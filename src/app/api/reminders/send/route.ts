import { NextResponse } from "next/server";
import { getMessaging } from "firebase-admin/messaging";
import { FieldPath } from "firebase-admin/firestore";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getDateKey } from "@/lib/streak";
import { selectReminderRecipients, type ReminderUser } from "@/lib/reminders";

const INVALID_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

const messages = {
  ta: { title: "ஆன்மிகம்", body: "உங்கள் இன்றைய அட்டை தயாராக உள்ளது" },
  en: { title: "Aanmigam", body: "Your card for today is ready" },
} as const;

function authorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!authorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getDateKey();
  const snapshot = await getFirebaseAdminFirestore().collection("users").get();
  const users: ReminderUser[] = snapshot.docs.map((doc) => ({
    uid: doc.id,
    ...(doc.data() as Omit<ReminderUser, "uid">),
  }));

  const recipients = selectReminderRecipients(users, today);
  let sent = 0;
  let removed = 0;

  for (const recipient of recipients) {
    const message = messages[recipient.language];
    const result = await getMessaging().sendEachForMulticast({
      tokens: [recipient.token],
      notification: message,
      data: { type: "daily-card", language: recipient.language },
    });

    const response = result.responses[0];
    if (response?.success) {
      sent += 1;
    } else if (response?.error && INVALID_TOKEN_CODES.has(response.error.code)) {
      await getFirebaseAdminFirestore().collection("users").doc(recipient.uid).update({
        "settings.fcmToken": FieldPath.delete(),
        "settings.reminderOptIn": false,
      });
      removed += 1;
    }
  }

  return NextResponse.json({ date: today, selected: recipients.length, sent, removed });
}
