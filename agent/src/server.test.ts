import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AgentService } from "./agent-service.js";
import { loadConfig } from "./config.js";
import { createServer } from "./server.js";
import { AgentStore } from "./store.js";

const tempDirs: string[] = [];
let agent: AgentService;

beforeEach(async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "mca-api-"));
  tempDirs.push(dir);
  const config = loadConfig({
    MCA_MODEL_PROVIDER: "stub",
    MCA_DATA_DIR: dir,
  });
  const store = new AgentStore(config.dataDir);
  agent = new AgentService(config, store);
  await agent.start();
});

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("Mac Coding Agent API", () => {
  it("reports healthy 24/7 status", async () => {
    const app = createServer(agent);
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Mac Coding Agent");
    expect(res.body.status).toBe("running");
    expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it("lists models and projects", async () => {
    const app = createServer(agent);
    const models = await request(app).get("/api/models");
    expect(models.body.models.length).toBeGreaterThan(0);
    const projects = await request(app).get("/api/projects");
    expect(projects.body.projects[0].name).toBe("Mac Coding Agent");
  });

  it("creates a session and completes a chat turn", async () => {
    const app = createServer(agent);
    const created = await request(app)
      .post("/api/sessions")
      .send({ title: "E2E session" });
    expect(created.status).toBe(201);
    const id = created.body.session.id as string;

    const chat = await request(app)
      .post(`/api/sessions/${id}/chat`)
      .send({ content: "hello there" });
    expect(chat.status).toBe(200);
    expect(chat.body.reply).toMatch(/Mac Coding Agent/i);
    expect(chat.body.session.messages.length).toBeGreaterThan(2);
  });

  it("rejects empty chat content", async () => {
    const app = createServer(agent);
    const created = await request(app).post("/api/sessions").send({});
    const id = created.body.session.id as string;
    const chat = await request(app)
      .post(`/api/sessions/${id}/chat`)
      .send({ content: "" });
    expect(chat.status).toBe(400);
  });
});

describe("Mac Coding Agent billing API", () => {
  it("creates demo Stripe checkout via backend", async () => {
    const { BillingStore } = await import("./billing.js");
    const dir = await mkdtemp(path.join(os.tmpdir(), "mca-bill-api-"));
    tempDirs.push(dir);
    const billing = new BillingStore(dir);
    await billing.load();
    const app = createServer(agent, billing);

    const plans = await request(app).get("/api/billing/plans");
    expect(plans.status).toBe(200);
    expect(plans.body.plans.length).toBeGreaterThan(0);

    const checkout = await request(app)
      .post("/api/billing/checkout")
      .send({ email: "mac@example.com", plan: "pro_monthly" });
    expect(checkout.status).toBe(200);
    expect(checkout.body.mode).toBe("demo");
    expect(checkout.body.url).toContain("/billing/success");
  });
});
