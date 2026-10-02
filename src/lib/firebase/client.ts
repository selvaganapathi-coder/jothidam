"use client";

import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  signInAnonymously,
  type Auth,
  type User,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";

import {
  getFirebaseWebClientConfig,
  readClientFirebaseEnv,
  shouldUseFirebaseEmulators,
} from "@/lib/firebase/client-config";

let authEmulatorConnected = false;
let firestoreEmulatorConnected = false;
let anonymousSignInPromise: Promise<User> | null = null;

function connectClientEmulators(auth: Auth, firestore: Firestore): void {
  const env = readClientFirebaseEnv();

  if (!authEmulatorConnected) {
    const authHost = env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
    connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
    authEmulatorConnected = true;
  }

  if (!firestoreEmulatorConnected) {
    const [host = "127.0.0.1", portValue = "8080"] =
      env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST.split(":");
    const port = Number(portValue);
    connectFirestoreEmulator(firestore, host, port);
    firestoreEmulatorConnected = true;
  }
}

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(getFirebaseWebClientConfig());
}

export function getFirebaseAuth(): Auth {
  const app = getFirebaseApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  if (shouldUseFirebaseEmulators()) {
    connectClientEmulators(auth, firestore);
  }

  return auth;
}

export function getFirebaseFirestore(): Firestore {
  const app = getFirebaseApp();
  const firestore = getFirestore(app);

  if (shouldUseFirebaseEmulators()) {
    connectClientEmulators(getAuth(app), firestore);
  }

  return firestore;
}

export function ensureAnonymousAuth(): Promise<User> {
  const auth = getFirebaseAuth();

  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  if (!anonymousSignInPromise) {
    anonymousSignInPromise = signInAnonymously(auth)
      .then((credential) => credential.user)
      .catch((error: unknown) => {
        anonymousSignInPromise = null;
        throw error;
      });
  }

  return anonymousSignInPromise;
}
