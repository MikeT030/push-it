# Email code sign-in (password optional)

Goal: make signing in reliable by sending a 6-digit code to the email, while keeping the password option for people who already have one.

## What I found so far

Sign-in attempts for your account were rejected with "invalid credentials" tonight. A password-reset link was opened at 00:26 and it did sign you in at that moment, but no password change was recorded afterwards, and the attempts right after that were rejected again. So the likely story is that the new password never got saved before the next sign-in attempt. This is not confirmed yet — the first step below verifies it before anything else.

## Step 1 — Verify the reset page

Open the app, request a reset link, open it, and follow the flow end to end while watching for errors. Confirm whether the "Update password" step actually saves. Two known risks to check:
- The page may sit on "Validating reset link..." if the link opens in a browser where the session is not picked up.
- Saving may be rejected if the account settings require the old password to be entered.

Fix whatever the check turns up, including a clear error message instead of a silent failure.

## Step 2 — Add code sign-in as the default

After entering an email, the next screen becomes:
- "Email me a code" as the main action — a 6-digit code arrives, you type it in, you're in.
- "Use password instead" as a small link below, for anyone who prefers it. Existing passwords keep working.
- "Resend code" with a short cooldown, and "Change email" to go back.

New accounts also sign up with a code, as they do today, so there is one consistent experience.

## Step 3 — Tidy up the surrounding flows

- The "Forgot password?" link stays, but moves under the password screen where it belongs.
- Clearer messages: expired code, wrong code, too many attempts.
- The demo account button keeps working unchanged.

## Technical notes

- Use `supabase.auth.signInWithOtp` with `shouldCreateUser: false` for existing accounts, verified via `verifyOtp` with `type: "email"`; keep the current `type: "signup"` path for brand-new accounts.
- Extend `AuthContext` with `sendLoginCode` / `verifyLoginCode`; keep `signIn` for the password fallback.
- `AuthPage` gains a `code` step alongside the existing `email` / `signin` / `signup` / `verify` steps; the existing email-existence check decides which branch is shown.
- Confirm email auth and the auth email rate limit are sufficient for code-based sign-in before rollout; raise the hourly limit if it is too low.
- Check `ResetPasswordPage` against the "require current password" setting and surface the returned error to the user.
