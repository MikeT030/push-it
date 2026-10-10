# Celebrate every goal hit, not just the first 30k

## What's happening today

- The celebration screen only fires once: when someone passes 30,000 push-ups while their goal is still 30,000. After they pick a higher goal and reach that, nothing happens — no celebration, and the app never offers a new goal.
- The "Recalibrate Your Goal" entry point lives only on the admin page, so a regular user who hits their second goal has no visible way to set a new one. That matches the report you got.

## The fix

1. **Generalize the goal-hit check.** Instead of the hardcoded 30k rule, the app celebrates whenever the total reaches the *current* yearly goal — 30k, 40k, 60k, whatever it is. After the user picks a new goal, the check resets and can fire again at the next milestone.
2. **Reuse the celebration screen** (`/welcome-v2`) for every goal hit. The headline adapts to the goal just reached ("You did it! You hit 40k, awesome."), with the same fireworks and goal picker.
3. **Remember that a milestone was celebrated** so the screen doesn't reappear on every visit after the user dismisses it without choosing a new goal. Stored per user in the database (e.g. a `celebrated_goal` value on the profile), not in browser storage, so it works across devices.
4. **Give regular users a way back in:** add the "Recalibrate Your Goal" entry to the profile page (it currently only exists on /admin), so anyone can change their goal anytime.

## Technical notes

- `src/hooks/useGoalHit.ts`: change the condition from `total >= 30000 && goal <= 30000` to `total >= yearly_goal && yearly_goal > (celebrated_goal ?? 0)`.
- Migration: add `celebrated_goal integer` column to `profiles` (default 0). WelcomeShell sets it to the just-reached goal when confirming (or dismissing) the celebration.
- `src/pages/WelcomePageV2.tsx`: make the headline goal-aware (read the reached goal from the profile) instead of hardcoded "30k".
- `src/pages/ProfilePage.tsx`: add the Recalibrate entry (same style as the admin one), navigating to `/welcome-recalibrate`.
- `src/App.tsx`: the existing redirect logic stays, just driven by the generalized hook.
