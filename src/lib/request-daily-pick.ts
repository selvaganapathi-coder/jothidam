import { pickCard, type Card } from "@/lib/cards";

export type RequestPickFailureReason = "already_picked" | "error";

export type RequestPickResult =
  | { ok: true; card: Card; cardIndex: number }
  | { ok: false; reason: RequestPickFailureReason };

export type RequestPickFn = () => Promise<RequestPickResult>;

const MOCK_DELAY_MS = 900;

export async function requestDailyPick(): Promise<RequestPickResult> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_DELAY_MS);
  });

  const card = pickCard();
  const cardIndex = Math.floor(Math.random() * 5);

  return { ok: true, card, cardIndex };
}
