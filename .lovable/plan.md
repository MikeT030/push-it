# Performance Optimization Plan

Scope is strictly backend data-fetching and caching. No UI, no behavior, no design tokens change.

## 1. Database indexes (migration)

Add indexes that match the existing query patterns on `push_up_entries`:

- `(user_id, date)` — used by per-user history fetches in `usePushUpData`, `ProfilePage`, etc.
- `(date)` — used by daily/weekly group overviews filtering by date range.

`profiles` and `user_roles` already have primary-key / unique lookups; no new indexes needed.

## 2. Stop fetching the entire `push_up_entries` table

Today several components do `select("date, user_id, count")` with no filter and pull every row in the DB on mount:

- `src/pages/GroupPage.tsx` (line 125)
- `src/components/DailyGroupOverview.tsx` (line 95)
- `src/components/WeeklyGroupOverview.tsx` (line 36)

Change to scoped queries:

- All three need only **current-year** data → add `.gte("date", "2026-01-01")`.
- `DailyGroupOverview` and `WeeklyGroupOverview` can additionally constrain to a rolling window (e.g. last ~120 days) since their selectors only render recent days/weeks.

No UI/logic change — same shape of data, just less of it.

## 3. React Query for shared fetches

`DailyGroupOverview`, `WeeklyGroupOverview`, `GroupPage`, and the leaderboard each independently re-fetch `profiles` + `push_up_entries` + `user_progress` via `useEffect`. Replace these with `useQuery` keyed by `["entries", year]`, `["profiles"]`, `["user-progress"]`.

Effects:
- Single network request shared across mounted components.
- Cached across tab switches (no refetch when toggling Daily/Weekly tabs).
- `staleTime: 60_000` so it still updates when the user logs new push-ups.

`QueryClientProvider` is already wired up in `App.tsx` — no infra change.

## What is NOT touched

- No UI / design tokens / animations.
- No auth, RLS, or policy changes.
- No new dependencies (React Query already installed).
- No removal of features; `usePushUpData` and personal-page queries already scope by `user_id` and stay as-is (they only benefit from the new index).

## Files to change

- New migration: indexes on `push_up_entries`.
- `src/pages/GroupPage.tsx`
- `src/components/DailyGroupOverview.tsx`
- `src/components/WeeklyGroupOverview.tsx`
- (Optional small refactor) a new `src/hooks/useGroupData.ts` housing the three shared queries so the components stay thin.

## Validation

- Confirm Network tab shows one `push_up_entries` request instead of three on `/group`.
- Confirm payload size drops (year-scoped vs full table).
- Visual diff: none expected.
