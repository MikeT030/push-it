## Goal

Wire the three welcome pages to the right audiences, and make sure no push-up can be logged until the current user has confirmed a goal **for the current year**.

## Audiences (final wiring)

| Route | Who lands here | Trigger |
|---|---|---|
| `/welcome` | Brand-new users AND anyone who hasn't confirmed a goal for the current year (incl. Jan 1 rollover) | `goal_set_year !== currentYear` |
| `/welcome-recalibrate` | Existing users who tap "Recalibrate goal" on their profile mid-year | Manual navigation only (from `/profile`) |
| `/welcome-v2` | Users who hit 30,000 push-ups this year but haven't raised the yearly goal above 30k | `yearlyTotal >= 30000 && yearly_goal <= 30000` |

The three pages stay distinct; only their entry conditions and the "back" button behavior change.

## Changes

### 1. Per-year goal flag (new column)
- Add `profiles.goal_set_year integer` (nullable).
- Set it to the current year whenever a user confirms a goal on `/welcome`, `/welcome-recalibrate`, or `/welcome-v2`.
- Replaces the role of `onboarded` for gating `/welcome`. (`onboarded` stays, used only as a "has ever onboarded" signal.)

### 2. New `useGoalSetThisYear` hook
- Reads `profiles.goal_set_year` for the current user.
- Returns `{ isSetThisYear, isLoading }`.

### 3. `ProtectedRoute` updates (`src/App.tsx`)
Redirect priority (when authenticated, not already on a welcome route):
1. `goal_set_year !== currentYear` → `/welcome`
2. else `yearlyTotal >= 30000 && yearly_goal <= 30000` → `/welcome-v2`
3. else render children

`/welcome-recalibrate` is never auto-redirected to — it's only reachable from a "Recalibrate goal" entry on `/profile` (already exists via Admin button; we'll surface a profile entry too, scope TBD — out of scope here, just confirming nothing auto-routes there).

### 4. "Back with no changes" button
- **`/welcome`**: hide the button entirely when `goal_set_year !== currentYear` (i.e., always on this page). The only exit is "Confirm goal". This enforces "no push-ups without a goal".
- **`/welcome-recalibrate`**: keep the button. User already has a goal; they can bail.
- **`/welcome-v2`**: keep the button. User already has a goal (just hit 30k); bailing is fine, but they'll keep getting nudged back to `/welcome-v2` until they raise the goal — which matches today's behavior.

### 5. Confirm handlers
All three pages, on successful goal save:
```ts
await supabase.from('profiles').update({
  yearly_goal: <new value>,
  onboarded: true,
  goal_set_year: new Date().getFullYear(),
}).eq('id', user.id);
```

### 6. Logging guard (defense in depth)
On `DailyPage` `+`/`-` handlers, if `goal_set_year !== currentYear`, navigate to `/welcome` instead of writing. (`ProtectedRoute` already prevents reaching the page, but this protects against race conditions.)

## Out of scope (deferred per user)
- Jan 1 archival job and `Past challenges` card on `/profile` — will be planned separately.
- "Recalibrate goal" CTA placement on `/profile`.

## Technical notes
- Migration: `ALTER TABLE public.profiles ADD COLUMN goal_set_year integer;` (no GRANT changes needed — existing profile grants cover it).
- Backfill: for users with `onboarded = true`, set `goal_set_year = EXTRACT(year FROM now())::int` so existing users aren't bounced to `/welcome` on deploy.
- Files touched:
  - `supabase/migrations/<new>.sql`
  - `src/App.tsx` (ProtectedRoute logic)
  - `src/hooks/useGoalSetThisYear.ts` (new)
  - `src/pages/WelcomePage.tsx` (hide back button, update confirm)
  - `src/pages/WelcomeRecalibratePage.tsx` (update confirm)
  - `src/pages/WelcomePageV2.tsx` (update confirm)
  - `src/pages/DailyPage.tsx` (guard log action)
