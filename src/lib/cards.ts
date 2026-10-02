import { z } from "zod";

import rawCardsData from "../../data/cards.json";

const localizedTextSchema = z.object({
  en: z.string().min(1),
  ta: z.string().min(1),
});

export const cardRaritySchema = z.enum(["common", "rare", "epic"]);

export const cardSchema = z.object({
  id: z.string().min(1),
  rarity: cardRaritySchema,
  category: z.string().min(1),
  symbol: localizedTextSchema,
  message: localizedTextSchema,
});

export const cardsFileSchema = z
  .object({
    version: z.literal(1),
    disclaimer: localizedTextSchema,
    rarityWeights: z.object({
      common: z.number().positive(),
      rare: z.number().positive(),
      epic: z.number().positive(),
    }),
    cards: z.array(cardSchema).min(1),
  })
  .superRefine((data, ctx) => {
    const seenIds = new Set<string>();

    for (const [index, card] of data.cards.entries()) {
      if (seenIds.has(card.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate card id: ${card.id}`,
          path: ["cards", index, "id"],
        });
      }
      seenIds.add(card.id);
    }

    for (const rarity of cardRaritySchema.options) {
      const weight = data.rarityWeights[rarity];
      if (weight === undefined) {
        ctx.addIssue({
          code: "custom",
          message: `Missing rarity weight for ${rarity}`,
          path: ["rarityWeights", rarity],
        });
        continue;
      }

      const hasCard = data.cards.some((card) => card.rarity === rarity);
      if (!hasCard) {
        ctx.addIssue({
          code: "custom",
          message: `No cards defined for rarity ${rarity}`,
          path: ["cards"],
        });
      }
    }
  });

export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type CardRarity = z.infer<typeof cardRaritySchema>;
export type Card = z.infer<typeof cardSchema>;
export type CardsFile = z.infer<typeof cardsFileSchema>;

export type RandomFn = () => number;

export function loadCardsFile(input: unknown): CardsFile {
  return cardsFileSchema.parse(input);
}

export const cardsCatalog: CardsFile = loadCardsFile(rawCardsData);

const cardsById = new Map(cardsCatalog.cards.map((card) => [card.id, card]));

const cardsByRarity: Record<CardRarity, Card[]> = {
  common: [],
  rare: [],
  epic: [],
};

for (const card of cardsCatalog.cards) {
  cardsByRarity[card.rarity].push(card);
}

export function getCardById(id: string): Card | undefined {
  return cardsById.get(id);
}

function pickRarity(
  weights: CardsFile["rarityWeights"],
  rng: RandomFn,
): CardRarity {
  const total = weights.common + weights.rare + weights.epic;
  const roll = rng() * total;

  if (roll < weights.common) {
    return "common";
  }
  if (roll < weights.common + weights.rare) {
    return "rare";
  }
  return "epic";
}

export function pickCard(rng: RandomFn = Math.random): Card {
  const rarity = pickRarity(cardsCatalog.rarityWeights, rng);
  const pool = cardsByRarity[rarity];

  if (pool.length === 0) {
    throw new Error(`No cards available for rarity ${rarity}`);
  }

  const index = Math.floor(rng() * pool.length);
  const card = pool[index];

  if (!card) {
    throw new Error(`Failed to pick a card for rarity ${rarity}`);
  }

  return card;
}
