import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

import { verifyAppCheck } from "@/lib/firebase/admin-app-check";
import {
  enforceRateLimit,
  parseJsonBody,
  rejectUnexpectedOrigin,
  requestBodyLimits,
} from "@/lib/security/api";

import { cardSchema, getCardById, pickCard } from "@/lib/cards";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminFirestore,
} from "@/lib/firebase/admin";
import {
  calculateStreak,
  getDateKey,
  getMilestoneRewards,
  getNextPickAt,
} from "@/lib/streak";

const authorizationSchema = z.string().regex(/^Bearer\s+\S+$/i);

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const requestBodySchema = z
  .object({
    useSecondPickToken: z.boolean().default(false),
  })
  .strict();

const userStateSchema = z.object({
  lastPickDate: dateKeySchema.optional(),
  lastPickCardId: z.string().min(1).optional(),
  streak: z.number().int().nonnegative().default(0),
  longestStreak: z.number().int().nonnegative().default(0),
  collection: z.record(z.string(), z.number().int().nonnegative()).default({}),
  totalPicks: z.number().int().nonnegative().default(0),
  badges: z.array(z.string().min(1)).default([]),
  secondPickTokens: z.number().int().nonnegative().default(0),
});

const responseSchema = z.object({
  card: cardSchema,
  streak: z.number().int().positive(),
  longestStreak: z.number().int().positive(),
  alreadyPicked: z.boolean(),
  nextPickAt: z.string().datetime({ offset: true }),
  secondPickTokenUsed: z.boolean(),
  secondPickTokens: z.number().int().nonnegative(),
  badges: z.array(z.string().min(1)),
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
  const originError = rejectUnexpectedOrigin(request);
  if (originError) return originError;

  const token = getBearerToken(request);

  if (!token) {
    return unauthorizedResponse();
  }

  try {
    const auth = getFirebaseAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const uid = z.string().min(1).parse(decodedToken.uid);
    if (!(await verifyAppCheck(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rateLimitResponse = await enforceRateLimit(request, uid);
    if (rateLimitResponse) return rateLimitResponse;
    const body = await parseJsonBody(
      request,
      requestBodySchema,
      requestBodyLimits.pick,
    );

    const today = getDateKey();
    const nextPickAt = getNextPickAt(today);
    const firestore = getFirebaseAdminFirestore();
    const userRef = firestore.collection("users").doc(uid);

    const result = await firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(userRef);
      const userState = userStateSchema.parse(
        snapshot.exists ? snapshot.data() : {},
      );

      if (
        userState.lastPickDate === today &&
        body.useSecondPickToken &&
        userState.secondPickTokens > 0
      ) {
        const card = cardSchema.parse(pickCard());
        const nextTokens = userState.secondPickTokens - 1;

        transaction.set(
          userRef,
          {
            lastPickCardId: card.id,
            totalPicks: FieldValue.increment(1),
            secondPickTokens: nextTokens,
            [`collection.${card.id}`]: FieldValue.increment(1),
          },
          { merge: true },
        );

        return {
          card,
          streak: Math.max(userState.streak, 1),
          longestStreak: Math.max(userState.longestStreak, 1),
          alreadyPicked: false,
          nextPickAt,
          secondPickTokenUsed: true,
          secondPickTokens: nextTokens,
          badges: userState.badges,
        };
      }

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
          secondPickTokenUsed: false,
          secondPickTokens: userState.secondPickTokens,
          badges: userState.badges,
        };
      }

      const card = cardSchema.parse(pickCard());
      const streak = calculateStreak(
        userState.lastPickDate,
        today,
        userState.streak,
      );
      const longestStreak = Math.max(userState.longestStreak, streak);
      const milestoneRewards = getMilestoneRewards(
        userState.streak,
        streak,
        userState.badges,
      );
      const badges = Array.from(
        new Set([...userState.badges, ...milestoneRewards.badges]),
      );
      const secondPickTokens =
        userState.secondPickTokens + milestoneRewards.secondPickTokens;

      transaction.set(
        userRef,
        {
          lastPickDate: today,
          lastPickCardId: card.id,
          streak,
          longestStreak,
          totalPicks: FieldValue.increment(1),
          badges,
          secondPickTokens,
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
        secondPickTokenUsed: false,
        secondPickTokens,
        badges,
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
