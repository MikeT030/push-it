# Turning Push-it into a native iOS app

## Short answer

Yes. The cleanest route is to keep this app exactly as it is and wrap it in a native shell with Capacitor, then publish that shell to the App Store. Nothing gets rewritten: your screens, your database, your group all stay put. The shell is what makes it a real app — an icon on the phone, its own install, its own entry in the store, and access to things a browser can't touch (notifications, haptics, the native share sheet).

Two things are unavoidable and worth knowing up front:

- An Apple Developer account costs $99 a year.
- The final build, signing and upload must run on a Mac with Xcode. I can prepare everything up to that point, but I cannot press "upload to Apple" from here.

## Path A and Path B

Path A is a one-line upgrade you already half-have: the app installs from Safari via Share → Add to Home Screen, gets the icon you already made, and opens full-screen. It costs nothing, takes minutes, and is not reversible damage if you later choose B. What it cannot do is send push notifications — iOS web apps don't receive them — and it can't be listed in the App Store.

Path B is the real thing. Recommended if the goal is "it's in the store, my group downloads it like any app."

```text
Path A  browser ──> your website ──> home-screen shortcut   (minutes, $0, no store)
Path B  App Store ──> native shell ──> your website inside it
                                      (days, $99/yr, Apple reviews it)
```

## Before I build anything: three decisions

1. Notifications yes or no. This is the single strongest argument Apple accepts that your app is more than a website. Daily "you haven't pushed today" reminders and "someone passed you" alerts are the natural fit here.
2. TestFlight first, then the store. TestFlight is Apple's private beta: your group installs it in a minute from a link, no review wait. I'd use it for a week before submitting.
3. Should the app keep working with no signal? Right now a dead connection means a blank screen and lost taps. Caching the last-known numbers plus a queue for pending push-ups is a real feature, not a nicety.

## Phase 1 — the shell

Add Capacitor to this project, name the app `push-it`, give it a bundle id under `app.lovable`, and point it at the running preview so the shell hot-reloads as you work. Then generate the iOS project. At this stage the app opens your site full-screen on a phone with no browser bar.

## Phase 2 — make it app-like enough to survive review

This is the part most people skip and then get rejected for. Apple's rule 4.2 says an app must offer something a browser doesn't; a bare website in a box is rejected as "a repackaged website" [4](https://appcompliance.io/blog/apple-guideline-4-2-minimum-functionality/), and push notifications or sharing alone are explicitly called out as not enough on their own [5](https://www.technetexperts.com/guideline-4-2-minimum-functionality/). So the shell gets real native wiring:

- Push notifications with a daily nudge and leaderboard alerts.
- The system share sheet instead of the browser's, plus copy-to-clipboard fallback (your share button already does both, so this is a swap, not a redesign).
- Haptics: a tap on the + buttons and a buzz when a goal is hit.
- A proper launch screen, generated icon set, and no pull-to-refresh or text-selection artefacts.
- Offline cache of the last numbers and a queue for taps made without signal.

## Phase 3 — sign-in links that land in the app

Your sign-in codes, email confirmations and password resets currently point at web addresses (`/auth/callback`, `/reset-password`). Inside a native shell, a tap on one of those links would bounce into Safari and lose the session. This phase adds Apple's "universal links" so those emails open in the app instead, with the browser version still working for everyone who uses the site.

## Phase 4 — ship

Build on the Mac, upload, fill in the store listing (description, screenshots at the required sizes, a privacy label saying what data you collect, a privacy policy page, support URL), then submit. First submission usually draws a question or two; the answers are template replies.

## What I can do here, and what needs you

```text
Me, in this project        You, once           Me again
- Capacitor setup          - Mac + Xcode       - npx cap sync after each pull
- icon + splash sets       - $99 developer     - debug on the real device
- notification wiring        account           - store listing copy
- universal links          - App Store Connect
- offline cache                                - final upload
```

After every pull of this repo you'd run `npx cap sync` to refresh the shell.

## Rough cost and time

$99/year to Apple, plus your existing plan. The wrapper and native wiring is a day or two of work here; the Mac steps are a few hours of following instructions; Apple's review is typically a day or two, longer if they ask questions.

## Risks

- Review rejection under 4.2 if the app is too thin. Mitigated by Phase 2 — that's exactly what it's for.
- Notifications need an Apple push key and a small server-side piece; if that stalls, the app still ships without them.
- Anyone who already added the site to their home screen keeps that shortcut; the store app is a separate install.
- The store app and the website must stay in sync; a change here isn't in the store until a new build is uploaded and reviewed.

## Technical details

- Current state (verified): no web app manifest and no install metadata beyond `theme-color` and `apple-touch-icon` in `index.html`; no Capacitor or service-worker code anywhere in the project.
- Dependencies: `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/cli` (dev only), plus `@capacitor/push-notifications`, `@capacitor/share`, `@capacitor/haptics`, `@capacitor/app`, `@capacitor/splash-screen`.
- `capacitor.config.json`: `appName: "push-it"`, `appID: "app.lovable.f4b487714b41458f9c7931787b179ae0"`, `webDir: "dist"`, and a `server.url` pointing at the preview (`https://f4b48771-4b41-458f-9c79-31787b179ae0.lovableproject.com?forceHideBadge=true`, `cleartext: true`) for hot-reload while developing — emptied before release so the app ships with the bundled build.
- Device steps: export to GitHub, `npm install`, `npx cap add ios`, `npx cap update ios`, `npm run build`, `npx cap sync`, `npx cap run ios`.
- Auth: `emailRedirectTo` and `redirectTo` values in `src/contexts/AuthContext.tsx` and `src/pages/ForgotPasswordPage.tsx` move from `window.location.origin` to a configured universal-link host, with an associated-domains Apple App ID prefix file served from the site.
- Local storage today holds the share toggle (`share-button-enabled`), the demo flag, the pending email and the splash flag; in the shell these live in the app's own web data store, so they persist per install but do not carry over from a browser session.
- Mini-games already use canvas and `requestAnimationFrame`, which run fine inside the shell; safe-area insets are already handled in `index.css`.
