// /server/api/admin/kyc/applications/index.get.ts

import { models } from "@b/db";
import {
  getFiltered,
  notFoundMetadataResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@b/utils/query";
import { crudParameters, paginationSchema } from "@b/utils/constants";
import { kycApplicationSchema } from "./utils";

export const metadata: OperationObject = {
  summary: "Lists all KYC applications with pagination and optional filtering",
  operationId: "listKycApplications",
  tags: ["Admin", "CRM", "KYC"],
  parameters: crudParameters,
  responses: {
    200: {
      description:
        "Paginated list of KYC applications with detailed user and template information",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: kycApplicationSchema,
                },
              },
              pagination: paginationSchema,
            },
          },
        },
      },
    },
    401: unauthorizedResponse,
    404: notFoundMetadataResponse("KYC Applications"),
    500: serverErrorResponse,
  },
  requiresAuth: true,
  permission: "Access KYC Application Management",
};

export default async (data: Handler) => {
  const { query } = data;

  return getFiltered({
    model: models.kyc,
    query,
    sortField: query.sortField || "createdAt",
    includeModels: [
      {
        model: models.user,
        as: "user",
        attributes: ["firstName", "lastName", "email", "avatar"],
      },
      {
        model: models.kycTemplate,
        as: "template",
        attributes: ["id", "title"],
      },
    ],
  });
};
