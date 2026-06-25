## Goal

Fix the mismatch between the "X below Target" number and the "Target N/d" label, while keeping today's quota counted from midnight so users feel pressure to push.

## Change (one file)

**`src/hooks/usePushUpData.ts`** — replace the fixed-365 divisor with a personal window from the user's start date through Dec 31.

```ts
// Determine the user's personal start date
const firstEntryTime = entries.length
  ? Math.min(...entries.map(e => new Date(e.date).getTime()))
  : today.getTime();
const startDate    = new Date(Math.min(firstEntryTime, today.getTime()));
const daysInWindow = differenceInDays(endOfYear(today), startDate) + 1;
const dailyTarget  = Math.max(1, Math.round(yearlyGoal / daysInWindow));
```

That's it. Everywhere `dailyTarget` is consumed (DailySection, TotalPage, WeeklyOverview, etc.) automatically gets the corrected per-day number.

## Explicitly NOT changing

- **`expectedByNow` still uses `activeDays` (today counts immediately).** As soon as the clock ticks past midnight, the user owes that day's quota. If they haven't accumulated a surplus from previous days, they'll show as one daily-target behind — by design, to keep them on their toes.

## Effect

For the example user (15,580 goal, no entries, first day):
- Old: dailyTarget = 43, expectedByNow = 43 → "−43 below Target / Target 82/d" (contradictory)
- New: dailyTarget = 82, expectedByNow = 82 → "−82 below Target / Target 82/d" (consistent, and creates the daily pressure you want)

For Jan-1 starters: nothing changes (window = 365).
For mid-year starters: daily target rises to match the shorter remaining window (e.g., Sascha 82 → 114).

## Cleanup

Since `dailyTarget` is now correct globally, the local recalculation added earlier to `DailySection.tsx` and `TotalPage.tsx` (the `firstEntryDate`-based expected calc) can be reverted back to using `dailyTarget * activeDays` directly. Keeps the codebase consistent and removes duplicated logic.
