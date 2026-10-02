import { describe, expect, it } from "vitest";

import { formatGreeting } from "@/lib/greeting";

describe("formatGreeting", () => {
  it("returns a welcome message for a valid name", () => {
    expect(formatGreeting("Arun")).toBe("Welcome, Arun");
  });

  it("rejects empty names", () => {
    expect(() => formatGreeting("   ")).toThrow();
  });
});
