import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

import {
  getFirebaseAdminAuth,
  getFirebaseAdminFirestore,
} from "@/lib/firebase/admin";

const authorizationSchema = z.string().regex(/^Bearer\s+\S+$/i);

export const tokenRequestSchema = z.object({
  enabled: z.boolean(),
  token: z.string().min(100).max(4096).optional(),
  language: z.enum(["ta", "en"]).optional(),
}).superRefine((data, ctx) => {
  if (data.enabled && !data.token) {
    ctx.addIssue({ code: "custom", path: ["token"], message: "Token required when enabling reminders" });
  }
});

function getBearerToken(request: Request): string | null {
  const value = authorizationSchema.safeParse(request.headers.get("authorization"));
  return value.success ? value.data.replace(/^Bearer\s+/i, "") : null;
}

export async function POST(request: Request): Promise<NextResponse> {
  const bearer = getBearerToken(request);
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = tokenRequestSchema.parse(await request.json());
    const decoded = await getFirebaseAdminAuth().verifyIdToken(bearer);
    const uid = z.string().min(1).parse(decoded.uid);
    const ref = getFirebaseAdminFirestore().collection("users").doc(uid);

    if (body.enabled) {
      await ref.set({
        settings: {
          fcmToken: body.token,
          reminderOptIn: true,
          ...(body.language ? { language: body.language } : {}),
        },
      }, { merge: true });
    } else {
      await ref.update({
        "settings.reminderOptIn": false,
        "settings.fcmToken": FieldValue.delete(),
      });
    }

    return NextResponse.json({ enabled: body.enabled });
  } catch (error: unknown) {
    console.error("Reminder token request failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Invalid reminder request" }, { status: 400 });
  }
}
