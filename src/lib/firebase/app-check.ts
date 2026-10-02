"use client";

import { getToken, initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import type { FirebaseApp } from "firebase/app";

let appCheck: AppCheck | null = null;

export function getFirebaseAppCheck(app: FirebaseApp): AppCheck | null {
  if (typeof window === "undefined") return null;
  if (appCheck) return appCheck;

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (!siteKey) return null;

  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  return appCheck;
}

export async function getFirebaseAppCheckToken(): Promise<string | null> {
  const { getFirebaseApp } = await import("@/lib/firebase/client");
  const instance = getFirebaseAppCheck(getFirebaseApp());
  if (!instance) return null;
  const result = await getToken(instance, false);
  return result.token;
}
