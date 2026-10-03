import { doc, getDoc } from "firebase/firestore";

import {
  ensureAnonymousAuth,
  getFirebaseFirestore,
} from "@/lib/firebase/client";

export type UserCollection = Record<string, number>;

export async function getUserCollection(): Promise<UserCollection> {
  const user = await ensureAnonymousAuth();
  const snapshot = await getDoc(doc(getFirebaseFirestore(), "users", user.uid));

  if (!snapshot.exists()) {
    return {};
  }

  const value = snapshot.data().collection;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const collection: UserCollection = {};
  for (const [cardId, count] of Object.entries(value)) {
    if (typeof count === "number" && Number.isFinite(count) && count > 0) {
      collection[cardId] = count;
    }
  }

  return collection;
}
