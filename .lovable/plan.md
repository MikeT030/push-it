## Change

Update "Day X of 365" under the progress bar on the yearly card to reflect the user's personal start-through-EOY window.

## Implementation

**File:** `src/pages/TotalPage.tsx`

1. Import `endOfYear` from `date-fns` (line 3).
2. Inside the existing stats `useMemo` (where `firstEntryTime` is already computed, ~line 94–98), add:
   ```ts
   const startDate   = new Date(firstEntryTime);
   const windowTotal = differenceInDays(endOfYear(today), startDate) + 1;
   const windowDay   = Math.min(windowTotal, Math.max(1, differenceInDays(today, startDate) + 1));
   ```
3. Return `windowDay` and `windowTotal` from `stats`.
4. Replace line 307:
   ```tsx
   Day {stats.windowDay} of {stats.windowTotal}
   ```
5. Also fix the existing hardcoded `Target 82/d` on line 333 → `Target {dailyTarget}/d`.

## Result

- Brand-new user today (no entries) → **Day 1 of 190**, "Target 82/d" (or whatever their real daily is).
- Sascha → **Day X of 264**, "Target 114/d".
- Jan-1 starter → **Day 176 of 365**, "Target 82/d" (unchanged).