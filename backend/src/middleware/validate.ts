import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "./errorHandler";

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as { body?: unknown };

      /**
       * Write the parsed body back so coercions and transforms actually take
       * effect. Previously the result was discarded, which meant z.coerce.date()
       * left dates as strings and z.coerce.number() left numbers as strings —
       * handlers then called .toUTCString() on a string and returned a 500.
       *
       * Merged over the original rather than replacing it, because zod strips
       * keys a schema does not declare and some handlers read fields the schema
       * never mentions.
       */
      if (parsed && typeof parsed.body === "object" && parsed.body !== null && !Array.isArray(parsed.body)) {
        req.body = { ...req.body, ...(parsed.body as Record<string, unknown>) };
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          code: 400,
          message: "Validation Error",
          errors: error.issues.map((e: any) => ({ path: e.path.join('.'), message: e.message }))
        });
      }
      next(error);
    }
  };
};
