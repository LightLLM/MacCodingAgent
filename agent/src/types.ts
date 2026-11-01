export type ModelProvider = "ollama" | "openai-compatible" | "stub";

export type AgentStatus = "running" | "idle" | "busy" | "offline";

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

export interface AgentHealth {
  name: string;
  version: string;
  status: AgentStatus;
  uptimeSeconds: number;
  startedAt: string;
  modelProvider: ModelProvider;
  activeModel: string;
  sessions: number;
  tasksQueued: number;
  tasksRunning: number;
  localModelsReachable: boolean;
}

export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  language: string;
  lastOpenedAt: string;
}
