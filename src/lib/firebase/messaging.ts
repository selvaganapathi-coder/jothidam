"use client";

import { getMessaging, getToken, isSupported, type Messaging } from "firebase/messaging";

import { getFirebaseApp } from "@/lib/firebase/client";

export async function requestFcmToken(): Promise<string | null> {
  if (!(await isSupported())) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey || !("Notification" in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
    { scope: "/firebase-cloud-messaging-push-scope" },
  );

  const messaging: Messaging = getMessaging(getFirebaseApp());
  return getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
}
