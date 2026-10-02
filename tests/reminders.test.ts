import { describe, expect, it } from "vitest";

import { tokenRequestSchema } from "@/app/api/reminders/token/route";
import { selectReminderRecipients } from "@/lib/reminders";

describe("reminder token store validation", () => {
  it("requires a token when enabling reminders", () => {
    expect(tokenRequestSchema.safeParse({ enabled: true }).success).toBe(false);
  });

  it("accepts an enabled token with a supported language", () => {
    const result = tokenRequestSchema.safeParse({
      enabled: true,
      token: "a".repeat(120),
      language: "ta",
    });
    expect(result.success).toBe(true);
  });

  it("accepts disabling without a token", () => {
    expect(tokenRequestSchema.safeParse({ enabled: false }).success).toBe(true);
  });

  it("rejects oversized tokens", () => {
    expect(
      tokenRequestSchema.safeParse({ enabled: true, token: "a".repeat(4097) }).success,
    ).toBe(false);
  });
});

describe("selectReminderRecipients", () => {
  const today = "2026-10-03";

  it("selects opted-in users who have not picked today", () => {
    expect(
      selectReminderRecipients(
        [
          { uid: "u1", settings: { reminderOptIn: true, fcmToken: "t1", language: "ta" } },
          { uid: "u2", settings: { reminderOptIn: true, fcmToken: "t2", language: "en" }, lastPickDate: today },
          { uid: "u3", settings: { reminderOptIn: false, fcmToken: "t3", language: "ta" } },
          { uid: "u4", settings: { reminderOptIn: true, language: "ta" } },
        ],
        today,
      ),
    ).toEqual([{ uid: "u1", token: "t1", language: "ta" }]);
  });

  it("defaults an unknown/missing language to Tamil", () => {
    expect(
      selectReminderRecipients(
        [{ uid: "u1", settings: { reminderOptIn: true, fcmToken: "t1" } }],
        today,
      )[0]?.language,
    ).toBe("ta");
  });
});
