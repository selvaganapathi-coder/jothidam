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

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "srmfamilystore";
const AUTH_EMULATOR =
  process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";

process.env.FIREBASE_PROJECT_ID = PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= AUTH_EMULATOR;

let auth: Auth;
let idToken = "";
let uid = "";

function createRequest(authorization?: string): Request {
  return new Request("http://localhost/api/pick", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : undefined,
  });
}

async function callPick(): Promise<Response> {
  return POST(createRequest(`Bearer ${idToken}`));
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
