"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

import { hasFirebaseClientConfig } from "@/lib/firebase/client-config";
import { ensureAnonymousAuth } from "@/lib/firebase/client";

type FirebaseAuthProviderProps = {
  children: ReactNode;
};

export function FirebaseAuthProvider({ children }: FirebaseAuthProviderProps) {
  useEffect(() => {
    if (!hasFirebaseClientConfig()) {
      return;
    }

    void ensureAnonymousAuth().catch(() => {
      // Auth failures are surfaced by features that require a signed-in user.
    });
  }, []);

  return children;
}
