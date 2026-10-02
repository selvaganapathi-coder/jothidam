"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

import type { AppLocale } from "@/i18n/routing";
import { ensureAnonymousAuth } from "@/lib/firebase/client";
import { requestFcmToken } from "@/lib/firebase/messaging";

export function ReminderOptIn() {
  const locale = useLocale() as AppLocale;
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const isTamil = locale === "ta";

  async function enable() {
    setBusy(true);
    try {
      const token = await requestFcmToken();
      if (!token) return;

      const user = await ensureAnonymousAuth();
      const idToken = await user.getIdToken();
      const response = await fetch("/api/reminders/token", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled: true, token, language: locale }),
      });
      if (response.ok) setEnabled(true);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const user = await ensureAnonymousAuth();
      const idToken = await user.getIdToken();
      const response = await fetch("/api/reminders/token", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled: false }),
      });
      if (response.ok) setEnabled(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900" data-testid="reminder-opt-in">
      <p className="font-semibold text-zinc-950 dark:text-zinc-50">
        {isTamil ? "தினசரி அட்டை நினைவூட்டல்" : "Daily card reminder"}
      </p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        {isTamil
          ? "தினமும் காலை 8 மணிக்கு உங்கள் அட்டை தயாராக உள்ளது என்று அறிவிப்பைப் பெறுங்கள். அனுமதி உங்கள் விருப்பப்படி மட்டுமே."
          : "Get one notification at 8:00 AM IST when your daily card is ready. You choose whether to allow notifications."}
      </p>
      <div className="mt-3 flex gap-2">
        {!enabled ? (
          <button type="button" disabled={busy} onClick={() => void enable()} className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white" data-testid="reminder-enable">
            {isTamil ? "நினைவூட்டலை இயக்கு" : "Enable reminder"}
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={() => void disable()} className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold" data-testid="reminder-disable">
            {isTamil ? "நினைவூட்டலை நிறுத்து" : "Turn off reminders"}
          </button>
        )}
      </div>
    </section>
  );
}
