import { doc, getDoc } from "firebase/firestore";

import { ensureAnonymousAuth, getFirebaseFirestore } from "@/lib/firebase/client";

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

  return Object.fromEntries(
    Object.entries(value).filter(
      ([, count]) => typeof count === "number" && Number.isFinite(count) && count > 0,
    ),
  );
}
