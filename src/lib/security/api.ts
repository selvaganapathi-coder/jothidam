import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { NextResponse } from "next/server";
import { z } from "zod";

const BODY_LIMITS = {
  pick: 4096,
  reminderToken: 16384,
} as const;

let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit {
  if (limiter) return limiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Rate limiting is not configured");
  limiter = new Ratelimit({
    redis: new Redis({ url, token, enableTelemetry: false }),
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    analytics: true,
    prefix: "jothidam:api",
  });
  return limiter;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function enforceRateLimit(
  request: Request,
  uid?: string,
): Promise<NextResponse | null> {
  const checks = [
    getLimiter().limit(`ip:${getClientIp(request)}`),
    ...(uid ? [getLimiter().limit(`uid:${uid}`)] : []),
  ];
  const results = await Promise.all(checks);
  const blocked = results.find((result) => !result.success);
  if (!blocked) return null;

  const response = NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429 },
  );
  response.headers.set("Retry-After", String(Math.max(1, Math.ceil((blocked.reset - Date.now()) / 1000))));
  return response;
}

export function rejectUnexpectedOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    const requestOrigin = new URL(request.url).origin;
    return origin === requestOrigin
      ? null
      : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
  limit: number,
): Promise<T> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > limit) {
    throw new Error("Request body too large");
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > limit) {
    throw new Error("Request body too large");
  }
  return schema.parse(raw ? JSON.parse(raw) : {});
}

export const requestBodyLimits = BODY_LIMITS;
