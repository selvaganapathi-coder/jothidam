"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { cardsCatalog, type CardRarity } from "@/lib/cards";
import { getUserCollection, type UserCollection } from "@/lib/collection";
import type { AppLocale } from "@/i18n/routing";

type RarityFilter = "all" | CardRarity;

type CollectionGridProps = {
  loadCollection?: () => Promise<UserCollection>;
};

export function CollectionGrid({
  loadCollection = getUserCollection,
}: CollectionGridProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("collection");
  const tRarity = useTranslations("cardRarity");
  const [collection, setCollection] = useState<UserCollection>({});
  const [filter, setFilter] = useState<RarityFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void loadCollection()
      .then((value) => {
        if (active) setCollection(value);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadCollection]);

  const discoveredCount = useMemo(
    () => cardsCatalog.cards.filter((card) => (collection[card.id] ?? 0) > 0).length,
    [collection],
  );

  const visibleCards = useMemo(
    () =>
      cardsCatalog.cards.filter(
        (card) => filter === "all" || card.rarity === filter,
      ),
    [filter],
  );

  return (
    <section
      className="flex flex-col gap-5"
      data-testid="collection"
      data-loading={loading ? "true" : "false"}
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {t("description")}
          </p>
        </div>
        <p
          className="shrink-0 text-lg font-bold text-zinc-900 dark:text-zinc-50"
          data-testid="collection-count"
        >
          {discoveredCount}/{cardsCatalog.cards.length}
        </p>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={t("rarityFilter")}
      >
        {(["all", "common", "rare", "epic"] as RarityFilter[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            data-testid={`collection-filter-${value}`}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          >
            {value === "all" ? t("all") : tRarity(value)}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-900" role="alert">
          {t("error")}
        </p>
      ) : null}

      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        data-testid="collection-grid"
      >
        {visibleCards.map((card) => {
          const unlocked = (collection[card.id] ?? 0) > 0;

          return (
            <article
              key={card.id}
              data-testid={`collection-card-${card.id}`}
              data-locked={unlocked ? "false" : "true"}
              className="relative min-h-36 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              {unlocked ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {tRarity(card.rarity)}
                  </p>
                  <p className="mt-3 text-2xl">{card.symbol[locale]}</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {card.message[locale]}
                  </p>
                </>
              ) : (
                <div
                  className="flex h-full min-h-28 flex-col items-center justify-center gap-2 text-zinc-400"
                  aria-label={t("locked")}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-2xl dark:bg-zinc-800">
                    ?
                  </div>
                  <p className="text-sm font-semibold">{t("locked")}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
