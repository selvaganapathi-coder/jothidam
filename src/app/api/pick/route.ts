import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

import { cardSchema, getCardById, pickCard } from "@/lib/cards";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminFirestore,
} from "@/lib/firebase/admin";
import {
  calculateStreak,
  getDateKey,
  getNextPickAt,
} from "@/lib/streak";

const authorizationSchema = z.string().regex(/^Bearer\s+\S+$/i);

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const userStateSchema = z.object({
  lastPickDate: dateKeySchema.optional(),
  lastPickCardId: z.string().min(1).optional(),
  streak: z.number().int().nonnegative().default(0),
  longestStreak: z.number().int().nonnegative().default(0),
  collection: z.record(z.string(), z.number().int().nonnegative()).default({}),
  totalPicks: z.number().int().nonnegative().default(0),
});

const responseSchema = z.object({
  card: cardSchema,
  streak: z.number().int().positive(),
  longestStreak: z.number().int().positive(),
  alreadyPicked: z.boolean(),
  nextPickAt: z.string().datetime({ offset: true }),
});

const GENERIC_ERROR = "Unable to process daily pick.";

function getBearerToken(request: Request): string | null {
  const result = authorizationSchema.safeParse(
    request.headers.get("authorization"),
  );

  if (!result.success) {
    return null;
  }

  return result.data.replace(/^Bearer\s+/i, "");
}

function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function genericErrorResponse(): NextResponse {
  return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
}

export async function POST(request: Request): Promise<NextResponse> {
  const token = getBearerToken(request);

  if (!token) {
    return unauthorizedResponse();
  }

  try {
    const auth = getFirebaseAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const uid = z.string().min(1).parse(decodedToken.uid);

    const today = getDateKey();
    const nextPickAt = getNextPickAt(today);
    const firestore = getFirebaseAdminFirestore();
    const userRef = firestore.collection("users").doc(uid);

    const result = await firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(userRef);
      const userState = userStateSchema.parse(
        snapshot.exists ? snapshot.data() : {},
      );

      if (userState.lastPickDate === today) {
        if (!userState.lastPickCardId) {
          throw new Error("Daily pick state is incomplete");
        }

        const existingCard = getCardById(userState.lastPickCardId);
        if (!existingCard) {
          throw new Error("Daily pick card is unavailable");
        }

        const card = cardSchema.parse(existingCard);
        return {
          card,
          streak: Math.max(userState.streak, 1),
          longestStreak: Math.max(userState.longestStreak, 1),
          alreadyPicked: true,
          nextPickAt,
        };
      }

      const card = cardSchema.parse(pickCard());
      const streak = calculateStreak(
        userState.lastPickDate,
        today,
        userState.streak,
      );
      const longestStreak = Math.max(userState.longestStreak, streak);

      transaction.set(
        userRef,
        {
          lastPickDate: today,
          lastPickCardId: card.id,
          streak,
          longestStreak,
          totalPicks: FieldValue.increment(1),
          [`collection.${card.id}`]: FieldValue.increment(1),
        },
        { merge: true },
      );

      return {
        card,
        streak,
        longestStreak,
        alreadyPicked: false,
        nextPickAt,
      };
    });

    const response = responseSchema.parse(result);
    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    console.error(
      "Daily pick request failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return genericErrorResponse();
  }
}
