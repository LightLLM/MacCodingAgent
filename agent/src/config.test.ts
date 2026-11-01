import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("uses defaults", () => {
    const config = loadConfig({});
    expect(config.port).toBe(8787);
    expect(config.host).toBe("0.0.0.0");
    expect(config.modelProvider).toBe("ollama");
    expect(config.modelName).toBe("llama3.2");
  });

  it("reads overrides from env", () => {
    const config = loadConfig({
      MCA_PORT: "9000",
      MCA_HOST: "127.0.0.1",
      MCA_MODEL_PROVIDER: "stub",
      MCA_MODEL_NAME: "custom",
      MCA_MODEL_BASE_URL: "http://localhost:11434",
      MCA_DATA_DIR: "/tmp/mca",
    });
    expect(config.port).toBe(9000);
    expect(config.host).toBe("127.0.0.1");
    expect(config.modelProvider).toBe("stub");
    expect(config.modelName).toBe("custom");
    expect(config.dataDir).toBe("/tmp/mca");
  });
});
