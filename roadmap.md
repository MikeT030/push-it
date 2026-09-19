# Roadmap

## Now
- [ ] Sign-in code email ("here's your code", code shown) — blocked on a sender domain the user owns; email setup dialog shown. After it: scaffold auth templates, brand them, show the six-digit code, deploy, test.

## Parked
- [ ] Native iOS app via Capacitor (plan archived: `.lovable/plan/a-proper-here-s-your-sign-in-code-email-2026-09-19.md` is the email plan; the iOS plan was interrupted and needs re-showing) — needs Apple Developer account ($99/yr) and a Mac with Xcode for the build/upload.

## Standing notes
- Resend-code wait is 60s to match the server.
- Password sign-in stays as the fallback while emails are throttled.
