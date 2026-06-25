# Consolidate the three Welcome pages into a shared shell

Goal: keep three distinct routes and three distinct experiences, but move all shared layout, state, and Supabase write logic into one reusable `WelcomeShell` component. Each route file becomes a thin config wrapper.

## What stays the same (user-visible)

- `/welcome`, `/welcome-v2`, `/welcome-recalibrate` remain three separate routes.
- Headlines, tiers, fireworks, info text, additive vs absolute goal math — all preserved exactly.
- Redirect logic in `ProtectedRoute` is untouched.

## What changes (internal only)

### New: `src/components/WelcomeShell.tsx`

A single component that renders:
- Logo, headline, subheadline
- Tier selection grid (preset buttons + custom input)
- Info text block
- Confirm button (disabled until a tier is tapped)
- "Back with no changes" button
- Optional fireworks overlay with delay-gated content reveal

Props:

```ts
type WelcomeShellProps = {
  headline: string;
  subheadline: string;
  tiers: number[];                       // e.g. [82, 90, 100, 110]
  infoText: ReactNode;
  mode: 'absolute' | 'additive';         // how to write yearly_goal
  showFireworks?: boolean;
  fireworksDelayMs?: number;             // gate content reveal until fired
  onConfirmRedirect?: string;            // default '/'
};
```

Internals:
- Tier-selection state, custom input, confirm-disabled logic.
- `handleConfirm`: computes `projectedTotal = dailyValue × daysRemaining`. If `mode === 'absolute'`, writes `yearly_goal = projectedTotal`. If `mode === 'additive'`, fetches current total and writes `yearly_goal = currentTotal + projectedTotal`. Also sets `onboarded = true` and `goal_set_year = currentYear`, invalidates queries, navigates.
- Fireworks rendering + 5s timer when `showFireworks` is true.

### Refactored route files

Each becomes ~20–30 lines:

```tsx
// src/pages/WelcomePage.tsx
<WelcomeShell
  headline="Welcome to the team"
  subheadline="Set your personal push-up goal for the rest of the year."
  tiers={[82, 90, 100, 110]}
  mode="absolute"
  infoText={<>Don't go too low. …</>}
/>
```

```tsx
// src/pages/WelcomePageV2.tsx
<WelcomeShell
  headline="You did it! You hit 30k, awesome."
  subheadline="Set your personal push-up goal for the rest of the year."
  tiers={[82, 90, 100]}
  mode="additive"
  showFireworks
  fireworksDelayMs={5000}
  infoText={<>…</>}
/>
```

```tsx
// src/pages/WelcomeRecalibratePage.tsx
<WelcomeShell
  headline="Recalibrate Your Goal"
  subheadline="Set your personal push-up goal for the rest of the year."
  tiers={[82, 90, 100, 110]}
  mode="additive"
  infoText={<>…</>}
/>
```

(Exact tiers and copy carried over verbatim from current files — no content changes.)

## Files touched

- **New:** `src/components/WelcomeShell.tsx`
- **Rewritten (slimmed):** `src/pages/WelcomePage.tsx`, `src/pages/WelcomePageV2.tsx`, `src/pages/WelcomeRecalibratePage.tsx`
- **Untouched:** `src/App.tsx` routes, `ProtectedRoute`, `useGoalHit`, `useHasEntries`, `Fireworks.tsx`

## Verification

After refactor, walk all three flows in the preview:
1. `/welcome` — fresh user, confirm sets absolute goal.
2. `/welcome-v2` — fireworks 5s, then content; confirm adds to current total.
3. `/welcome-recalibrate` from `/admin` — additive goal write.

Confirm each shows the right headline, tiers, info text, and writes the expected `yearly_goal` value.

## Risk

Medium. Three pages move at once, but behavior is preserved and the shell is purely structural. Verifiable visually in one pass.
