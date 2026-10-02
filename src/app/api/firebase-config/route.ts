import { NextResponse } from "next/server";
import { enforceRateLimit, rejectUnexpectedOrigin } from "@/lib/security/api";

export async function GET(request: Request): Promise<NextResponse> {
  const originError = rejectUnexpectedOrigin(request);
  if (originError) return originError;
  const rateLimitResponse = await enforceRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;
  return new NextResponse(
    `self.FIREBASE_CONFIG = ${JSON.stringify({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    })};`,
    { headers: { "content-type": "application/javascript; charset=utf-8" } },
  );
}
