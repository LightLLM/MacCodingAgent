import type { NextFunction, Request, Response } from "express";
import { AppError, toErrorMessage } from "./errors.js";

const hits = new Map<string, { count: number; resetAt: number }>();

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id =
    (typeof req.headers["x-request-id"] === "string" &&
      req.headers["x-request-id"]) ||
    `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  res.setHeader("x-request-id", id);
  (req as Request & { requestId?: string }).requestId = id;
  next();
}

/** Lightweight in-memory rate limit for chat/checkout abuse protection. */
export function rateLimit(options: {
  windowMs: number;
  max: number;
  key?: (req: Request) => string;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${options.key?.(req) ?? req.ip ?? "local"}:${req.path}`;
    const now = Date.now();
    const row = hits.get(key);
    if (!row || row.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }
    row.count += 1;
    if (row.count > options.max) {
      res.status(429).json({
        error: "Too many requests. Slow down and retry.",
        code: "rate_limited",
      });
      return;
    }
    next();
  };
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not found", code: "not_found" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) return;
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }
  console.error("[agent]", err);
  res.status(500).json({
    error: toErrorMessage(err, "Internal server error"),
    code: "internal_error",
  });
}

export function clearRateLimitState(): void {
  hits.clear();
}
