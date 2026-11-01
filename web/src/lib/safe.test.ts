import { describe, expect, it } from "vitest";
import { clampText, isEmail } from "./safe";

describe("safe helpers", () => {
  it("clamps long text", () => {
    expect(clampText("abcdef", 3)).toBe("abc");
    expect(clampText("hi", 10)).toBe("hi");
  });

  it("validates emails", () => {
    expect(isEmail("a@b.com")).toBe(true);
    expect(isEmail("nope")).toBe(false);
  });
});
