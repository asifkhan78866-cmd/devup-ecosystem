import swaggerUi from "swagger-ui-express";
import { Application, Request, Response } from "express";

export const setupSwagger = (app: Application) => {
  // We'll generate a proper OpenAPI spec using zod-to-openapi in a production app.
  // For now, a placeholder config to mount the UI.
  const swaggerDocument = {
    openapi: "3.0.0",
    info: {
      title: "DevUp Ecosystem API",
      version: "1.0.0",
      description: "API for the DevUp Ecosystem platform",
    },
    servers: [
      {
        url: "http://localhost:4000/api",
        description: "Development server",
      },
    ],
    paths: {},
  };

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  
  app.get("/api/docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerDocument);
  });
};
