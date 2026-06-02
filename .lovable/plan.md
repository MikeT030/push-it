## Goal
On the Group page leaderboard, hide any user whose push-up total in the current view is 0.

## Change
File: `src/pages/GroupPage.tsx` — inside the `filteredUsers` useMemo (lines 191–231):

- **All-time tab:** return `users.filter(u => u.total_pushups > 0)` instead of the full list.
- **Weekly / Monthly tabs:** after the existing `.map(...)` that recomputes per-period totals, add `.filter(u => u.total_pushups > 0)` before the `.sort(...)`.

No other components, queries, or styles change. The podium (top 3) and the list below it both read from `filteredUsers`, so both update automatically. The empty-state at line 346 already handles the case where the filtered list is empty.
