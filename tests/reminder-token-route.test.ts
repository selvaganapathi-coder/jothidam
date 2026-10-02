import { describe, expect, it, vi } from "vitest";

const verifyIdToken = vi.fn().mockResolvedValue({ uid: "user-1" });
const set = vi.fn().mockResolvedValue(undefined);
const update = vi.fn().mockResolvedValue(undefined);
const doc = vi.fn(() => ({ set, update }));
const collection = vi.fn(() => ({ doc }));

vi.mock("@/lib/firebase/admin", () => ({
  getFirebaseAdminAuth: () => ({ verifyIdToken }),
  getFirebaseAdminFirestore: () => ({ collection }),
}));

const { POST } = await import("@/app/api/reminders/token/route");

function request(body: unknown) {
  return new Request("http://localhost/api/reminders/token", {
    method: "POST",
    headers: {
      authorization: "Bearer valid-token",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/reminders/token", () => {
  it("stores an opted-in FCM token server-side", async () => {
    const response = await POST(
      request({
        enabled: true,
        token: "fcm-" + "a".repeat(120),
        language: "en",
      }),
    );

    expect(response.status).toBe(200);
    expect(set).toHaveBeenCalledWith(
      {
        settings: {
          fcmToken: "fcm-" + "a".repeat(120),
          reminderOptIn: true,
          language: "en",
        },
      },
      { merge: true },
    );
  });

  it("removes the token and disables reminders", async () => {
    const response = await POST(request({ enabled: false }));

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        "settings.reminderOptIn": false,
        "settings.fcmToken": expect.anything(),
      }),
    );
  });

  it("rejects enabling without a token", async () => {
    const response = await POST(request({ enabled: true }));

    expect(response.status).toBe(400);
    expect(set).not.toHaveBeenCalled();
  });
});
