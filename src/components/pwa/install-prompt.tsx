"use client";

import { useEffect, useState } from "react";
import type { AppLocale } from "@/i18n/routing";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const VISIT_COUNT_KEY = "aanmigam.visit-count";
const DISMISSED_KEY = "aanmigam.install-prompt-dismissed";

export function InstallPrompt({ locale }: { locale: AppLocale }) {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const visits = Number.parseInt(
      window.localStorage.getItem(VISIT_COUNT_KEY) ?? "0",
      10,
    );
    const nextVisits = Number.isFinite(visits) ? visits + 1 : 1;
    window.localStorage.setItem(VISIT_COUNT_KEY, String(nextVisits));

    if (
      nextVisits < 2 ||
      window.localStorage.getItem(DISMISSED_KEY) === "true"
    ) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt,
    );

    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  if (!visible || !installEvent) return null;

  const isTamil = locale === "ta";

  async function handleInstall() {
    await installEvent.prompt();
    await installEvent.userChoice;
    setVisible(false);
    setInstallEvent(null);
  }

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
    setInstallEvent(null);
  }

  return (
    <aside
      aria-label={isTamil ? "முகப்புத் திரையில் சேர்க்கவும்" : "Add to Home Screen"}
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      data-testid="install-prompt"
    >
      <div className="flex items-start gap-3">
        <img
          src="/icons/icon.svg"
          alt=""
          className="h-12 w-12 rounded-xl"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-950 dark:text-zinc-50">
            {isTamil ? "Aanmigam-ஐ முகப்புத் திரையில் சேர்க்கவும்" : "Add Aanmigam to your Home Screen"}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {isTamil
              ? "தினசரி அட்டையை விரைவாக அணுகலாம்."
              : "Keep your daily card one tap away."}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              data-testid="install-prompt-action"
            >
              {isTamil ? "சேர்க்கவும்" : "Add"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300"
              data-testid="install-prompt-dismiss"
            >
              {isTamil ? "இப்போது வேண்டாம்" : "Not now"}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
