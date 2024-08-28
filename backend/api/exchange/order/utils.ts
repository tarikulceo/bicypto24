import { models } from "@b/db";

export async function updateOrderData(id: string, orderData: any) {
  const updateData: Record<string, any> = {
    status: orderData.status.toUpperCase(),
    filled: orderData.filled,
    remaining: orderData.remaining,
    cost: orderData.cost,
    fee: orderData.fee?.cost,
    trades: orderData.trades,
    average: orderData.average,
  };

  // Remove undefined properties
  const filteredUpdateData = Object.fromEntries(
    Object.entries(updateData).filter(([_, value]) => value !== undefined)
  );

  await models.exchangeOrder.update(filteredUpdateData, {
    where: {
      id,
    },
  });

  const updatedOrder = await models.exchangeOrder.findOne({
    where: {
      id,
    },
  });

  if (!updatedOrder) {
    throw new Error("Order not found");
  }

  return updatedOrder.get({ plain: true });
}

import { baseStringSchema, baseNumberSchema } from "@b/utils/schema";

export const baseOrderSchema = {
  id: baseStringSchema("Unique identifier for the order"),
  referenceId: baseStringSchema("External reference ID for the order"),
  userId: baseStringSchema("User ID associated with the order"),
  status: baseStringSchema("Status of the order (e.g., pending, completed)"),
  symbol: baseStringSchema("Trading symbol for the order"),
  type: baseStringSchema("Type of order (e.g., market, limit)"),
  timeInForce: baseStringSchema("Time in force policy for the order"),
  side: baseStringSchema("Order side (buy or sell)"),
  price: baseNumberSchema("Price per unit"),
  average: baseNumberSchema("Average price per unit"),
  amount: baseNumberSchema("Total amount ordered"),
  filled: baseNumberSchema("Amount filled"),
  remaining: baseNumberSchema("Amount remaining"),
  cost: baseNumberSchema("Total cost"),
  trades: {
    type: "object",
    description: "Details of trades executed for this order",
    additionalProperties: true,
  },
  fee: baseNumberSchema("Transaction fee"),
  feeCurrency: baseStringSchema("Currency of the transaction fee"),
  createdAt: baseStringSchema("Creation date of the order"),
  updatedAt: baseStringSchema("Last update date of the order"),
};
