import "server-only";

import { getAppCheck } from "firebase-admin/app-check";
import { getFirebaseAdminApp } from "@/lib/firebase/admin";

export async function verifyAppCheck(request: Request): Promise<boolean> {
  const token = request.headers.get("X-Firebase-AppCheck");
  if (!token) return false;

  try {
    await getAppCheck(getFirebaseAdminApp()).verifyToken(token);
    return true;
  } catch {
    return false;
  }
}
