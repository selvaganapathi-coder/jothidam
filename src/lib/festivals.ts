import type { CardsFile, Card } from "@/lib/cards";

const IST_TIME_ZONE = "Asia/Kolkata";
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getIstDateKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type === "year" || part.type === "month" || part.type === "day") values[part.type] = part.value;
  }
  if (!values.year || !values.month || !values.day) throw new Error("Unable to determine IST date");
  return `${values.year}-${values.month}-${values.day}`;
}

export function isFestivalActive(
  festival: CardsFile["festivals"][number],
  date: Date = new Date(),
): boolean {
  const dateKey = getIstDateKey(date);
  return dateKey >= festival.startDate && dateKey <= festival.endDate;
}

export function getActiveFestivals(
  catalog: CardsFile,
  date: Date = new Date(),
): CardsFile["festivals"] {
  return catalog.festivals.filter((festival) => isFestivalActive(festival, date));
}

export function getFestivalBoost(
  card: Card,
  festivals: CardsFile["festivals"],
): number {
  const boosts = festivals
    .filter((festival) => festival.cardIds.includes(card.id))
    .map((festival) => festival.boostedWeight);
  return boosts.length > 0 ? Math.max(...boosts) : 1;
}
