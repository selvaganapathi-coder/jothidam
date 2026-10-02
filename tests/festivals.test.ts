import { describe, expect, it } from "vitest";

import { getActiveFestivals, getFestivalBoost, getIstDateKey, isFestivalActive } from "@/lib/festivals";
import { loadCardsFile, pickCard } from "@/lib/cards";

const festival = {
  id: "test-festival",
  name: { en: "Test Festival", ta: "சோதனை திருவிழா" },
  startDate: "2026-10-03",
  endDate: "2026-10-05",
  cardIds: ["c01", "r01"],
  boostedWeight: 5,
} as const;

describe("festival windows", () => {
  it("uses the IST calendar date", () => {
    expect(getIstDateKey(new Date("2026-10-02T18:29:59.000Z"))).toBe("2026-10-02");
    expect(getIstDateKey(new Date("2026-10-02T18:30:00.000Z"))).toBe("2026-10-03");
  });

  it("includes both start and end dates", () => {
    expect(isFestivalActive(festival, new Date("2026-10-03T00:00:00+05:30"))).toBe(true);
    expect(isFestivalActive(festival, new Date("2026-10-05T23:59:59+05:30"))).toBe(true);
  });

  it("excludes the day before and the day after", () => {
    expect(isFestivalActive(festival, new Date("2026-10-02T23:59:59+05:30"))).toBe(false);
    expect(isFestivalActive(festival, new Date("2026-10-06T00:00:00+05:30"))).toBe(false);
  });

  it("returns only active festivals", () => {
    const catalog = loadCardsFile({
      version: 1,
      disclaimer: { en: "x", ta: "x" },
      rarityWeights: { common: 70, rare: 25, epic: 5 },
      festivals: [festival],
      cards: [{
        id: "c01", rarity: "common", category: "x",
        symbol: { en: "x", ta: "x" }, message: { en: "x", ta: "x" },
      }],
    });
    expect(getActiveFestivals(catalog, new Date("2026-10-04T12:00:00+05:30"))).toHaveLength(1);
    expect(getActiveFestivals(catalog, new Date("2026-10-06T12:00:00+05:30"))).toHaveLength(0);
  });

  it("uses the strongest active boost for a card", () => {
    const card = { id: "c01", rarity: "common", category: "x", symbol: { en: "x", ta: "x" }, message: { en: "x", ta: "x" } };
    expect(getFestivalBoost(card, [festival, { ...festival, id: "f2", boostedWeight: 3 }])).toBe(5);
  });
});

describe("festival weighted pick", () => {
  it("gives an active festival card boosted selection weight", () => {
    const catalog = loadCardsFile({
      version: 1,
      disclaimer: { en: "x", ta: "x" },
      rarityWeights: { common: 1, rare: 1, epic: 1 },
      festivals: [festival],
      cards: [
        { id: "c01", rarity: "common", category: "x", symbol: { en: "x", ta: "x" }, message: { en: "x", ta: "x" } },
        { id: "c02", rarity: "common", category: "x", symbol: { en: "y", ta: "y" }, message: { en: "y", ta: "y" } },
        { id: "r01", rarity: "rare", category: "x", symbol: { en: "r", ta: "r" }, message: { en: "r", ta: "r" } },
        { id: "e01", rarity: "epic", category: "x", symbol: { en: "e", ta: "e" }, message: { en: "e", ta: "e" } },
      ],
    });

    expect(pickCard(() => 0.49, new Date("2026-10-04T12:00:00+05:30"), catalog).id).toBe("c01");
    expect(pickCard(() => 0.75, new Date("2026-10-04T12:00:00+05:30"), catalog).id).toBe("c02");
  });
});
