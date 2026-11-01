import { randomBytes } from "node:crypto";

export type ModelProvider = "ollama" | "openai-compatible" | "stub";

export interface ModelInfo {
  id: string;
  name: string;
  provider: ModelProvider;
  available: boolean;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface Session {
  id: string;
  title: string;
  projectPath: string | null;
  modelId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = "queued" | "running" | "completed" | "failed";

export interface CodingTask {
  id: string;
  sessionId: string;
  prompt: string;
  status: TaskStatus;
  result: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  language: string;
  lastOpenedAt: string;
}

export interface AgentHealth {
  name: string;
  version: string;
  status: "running" | "idle" | "busy" | "offline";
  uptimeSeconds: number;
  startedAt: string;
  modelProvider: ModelProvider;
  activeModel: string;
  sessions: number;
  tasksQueued: number;
  tasksRunning: number;
  localModelsReachable: boolean;
}

function id(size = 10): string {
  return randomBytes(size).toString("hex").slice(0, size);
}

function stubComplete(prompt: string): string {
  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();
  if (!trimmed) {
    return "Mac Coding Agent is online. Describe the feature, bug, or file you want to work on.";
  }
  if (lower.includes("hello") || lower.includes("hi ")) {
    return "Hello — Mac Coding Agent is running locally on your Mac. Ask me to scaffold, refactor, or debug code using your open-source model.";
  }
  if (lower.includes("react") || lower.includes("component")) {
    return [
      "Here’s a solid starting point for a React component:",
      "",
      "```tsx",
      "export function FeaturePanel({ title, children }: { title: string; children: React.ReactNode }) {",
      "  return (",
      '    <section className="feature-panel">',
      "      <h2>{title}</h2>",
      "      <div>{children}</div>",
      "    </section>",
      "  );",
      "}",
      "```",
      "",
      "Want me to wire this into a specific route or add tests next?",
    ].join("\n");
  }
  if (lower.includes("test") || lower.includes("unit")) {
    return [
      "Suggested Vitest unit test shape:",
      "",
      "```ts",
      "import { describe, it, expect } from 'vitest';",
      "import { formatUptime } from './api';",
      "",
      "describe('formatUptime', () => {",
      "  it('formats seconds', () => {",
      "    expect(formatUptime(42)).toBe('42s');",
      "  });",
      "});",
      "```",
    ].join("\n");
  }
  return [
    "Mac Coding Agent received your request:",
    "",
    `> ${trimmed.slice(0, 280)}${trimmed.length > 280 ? "…" : ""}`,
    "",
    "I’ll treat this as a local coding task. Proposed plan:",
    "1. Clarify the target files and acceptance criteria",
    "2. Draft the minimal change set",
    "3. Add or update unit tests",
    "4. Summarize what to run locally on your Mac",
    "",
    "Connect Ollama or LM Studio on your Mac for richer model output — this hosted preview keeps the agent loop online with the stub model.",
  ].join("\n");
}

class HostedAgent {
  readonly startedAt = new Date();
  activeModelId = "stub-coder";
  busyCount = 0;
  sessions: Session[] = [];
  tasks: CodingTask[] = [];
  models: ModelInfo[] = [
    {
      id: "stub-coder",
      name: "Mac Coding Stub",
      provider: "stub",
      available: true,
      description: "Hosted stub for the Vercel preview when Ollama is not attached",
    },
    {
      id: "stub-fast",
      name: "Mac Coding Stub Fast",
      provider: "stub",
      available: true,
      description: "Lightweight stub tuned for quick replies",
    },
  ];
  projects: ProjectInfo[] = [
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

  health(): AgentHealth {
    return {
      name: "Mac Coding Agent",
      version: "1.0.0",
      status: this.busyCount > 0 ? "busy" : "running",
      uptimeSeconds: Math.floor((Date.now() - this.startedAt.getTime()) / 1000),
      startedAt: this.startedAt.toISOString(),
      modelProvider: "stub",
      activeModel: this.activeModelId,
      sessions: this.sessions.length,
      tasksQueued: this.tasks.filter((t) => t.status === "queued").length,
      tasksRunning: this.tasks.filter((t) => t.status === "running").length,
      localModelsReachable: true,
    };
  }

  createSession(input: {
    title?: string;
    projectPath?: string | null;
    modelId?: string;
  } = {}): Session {
    const now = new Date().toISOString();
    const session: Session = {
      id: id(),
      title: input.title?.trim() || "New coding session",
      projectPath: input.projectPath ?? null,
      modelId: input.modelId ?? this.activeModelId,
      messages: [
        {
          id: id(8),
          role: "system",
          content:
            "You are Mac Coding Agent, a 24/7 local coding assistant running with open-source models.",
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.unshift(session);
    return session;
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.find((s) => s.id === sessionId);
  }

  async chat(sessionId: string, content: string) {
    const session = this.getSession(sessionId);
    if (!session) throw new Error("Session not found");
    const now = new Date().toISOString();
    session.messages.push({
      id: id(8),
      role: "user",
      content,
      createdAt: now,
    });
    if (session.title === "New coding session") {
      session.title = content.slice(0, 48) || session.title;
    }
    session.updatedAt = now;

    const task: CodingTask = {
      id: id(),
      sessionId,
      prompt: content,
      status: "running",
      result: null,
      createdAt: now,
      completedAt: null,
    };
    this.tasks.unshift(task);
    this.busyCount += 1;
    try {
      const reply = stubComplete(content);
      session.messages.push({
        id: id(8),
        role: "assistant",
        content: reply,
        createdAt: new Date().toISOString(),
      });
      session.updatedAt = new Date().toISOString();
      task.status = "completed";
      task.result = reply;
      task.completedAt = new Date().toISOString();
      return { sessionId, reply, taskId: task.id, session };
    } finally {
      this.busyCount = Math.max(0, this.busyCount - 1);
    }
  }
}

const globalKey = "__macCodingAgentHosted__";

export function getHostedAgent(): HostedAgent {
  const g = globalThis as typeof globalThis & {
    [globalKey]?: HostedAgent;
  };
  if (!g[globalKey]) {
    g[globalKey] = new HostedAgent();
  }
  return g[globalKey]!;
}
