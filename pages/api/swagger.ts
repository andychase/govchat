import { NextApiRequest, NextApiResponse } from "next";
import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "pages/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Next Swagger API Example",
        version: "1.0",
      },
      components: {
        schemas: {
          Message: {
            type: "object",
            properties: {
              role: {
                type: "string",
                description: "Role of the message (e.g., user, assistant)",
              },
              content: {
                type: "string",
                description: "Message content",
              },
              timestamp: {
                type: "string",
                format: "date-time",
                description: "Message timestamp",
              },
            },
            required: ["role", "content"],
          },
        },
      },
    },
  });
  return spec;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const spec = await getApiDocs();
  res.status(200).json(spec);
}