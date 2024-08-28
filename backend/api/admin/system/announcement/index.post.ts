import { announcementUpdateSchema } from "./utils";
// /server/api/announcement/index.post.ts

import { storeRecord, storeRecordResponses } from "@b/utils/query";
import { announcementSchema } from "./utils";
import { handleRouteClientsMessage } from "@b/handler/Websocket";

export const metadata = {
  summary: "Stores a new Announcement",
  operationId: "storeAnnouncement",
  tags: ["Admin", "Announcements"],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: announcementUpdateSchema,
      },
    },
  },
  responses: storeRecordResponses(announcementSchema, "Announcement"),
  requiresAuth: true,
  permission: "Access Announcement Management",
};

export default async (data: Handler) => {
  const { body } = data;
  const { type, title, message, link, status } = body;

  const announcement = await storeRecord({
    model: "announcement",
    data: {
      type,
      title,
      message,
      link,
      status,
    },
    returnResponse: true,
  });

  handleRouteClientsMessage({
    type: "announcements",
    method: "create",
    data: announcement.record,
  });

  return announcement.message;
};
