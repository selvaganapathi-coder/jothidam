import { z } from "zod";

const clientFirebaseEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: z
    .enum(["true", "false"])
    .optional()
    .default("false"),
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: z
    .string()
    .min(1)
    .optional()
    .default("127.0.0.1:9099"),
  NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST: z
    .string()
    .min(1)
    .optional()
    .default("127.0.0.1:8080"),
});

export type ClientFirebaseEnv = z.infer<typeof clientFirebaseEnvSchema>;

export type FirebaseWebClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
};

export function readClientFirebaseEnv(
  env: Record<string, string | undefined> = process.env,
): ClientFirebaseEnv {
  return clientFirebaseEnvSchema.parse(env);
}

export function getFirebaseWebClientConfig(
  env: Record<string, string | undefined> = process.env,
): FirebaseWebClientConfig {
  const parsed = readClientFirebaseEnv(env);

  return {
    apiKey: parsed.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: parsed.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: parsed.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: parsed.NEXT_PUBLIC_FIREBASE_APP_ID,
    storageBucket: parsed.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: parsed.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: parsed.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

export function shouldUseFirebaseEmulators(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return (
    readClientFirebaseEnv(env).NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true"
  );
}

export function hasFirebaseClientConfig(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return clientFirebaseEnvSchema.safeParse(env).success;
}
