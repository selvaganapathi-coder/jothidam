import type { Card } from "@/lib/cards";

export type DailyPickViewState =
  | { kind: "idle" }
  | { kind: "loading" }
  | {
      kind: "result";
      card: Card;
      cardIndex: number;
      streak: number;
      longestStreak: number;
      alreadyPicked: boolean;
      nextPickAt: string;
    }
  | { kind: "error"; reason: "network" | "unauthorized" | "error" };
