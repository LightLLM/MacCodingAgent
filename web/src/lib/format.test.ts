import { describe, expect, it } from "vitest";
import { formatUptime } from "./api";

describe("formatUptime", () => {
  it("formats seconds only", () => {
    expect(formatUptime(42)).toBe("42s");
  });

  it("formats minutes and seconds", () => {
    expect(formatUptime(125)).toBe("2m 5s");
  });

  it("formats hours and minutes", () => {
    expect(formatUptime(7380)).toBe("2h 3m");
  });
});
