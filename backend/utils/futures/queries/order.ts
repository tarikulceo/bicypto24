import {
  fromBigInt,
  fromBigIntMultiply,
  removeTolerance,
} from "@b/utils/eco/blockchain";
import client, { scyllaFuturesKeyspace } from "@b/utils/eco/scylla/client";
import { makeUuid } from "@b/utils/passwords";
import { FuturesMatchingEngine } from "../matchingEngine";
import {
  getWalletByUserIdAndCurrency,
  updateWalletBalance,
} from "@b/utils/eco/wallet";
import { getOrderbookEntry } from "./orderbook";
import { stringify as uuidStringify } from "uuid";

interface Uuid {
  buffer: Buffer;
}

// Define a TypeScript interface for the "order" table
export interface FuturesOrder {
  id: string;
  userId: string;
  symbol: string;
  type: string;
  timeInForce?: string;
  side: string;
  price: bigint;
  average?: bigint;
  amount: bigint;
  filled: bigint;
  remaining: bigint;
  cost: bigint;
  trades: string;
  fee: bigint;
  feeCurrency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  leverage: number;
  stopLossPrice?: bigint;
  takeProfitPrice?: bigint;
}

export interface FuturesMatchedOrder {
  userId: string;
  symbol: string;
  side: string;
  price: bigint;
  updatedAt: Date;
  createdAt: Date;
  amount: bigint;
  id: string;
  filled?: bigint;
  remaining?: bigint;
  trades?: string;
}

export function uuidToString(uuid: Uuid): string {
  return uuidStringify(uuid.buffer);
}

export async function query(q: string, params: any[] = []): Promise<any> {
  return client.execute(q, params, { prepare: true });
}

/**
 * Retrieves orders by user ID with pagination.
 * @param userId - The ID of the user whose orders are to be retrieved.
 * @param pageState - The page state for pagination. Default is null.
 * @param limit - The maximum number of orders to retrieve per page. Default is 10.
 * @returns A Promise that resolves with an array of orders and the next page state.
 */
export async function getOrdersByUserId(
  userId: string
): Promise<FuturesOrder[]> {
  const query = `
    SELECT * FROM ${scyllaFuturesKeyspace}.orders
    WHERE "userId" = ?
    ORDER BY "createdAt" DESC;
  `;
  const params = [userId];

  try {
    const result = await client.execute(query, params, { prepare: true });
    return result.rows.map(mapRowToOrder);
  } catch (error) {
    console.error(`Failed to fetch futures orders by userId: ${error.message}`);
    throw new Error(
      `Failed to fetch futures orders by userId: ${error.message}`
    );
  }
}

function mapRowToOrder(row: any): FuturesOrder {
  return {
    id: row.id,
    userId: row.userId,
    symbol: row.symbol,
    type: row.type,
    side: row.side,
    price: row.price,
    amount: row.amount,
    filled: row.filled,
    remaining: row.remaining,
    timeInForce: row.timeInForce,
    cost: row.cost,
    fee: row.fee,
    feeCurrency: row.feeCurrency,
    average: row.average,
    trades: row.trades,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    leverage: row.leverage,
    stopLossPrice: row.stopLossPrice,
    takeProfitPrice: row.takeProfitPrice,
  };
}

export function getOrderByUuid(
  userId: string,
  id: string,
  createdAt: string
): Promise<FuturesOrder> {
  const query = `
    SELECT * FROM ${scyllaFuturesKeyspace}.orders
    WHERE "userId" = ? AND id = ? AND "createdAt" = ?;
  `;
  const params = [userId, id, createdAt];

  return client
    .execute(query, params, { prepare: true })
    .then((result) => result.rows[0])
    .then(mapRowToOrder);
}

