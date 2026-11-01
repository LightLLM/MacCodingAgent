import { afterEach, describe, expect, it, vi } from "vitest";
import { createSession, fetchHealth, formatUptime } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("api client", () => {
  it("formatUptime edge cases", () => {
    expect(formatUptime(0)).toBe("0s");
    expect(formatUptime(3600)).toBe("1h 0m");
  });

  it("fetchHealth returns JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: "Mac Coding Agent", status: "running" }),
      }),
    );
    const health = await fetchHealth();
    expect(health.name).toBe("Mac Coding Agent");
  });

  it("surfaces API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "boom" }),
      }),
    );
    await expect(createSession("x")).rejects.toThrow(/boom/);
  });
});
