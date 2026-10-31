import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import type { CodingTask, ProjectInfo, Session } from "./types.js";

export interface AgentState {
  sessions: Session[];
  tasks: CodingTask[];
  projects: ProjectInfo[];
  activeModelId: string;
}

const DEFAULT_PROJECTS: ProjectInfo[] = [
  {
    id: "proj-mac-coding-agent",
    name: "Mac Coding Agent",
    path: "~/Developer/MacCodingAgent",
    language: "TypeScript",
    lastOpenedAt: new Date().toISOString(),
  },
  {
    id: "proj-sample-ios",
    name: "Companion iOS",
    path: "~/Developer/MacCodingAgent/ios",
    language: "Swift",
    lastOpenedAt: new Date().toISOString(),
  },
];

export function createEmptyState(activeModelId = "stub-coder"): AgentState {
  return {
    sessions: [],
    tasks: [],
    projects: DEFAULT_PROJECTS,
    activeModelId,
  };
}

export class AgentStore {
  private state: AgentState;
  private readonly filePath: string;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(dataDir: string, initialModelId = "stub-coder") {
    this.filePath = path.join(dataDir, "state.json");
    this.state = createEmptyState(initialModelId);
  }

  async load(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as AgentState;
      this.state = {
        ...createEmptyState(parsed.activeModelId),
        ...parsed,
        projects: parsed.projects?.length ? parsed.projects : DEFAULT_PROJECTS,
      };
    } catch {
      await this.persistNow();
    }
  }

  getState(): AgentState {
    return this.state;
  }

  setActiveModel(modelId: string): void {
    this.state.activeModelId = modelId;
    this.scheduleSave();
  }

  listSessions(): Session[] {
    return [...this.state.sessions].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  getSession(id: string): Session | undefined {
    return this.state.sessions.find((s) => s.id === id);
  }

  createSession(input: {
    title?: string;
    projectPath?: string | null;
    modelId?: string;
  }): Session {
    const now = new Date().toISOString();
    const session: Session = {
      id: nanoid(10),
      title: input.title?.trim() || "New coding session",
      projectPath: input.projectPath ?? null,
      modelId: input.modelId ?? this.state.activeModelId,
      messages: [
        {
          id: nanoid(8),
          role: "system",
          content:
            "You are Mac Coding Agent, a 24/7 local coding assistant running on the user’s Mac with open-source models.",
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    this.state.sessions.unshift(session);
    this.scheduleSave();
    return session;
  }

  appendMessage(
    sessionId: string,
    role: "user" | "assistant",
    content: string,
  ): Session {
    const session = this.getSession(sessionId);
    if (!session) throw new Error("Session not found");
    const now = new Date().toISOString();
    session.messages.push({
      id: nanoid(8),
      role,
      content,
      createdAt: now,
    });
    session.updatedAt = now;
    if (role === "user" && session.title === "New coding session") {
      session.title = content.slice(0, 48) || session.title;
    }
    this.scheduleSave();
    return session;
  }

  listTasks(): CodingTask[] {
    return [...this.state.tasks].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  enqueueTask(sessionId: string, prompt: string): CodingTask {
    const task: CodingTask = {
      id: nanoid(10),
      sessionId,
      prompt,
      status: "queued",
      result: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    this.state.tasks.unshift(task);
    this.scheduleSave();
    return task;
  }

  updateTask(id: string, patch: Partial<CodingTask>): CodingTask {
    const task = this.state.tasks.find((t) => t.id === id);
    if (!task) throw new Error("Task not found");
    Object.assign(task, patch);
    this.scheduleSave();
    return task;
  }

  listProjects(): ProjectInfo[] {
    return this.state.projects;
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      void this.persistNow();
    }, 50);
  }

  async persistNow(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }
}
