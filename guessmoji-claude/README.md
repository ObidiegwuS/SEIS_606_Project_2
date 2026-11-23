# GuessMoji — Claude build (Uchenna)

Next.js 16 (App Router) + React 19 + TypeScript. This is the Claude-assisted half of the Platform Bake-off.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest unit + component tests
npm run build
```

## What exists so far

| Route | Purpose |
|---|---|
| `/` | Landing page: "Create a New Account" (→ `/register`) and an inline returning-player login form |
| `/login` | Full-page login (supports `?next=` for post-login redirect, relative paths only) |
| `/register` | Account registration |
| `/home` | Authenticated home — **unreachable until the backend exists** |

Authentication is **not implemented yet**. The API routes return `501`, the UI shows
"Sign-in is not available right now", and no credentials are hardcoded or simulated.

## Route protection

1. `src/proxy.ts` — quick redirect to `/login` when there is no `guessmoji_session` cookie.
2. `getCurrentUser()` in `src/lib/auth/session.ts` — the real check, run on the server by every
   protected page. It currently trusts no token, so even a forged cookie is redirected.

## Auth API contract (for the backend to implement)

All requests are JSON. Emails are trimmed and lowercased by the client; the server must
normalize and validate again.

| Endpoint | Body | Success | Errors |
|---|---|---|---|
| `POST /api/auth/register` | `{ email, password }` | `201` | `400` invalid input · `409` email already registered (AT-02) · `429` rate limited |
| `POST /api/auth/login` | `{ email, password }` | `200` + sets `guessmoji_session` (HttpOnly, Secure, SameSite=Lax) | `400` · `401` wrong credentials (AT-04) · `429` |

Error bodies may include `{ "message": string, "fieldErrors": { "email"?: string, "password"?: string } }`;
field errors are shown under the matching input.

Integration points: `src/app/api/auth/*/route.ts` and `verifySessionToken()` in `src/lib/auth/session.ts`.

## Validation rules (client-side, see `src/lib/validation.ts`)

- Email: required, `name@domain.tld` shape, ≤ 254 chars.
- New password: 8–128 chars, at least one letter and one number. Confirmation must match.
- Login password: required only (strength is enforced at registration).
