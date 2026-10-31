import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AgentStore } from "./store.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function tempStore(): Promise<AgentStore> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "mca-"));
  tempDirs.push(dir);
  const store = new AgentStore(dir);
  await store.load();
  return store;
}

describe("AgentStore", () => {
  it("creates sessions and appends chat messages", async () => {
    const store = await tempStore();
    const session = store.createSession({});
    expect(session.messages[0]?.role).toBe("system");
    store.appendMessage(session.id, "user", "Add a status screen");
    const updated = store.getSession(session.id)!;
    expect(updated.messages.some((m) => m.role === "user")).toBe(true);
    expect(updated.title).toBe("Add a status screen");
  });

  it("enqueues and updates coding tasks", async () => {
    const store = await tempStore();
    const session = store.createSession({});
    const task = store.enqueueTask(session.id, "Fix lint");
    expect(task.status).toBe("queued");
    store.updateTask(task.id, { status: "completed", result: "done" });
    expect(store.listTasks()[0]?.status).toBe("completed");
  });

  it("persists active model across reload", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "mca-"));
    tempDirs.push(dir);
    const store = new AgentStore(dir);
    await store.load();
    store.setActiveModel("stub-fast");
    await store.persistNow();

    const reloaded = new AgentStore(dir);
    await reloaded.load();
    expect(reloaded.getState().activeModelId).toBe("stub-fast");
  });
});
