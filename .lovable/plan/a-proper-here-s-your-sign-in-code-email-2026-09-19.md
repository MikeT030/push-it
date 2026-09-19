# A proper "here's your sign-in code" email

## What you'll get

Right now the sign-in code arrives in an email titled "Sign in to your account" that only contains a link — the six digits you actually type are hidden inside it. The new one says what's happening and shows the code itself.

```text
Push it

Your sign-in code

 4   8   2   1   9   6

Use this code to finish signing in. It works on this
device only and can be used once.

Didn't ask for a code? Nothing has happened to your
account — just delete this email.
```

Subject line becomes "Your Push-it sign-in code" so it's findable in a crowded inbox. The code is drawn as six large, evenly spaced digits in its own bordered box, so it's readable at a glance on a lock-screen preview and easy to tap-read while typing.

## The one thing standing in the way

Custom auth emails can only be created once the project sends from a domain you own — there is no shared or provided sender domain, and nothing can be built against a domain you don't have. Your project has no email domain configured today, so the custom templates can't be created yet.

That's the same missing piece as the two-emails-an-hour cap we hit while testing sign-in codes, so one setup clears both: the branded email and a real sending allowance.

## Steps

1. **Connect a domain** — you pick a domain you own and already pay for, the setup hands you a couple of records to paste at your DNS provider, and the sender address becomes something like `no-reply@yourdomain.com`.
2. **Create the auth email templates** — this adds the six auth emails (sign-in code, sign-up code, password reset, invite, email change, reauthentication) plus the sending hook, all wired to your new domain.
3. **Restyle them to the app** — Push-it wording and colours, teal accents, the muscle mark as the header. Emails keep a light background even though the app is dark; that's what mail clients render reliably.
4. **Show the code in the sign-in email** — the code is already in the data the backend hands over when it asks for an email to be sent [1](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook), and Supabase's own template system exposes the same six-digit value [2](https://supabase.com/docs/guides/auth/auth-email-templates), so this is a rendering change, not a new mechanism.
5. **Deploy and test** — request a code on the sign-in page, read the real email, confirm the digits match and that signing in works, then repeat for sign-up and password reset.

## Wording I'd use

- Subject: `Your Push-it sign-in code`
- Heading: `Your sign-in code`
- Above the code: `Enter these six digits to finish signing in.`
- Under the code: `The code works on this device only and can be used once. If it doesn't arrive, request a new one after a minute.`
- Footer: `Didn't ask for a code? Nothing has happened to your account — just delete this email.`
- No marketing, no links to anything else. The email does one job.

## Two choices to make

1. **Code only, or code plus a button?** Code only is the tighter story and matches how the app actually signs you in. A second "sign in now" link is a convenience for someone reading it on a different device, but it also invites phishing-style confusion. My suggestion: code only for sign-in, and keep the link for password reset where a code isn't used.
2. **Do the other emails in the same pass?** The sign-up confirmation also sends a six-digit code, so it should look identical. Password reset and the rest would get the same header and footer. Doing them all now costs very little extra and avoids a half-branded set.

## What doesn't change

Password sign-in stays available as the fallback, the "resend code" wait stays at 60 seconds, and nobody gets locked out for a wrong code. Nothing about the app's screens moves.

## Rough effort

Domain setup is a few minutes of yours plus DNS propagation, which varies from minutes to a few hours. Templates, styling and testing are one working session here. Until DNS verifies, the default emails keep going out, so nobody is left without a code.

## Technical details

- Verified current state: no email domain configured, no auth email templates or sending hook in the project, and the code email is triggered by `signInWithOtp` in `src/contexts/AuthContext.tsx` (verified: `sendLoginCode` at line 77, `verifyLoginCode` using `verifyOtp` at line 86).
- Once a domain is active, scaffolding creates the sending hook plus six React Email templates under the shared functions folder, and the templates must be deployed as a function to take effect.
- The payload that triggers an auth email carries the six-digit code as `email_data.token` alongside the link and redirect target [1](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook); the sign-in template will render `token` as the digit box and stop relying on the confirmation link.
- Email body background stays white with brand accents inside, for mail-client compatibility, even though the app itself is dark.
- The expiry line will state whatever the backend actually enforces — I'll confirm the real window before writing it rather than guessing "10 minutes".
- The native iOS app plan is untouched and parked; it can be picked up again after this.
