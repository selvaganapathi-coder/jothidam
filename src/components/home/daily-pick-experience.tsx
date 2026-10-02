"use client";

import { useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { FortuneCard } from "@/components/home/fortune-card";
import type { DailyPickViewState } from "@/components/home/daily-pick-types";
import { ParrotCageScene } from "@/components/home/parrot-cage-scene";
import type { AppLocale } from "@/i18n/routing";
import type { CardRarity } from "@/lib/cards";
import { requestDailyPick, type RequestPickFn } from "@/lib/request-daily-pick";

const CARD_COUNT = 5;
const STORAGE_KEY = "jothidam.daily-pick.v2";

type DailyPickExperienceProps = {
  requestPick?: RequestPickFn;
  initialViewState?: DailyPickViewState;
  streakCount?: number;
};

function rarityTranslationKey(rarity: CardRarity): "common" | "rare" | "epic" {
  return rarity;
}

function readStoredResult(): DailyPickViewState {
  if (typeof window === "undefined") return { kind: "idle" };

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { kind: "idle" };

    const parsed = JSON.parse(raw) as DailyPickViewState;
    if (
      parsed.kind === "result" &&
      parsed.card &&
      typeof parsed.cardIndex === "number" &&
      typeof parsed.nextPickAt === "string"
    ) {
      return parsed;
    }
  } catch {
    // Ignore invalid or unavailable session storage.
  }

  return { kind: "idle" };
}

function persistResult(state: Extract<DailyPickViewState, { kind: "result" }>) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Session storage is an enhancement, not a requirement.
  }
}

function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => value.toString().padStart(2, "0")).join(":");
}

function FlameIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.8 2.7c.3 3.3-1.2 4.9-2.7 6.4-1.5 1.5-2.7 3-2.7 5.4A5.7 5.7 0 0 0 13 20.2a5.8 5.8 0 0 0 5.8-5.8c0-3.5-2.1-6.7-6-11.7Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.4 11.2c.2 1.7-.8 2.4-1.3 3.3-.7 1.1-.2 2.8 1.7 3.2 1.7-.2 2.6-1.4 2.6-2.9 0-1.2-.7-2.3-3-3.6Z"
      />
    </svg>
  );
}

export function DailyPickExperience({
  requestPick = requestDailyPick,
  initialViewState,
  streakCount = 0,
}: DailyPickExperienceProps) {
  const tHome = useTranslations("home");
  const tRarity = useTranslations("cardRarity");
  const tErrors = useTranslations("errors");
  const locale = useLocale() as AppLocale;
  const reducedMotion = useReducedMotion();
  const [viewState, setViewState] = useState<DailyPickViewState>(
    initialViewState ?? readStoredResult(),
  );
  const [countdown, setCountdown] = useState(0);

  const isLoading = viewState.kind === "loading";
  const isResult = viewState.kind === "result";
  const flippedIndex = isResult ? viewState.cardIndex : null;

  useEffect(() => {
    if (!isResult) {
      setCountdown(0);
      return;
    }

    const update = () => {
      const remaining = Math.max(
        0,
        Math.ceil((Date.parse(viewState.nextPickAt) - Date.now()) / 1000),
      );
      setCountdown(remaining);
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [isResult, isResult ? viewState.nextPickAt : null]);

  const statusLabel = useMemo(() => viewState.kind, [viewState.kind]);

  async function handlePick() {
    if (
      viewState.kind === "loading" ||
      (viewState.kind === "result" && viewState.alreadyPicked)
    ) {
      return;
    }

    setViewState({ kind: "loading" });

    const outcome = await requestPick();

    if (outcome.ok) {
      const result: DailyPickViewState = {
        kind: "result",
        card: outcome.card,
        cardIndex: outcome.cardIndex,
        streak: outcome.streak,
        longestStreak: outcome.longestStreak,
        alreadyPicked: outcome.alreadyPicked,
        nextPickAt: outcome.nextPickAt,
      };
      setViewState(result);
      persistResult(result);
      return;
    }

    setViewState({ kind: "error", reason: outcome.reason });
  }

  const pickDisabled =
    viewState.kind === "loading" ||
    (viewState.kind === "result" && viewState.alreadyPicked);

  const streak = isResult ? viewState.streak : streakCount;
  const longestStreak = isResult ? viewState.longestStreak : streakCount;

  return (
    <section
      className="mx-auto flex w-full max-w-[360px] flex-col gap-5 px-4 py-6"
      aria-live="polite"
      data-testid="daily-pick-experience"
      data-status={statusLabel}
    >
      <ParrotCageScene isAnimating={isLoading} />

      <div className="flex justify-center gap-2" data-testid="fortune-card-deck">
        {Array.from({ length: CARD_COUNT }).map((_, index) => {
          const isFlipped = isResult && flippedIndex === index;
          const card = isResult ? viewState.card : undefined;

          return (
            <FortuneCard
              key={index}
              index={index}
              isFlipped={isFlipped}
              reducedMotion={Boolean(reducedMotion)}
              symbol={card ? card.symbol[locale] : undefined}
              message={card ? card.message[locale] : undefined}
              rarity={card?.rarity}
              rarityLabel={
                card ? tRarity(rarityTranslationKey(card.rarity)) : undefined
              }
            />
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <p className="text-center text-sm font-medium text-amber-900" data-testid="daily-pick-loading">
            {tHome("picking")}
          </p>
        ) : null}

        {isResult ? (
          <div className="rounded-xl bg-amber-100 px-4 py-3 text-center text-sm font-medium text-amber-950">
            <p data-testid="daily-pick-result-summary">
              {viewState.alreadyPicked
                ? tHome("alreadyPickedToday")
                : tHome("comeBackTomorrow")}
            </p>
            <p className="mt-1 font-mono text-xs" data-testid="daily-pick-countdown">
              {tHome("nextPickIn", { time: formatCountdown(countdown) })}
            </p>
          </div>
        ) : null}

        {viewState.kind === "error" ? (
          <div
            className="rounded-xl bg-red-100 px-4 py-3 text-center text-sm font-medium text-red-900"
            data-testid="daily-pick-error"
            role="alert"
          >
            {viewState.reason === "network"
              ? tErrors("network")
              : viewState.reason === "unauthorized"
                ? tErrors("unauthorized")
                : tErrors("generic")}
          </div>
        ) : null}

        <button
          type="button"
          data-testid="daily-pick-button"
          className="min-h-12 w-full rounded-full bg-zinc-900 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          disabled={pickDisabled}
          aria-busy={isLoading}
          onClick={() => void handlePick()}
        >
          {viewState.kind === "error" ? tHome("tryAgain") : tHome("pickCard")}
        </button>

        <div
          className="flex items-center justify-center gap-5 text-sm font-medium text-zinc-800 dark:text-zinc-200"
          data-testid="daily-pick-streak"
        >
          <span className="inline-flex items-center gap-1.5">
            <FlameIcon />
            {tHome("streak", { count: streak })}
          </span>
          <span>{tHome("longestStreak", { count: longestStreak })}</span>
        </div>
      </div>
    </section>
  );
}
