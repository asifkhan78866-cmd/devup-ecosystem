import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { logger } from "./logger";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code: string;

  constructor(statusCode: number, message: string, code = "ERROR", isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode, message, code } = err as AppError;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      message = "This record already exists";
      code = "DUPLICATE_ENTRY";
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found";
      code = "NOT_FOUND";
    }
  }

  if (!(err instanceof AppError) && !statusCode) {
    statusCode = 500;
    message = "Internal Server Error";
    code = "INTERNAL_SERVER_ERROR";
  }

  res.locals.errorMessage = err.message;

  const response = {
    success: false,
    error: message,
    code: code || "ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  if (statusCode === 500) {
    logger.error(`${err.message} - ${err.stack}`);
  } else {
    logger.warn(`${statusCode} - ${message}`);
  }

  res.status(statusCode).json(response);
};
