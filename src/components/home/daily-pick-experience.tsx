"use client";

import { useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { FortuneCard } from "@/components/home/fortune-card";
import type { DailyPickViewState } from "@/components/home/daily-pick-types";
import { ParrotCageScene } from "@/components/home/parrot-cage-scene";
import type { AppLocale } from "@/i18n/routing";
import type { CardRarity } from "@/lib/cards";
import { requestDailyPick, type RequestPickFn } from "@/lib/request-daily-pick";

const CARD_COUNT = 5;

type DailyPickExperienceProps = {
  requestPick?: RequestPickFn;
  initialViewState?: DailyPickViewState;
  streakCount?: number;
};

function rarityTranslationKey(rarity: CardRarity): "common" | "rare" | "epic" {
  return rarity;
}

export function DailyPickExperience({
  requestPick = requestDailyPick,
  initialViewState = { kind: "idle" },
  streakCount = 0,
}: DailyPickExperienceProps) {
  const tHome = useTranslations("home");
  const tRarity = useTranslations("cardRarity");
  const tErrors = useTranslations("errors");
  const locale = useLocale() as AppLocale;
  const reducedMotion = useReducedMotion();

  const [viewState, setViewState] =
    useState<DailyPickViewState>(initialViewState);

  const isLoading = viewState.kind === "loading";
  const isResult = viewState.kind === "result";
  const flippedIndex = isResult ? viewState.cardIndex : null;

  const statusLabel = useMemo(() => {
    switch (viewState.kind) {
      case "idle":
        return "idle";
      case "loading":
        return "loading";
      case "result":
        return "result";
      case "already-picked-today":
        return "already-picked-today";
      case "error":
        return "error";
      default:
        return "idle";
    }
  }, [viewState.kind]);

  async function handlePick() {
    if (
      viewState.kind === "loading" ||
      viewState.kind === "already-picked-today"
    ) {
      return;
    }

    setViewState({ kind: "loading" });

    try {
      const outcome = await requestPick();

      if (outcome.ok) {
        setViewState({
          kind: "result",
          card: outcome.card,
          cardIndex: outcome.cardIndex,
        });
        return;
      }

      if (outcome.reason === "already_picked") {
        setViewState({ kind: "already-picked-today" });
        return;
      }

      setViewState({ kind: "error" });
    } catch {
      setViewState({ kind: "error" });
    }
  }

  const pickDisabled =
    viewState.kind === "loading" ||
    viewState.kind === "already-picked-today" ||
    viewState.kind === "result";

  return (
    <section
      className="mx-auto flex w-full max-w-[360px] flex-col gap-5 px-4 py-6"
      aria-live="polite"
      data-testid="daily-pick-experience"
      data-status={statusLabel}
    >
      <ParrotCageScene isAnimating={isLoading} />

      <div
        className="flex justify-center gap-2"
        data-testid="fortune-card-deck"
      >
        {Array.from({ length: CARD_COUNT }).map((_, index) => {
          const isFlipped = flippedIndex === index;
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
        {viewState.kind === "loading" ? (
          <p className="text-center text-sm font-medium text-amber-900">
            {tHome("picking")}
          </p>
        ) : null}

        {viewState.kind === "already-picked-today" ? (
          <p
            className="rounded-xl bg-amber-100 px-4 py-3 text-center text-sm font-medium text-amber-950"
            data-testid="daily-pick-already-picked"
          >
            {tHome("alreadyPickedToday")}
          </p>
        ) : null}

        {viewState.kind === "error" ? (
          <p
            className="rounded-xl bg-red-100 px-4 py-3 text-center text-sm font-medium text-red-900"
            data-testid="daily-pick-error"
            role="alert"
          >
            {tErrors("generic")}
          </p>
        ) : null}

        {viewState.kind === "result" ? (
          <p
            className="text-center text-sm text-zinc-600 dark:text-zinc-400"
            data-testid="daily-pick-result-summary"
          >
            {tHome("comeBackTomorrow")}
          </p>
        ) : null}

        <button
          type="button"
          data-testid="daily-pick-button"
          className="min-h-12 w-full rounded-full bg-zinc-900 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          disabled={pickDisabled}
          aria-busy={isLoading}
          onClick={() => {
            void handlePick();
          }}
        >
          {viewState.kind === "error" ? tHome("tryAgain") : tHome("pickCard")}
        </button>

        <p className="text-center text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {tHome("streak", { count: streakCount })}
        </p>
      </div>
    </section>
  );
}
