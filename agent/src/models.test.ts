import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";
import { probeLocalModels, stubComplete } from "./models.js";

describe("stubComplete", () => {
  it("prompts empty input with an online cue", () => {
    expect(stubComplete("")).toMatch(/online/i);
  });

  it("returns a React snippet for component prompts", () => {
    const out = stubComplete("Build a React component for settings");
    expect(out).toContain("```tsx");
    expect(out).toContain("FeaturePanel");
  });

  it("returns a test snippet for unit-test prompts", () => {
    const out = stubComplete("Write a unit test");
    expect(out).toContain("vitest");
  });

  it("echoes a plan for general coding prompts", () => {
    const out = stubComplete("Refactor the auth middleware");
    expect(out).toMatch(/Proposed plan/i);
    expect(out).toContain("Refactor the auth middleware");
  });
});

describe("probeLocalModels", () => {
  it("returns stub models when provider is stub", async () => {
    const config = loadConfig({
      MCA_MODEL_PROVIDER: "stub",
    });
    const result = await probeLocalModels(config);
    expect(result.reachable).toBe(true);
    expect(result.models.some((m) => m.id === "stub-coder")).toBe(true);
  });

  it("falls back to stub models when Ollama is unreachable", async () => {
    const config = loadConfig({
      MCA_MODEL_PROVIDER: "ollama",
      MCA_MODEL_BASE_URL: "http://127.0.0.1:9",
    });
    const result = await probeLocalModels(config);
    expect(result.reachable).toBe(false);
    expect(result.models[0]?.provider).toBe("stub");
  });
});
