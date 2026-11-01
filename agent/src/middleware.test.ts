import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { AppError } from "./errors.js";
import {
  clearRateLimitState,
  errorHandler,
  rateLimit,
  requestId,
} from "./middleware.js";

afterEach(() => {
  clearRateLimitState();
});

describe("middleware", () => {
  it("assigns request ids", async () => {
    const app = express();
    app.use(requestId);
    app.get("/x", (_req, res) => res.json({ ok: true }));
    const res = await request(app).get("/x");
    expect(res.headers["x-request-id"]).toBeTruthy();
  });

  it("rate limits burst traffic", async () => {
    const app = express();
    app.use(rateLimit({ windowMs: 60_000, max: 2 }));
    app.get("/x", (_req, res) => res.json({ ok: true }));
    expect((await request(app).get("/x")).status).toBe(200);
    expect((await request(app).get("/x")).status).toBe(200);
    expect((await request(app).get("/x")).status).toBe(429);
  });

  it("formats AppError responses", async () => {
    const app = express();
    app.get("/boom", () => {
      throw new AppError("nope", 418, "teapot");
    });
    app.use(errorHandler);
    const res = await request(app).get("/boom");
    expect(res.status).toBe(418);
    expect(res.body.code).toBe("teapot");
  });
});
