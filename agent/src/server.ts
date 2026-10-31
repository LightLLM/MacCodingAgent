import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import { z } from "zod";
import type { AgentService } from "./agent-service.js";

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

export function createServer(agent: AgentService): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json(agent.health());
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

  app.post("/api/sessions/:id/chat", async (req, res) => {
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
  });

  app.get("/api/tasks", (_req, res) => {
    res.json({ tasks: agent.store.listTasks() });
  });

  app.get("/api/projects", (_req, res) => {
    res.json({ projects: agent.store.listProjects() });
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
      docs: "Use /api/health, /api/sessions, /api/models",
    });
  });

  return app;
}
