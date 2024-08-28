import {
  deleteRecordParams,
  deleteRecordResponses,
  handleSingleDelete,
} from "@b/utils/query";

export const metadata = {
  summary: "Deletes a wallet",
  operationId: "deleteWallet",
  tags: ["Admin", "Wallet"],
  parameters: deleteRecordParams("wallet"),
  responses: deleteRecordResponses("Wallet"),
  requiresAuth: true,
  permission: "Access Wallet Management",
};

export default async (data: Handler) => {
  const { params, query } = data;
  return handleSingleDelete({
    model: "wallet",
    id: params.id,
    query,
  });
};
