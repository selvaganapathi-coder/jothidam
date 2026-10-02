# Security deployment checklist

## Firebase App Check

The web client initializes Firebase App Check with reCAPTCHA Enterprise before Firebase Auth/Firestore access when NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY is configured. `/api/pick` independently verifies X-Firebase-AppCheck with the Admin SDK and rejects missing/invalid tokens.

Cloud Firestore App Check enforcement is a Firebase project-level setting and is not represented by firestore.rules. After deploying this branch and verifying App Check metrics, open Firebase Console → Security → App Check → APIs → Cloud Firestore → Enforce. Firebase documents that enforcement rejects unverified client requests.

Local Firebase emulator requests intentionally bypass the custom `/api/pick` App Check verifier; production does not.

## Upstash rate limiting

Set:

- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

All current /api/* route handlers are rate limited by IP, and authenticated routes also by Firebase UID. Exceeded limits return HTTP 429.

## Production secrets

Keep these server-only:

- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY
- UPSTASH_REDIS_REST_TOKEN
- CRON_SECRET

Only NEXT_PUBLIC_* Firebase web configuration and the reCAPTCHA Enterprise site key are browser-safe public configuration.

## CORS

API handlers reject requests carrying an Origin that does not exactly match the request origin. They do not emit Access-Control-Allow-Origin, so cross-origin browser access is closed.

## Dependency auditing

CI runs `pnpm audit --audit-level=high`. Dependabot is enabled weekly for npm dependencies.
