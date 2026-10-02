"use client";

import { useState } from "react";

import type { AppLocale } from "@/i18n/routing";
import { buildCardShareUrl } from "@/lib/share";

type ShareCardButtonProps = {
  cardId: string;
  locale: AppLocale;
  label: string;
  copiedLabel: string;
};

export function ShareCardButton({
  cardId,
  locale,
  label,
  copiedLabel,
}: ShareCardButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = buildCardShareUrl(window.location.origin, cardId, locale);

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Aanmigam", url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      data-testid="share-card-button"
      onClick={() => void handleShare()}
      className="min-h-11 rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
