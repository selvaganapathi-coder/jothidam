"use client";

import { motion } from "framer-motion";

import type { CardRarity } from "@/lib/cards";

type FortuneCardProps = {
  index: number;
  isFlipped: boolean;
  symbol?: string;
  message?: string;
  rarity?: CardRarity;
  rarityLabel?: string;
  reducedMotion: boolean;
};

const rarityStyles: Record<CardRarity, string> = {
  common: "bg-zinc-200 text-zinc-800",
  rare: "bg-sky-200 text-sky-950",
  epic: "bg-amber-200 text-amber-950",
};

export function FortuneCard({
  index,
  isFlipped,
  symbol,
  message,
  rarity,
  rarityLabel,
  reducedMotion,
}: FortuneCardProps) {
  const showFace = isFlipped && symbol && message && rarity && rarityLabel;

  if (reducedMotion) {
    return (
      <div
        className="relative h-24 w-[4.5rem] shrink-0 sm:h-28 sm:w-20"
        data-testid={`fortune-card-${index}`}
        data-flipped={isFlipped ? "true" : "false"}
      >
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-amber-900/30 bg-gradient-to-br from-amber-700 to-amber-900 shadow-md"
          animate={{ opacity: showFace ? 0 : 1 }}
          transition={{ duration: 0.25 }}
          aria-hidden={Boolean(showFace)}
        >
          <div className="flex h-full items-center justify-center text-xs font-semibold text-amber-100/80">
            ✦
          </div>
        </motion.div>
        {showFace ? (
          <motion.article
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col gap-1 rounded-lg border border-amber-200 bg-amber-50 p-2 text-left shadow-md"
            data-testid="fortune-card-face"
          >
            <span
              className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${rarityStyles[rarity]}`}
            >
              {rarityLabel}
            </span>
            <p className="text-[11px] leading-tight font-semibold text-amber-950">
              {symbol}
            </p>
            <p className="line-clamp-4 text-[10px] leading-snug text-amber-900/90">
              {message}
            </p>
          </motion.article>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="relative h-24 w-[4.5rem] shrink-0 perspective-[1000px] sm:h-28 sm:w-20"
      data-testid={`fortune-card-${index}`}
      data-flipped={isFlipped ? "true" : "false"}
    >
      <motion.div
        className="relative h-full w-full"
        initial={false}
        animate={{ rotateY: showFace ? 180 : 0 }}
        transition={{ duration: 0.55, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center rounded-lg border-2 border-amber-900/30 bg-gradient-to-br from-amber-700 to-amber-900 shadow-md backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="text-xs font-semibold text-amber-100/80">✦</span>
        </div>
        {showFace ? (
          <article
            className="absolute inset-0 flex flex-col gap-1 rounded-lg border border-amber-200 bg-amber-50 p-2 text-left shadow-md"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
            data-testid="fortune-card-face"
          >
            <span
              className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${rarityStyles[rarity]}`}
            >
              {rarityLabel}
            </span>
            <p className="text-[11px] leading-tight font-semibold text-amber-950">
              {symbol}
            </p>
            <p className="line-clamp-4 text-[10px] leading-snug text-amber-900/90">
              {message}
            </p>
          </article>
        ) : null}
      </motion.div>
    </div>
  );
}
