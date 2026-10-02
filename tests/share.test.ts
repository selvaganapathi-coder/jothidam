import { describe, expect, it } from "vitest";

import { buildCardShareUrl } from "@/lib/share";

describe("buildCardShareUrl", () => {
  it("builds a Tamil OG share URL", () => {
    expect(buildCardShareUrl("https://aanmigam.example", "c01", "ta")).toBe(
      "https://aanmigam.example/api/og?card=c01&lang=ta",
    );
  });

  it("builds an English OG share URL without trusting page query text", () => {
    expect(buildCardShareUrl("https://aanmigam.example/path?message=unsafe", "e02", "en")).toBe(
      "https://aanmigam.example/api/og?card=e02&lang=en",
    );
  });
});
