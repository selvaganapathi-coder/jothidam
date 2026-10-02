import { describe, expect, it } from "vitest";

import { parseOgQuery } from "@/app/api/og/route";

describe("OG card query validation", () => {
  it("accepts known card ids and supported languages", () => {
    const result = parseOgQuery("https://example.test/api/og?card=c01&lang=ta");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ card: "c01", lang: "ta" });
  });

  it("defaults language to Tamil", () => {
    const result = parseOgQuery("https://example.test/api/og?card=e02");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.lang).toBe("ta");
  });

  it("rejects unknown card ids", () => {
    expect(parseOgQuery("https://example.test/api/og?card=unknown&lang=en").success).toBe(false);
  });

  it("rejects unsupported languages", () => {
    expect(parseOgQuery("https://example.test/api/og?card=c01&lang=fr").success).toBe(false);
  });

  it("ignores raw user text and resolves content only from the card catalog", () => {
    const result = parseOgQuery("https://example.test/api/og?card=c01&lang=en&message=Injected%20text&symbol=Injected");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ card: "c01", lang: "en" });
  });
});
