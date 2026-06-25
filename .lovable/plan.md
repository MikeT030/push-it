## Problem

In `src/components/DailySection.tsx` (line 329) the "Above/Below Target" stat pro-rates the yearly goal from January 1:

```ts
const expectedByNow = Math.round((daysElapsed / 365) * yearlyGoal);
```

For a user who signs up mid-year and sets a "rest of year" goal via `/welcome`, this immediately reports a large deficit (e.g. −7.51k on day 1) because the formula assumes they have been pushing since Jan 1.

## Fix

Compute "expected by now" from the user's **daily target × days the user has been active**, not from a Jan 1 baseline.

The cleanest available signal is the user's first push-up entry date (with fallback to today when none exist). The daily target is already exposed via `usePushUpData`.

### Change in `src/components/DailySection.tsx`

1. Replace the Jan 1 pro-ration with a per-user baseline:
   ```ts
   const firstEntryDate = /* earliest entry date this year, or today */;
   const activeDays = Math.max(1, differenceInDays(today, firstEntryDate) + 1);
   const expectedByNow = activeDays * dailyTarget;
   const diff = total - expectedByNow;
   ```
2. Keep the `Above Tgt / Below Tgt` label and tooltip behavior unchanged.

### Notes

- `dailyTarget` already accounts for goal recalibrations (it is `remaining / daysRemaining`), so this stays correct after `/welcome-recalibrate` or `/welcome-v2`.
- The `${Math.round(yearlyGoal/1000)}k on` projection stat is unrelated and stays as-is.
- No backend or schema changes required.

## Out of scope

- Other Jan-1-based pro-rations elsewhere in the app (Yearly card, on-track logic). If you want those normalized to a per-user start date too, say the word and I'll extend the fix.
