"use client";

import { getToken, initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { getFirebaseApp } from "@/lib/firebase/client";

let appCheck: AppCheck | null = null;

export function getFirebaseAppCheck(): AppCheck | null {
  if (typeof window === "undefined") return null;
  if (appCheck) return appCheck;

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (!siteKey) return null;

  appCheck = initializeAppCheck(getFirebaseApp(), {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  return appCheck;
}

export async function getFirebaseAppCheckToken(): Promise<string | null> {
  const instance = getFirebaseAppCheck();
  if (!instance) return null;
  const result = await getToken(instance, false);
  return result.token;
}
