import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "srmfamilystore";

let testEnv: RulesTestEnvironment;

describe("Firestore Security Rules", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8"),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("allows a signed-in user to read only their own user document", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/alice"), {
        settings: { language: "ta", reminderOptIn: true },
        streak: 4,
      });
      await setDoc(doc(context.firestore(), "users/bob"), {
        settings: { language: "en" },
        streak: 8,
      });
    });

    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(getDoc(doc(alice.firestore(), "users/alice")));
    await assertFails(getDoc(doc(alice.firestore(), "users/bob")));
  });

  it("denies client writes to streak and other server-owned fields", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/alice"), {
        settings: { language: "ta" },
        streak: 4,
        lastPickDate: "2026-10-02",
        collection: { c01: 1 },
        totalPicks: 1,
      });
    });

    const alice = testEnv.authenticatedContext("alice");
    const reference = doc(alice.firestore(), "users/alice");

    await assertFails(updateDoc(reference, { streak: 5 }));
    await assertFails(updateDoc(reference, { lastPickDate: "2026-10-03" }));
    await assertFails(updateDoc(reference, { collection: { c01: 2 } }));
    await assertFails(updateDoc(reference, { totalPicks: 2 }));
    await assertFails(updateDoc(reference, { secondPickTokens: 2 }));
    await assertFails(updateDoc(reference, { badges: ["streak-3"] }));
  });

  it("denies creating fields outside the allowed settings field", async () => {
    const alice = testEnv.authenticatedContext("alice");

    await assertFails(
      setDoc(doc(alice.firestore(), "users/alice"), {
        settings: { language: "ta" },
        streak: 1,
      }),
    );

    await assertFails(
      setDoc(doc(alice.firestore(), "users/alice"), {
        language: "ta",
      }),
    );
  });

  it("validates settings types and size", async () => {
    const alice = testEnv.authenticatedContext("alice");
    const reference = doc(alice.firestore(), "users/alice");

    await assertSucceeds(
      setDoc(reference, {
        settings: { language: "ta", reminderOptIn: true },
      }),
    );

    await assertFails(
      updateDoc(reference, {
        settings: { language: "ta", reminderOptIn: "yes" },
      }),
    );

    await assertFails(
      updateDoc(reference, {
        settings: { language: "this-language-is-too-long" },
      }),
    );

    await assertFails(
      updateDoc(reference, {
        settings: { language: "ta", reminderOptIn: true, extra: true },
      }),
    );
  });

  it("allows an authenticated user to update only settings", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/alice"), {
        settings: { language: "en", reminderOptIn: false },
        streak: 4,
        totalPicks: 9,
      });
    });

    const alice = testEnv.authenticatedContext("alice");
    await assertSucceeds(
      updateDoc(doc(alice.firestore(), "users/alice"), {
        settings: { language: "ta", reminderOptIn: true },
      }),
    );
  });

  it("allows public card reads but never client card writes", async () => {
    const unauthenticated = testEnv.unauthenticatedContext();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "cards/c01"), { id: "c01" });
    });

    await assertSucceeds(
      getDoc(doc(unauthenticated.firestore(), "cards/c01")),
    );
    await assertFails(
      setDoc(doc(unauthenticated.firestore(), "cards/c02"), { id: "c02" }),
    );
  });

  it("denies unauthenticated access to user data and all writes", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/alice"), {
        settings: { language: "ta" },
      });
      await setDoc(doc(context.firestore(), "private/secret"), {
        value: "secret",
      });
    });

    const unauthenticated = testEnv.unauthenticatedContext();

    await assertFails(
      getDoc(doc(unauthenticated.firestore(), "users/alice")),
    );
    await assertFails(
      setDoc(doc(unauthenticated.firestore(), "users/new"), {
        settings: { language: "ta" },
      }),
    );
    await assertFails(
      deleteDoc(doc(unauthenticated.firestore(), "private/secret")),
    );
  });
});
