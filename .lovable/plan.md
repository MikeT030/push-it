## Goal
Unify the definition of an "active user" everywhere in the app:
> A user is **active** if they have logged at least one push-up entry (`count > 0`) on any of the **last 30 calendar days**. Otherwise they are inactive. The status is recomputed continuously, so an inactive user becomes active again as soon as they log a new entry.

## Current state (the inconsistency)
Today two different definitions are mixed:

- **Last-30-days definition** (already correct) — used in:
  - `GroupPage.tsx` → `activeUserCount` (line 232-239) → drives `memberCount` and `groupGoal` on the Group Mountain Goal Card.
  - `AdminPage.tsx` → `activeUserCount` (line 39-44).
- **Lifetime ≥ 82 PU definition** (legacy, to be replaced) — used in:
  - `GroupPage.tsx` `stats` block (line 241-260): `totalMembers`, `totalPushups`, `avgProgress`, `onTrackCount`, `avgPuPerDay`.
  - `AdminPage.tsx` `realStats` block (line 33-38): `totalPushups`, `avgProgress`.
- **Period-only filter** (`total_pushups > 0`) — used in the leaderboard `filteredUsers` (line 186-229). This is a period filter, not an "active user" filter, but it interacts with the change (see open question below).

## Changes

### 1. Single source of truth
Introduce one shared `activeUserIds: Set<string>` in `GroupPage.tsx` and `AdminPage.tsx`, computed from `allEntries` where `date >= today − 30 days` and `count > 0`. All downstream stats consume it.

### 2. Replace the `>= 82` filter in the group `stats` block
Replace `users.filter(u => u.total_pushups >= 82)` with `users.filter(u => activeUserIds.has(u.user_id))`. This affects the four tiles in the Leaderboard & Stats strip:

- **Total PU** — sum of yearly totals of active users only.
- **Avg. PU/day** — `(sum of active users' yearly totals) / daysElapsed`.
- **Avg. prog.** — average yearly progress across active users only.
- **On track X / Y** — both numerator and `totalMembers` denominator now reflect active users.

### 3. Group Mountain Goal Card
Already uses `activeUserCount`. No change needed beyond keeping it wired to the same shared set.
Note: `totalPushUps` passed to the card currently comes from `stats.totalPushups`, which will now be the active-users-only sum. Keep this consistent so progress vs. `activeUserCount × 82 × 365` stays meaningful.

### 4. Admin page
Apply the same active-set filter to `totalPushups` and `avgProgress` in `realStats` so the admin preview matches the live group page.

### 5. UX side-effects to be aware of
- When a user becomes inactive, the group's **Total PU** and **Avg. prog.** numbers will drop, and the **Group Goal** target will also shrink (fewer active members × 82 × 365), so the progress bar can move both up and down day-to-day. This is the intended behaviour but worth noting.
- The **On track** denominator will fluctuate as members go in/out of "active".
- New users start **inactive** (no entries yet) and only appear in stats once they log their first push-up — this matches the definition.

## Open question (please confirm before I implement)
The **Leaderboard** currently shows every user with `total_pushups > 0` in the selected period (week/month/all-time). Should inactive users (no entries in the last 30 days) also be hidden from:

- **a)** All leaderboard periods (week, month, all-time), or
- **b)** Only the "All-time" view (week/month already implicitly hide inactives because their period total is 0), or
- **c)** Leave the leaderboard untouched — only change the aggregate stats and goal card.

My recommendation is **(c)**: keep the leaderboard as-is so an inactive member's historical achievement is still visible, and only change the aggregates + goal sizing. Let me know which option you prefer and I'll implement.
