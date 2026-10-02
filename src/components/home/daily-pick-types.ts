import type { Card } from "@/lib/cards";

export type DailyPickViewState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; card: Card; cardIndex: number }
  | { kind: "already-picked-today" }
  | { kind: "error" };