export async function cancelOrderByUuid(
  userId: string,
  id: string,
  createdAt: string,
  symbol: string,
  price: bigint,
  side: string,
  amount: bigint
): Promise<any> {
  const priceFormatted = fromBigInt(price);
  const orderbookSide = side === "BUY" ? "BIDS" : "ASKS";
  const orderbookAmount = await getOrderbookEntry(
    symbol,
    priceFormatted,
    orderbookSide
  );

  let orderbookQuery: string = "";
  let orderbookParams: any[] = [];
  if (orderbookAmount) {
    const newAmount = orderbookAmount - amount;

    if (newAmount <= BigInt(0)) {
      orderbookQuery = `DELETE FROM ${scyllaFuturesKeyspace}.orderbook WHERE symbol = ? AND price = ? AND side = ?`;
      orderbookParams = [symbol, priceFormatted.toString(), orderbookSide];
    } else {
      orderbookQuery = `UPDATE ${scyllaFuturesKeyspace}.orderbook SET amount = ? WHERE symbol = ? AND price = ? AND side = ?`;
      orderbookParams = [
        fromBigInt(newAmount).toString(),
        symbol,
        priceFormatted.toString(),
        orderbookSide,
      ];
    }
  } else {
    console.warn(
      `No orderbook entry found for symbol: ${symbol}, price: ${priceFormatted}, side: ${orderbookSide}`
    );
  }

  const deleteOrderQuery = `DELETE FROM ${scyllaFuturesKeyspace}.orders WHERE "userId" = ? AND id = ? AND "createdAt" = ?`;
  const deleteOrderParams = [userId, id, createdAt];

  const batchQueries = orderbookQuery
    ? [
        { query: orderbookQuery, params: orderbookParams },
        { query: deleteOrderQuery, params: deleteOrderParams },
      ]
    : [{ query: deleteOrderQuery, params: deleteOrderParams }];

  try {
    await client.batch(batchQueries, { prepare: true });
  } catch (error) {
    console.error(
      `Failed to cancel futures order and update orderbook: ${error.message}`
    );
    throw new Error(
      `Failed to cancel futures order and update orderbook: ${error.message}`
    );
  }
}

function applyLeverage(amount: bigint, leverage: number): bigint {
  return amount * BigInt(Math.max(1, Math.floor(leverage)));
}

/**
 * Creates a new order in the order table.
 * @param order - The order object to be inserted into the table.
 * @returns A Promise that resolves when the order has been successfully inserted.
 */
