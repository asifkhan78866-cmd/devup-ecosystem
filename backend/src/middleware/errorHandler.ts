import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
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
  let { statusCode, message } = err;
  
  if (!(err instanceof AppError)) {
    statusCode = 500;
    message = "Internal Server Error";
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  if (statusCode === 500) {
    logger.error(`${err.message} - ${err.stack}`);
  } else {
    logger.warn(`${statusCode} - ${message}`);
  }

  res.status(statusCode).json(response);
};
