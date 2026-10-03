const IST_TIME_ZONE = "Asia/Kolkata";
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateKey(dateKey: string): [number, number, number] {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    throw new Error("Invalid date key");
  }

  const [year = 0, month = 0, day = 0] = dateKey.split("-").map(Number);
  return [year, month, day];
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export function getDateKey(
  date: Date = new Date(),
  timeZone: string = IST_TIME_ZONE,
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type === "year" || part.type === "month" || part.type === "day") {
      values[part.type] = part.value;
    }
  }

  if (!values.year || !values.month || !values.day) {
    throw new Error("Unable to determine date key");
  }

  return `${values.year}-${values.month}-${values.day}`;
}

export function getPreviousDateKey(dateKey: string): string {
  const [year, month, day] = parseDateKey(dateKey);
  const previous = new Date(Date.UTC(year, month - 1, day - 1));

  return formatDateKey(
    previous.getUTCFullYear(),
    previous.getUTCMonth() + 1,
    previous.getUTCDate(),
  );
}

export function isYesterday(
  lastPickDate: string | undefined,
  today: string,
): boolean {
  return lastPickDate === getPreviousDateKey(today);
}

export function calculateStreak(
  lastPickDate: string | undefined,
  today: string,
  currentStreak: number,
): number {
  return isYesterday(lastPickDate, today) ? currentStreak + 1 : 1;
}

export function getNextPickAt(dateKey: string): string {
  const [year, month, day] = parseDateKey(dateKey);
  const nextDayUtc = Date.UTC(year, month - 1, day + 1);

  // Asia/Kolkata is fixed at UTC+05:30.
  return new Date(nextDayUtc - 5.5 * 60 * 60 * 1000).toISOString();
}

export const STREAK_MILESTONES = [
  { streak: 3, badge: "streak-3" },
  { streak: 7, badge: "streak-7" },
  { streak: 30, badge: "streak-30" },
] as const;

export function getMilestoneRewards(
  previousStreak: number,
  currentStreak: number,
  existingBadges: string[] = [],
): { badges: string[]; secondPickTokens: number } {
  const rewards = STREAK_MILESTONES.filter(
    (milestone) =>
      milestone.streak > previousStreak &&
      milestone.streak <= currentStreak &&
      !existingBadges.includes(milestone.badge),
  );

  return {
    badges: rewards.map((milestone) => milestone.badge),
    secondPickTokens: rewards.length,
  };
}
