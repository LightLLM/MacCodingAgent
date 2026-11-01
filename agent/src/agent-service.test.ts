import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AgentService } from "./agent-service.js";
import { loadConfig } from "./config.js";
import { AgentStore } from "./store.js";

const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function boot() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "mca-svc-"));
  dirs.push(dir);
  const config = loadConfig({
    MCA_MODEL_PROVIDER: "stub",
    MCA_DATA_DIR: dir,
  });
  const store = new AgentStore(config.dataDir);
  const agent = new AgentService(config, store);
  await agent.start();
  return agent;
}

describe("AgentService", () => {
  it("reports running health with uptime", async () => {
    const agent = await boot();
    const health = agent.health();
    expect(health.name).toBe("Mac Coding Agent");
    expect(health.status).toBe("running");
    expect(health.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it("completes a chat turn end to end", async () => {
    const agent = await boot();
    const session = agent.store.createSession({ title: "svc" });
    const result = await agent.chat(session.id, "hello production");
    expect(result.reply).toMatch(/Mac Coding Agent/i);
    expect(agent.store.getSession(session.id)?.messages.length).toBeGreaterThan(2);
  });

  it("throws for missing sessions", async () => {
    const agent = await boot();
    await expect(agent.chat("missing", "hi")).rejects.toThrow(/not found/i);
  });
});
