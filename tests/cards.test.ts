import { describe, expect, it } from "vitest";

import rawCardsData from "../data/cards.json";
import {
  cardsCatalog,
  cardsFileSchema,
  getCardById,
  loadCardsFile,
  pickCard,
  type CardRarity,
  type RandomFn,
} from "@/lib/cards";

function createSeededRng(seed: number): RandomFn {
  let state = seed >>> 0;

  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe("cards.json", () => {
  it("passes schema validation for the real file", () => {
    expect(() => loadCardsFile(rawCardsData)).not.toThrow();
    expect(cardsFileSchema.safeParse(rawCardsData).success).toBe(true);
  });

  it("gives every card both Tamil and English text", () => {
    for (const card of cardsCatalog.cards) {
      expect(card.symbol.en.trim().length).toBeGreaterThan(0);
      expect(card.symbol.ta.trim().length).toBeGreaterThan(0);
      expect(card.message.en.trim().length).toBeGreaterThan(0);
      expect(card.message.ta.trim().length).toBeGreaterThan(0);
    }
  });

  it("uses unique card ids", () => {
    const ids = cardsCatalog.cards.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("matches rarity distribution to weights over many seeded picks", () => {
    const iterations = 10_000;
    const rng = createSeededRng(42_024);
    const counts: Record<CardRarity, number> = {
      common: 0,
      rare: 0,
      epic: 0,
    };

    for (let i = 0; i < iterations; i += 1) {
      counts[pickCard(rng).rarity] += 1;
    }

    const weights = cardsCatalog.rarityWeights;
    const totalWeight = weights.common + weights.rare + weights.epic;

    for (const rarity of ["common", "rare", "epic"] as const) {
      const expected = (iterations * weights[rarity]) / totalWeight;
      const tolerance = Math.max(200, expected * 0.1);
      expect(counts[rarity]).toBeGreaterThanOrEqual(expected - tolerance);
      expect(counts[rarity]).toBeLessThanOrEqual(expected + tolerance);
    }
  });
});

describe("getCardById", () => {
  it("returns a card when the id exists", () => {
    const first = cardsCatalog.cards[0];
    expect(first).toBeDefined();
    if (!first) {
      throw new Error("Expected at least one card");
    }

    expect(getCardById(first.id)).toEqual(first);
    expect(getCardById("missing-id")).toBeUndefined();
  });
});
