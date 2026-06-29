## Two-step auth flow

Split `/auth` into an email-first flow that branches to either sign-in or sign-up based on whether the email already exists.

### Step 1 — Email
- Single `Email` field + `Continue` button.
- On Continue: validate email, then call a new backend endpoint to check if a user with that email exists.
- While checking, the button shows a spinner/`Checking…` state.

### Step 2a — Existing user (Sign in)
- Show the email (read-only summary with a "Use a different email" link back to step 1).
- Password field + `Sign In` button (uses current `signIn`).
- Keeps the existing "Forgot password?" link.
- If the account exists but is unverified, fall through to the current OTP verify step (unchanged).

### Step 2b — New user (Create account)
- Show the email (read-only + "Use a different email").
- Password field. `Create account` button is disabled until the password passes validation (≥6 chars), then activates.
- On click: runs the current `signUp` → 6-digit OTP verification flow (unchanged).

### Existence check (backend)
Add an Edge Function `check-email-exists` (public, no JWT required):
- Input: `{ email }`.
- Uses the service role key to call `auth.admin.listUsers` (filtered) / a direct query on `auth.users` to return `{ exists: boolean }`.
- Rate-limited by a simple in-memory token bucket per IP to limit enumeration abuse.
- Note: this is a known trade-off — a two-step flow inherently reveals whether an email is registered. Acceptable per the requested UX.

### Files touched
- `src/pages/AuthPage.tsx` — replace single form with `email` → `signin` / `signup` sub-steps; remove the "New here? / Already have an account?" toggle (the branch is now automatic). Keep OTP verify step as-is.
- `supabase/functions/check-email-exists/index.ts` — new edge function (+ `config.toml` entry with `verify_jwt = false`).
- `src/contexts/AuthContext.tsx` — add a `checkEmailExists(email)` helper that invokes the function.

### Out of scope
- No change to OTP verification, password reset, or session handling.
- No DB schema changes.
