import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export interface HttpError extends Error {
  status?: number;
}

export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? 500;
  console.error(err);

  res.status(status).json({
    error: err.message || "Internal Server Error",
    ...(env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
}
