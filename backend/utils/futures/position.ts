import { getWallet } from "@b/api/finance/wallet/utils";
import { fromBigIntMultiply, fromBigInt } from "@b/utils/eco/blockchain";
import { FuturesOrder } from "./queries/order";
import {
  FuturesPosition,
  createPosition,
  getPosition,
  getPositions,
  updatePositionInDB,
  updatePositionStatus,
} from "./queries/positions";
import { updateWalletBalance } from "../eco/wallet";

// Constants
const SCALE_FACTOR = BigInt(10 ** 18);
const FUTURES_WALLET_TYPE = "FUTURES";

// Types
type Side = "BUY" | "SELL";

interface Position {
  userId: string;
  id: string;
  amount: bigint;
  entryPrice: bigint;
  unrealizedPnl: bigint;
  stopLossPrice: bigint | null;
  takeProfitPrice: bigint | null;
}

// Helper functions
const scaleDown = (value: bigint): number =>
  Number(value) / Number(SCALE_FACTOR);
const scaleUp = (value: number): bigint =>
  BigInt(Math.round(value * Number(SCALE_FACTOR)));

export const calculateUnrealizedPnl = (
  entryPrice: bigint,
  amount: bigint,
  currentPrice: bigint,
  side: Side
): bigint => {
  const unscaledEntryPrice = scaleDown(entryPrice);
  const unscaledCurrentPrice = scaleDown(currentPrice);
  const unscaledAmount = scaleDown(amount);

  const pnl =
    side === "BUY"
      ? (unscaledCurrentPrice - unscaledEntryPrice) * unscaledAmount
      : (unscaledEntryPrice - unscaledCurrentPrice) * unscaledAmount;

  return scaleUp(pnl);
};

// Main functions
export const updatePositions = async (
  buyOrder: FuturesOrder,
  sellOrder: FuturesOrder,
  amountToFill: bigint,
  matchedPrice: bigint
): Promise<void> => {
  await Promise.all([
    updateSinglePosition(buyOrder, amountToFill, matchedPrice),
    updateSinglePosition(sellOrder, amountToFill, matchedPrice),
  ]);
};

const updateSinglePosition = async (
  order: FuturesOrder,
  amount: bigint,
  matchedPrice: bigint
): Promise<void> => {
  const position = await getPosition(order.userId, order.symbol, order.side);

  if (position) {
    await updateExistingPosition(position, order, amount, matchedPrice);
  } else {
    await createNewPosition(order, amount, matchedPrice);
  }
};

const updateExistingPosition = async (
  position: FuturesPosition,
  order: FuturesOrder,
  amount: bigint,
  matchedPrice: bigint
): Promise<void> => {
  const newAmount = scaleDown(position.amount) + scaleDown(amount);
  const newEntryPrice =
    (scaleDown(position.entryPrice) * scaleDown(position.amount) +
      scaleDown(order.price) * scaleDown(amount)) /
    newAmount;

  const scaledNewAmount = scaleUp(newAmount);
  const scaledNewEntryPrice = scaleUp(newEntryPrice);

  const unrealizedPnl = calculateUnrealizedPnl(
    scaledNewEntryPrice,
    scaledNewAmount,
    matchedPrice,
    order.side as Side
  );

  await updatePositionInDB(
    position.userId,
    position.id,
    scaledNewEntryPrice,
    scaledNewAmount,
    unrealizedPnl,
    position.stopLossPrice,
    position.takeProfitPrice
  );
};

const createNewPosition = async (
  order: FuturesOrder,
  amount: bigint,
  matchedPrice: bigint
): Promise<void> => {
  const unrealizedPnl = calculateUnrealizedPnl(
    order.price,
    amount,
    matchedPrice,
    order.side as Side
  );

  await createPosition(
    order.userId,
    order.symbol,
    order.side,
    order.price,
    amount,
    order.leverage,
    unrealizedPnl,
    order.stopLossPrice,
    order.takeProfitPrice
  );
};

export const closePosition = async (order: FuturesOrder): Promise<void> => {
  const position = await getPosition(order.userId, order.symbol, order.side);

  if (position) {
    const realizedPnl = fromBigIntMultiply(position.unrealizedPnl, BigInt(1));
    const baseCurrency = order.symbol.split("/")[1];
    const wallet = await getWallet(
      order.userId,
      FUTURES_WALLET_TYPE,
      baseCurrency
    );

    if (wallet) {
      await updateWalletBalance(wallet, realizedPnl, "add");
    } else {
      throw new Error(
        `Wallet not found for user ${order.userId} and currency ${baseCurrency}`
      );
    }

    await updatePositionStatus(position.userId, position.id, "CLOSED");
  } else {
    throw new Error(
      `No position found for user ${order.userId} and symbol ${order.symbol}`
    );
  }
};
