import { describe, expect, it, vi, beforeEach } from "vitest";

const limit = vi.fn();

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    constructor() {}
    limit = limit;
  },
}));

vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor() {}
  },
}));

describe("API security", () => {
  beforeEach(() => {
    vi.resetModules();
    limit.mockReset();
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  });

  it("allows a request when both IP and UID limits pass", async () => {
    limit.mockResolvedValue({ success: true, reset: Date.now() + 1000 });
    const { enforceRateLimit } = await import("@/lib/security/api");
    const response = await enforceRateLimit(
      new Request("https://example.com/api/pick", { headers: { "x-forwarded-for": "203.0.113.5" } }),
      "user-1",
    );
    expect(response).toBeNull();
    expect(limit).toHaveBeenCalledTimes(2);
    expect(limit).toHaveBeenCalledWith("ip:203.0.113.5");
    expect(limit).toHaveBeenCalledWith("uid:user-1");
  });

  it("returns 429 when either identifier is blocked", async () => {
    limit
      .mockResolvedValueOnce({ success: true, reset: Date.now() + 1000 })
      .mockResolvedValueOnce({ success: false, reset: Date.now() + 5000 });
    const { enforceRateLimit } = await import("@/lib/security/api");
    const response = await enforceRateLimit(
      new Request("https://example.com/api/pick", { headers: { "x-forwarded-for": "203.0.113.6" } }),
      "user-2",
    );
    expect(response?.status).toBe(429);
    expect(response?.headers.get("retry-after")).toBeTruthy();
  });

  it("closes cross-origin API requests", async () => {
    const { rejectUnexpectedOrigin } = await import("@/lib/security/api");
    const response = rejectUnexpectedOrigin(
      new Request("https://example.com/api/pick", { headers: { origin: "https://evil.example" } }),
    );
    expect(response?.status).toBe(403);
  });
});

describe("security headers", () => {
  it("defines the required hardening headers and a CSP without unsafe-inline", async () => {
    const { securityHeaders } = await import("../next.config");
    const names = new Set(securityHeaders.map((header) => header.key));
    for (const name of [
      "Content-Security-Policy",
      "Strict-Transport-Security",
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Referrer-Policy",
      "Permissions-Policy",
    ]) {
      expect(names.has(name)).toBe(true);
    }

    const csp = securityHeaders.find((header) => header.key === "Content-Security-Policy")?.value ?? "";
    expect(csp).not.toContain("'unsafe-inline'");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
