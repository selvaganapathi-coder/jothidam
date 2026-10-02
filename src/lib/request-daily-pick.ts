import { getFirebaseAuth, ensureAnonymousAuth, reauthenticateAnonymously } from "@/lib/firebase/client";
import type { Card } from "@/lib/cards";

export type DailyPickApiResponse = {
  card: Card;
  streak: number;
  longestStreak: number;
  alreadyPicked: boolean;
  nextPickAt: string;
};

export type RequestPickFailureReason = "already_picked" | "unauthorized" | "network" | "error";

export type RequestPickResult =
  | { ok: true; card: Card; streak: number; longestStreak: number; alreadyPicked: boolean; nextPickAt: string; cardIndex: number }
  | { ok: false; reason: RequestPickFailureReason };

export type RequestPickFn = () => Promise<RequestPickResult>;

async function postPick(): Promise<Response> {
  const user = await ensureAnonymousAuth();
  const token = await user.getIdToken();

  return fetch("/api/pick", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}

export async function requestDailyPick(): Promise<RequestPickResult> {
  let response: Response;

  try {
    response = await postPick();
  } catch {
    return { ok: false, reason: "network" };
  }

  if (response.status === 401) {
    try {
      await reauthenticateAnonymously();
      response = await postPick();
    } catch {
      return { ok: false, reason: "unauthorized" };
    }

    if (response.status === 401) {
      return { ok: false, reason: "unauthorized" };
    }
  }

  if (!response.ok) {
    return { ok: false, reason: "error" };
  }

  try {
    const data = (await response.json()) as DailyPickApiResponse;
    const cardIndex = Math.floor(Math.random() * 5);
    return {
      ok: true,
      card: data.card,
      streak: data.streak,
      longestStreak: data.longestStreak,
      alreadyPicked: data.alreadyPicked,
      nextPickAt: data.nextPickAt,
      cardIndex,
    };
  } catch {
    return { ok: false, reason: "error" };
  }
}
