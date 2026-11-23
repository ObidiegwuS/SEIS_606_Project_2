# GuessMoji — Claude build (Uchenna)

Next.js 16 (App Router) + React 19 + TypeScript. This is the Claude-assisted half of the Platform Bake-off.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest unit + component tests
npm run test:e2e   # Playwright end-to-end tests (needs Google Chrome installed)
npm run build
```

### End-to-end tests (`e2e/`)

`npm run test:e2e` builds the app, starts it in production mode with a fresh SQLite database in a
temp folder, and points SMTP at `e2e/smtp-sink.mjs` (a tiny local mail catcher, test-only) so real
verification emails are captured and their links followed. Every case runs in desktop Chrome and
an emulated Pixel 7 and iPad Mini. No authentication is mocked; the only shortcut is editing a token's expiry in
the database to simulate 24 hours passing.

| # | Case | # | Case |
|---|---|---|---|
| 01 | Successful registration | 10 | Invalid verification token |
| 02 | Invalid email format (UI + API) | 11 | Expired verification token |
| 03 | Duplicate email address | 12 | Reused verification token |
| 04 | Password shorter than 7 characters (UI + API) | 13 | Successful login → home, secure cookie |
| 05 | Missing uppercase letter (UI + API) | 14 | Incorrect password |
| 06 | Missing lowercase letter (UI + API) | 15 | Unverified account login attempt |
| 07 | Missing special character (UI + API) | 16 | Logout, Back button, replayed old cookie |
| 08 | Password confirmation mismatch | 17 | Home screen without authentication / forged cookie |
| 09 | Successful email verification | — | No horizontal scrolling on each page |

`e2e/game.spec.ts` covers the category screen, AT-05 to AT-13 (separate collections, correct/incorrect/
blank answers, capitalization and spacing, duplicate points, progress after logout, private progress),
and access control for `/home`, `/play/*` and the answer API.

## Setup

Copy `.env.example` to `.env.local`. With no SMTP settings, `npm run dev` prints verification
emails (with the link) to the terminal instead of sending them. Accounts are stored in SQLite at
`data/guessmoji.db` (git-ignored), using Node's built-in `node:sqlite` — Node 22.13+ required.

## What exists so far

| Route | Purpose |
|---|---|
| `/` | Landing page: "Create a New Account" (→ `/register`) and an inline returning-player login form |
| `/login` | Full-page login (supports `?next=` for post-login redirect, relative paths only) |
| `/register` | Registration: email, password (live requirements checklist), confirm password |
| `/register/check-email` | Shown after registering: "check your email" |
| `/verify-email?token=…` | Link from the verification email; the user presses "Verify my email" to confirm |
| `/verify-email/resend` | Request a new verification link (invalidates earlier links; 60-second cooldown) |
| `/forgot-password` | Request a password reset link by email |
| `/reset-password?token=…` | Link from the reset email: choose a new password |
| `/home` | Category selection (first screen after login): Movies and Countries cards with progress, total score, Log Out |
| `/play/movies`, `/play/countries` | The game for each category: emoji clue, answer box, hint, Previous/Skip/Next, ← Categories, Log Out |

Registration, email verification, resend, login (with lockout), logout, and password reset are implemented against the SQLite
database. No credentials are hardcoded or simulated.

## Registration flow

1. Client validates the form (same rules as the server, in `src/lib/validation.ts`).
2. `POST /api/auth/register` re-validates, normalizes the email, and rejects it if already registered
   (case-insensitive; a UNIQUE index also blocks concurrent duplicates).
3. The password is hashed with scrypt (`src/server/password.ts`); the user is stored with
   `email_verified = 0` together with a single-use, 24-hour verification token (only its SHA-256 is stored).
4. A verification email is sent. If sending fails, the account is removed and the user is asked to retry.
5. Opening the link and pressing "Verify my email" marks the email verified and redirects to `/login?verified=1`.
   A valid email format alone never marks an account verified.

## Login and sessions

- `POST /api/auth/login` checks the scrypt hash. Unknown emails and wrong passwords both return `401`
  ("Incorrect email or password"); unknown emails still run a hash so timing doesn't reveal them.
- **Unverified accounts are blocked**: a correct password on an unverified account returns `403`
  with `error: "email_not_verified"`, and the login form links to `/verify-email/resend`. This status
  is only revealed after the correct password is entered.
- On success a random session token is set as an HttpOnly, SameSite=Lax cookie (Secure in production),
  valid for 7 days. Only its SHA-256 is stored in the `sessions` table.
- Log Out (on `/home`) deletes the session server-side, clears the cookie, and redirects to `/login?loggedOut=1`.
  The old cookie is rejected afterwards by both `/home` and protected API routes.
- **Lockout**: 3 consecutive wrong passwords lock the account for 24 hours (`423`, `error: "account_locked"`).
  While locked, even the correct password is refused and no further guesses are checked. A successful
  login resets the count. Unknown emails never lock anything.

## The game

- **Separate question collections:** `src/data/puzzles/movies.json` and `src/data/puzzles/countries.json`.
  These are a **DRAFT starter set pending agreement with Ezana** (contract §4). Replace the files to
  change puzzles; no code changes needed. Each puzzle has `id`, `emojis`, `answer`, `accepted`
  (alternative names) and `hint`.
- **Answers never reach the browser** until the player has solved the puzzle. `POST /api/game/answer`
  checks the answer on the server for the logged-in user (`requireUser`).
- **Answer matching** (`src/lib/game/answers.ts`): capitalization, extra spaces, punctuation, and accents
  are ignored; only the listed answer and `accepted` alternatives count. Blank answers are rejected.
- **Scoring:** 10 points the first time a puzzle is solved. The `puzzle_completions` table's primary key
  `(user_id, puzzle_id)` makes duplicate points impossible, even if an answer is replayed to the API.
  Hints are free.
- **Privacy:** progress is always read and written for the session's user; no endpoint accepts a user id.

## Forgot password

- `POST /api/auth/forgot-password` always returns the same `200` response. For a registered email it
  sends a reset link (1-hour expiry, single use, only the newest link works, 60-second cooldown).
- `/reset-password?token=…` checks the link first, then shows New Password / Confirm New Password with
  the same requirements checklist as registration.
- `POST /api/auth/reset-password` sets the new password, ends all of that user's sessions, clears any
  lockout, and marks the email verified (the link proves the user controls the address).

### Password rules
At least 7 characters, one uppercase letter, one lowercase letter, and one special character
(any non-letter, non-digit, non-space character such as `! @ # $ % & *`). Numbers are allowed but not required. Max 128.

## Route protection

1. `src/proxy.ts` — quick redirect to `/login` when there is no `guessmoji_session` cookie.
2. `getCurrentUser()` in `src/lib/auth/session.ts` — the real check, run on the server by every
   protected page. It looks the token up in `sessions`, rejects expired sessions, and only accepts
   users whose email is verified. A forged cookie is redirected to `/login`.
3. Protected API routes call `requireUser(request)` from `src/server/requireUser.ts`, which applies the
   same check and returns `401` JSON otherwise. `GET /api/me` is the first one; future game and
   progress routes should use the same guard.

Protected responses are sent with `Cache-Control: no-store`, so the browser's Back button can't
show a cached home page after logout.

## Auth API

The rules below match the Account Rules in `../spec.md` (v0.3).

All requests are JSON.

| Endpoint | Body | Success | Errors |
|---|---|---|---|
| `POST /api/auth/register` | `{ email, password }` | `201` | `400` invalid input · `409` email already registered (AT-02) · `503` verification email could not be sent / server misconfigured |
| `POST /api/auth/login` | `{ email, password }` | `200` + sets `guessmoji_session` cookie | `400` invalid input · `401` wrong credentials (AT-04) · `403` `email_not_verified` (AT-16) · `423` `account_locked` (AT-19) |
| `GET /api/me` *(protected)* | — | `200` `{ email, emailVerified, memberSince }` | `401` not logged in, expired/forged session, or unverified account |
| `POST /api/game/answer` *(protected)* | `{ puzzleId, answer }` | `200` `{ result: "correct" \| "incorrect" \| "already_solved", pointsAwarded, score, answer? }` | `400` blank or too long · `401` not logged in · `404` unknown puzzle |
| `POST /api/auth/forgot-password` | `{ email }` | `200` (same response whether or not the email is registered) | `400` invalid email · `503` email could not be sent |
| `POST /api/auth/reset-password` | `{ token, password }` | `200` | `400` weak password, or `invalid_token` / `expired_token` |
| `POST /api/auth/resend-verification` | `{ email }` | `200` (same response whether or not the account exists or needs verifying) | `400` invalid email · `503` email could not be sent |

Error bodies may include `{ "message": string, "error"?: string, "fieldErrors": { "email"?: string, "password"?: string } }`;
field errors are shown under the matching input.

## Configuration (`.env.local`)

| Variable | Purpose |
|---|---|
| `APP_URL` | Base URL used in verification links. **Required in production** (the request Host header is not trusted). |
| `DATABASE_PATH` | SQLite file path (default `./data/guessmoji.db`). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | SMTP server for verification emails. Required in production. |
