import type {
  AgentHealth,
  CodingTask,
  ModelInfo,
  ProjectInfo,
  Session,
} from "./types";

const BASE = "/agent-api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function fetchHealth(): Promise<AgentHealth> {
  return request<AgentHealth>("/health");
}

export function fetchModels(): Promise<{
  models: ModelInfo[];
  activeModelId: string;
  localModelsReachable: boolean;
}> {
  return request("/models");
}

export function setActiveModel(modelId: string): Promise<{ activeModelId: string }> {
  return request("/models/active", {
    method: "POST",
    body: JSON.stringify({ modelId }),
  });
}

export function fetchSessions(): Promise<{ sessions: Session[] }> {
  return request("/sessions");
}

export function createSession(title?: string): Promise<{ session: Session }> {
  return request("/sessions", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function fetchSession(id: string): Promise<{ session: Session }> {
  return request(`/sessions/${id}`);
}

export function sendChat(
  sessionId: string,
  content: string,
): Promise<{ reply: string; session: Session; taskId: string }> {
  return request(`/sessions/${sessionId}/chat`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function fetchProjects(): Promise<{ projects: ProjectInfo[] }> {
  return request("/projects");
}

export function fetchTasks(): Promise<{ tasks: CodingTask[] }> {
  return request("/tasks");
}

export function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
