import type { AgentConfig } from "./config.js";
import { completeChat, probeLocalModels } from "./models.js";
import { AgentStore } from "./store.js";
import type { AgentHealth, AgentStatus, ModelInfo } from "./types.js";

export class AgentService {
  readonly startedAt = new Date();
  private modelsCache: ModelInfo[] = [];
  private modelsReachable = false;
  private busyCount = 0;

  constructor(
    readonly config: AgentConfig,
    readonly store: AgentStore,
  ) {}

  async start(): Promise<void> {
    await this.store.load();
    await this.refreshModels();
  }

  async refreshModels(): Promise<ModelInfo[]> {
    const result = await probeLocalModels(this.config);
    this.modelsCache = result.models;
    this.modelsReachable = result.reachable;
    const active = this.store.getState().activeModelId;
    if (!this.modelsCache.some((m) => m.id === active) && this.modelsCache[0]) {
      this.store.setActiveModel(this.modelsCache[0].id);
    }
    return this.modelsCache;
  }

  getModels(): ModelInfo[] {
    return this.modelsCache;
  }

  status(): AgentStatus {
    if (this.busyCount > 0) return "busy";
    return "running";
  }

  health(): AgentHealth {
    const tasks = this.store.listTasks();
    return {
      name: "Mac Coding Agent",
      version: "1.0.0",
      status: this.status(),
      uptimeSeconds: Math.floor((Date.now() - this.startedAt.getTime()) / 1000),
      startedAt: this.startedAt.toISOString(),
      modelProvider: this.modelsReachable
        ? this.config.modelProvider
        : "stub",
      activeModel: this.store.getState().activeModelId,
      sessions: this.store.listSessions().length,
      tasksQueued: tasks.filter((t) => t.status === "queued").length,
      tasksRunning: tasks.filter((t) => t.status === "running").length,
      localModelsReachable: this.modelsReachable,
    };
  }

  async chat(sessionId: string, content: string): Promise<{
    sessionId: string;
    reply: string;
    taskId: string;
  }> {
    const session = this.store.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    this.store.appendMessage(sessionId, "user", content);
    const task = this.store.enqueueTask(sessionId, content);
    this.store.updateTask(task.id, { status: "running" });
    this.busyCount += 1;

    try {
      const messages = this.store
        .getSession(sessionId)!
        .messages.filter((m) => m.role !== "system" || true)
        .map((m) => ({ role: m.role, content: m.content }));

      const reply = await completeChat(
        this.config,
        session.modelId || this.store.getState().activeModelId,
        messages,
      );

      this.store.appendMessage(sessionId, "assistant", reply);
      this.store.updateTask(task.id, {
        status: "completed",
        result: reply,
        completedAt: new Date().toISOString(),
      });

      return { sessionId, reply, taskId: task.id };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown agent error";
      this.store.updateTask(task.id, {
        status: "failed",
        result: message,
        completedAt: new Date().toISOString(),
      });
      throw error;
    } finally {
      this.busyCount = Math.max(0, this.busyCount - 1);
    }
  }
}
