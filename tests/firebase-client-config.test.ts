import { describe, expect, it } from "vitest";

import {
  getFirebaseWebClientConfig,
  hasFirebaseClientConfig,
  shouldUseFirebaseEmulators,
} from "@/lib/firebase/client-config";

const sampleEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "test-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "example.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "example-project",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:abc",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "example.appspot.com",
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
};

describe("firebase client config", () => {
  it("builds web config from NEXT_PUBLIC env vars", () => {
    expect(getFirebaseWebClientConfig(sampleEnv)).toEqual({
      apiKey: "test-api-key",
      authDomain: "example.firebaseapp.com",
      projectId: "example-project",
      appId: "1:123:web:abc",
      storageBucket: "example.appspot.com",
      messagingSenderId: undefined,
      measurementId: undefined,
    });
  });

  it("detects emulator mode", () => {
    expect(shouldUseFirebaseEmulators(sampleEnv)).toBe(true);
    expect(
      shouldUseFirebaseEmulators({
        ...sampleEnv,
        NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "false",
      }),
    ).toBe(false);
  });

  it("reports missing client config", () => {
    expect(hasFirebaseClientConfig(sampleEnv)).toBe(true);
    expect(hasFirebaseClientConfig({})).toBe(false);
  });
});
