export interface AgentHealth {
  name: string;
  version: string;
  status: "running" | "idle" | "busy" | "offline";
  uptimeSeconds: number;
  startedAt: string;
  modelProvider: string;
  activeModel: string;
  sessions: number;
  tasksQueued: number;
  tasksRunning: number;
  localModelsReachable: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
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

export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  language: string;
  lastOpenedAt: string;
}

export interface CodingTask {
  id: string;
  sessionId: string;
  prompt: string;
  status: "queued" | "running" | "completed" | "failed";
  result: string | null;
  createdAt: string;
  completedAt: string | null;
}
