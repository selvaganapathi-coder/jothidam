import { deleteApp, getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  signInAnonymously,
  type Auth,
} from "firebase/auth";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/pick/route";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getDateKey, getPreviousDateKey } from "@/lib/streak";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "srmfamilystore";
const AUTH_EMULATOR =
  process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";

process.env.FIREBASE_PROJECT_ID = PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= AUTH_EMULATOR;

let auth: Auth;
let idToken = "";
let uid = "";

function createRequest(authorization?: string, body?: unknown): Request {
  return new Request("http://localhost/api/pick", {
    method: "POST",
    headers: {
      ...(authorization ? { Authorization: authorization } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function callPick(body?: unknown): Promise<Response> {
  return POST(createRequest(`Bearer ${idToken}`, body));
}

describe("POST /api/pick", () => {
  beforeAll(async () => {
    const app = initializeApp(
      {
        apiKey: "demo-api-key",
        authDomain: `${PROJECT_ID}.firebaseapp.com`,
        projectId: PROJECT_ID,
        appId: "demo-app-id",
      },
      "pick-route-test",
    );
    auth = getAuth(app);
    connectAuthEmulator(auth, `http://${AUTH_EMULATOR}`, {
      disableWarnings: true,
    });

    const credential = await signInAnonymously(auth);
    uid = credential.user.uid;
    idToken = await credential.user.getIdToken();
  });

  beforeEach(async () => {
    await getFirebaseAdminFirestore().collection("users").doc(uid).delete();
  });

  afterAll(async () => {
    await auth.signOut();
    const app = getApps().find(
      (candidate) => candidate.name === "pick-route-test",
    );
    if (app) {
      await deleteApp(app);
    }
  });

  it("rejects a missing token", async () => {
    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects a bad token", async () => {
    const response = await POST(createRequest("Bearer invalid-token"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("accepts a valid Firebase ID token", async () => {
    const response = await callPick();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.alreadyPicked).toBe(false);
    expect(body.card.id).toMatch(/^(c|r|e)\d+$/);
    expect(body.streak).toBe(1);
    expect(body.longestStreak).toBe(1);
    expect(body.nextPickAt).toMatch(/T18:30:00.000Z$/);
    expect(body.secondPickTokenUsed).toBe(false);
    expect(body.secondPickTokens).toBe(0);
    expect(body.badges).toEqual([]);
  });

  it("awards a badge and second-pick token at streak 3, 7, and 30", async () => {
    const milestones = [
      { streak: 3, badge: "streak-3" },
      { streak: 7, badge: "streak-7" },
      { streak: 30, badge: "streak-30" },
    ];

    for (const milestone of milestones) {
      await getFirebaseAdminFirestore().collection("users").doc(uid).set({
        lastPickDate: getPreviousDateKey(getDateKey()),
        lastPickCardId: "c01",
        streak: milestone.streak - 1,
        longestStreak: milestone.streak - 1,
        collection: { c01: 1 },
        totalPicks: milestone.streak - 1,
        badges: [],
        secondPickTokens: 0,
      });

      const response = await callPick();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.streak).toBe(milestone.streak);
      expect(body.badges).toContain(milestone.badge);
      expect(body.secondPickTokens).toBe(1);

      await getFirebaseAdminFirestore().collection("users").doc(uid).delete();
    }
  });

  it("uses one server-side second-pick token exactly once", async () => {
    await getFirebaseAdminFirestore().collection("users").doc(uid).set({
      lastPickDate: getDateKey(),
      lastPickCardId: "c01",
      streak: 7,
      longestStreak: 7,
      collection: { c01: 1 },
      totalPicks: 1,
      badges: ["streak-3", "streak-7"],
      secondPickTokens: 1,
    });

    const first = await callPick({ useSecondPickToken: true });
    const firstBody = await first.json();

    expect(first.status).toBe(200);
    expect(firstBody.alreadyPicked).toBe(false);
    expect(firstBody.secondPickTokenUsed).toBe(true);
    expect(firstBody.secondPickTokens).toBe(0);

    const storedAfterFirst = await getFirebaseAdminFirestore()
      .collection("users").doc(uid).get();
    expect(storedAfterFirst.data()?.secondPickTokens).toBe(0);
    expect(storedAfterFirst.data()?.totalPicks).toBe(2);

    const second = await callPick({ useSecondPickToken: true });
    const secondBody = await second.json();

    expect(second.status).toBe(200);
    expect(secondBody.alreadyPicked).toBe(true);
    expect(secondBody.secondPickTokenUsed).toBe(false);
    expect(secondBody.secondPickTokens).toBe(0);

    const storedAfterSecond = await getFirebaseAdminFirestore()
      .collection("users").doc(uid).get();
    expect(storedAfterSecond.data()?.secondPickTokens).toBe(0);
    expect(storedAfterSecond.data()?.totalPicks).toBe(2);
  });

  it("prevents concurrent double-spending of one second-pick token", async () => {
    await getFirebaseAdminFirestore().collection("users").doc(uid).set({
      lastPickDate: getDateKey(),
      lastPickCardId: "c01",
      streak: 7,
      longestStreak: 7,
      collection: { c01: 1 },
      totalPicks: 1,
      badges: ["streak-3", "streak-7"],
      secondPickTokens: 1,
    });

    const responses = await Promise.all(
      Array.from({ length: 10 }, () =>
        callPick({ useSecondPickToken: true }),
      ),
    );
    const bodies = await Promise.all(
      responses.map((response) => response.json()),
    );

    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(
      bodies.filter((body) => body.secondPickTokenUsed === true),
    ).toHaveLength(1);
    expect(
      bodies.filter((body) => body.alreadyPicked === true),
    ).toHaveLength(9);

    const snapshot = await getFirebaseAdminFirestore()
      .collection("users").doc(uid).get();
    const data = snapshot.data();

    expect(data?.secondPickTokens).toBe(0);
    expect(data?.totalPicks).toBe(2);
  });

  it("returns the same card for a same-day repeat", async () => {
    const first = await callPick();
    const firstBody = await first.json();

    const second = await callPick();
    const secondBody = await second.json();

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(secondBody.alreadyPicked).toBe(true);
    expect(secondBody.card).toEqual(firstBody.card);
    expect(secondBody.streak).toBe(firstBody.streak);
    expect(secondBody.longestStreak).toBe(firstBody.longestStreak);
    expect(secondBody.secondPickTokenUsed).toBe(false);
  });

  it("creates only one new pick for concurrent calls", async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, () => callPick()),
    );
    const bodies = await Promise.all(
      responses.map((response) => response.json()),
    );

    expect(responses.every((response) => response.status === 200)).toBe(true);
    expect(
      bodies.filter((body) => body.alreadyPicked === false),
    ).toHaveLength(1);
    expect(new Set(bodies.map((body) => body.card.id)).size).toBe(1);
    expect(
      bodies.filter((body) => body.alreadyPicked === true),
    ).toHaveLength(9);

    const snapshot = await getFirebaseAdminFirestore()
      .collection("users")
      .doc(uid)
      .get();
    const data = snapshot.data();

    expect(data?.totalPicks).toBe(1);
    expect(data?.streak).toBe(1);
    expect(data?.longestStreak).toBe(1);
  });
});
