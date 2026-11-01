import type { AgentConfig } from "./config.js";
import type { ModelInfo, ModelProvider } from "./types.js";

const STUB_MODELS: ModelInfo[] = [
  {
    id: "stub-coder",
    name: "Mac Coding Stub",
    provider: "stub",
    available: true,
    description: "On-device stub for demos when Ollama/LM Studio is offline",
  },
  {
    id: "stub-fast",
    name: "Mac Coding Stub Fast",
    provider: "stub",
    available: true,
    description: "Lightweight stub tuned for quick replies",
  },
];

export async function probeLocalModels(config: AgentConfig): Promise<{
  reachable: boolean;
  models: ModelInfo[];
}> {
  if (config.modelProvider === "stub") {
    return { reachable: true, models: STUB_MODELS };
  }

  try {
    if (config.modelProvider === "ollama") {
      const res = await fetch(`${config.modelBaseUrl}/api/tags`, {
        signal: AbortSignal.timeout(1500),
      });
      if (!res.ok) throw new Error(`Ollama status ${res.status}`);
      const data = (await res.json()) as {
        models?: Array<{ name: string; model?: string }>;
      };
      const models: ModelInfo[] = (data.models ?? []).map((m) => ({
        id: m.name,
        name: m.name,
        provider: "ollama" as ModelProvider,
        available: true,
        description: "Local Ollama model",
      }));
      return {
        reachable: true,
        models: models.length ? models : STUB_MODELS,
      };
    }

    const res = await fetch(`${config.modelBaseUrl}/models`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) throw new Error(`Compatible API status ${res.status}`);
    const data = (await res.json()) as {
      data?: Array<{ id: string }>;
    };
    const models: ModelInfo[] = (data.data ?? []).map((m) => ({
      id: m.id,
      name: m.id,
      provider: "openai-compatible" as ModelProvider,
      available: true,
      description: "OpenAI-compatible local model",
    }));
    return {
      reachable: true,
      models: models.length ? models : STUB_MODELS,
    };
  } catch {
    return { reachable: false, models: STUB_MODELS };
  }
}

export async function completeChat(
  config: AgentConfig,
  modelId: string,
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  if (modelId.startsWith("stub-") || config.modelProvider === "stub") {
    return stubComplete(lastUser);
  }

  try {
    if (config.modelProvider === "ollama") {
      const res = await fetch(`${config.modelBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelId || config.modelName,
          messages,
          stream: false,
        }),
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) throw new Error(`Ollama chat ${res.status}`);
      const data = (await res.json()) as { message?: { content?: string } };
      return data.message?.content?.trim() || stubComplete(lastUser);
    }

    const res = await fetch(`${config.modelBaseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelId || config.modelName,
        messages,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) throw new Error(`Compatible chat ${res.status}`);
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content?.trim() || stubComplete(lastUser);
  } catch {
    return stubComplete(lastUser);
  }
}

export function stubComplete(prompt: string): string {
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
      "import { stubComplete } from './models';",
      "",
      "describe('stubComplete', () => {",
      "  it('answers empty prompts with an online cue', () => {",
      "    expect(stubComplete('')).toMatch(/online/i);",
      "  });",
      "});",
      "```",
    ].join("\n");
  }

  return [
    `Mac Coding Agent received your request:`,
    "",
    `> ${trimmed.slice(0, 280)}${trimmed.length > 280 ? "…" : ""}`,
    "",
    "I’ll treat this as a local coding task. Proposed plan:",
    "1. Clarify the target files and acceptance criteria",
    "2. Draft the minimal change set",
    "3. Add or update unit tests",
    "4. Summarize what to run locally on your Mac",
    "",
    "Connect Ollama or LM Studio for richer model output — until then the stub model keeps the 24/7 loop alive.",
  ].join("\n");
}
