
## Goal

Eliminate the "type everything again" step after email verification, and offer a few alternative flows that are smoother overall.

## Why the current flow feels broken

When a user clicks the verification link, the backend exchanges the token and redirects to `/`. In the same browser, that already creates a session — so landing on `/auth` means one of two things is happening:

1. The link is opened in a **different browser/device** than where the user signed up (very common on mobile, where mail apps open links in an in-app browser). No session can be created there, so they hit `/auth` with empty fields.
2. The redirect token isn't being consumed before `ProtectedRoute` runs, so the user is bounced to `/auth` before the session is set.

We'll fix both, and then layer on smoother alternatives.

## Proposed changes (pick any combination)

### 1. Make the existing link flow actually auto-login (baseline fix)
- Add a dedicated `/auth/callback` route that waits for `supabase.auth.exchangeCodeForSession` / `onAuthStateChange` to resolve before redirecting. Use this as `emailRedirectTo` instead of `/`.
- On signup, stash `{ email }` (not the password) in `localStorage` under a short-lived key. If the verification link is opened in a different browser and lands on `/auth`, prefill the email field and show "Welcome back — just enter your password to finish signing in."
- After a successful signup, show a "Check your email" screen (instead of dumping the user back on the form) so the same tab stays open and ready to receive the session when they click the link.

### 2. Replace the magic link with a 6-digit OTP code (recommended for "smoothest")
- Switch `signUp` to use Supabase's email OTP: the email contains a 6-digit code instead of a link.
- The user stays on the signup page; we swap the form to a code input. On submit we call `supabase.auth.verifyOtp({ email, token, type: 'signup' })`, which immediately creates a session — no second login, no cross-browser problem, password they already typed is used as-is.
- Works perfectly on mobile because the user never leaves the tab.

### 3. Add Google sign-in
- One-tap, no email verification, no password. Add a "Continue with Google" button above the email form on `/auth`. Uses Lovable Cloud's built-in Google provider.

### 4. Auto-confirm emails (fastest, lowest friction, lower security)
- Disable the "confirm email" requirement entirely. User signs up → instantly signed in → done. Email is still stored but never verified.
- Trade-off: anyone can register with someone else's address; no protection against typos in the email field.

### 5. Small UX polish regardless of which flow we pick
- After signup, route to a "Check your email" screen with the address shown, a "Resend email" button, and a "Wrong address?" link back to the form (with email prefilled).
- Keep the typed email in component state across `signin` ↔ `signup` toggles (right now it persists, but make sure it survives the post-signup screen too).
- Show a clear toast on `/auth` when the user lands there from a verification link in a new browser, explaining what to do.

## Recommendation

Do **#1 + #2 + #3** together:
- #1 fixes the bug for same-browser users.
- #2 makes the cross-browser/mobile case disappear by removing the link entirely.
- #3 gives users who don't want to deal with email at all a one-click path.

Skip #4 unless you explicitly want to drop email verification.

## Technical notes

- `/auth/callback` page mounts, calls `supabase.auth.getSession()` after `onAuthStateChange` fires once, then `navigate("/")`. Guard `ProtectedRoute` so it doesn't redirect while `loading` is true (already the case) and so `/auth/callback` is a public route.
- For OTP: `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, data: { pending_password: ... } } })` won't set a password. Instead, use `supabase.auth.signUp({ email, password })` with `emailRedirectTo` omitted and Supabase email template switched to send `{{ .Token }}` instead of `{{ .ConfirmationURL }}`. Verification call: `supabase.auth.verifyOtp({ email, token, type: 'signup' })`.
- Google sign-in requires enabling the Google provider in Lovable Cloud (one-time config); the button calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: \`${window.location.origin}/auth/callback\` } })`.
- Auto-confirm (#4) is a single auth setting toggle; no code changes needed.

## Question before I build

Which combination do you want?
- **A.** Just fix the auto-login bug (#1) — minimal change.
- **B.** #1 + #2 (OTP code, no more link) — smoothest email flow.
- **C.** #1 + #2 + #3 (also add Google) — recommended.
- **D.** #4 only (turn off email verification) — fastest, least secure.
