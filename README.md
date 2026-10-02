# jothidam (Kili Jothidam)

Next.js App Router app for daily Tamil fortune cards. Uses **pnpm**, **next-intl** (`/ta`, `/en`), **Vitest**, **Playwright**, and **Firebase** (Auth + Firestore).

## Getting started

```bash
pnpm install
cp .env.example .env.local
# Fill in Firebase values in .env.local (never commit secrets).
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) (redirects to `/ta`).

### Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test run
pnpm test:e2e
pnpm build
```

## Firebase setup

### 1. Web client (`NEXT_PUBLIC_*`)

Copy your Firebase web app config from **Firebase Console → Project settings → Your apps** into `.env.local`:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (optional)
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` (optional)
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)

The browser SDK is initialised in `src/lib/firebase/client.ts`. `FirebaseAuthProvider` (in the locale layout) calls **anonymous sign-in** on the visitor’s first load when config is present.

### 2. Admin SDK (server only)

Create a service account in Firebase Console and set **only** in `.env.local` or deployment secrets (never in git):

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (use `\n` for newlines)

Server helpers live in `src/lib/firebase/admin.ts` (`server-only`).

### 3. Dev vs prod Firebase projects

`.firebaserc` defines aliases:

| Alias  | Project ID (update `prod` when you create production) |
| ------ | ----------------------------------------------------- |
| `dev`  | `srmfamilystore`                                      |
| `prod` | `srmfamilystore-prod`                                 |

Switch the CLI target:

```bash
pnpm firebase:use:dev   # firebase use dev
pnpm firebase:use:prod  # firebase use prod
```

Use **dev** credentials in local `.env.local`. Production deploys should use the **prod** Firebase project and prod service account via your host’s secret store.

### 4. Local emulators (Auth + Firestore)

`firebase.json` configures emulators:

| Service     | Port |
| ----------- | ---- |
| Auth        | 9099 |
| Firestore   | 8080 |
| Emulator UI | 4000 |

**Terminal 1 — start emulators:**

```bash
pnpm firebase:emulators
```

**Terminal 2 — point the app at emulators** (add to `.env.local`):

```env
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
NEXT_PUBLIC_FIREBASE_PROJECT_ID=srmfamilystore
FIREBASE_PROJECT_ID=srmfamilystore
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

With emulator host variables set, Admin can boot with **project ID only** (no service account required). For deployed dev/staging against real Firebase, provide the full service account env vars and set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false`.

Open the Emulator UI at [http://localhost:4000](http://localhost:4000).

### 5. Deploy rules / indexes (prod or dev)

```bash
pnpm firebase:use:dev   # or firebase:use:prod
firebase deploy --only firestore:rules,firestore:indexes
```

## Project layout

- `src/app/[locale]/` — localized routes
- `src/lib/firebase/` — client + admin Firebase
- `data/cards.json` — card catalog
- `tests/` — unit tests; `tests/e2e/` — Playwright