export async function createOrder({
  userId,
  symbol,
  amount,
  price,
  cost,
  type,
  side,
  fee,
  feeCurrency,
  leverage,
  stopLossPrice,
  takeProfitPrice,
}: {
  userId: string;
  symbol: string;
  amount: bigint;
  price: bigint;
  cost: bigint;
  type: string;
  side: string;
  fee: bigint;
  feeCurrency: string;
  leverage: number;
  stopLossPrice?: bigint;
  takeProfitPrice?: bigint;
}): Promise<FuturesOrder> {
  const currentTimestamp = new Date();
  const leveragedAmount = applyLeverage(amount, leverage);
  const query = `
    INSERT INTO ${scyllaFuturesKeyspace}.orders (
      id, "userId", symbol, type, "timeInForce", side, price, average,
      amount, filled, remaining, cost, leverage, fee, "feeCurrency", status,
      "stopLossPrice", "takeProfitPrice", "createdAt", "updatedAt"
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  const priceTolerance = removeTolerance(price);
  const amountTolerance = removeTolerance(leveragedAmount); // Use leveraged amount
  const costTolerance = removeTolerance(cost);
  const feeTolerance = removeTolerance(fee);
  const stopLossTolerance = stopLossPrice
    ? removeTolerance(stopLossPrice)
    : undefined;
  const takeProfitTolerance = takeProfitPrice
    ? removeTolerance(takeProfitPrice)
    : undefined;
  const id = makeUuid();
  const params = [
    id,
    userId,
    symbol,
    type,
    "GTC",
    side,
    priceTolerance.toString(),
    "0", // average
    amountTolerance.toString(),
    "0", // filled
    amountTolerance.toString(), // remaining
    costTolerance.toString(),
    leverage.toString(), // leverage as string
    feeTolerance.toString(),
    feeCurrency,
    "OPEN",
    stopLossTolerance ? stopLossTolerance.toString() : null,
    takeProfitTolerance ? takeProfitTolerance.toString() : null,
    currentTimestamp,
    currentTimestamp,
  ];

  try {
    await client.execute(query, params, {
      prepare: true,
    });

    const newOrder: FuturesOrder = {
      id,
      userId,
      symbol,
      type,
      timeInForce: "GTC",
      side,
      price: priceTolerance,
      amount: amountTolerance,
      filled: BigInt(0),
      remaining: amountTolerance,
      cost: costTolerance,
      fee: feeTolerance,
      feeCurrency,
      average: BigInt(0),
      trades: "",
      status: "OPEN",
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      leverage,
      stopLossPrice: stopLossTolerance,
      takeProfitPrice: takeProfitTolerance,
    };

    const matchingEngine = await FuturesMatchingEngine.getInstance();
    matchingEngine.addToQueue(newOrder);
    return newOrder;
  } catch (error) {
    console.error(`Failed to create futures order: ${error.message}`);
    throw new Error(`Failed to create futures order: ${error.message}`);
  }
}

/**
 * Retrieves all futures orders with status 'OPEN'.
 * @returns A Promise that resolves with an array of open  orders.
 */
export async function getAllOpenOrders(): Promise<any[]> {
  const query = `
    SELECT * FROM ${scyllaFuturesKeyspace}.open_order
    WHERE status = 'OPEN' ALLOW FILTERING;
  `;

  try {
    const result = await client.execute(query, [], { prepare: true });
    return result.rows;
  } catch (error) {
    console.error(`Failed to fetch all open futures orders: ${error.message}`);
    throw new Error(
      `Failed to fetch all open futures orders: ${error.message}`
    );
  }
}

export function generateOrderUpdateQueries(
  ordersToUpdate: FuturesOrder[]
): Array<{ query: string; params: any[] }> {
  const queries = ordersToUpdate.map((order) => {
    return {
      query: `
        UPDATE ${scyllaFuturesKeyspace}.orders
        SET filled = ?, remaining = ?, status = ?, "updatedAt" = ?, trades = ?
        WHERE "userId" = ? AND "createdAt" = ? AND id = ?;
      `,
      params: [
        removeTolerance(order.filled).toString(),
        removeTolerance(order.remaining).toString(),
        order.status,
        new Date(),
        JSON.stringify(order.trades),
        order.userId,
        order.createdAt,
        order.id,
      ],
    };
  });
  return queries;
}

export async function deleteAllMarketData(symbol: string) {
  // Step 1: Fetch the primary keys from the materialized view for orders
  const ordersResult = await client.execute(
    `
      SELECT "userId", "createdAt", id
      FROM ${scyllaFuturesKeyspace}.orders_by_symbol
      WHERE symbol = ?;
    `,
    [symbol],
    { prepare: true }
  );

  for (const row of ordersResult.rows) {
    await cancelAndRefundOrder(row.userId, row.id, row.createdAt);
  }

  const deleteOrdersQueries = ordersResult.rows.map((row) => ({
    query: `
      DELETE FROM ${scyllaFuturesKeyspace}.orders
      WHERE "userId" = ? AND "createdAt" = ? AND id = ?;
    `,
    params: [row.userId, row.createdAt, row.id],
  }));

  // Step 2: Fetch the primary keys for candles
  const candlesResult = await client.execute(
    `
      SELECT interval, "createdAt"
      FROM ${scyllaFuturesKeyspace}.candles
      WHERE symbol = ?;
    `,
    [symbol],
    { prepare: true }
  );

  const deleteCandlesQueries = candlesResult.rows.map((row) => ({
    query: `
      DELETE FROM ${scyllaFuturesKeyspace}.candles
      WHERE symbol = ? AND interval = ? AND "createdAt" = ?;
    `,
    params: [symbol, row.interval, row.createdAt],
  }));

  // Step 3: Fetch the primary keys for orderbook
  const sides = ["ASKS", "BIDS"];

  const deleteOrderbookQueries: Array<{ query: string; params: any[] }> = [];
  for (const side of sides) {
    const orderbookResult = await client.execute(
      `
        SELECT price
        FROM ${scyllaFuturesKeyspace}.orderbook
        WHERE symbol = ? AND side = ?;
      `,
      [symbol, side],
      { prepare: true }
    );

    const queries = orderbookResult.rows.map((row) => ({
      query: `
        DELETE FROM ${scyllaFuturesKeyspace}.orderbook
        WHERE symbol = ? AND side = ? AND price = ?;
      `,
      params: [symbol, side, row.price],
    }));

    deleteOrderbookQueries.push(...queries);
  }

  // Step 4: Combine all queries in a batch
  const batchQueries = [
    ...deleteOrdersQueries,
    ...deleteCandlesQueries,
    ...deleteOrderbookQueries,
  ];

  if (batchQueries.length === 0) {
    return;
  }

  // Step 5: Execute the batch queries
  try {
    await client.batch(batchQueries, { prepare: true });
  } catch (err) {
    console.error(`Failed to delete all futures market data: ${err.message}`);
  }
}

async function cancelAndRefundOrder(userId, id, createdAt) {
  const order = await getOrderByUuid(userId, id, createdAt);

  if (!order) {
    console.warn(`Order not found for UUID: ${id}`);
    return;
  }

  // Skip if order is not open or fully filled
  if (order.status !== "OPEN" || BigInt(order.remaining) === BigInt(0)) {
    return;
  }

  // Calculate refund amount based on remaining amount for partially filled orders
  const refundAmount =
    order.side === "BUY"
      ? fromBigIntMultiply(
          BigInt(order.remaining) + BigInt(order.fee),
          BigInt(order.price)
        )
      : fromBigInt(BigInt(order.remaining) + BigInt(order.fee));

  const walletCurrency =
    order.side === "BUY"
      ? order.symbol.split("/")[1]
      : order.symbol.split("/")[0];

  const wallet = await getWalletByUserIdAndCurrency(userId, walletCurrency);
  if (!wallet) {
    console.warn(`${walletCurrency} wallet not found for user ID: ${userId}`);
    return;
  }

  await updateWalletBalance(wallet, refundAmount, "add");
}

/**
 * Retrieves orders by user ID and symbol based on their status (open or non-open).
 * @param userId - The ID of the user whose orders are to be retrieved.
 * @param symbol - The symbol of the orders to be retrieved.
 * @param isOpen - A boolean indicating whether to fetch open orders (true) or non-open orders (false).
 * @returns A Promise that resolves with an array of orders.
 */
export async function getOrders(
  userId: string,
  symbol: string,
  isOpen: boolean
): Promise<any[]> {
  const query = `
    SELECT * FROM ${scyllaFuturesKeyspace}.orders_by_symbol
    WHERE symbol = ? AND "userId" = ?
    ORDER BY "createdAt" DESC;
  `;
  const params = [symbol, userId];

  try {
    const result = await client.execute(query, params, { prepare: true });
    return result.rows
      .map(mapRowToOrder)
      .filter((order) =>
        isOpen ? order.status === "OPEN" : order.status !== "OPEN"
      )
      .map((order) => ({
        ...order,
        amount: fromBigInt(order.amount),
        price: fromBigInt(order.price),
        cost: fromBigInt(order.cost),
        fee: fromBigInt(order.fee),
        filled: fromBigInt(order.filled),
        remaining: fromBigInt(order.remaining),
      }));
  } catch (error) {
    console.error(
      `Failed to fetch futures orders by userId and symbol: ${error.message}`
    );
    throw new Error(
      `Failed to fetch futures orders by userId and symbol: ${error.message}`
    );
  }
}
