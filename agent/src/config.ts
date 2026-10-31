import type { ModelProvider } from "./types.js";

export interface AgentConfig {
  port: number;
  host: string;
  modelProvider: ModelProvider;
  modelBaseUrl: string;
  modelName: string;
  dataDir: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AgentConfig {
  const provider = (env.MCA_MODEL_PROVIDER as ModelProvider | undefined) ?? "ollama";
  return {
    port: Number(env.MCA_PORT ?? 8787),
    host: env.MCA_HOST ?? "0.0.0.0",
    modelProvider: provider,
    modelBaseUrl: env.MCA_MODEL_BASE_URL ?? "http://127.0.0.1:11434",
    modelName: env.MCA_MODEL_NAME ?? "llama3.2",
    dataDir: env.MCA_DATA_DIR ?? new URL("../data", import.meta.url).pathname,
  };
}
