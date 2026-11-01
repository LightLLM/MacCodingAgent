import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import { z } from "zod";
import type { AgentService } from "./agent-service.js";
import {
  applyStripeEvent,
  createCheckoutSession,
  entitlementsFor,
  finalizeCheckoutSession,
  loadBillingConfig,
  plans,
  verifyStripeWebhook,
  type BillingStore,
  type PlanId,
} from "./billing.js";
import {
  errorHandler,
  notFound,
  rateLimit,
  requestId,
} from "./middleware.js";

const chatSchema = z.object({
  content: z.string().min(1).max(20_000),
});

const sessionSchema = z.object({
  title: z.string().max(120).optional(),
  projectPath: z.string().max(500).nullable().optional(),
  modelId: z.string().max(120).optional(),
});

const modelSchema = z.object({
  modelId: z.string().min(1).max(120),
});

const checkoutSchema = z.object({
  email: z.string().email(),
  plan: z.enum(["pro_monthly", "pro_lifetime"]),
});

export function createServer(
  agent: AgentService,
  billing?: BillingStore,
): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(requestId);
  app.use(
    cors({
      origin: process.env.MCA_CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? true,
    }),
  );

  const billingConfig = loadBillingConfig(process.env, agent.config.dataDir);

  app.post(
    "/api/billing/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      if (!billing) {
        res.status(503).json({ error: "Billing store unavailable" });
        return;
      }
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body ?? {});
      const signature = req.header("stripe-signature") ?? undefined;
      if (!verifyStripeWebhook(billingConfig, rawBody, signature)) {
        res.status(400).json({ error: "Invalid Stripe signature" });
        return;
      }
      try {
        const event = JSON.parse(rawBody) as {
          type: string;
          data?: { object?: Record<string, unknown> };
        };
        const license = await applyStripeEvent(billing, event, billingConfig);
        res.json({ received: true, licenseKey: license?.licenseKey ?? null });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Webhook handling failed";
        res.status(400).json({ error: message });
      }
    },
  );

  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      ...agent.health(),
      billingConfigured: Boolean(billingConfig.secretKey),
      plans: plans().map((p) => p.id),
    });
  });

  app.get("/api/models", async (_req, res) => {
    const models = await agent.refreshModels();
    res.json({
      activeModelId: agent.store.getState().activeModelId,
      models,
      localModelsReachable: agent.health().localModelsReachable,
    });
  });

  app.post("/api/models/active", (req, res) => {
    const parsed = modelSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    agent.store.setActiveModel(parsed.data.modelId);
    res.json({ activeModelId: parsed.data.modelId });
  });

  app.get("/api/sessions", (_req, res) => {
    res.json({ sessions: agent.store.listSessions() });
  });

  app.post("/api/sessions", (req, res) => {
    const parsed = sessionSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const session = agent.store.createSession(parsed.data);
    res.status(201).json({ session });
  });

  app.get("/api/sessions/:id", (req, res) => {
    const session = agent.store.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json({ session });
  });

  app.post(
    "/api/sessions/:id/chat",
    rateLimit({ windowMs: 60_000, max: 60 }),
    async (req, res) => {
      const parsed = chatSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }
      try {
        const result = await agent.chat(req.params.id, parsed.data.content);
        const session = agent.store.getSession(req.params.id);
        res.json({ ...result, session });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Chat failed";
        const status = message === "Session not found" ? 404 : 500;
        res.status(status).json({ error: message });
      }
    },
  );

  app.get("/api/tasks", (_req, res) => {
    res.json({ tasks: agent.store.listTasks() });
  });

  app.get("/api/projects", (_req, res) => {
    res.json({ projects: agent.store.listProjects() });
  });

  app.get("/api/billing/plans", (_req, res) => {
    res.json({
      plans: plans(),
      publishableKey: billingConfig.publishableKey,
      stripeConfigured: Boolean(billingConfig.secretKey),
    });
  });

  app.post(
    "/api/billing/checkout",
    rateLimit({ windowMs: 60_000, max: 20 }),
    async (req, res) => {
      if (!billing) {
        res.status(503).json({ error: "Billing store unavailable" });
        return;
      }
      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }
      try {
        const result = await createCheckoutSession(billing, billingConfig, {
          email: parsed.data.email,
          plan: parsed.data.plan as Exclude<PlanId, "free">,
        });
        res.json(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Checkout failed";
        res.status(400).json({ error: message });
      }
    },
  );

  app.get("/api/billing/session/:id", async (req, res) => {
    if (!billing) {
      res.status(503).json({ error: "Billing store unavailable" });
      return;
    }
    try {
      const license = await finalizeCheckoutSession(
        billing,
        billingConfig,
        req.params.id,
      );
      res.json({
        license,
        entitlements: entitlementsFor(license),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not finalize session";
      res.status(404).json({ error: message });
    }
  });

  app.get("/api/billing/license/:key", (req, res) => {
    if (!billing) {
      res.status(503).json({ error: "Billing store unavailable" });
      return;
    }
    const license = billing.resolveLicense(req.params.key, billingConfig);
    if (!license) {
      res.status(404).json({ error: "License not found" });
      return;
    }
    res.json({ license, entitlements: entitlementsFor(license) });
  });

  app.get("/api/billing/entitlements", (req, res) => {
    if (!billing) {
      res.status(503).json({ error: "Billing store unavailable" });
      return;
    }
    const licenseKey = String(req.query.license ?? "");
    const email = String(req.query.email ?? "");
    const license = licenseKey
      ? billing.resolveLicense(licenseKey, billingConfig)
      : email
        ? billing.findByEmail(email)
        : null;
    res.json(entitlementsFor(license ?? null));
  });

  app.get("/api/events", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const send = () => {
      res.write(`event: health\ndata: ${JSON.stringify(agent.health())}\n\n`);
    };
    send();
    const timer = setInterval(send, 2000);
    req.on("close", () => clearInterval(timer));
  });

  app.get("/", (_req, res) => {
    res.json({
      name: "Mac Coding Agent",
      docs: "Use /api/health, /api/sessions, /api/models, /api/billing",
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
