// /server/api/blog/posts/show.get.ts
import { models } from "@b/db";
import { createError } from "@b/utils/error";
// import { redis } from '@b/utils/redis';

export const metadata: OperationObject = {
  summary: "Retrieves a single blog post by ID",
  description: "This endpoint retrieves a single blog post by its ID.",
  operationId: "getPostById",
  tags: ["Content", "Author", "Post"],
  requiresAuth: true,
  parameters: [
    {
      index: 0,
      name: "authorId",
      in: "path",
      description: "ID of the author",
      required: true,
      schema: {
        type: "string",
      },
    },
    {
      index: 1,
      name: "id",
      in: "path",
      description: "The ID of the blog post to retrieve",
      required: true,
      schema: {
        type: "string",
        description: "Post ID",
      },
    },
  ],
  responses: {
    200: {
      description: "Blog post retrieved successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              status: {
                type: "boolean",
                description: "Indicates if the request was successful",
              },
              statusCode: {
                type: "number",
                description: "HTTP status code",
                example: 200,
              },
              data: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  content: { type: "string" },
                  categoryId: { type: "string" },
                  authorId: { type: "string" },
                  slug: { type: "string" },
                  description: { type: "string", nullable: true },
                  status: {
                    type: "string",
                    enum: ["PUBLISHED", "DRAFT", "TRASH"],
                  },
                  image: { type: "string", nullable: true },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: {
                    type: "string",
                    format: "date-time",
                    nullable: true,
                  },
                  author: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      userId: { type: "string" },
                      // Additional author details here
                    },
                  },
                  category: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      slug: { type: "string" },
                      // Additional category details here
                    },
                  },
                  postTag: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        postId: { type: "string" },
                        tagId: { type: "string" },
                        // Additional postTag details here
                      },
                    },
                  },
                  // Include additional relations as needed
                },
              },
            },
          },
        },
      },
    },
    404: {
      description: "Blog post not found",
    },
    500: {
      description: "Internal server error",
    },
  },
};

export default async (data: Handler) => {
  const { user, params } = data;
  if (!user?.id)
    throw createError({ statusCode: 401, message: "Unauthorized" });
  const { authorId } = params;

  const { id } = params;
  return await models.post.findOne({
    where: { id, authorId },
    include: [
      {
        model: models.author,
        as: "author",
        include: [
          {
            model: models.user,
            as: "user",
            attributes: ["firstName", "lastName", "email", "avatar"],
            include: [
              {
                model: models.role,
                as: "role",
                attributes: ["name"],
              },
            ],
          },
        ],
      },
      {
        model: models.category,
        as: "category",
      },
      {
        model: models.tag,
        as: "tags",
        through: {
          attributes: [],
        },
      },
    ],
  });
};
