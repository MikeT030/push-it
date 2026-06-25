## Add "On Target" state

When `diff === 0`, treat as a distinct state using the existing above-target visuals (rocket icon, teal color).

### `src/components/DailySection.tsx` (pace tile, ~lines 337–376)
- Change label logic: `diff === 0 ? "On Tgt" : diff > 0 ? "Above Tgt" : "Below Tgt"`
- Change value logic: `diff === 0 ? "±0" : (diff > 0 ? `+${diff}` : `−${Math.abs(diff)}`)`
- Icon/color: use the above-target rocket + teal styling for both `diff >= 0` (unchanged for positive; now also applies to zero).

### `src/pages/TotalPage.tsx` (yearly card tagline, ~line 319)
- When `paceDiff === 0`: render "On target — keep it up at {dailyTarget}/d" (using the existing above-target megaphone/rocket icon and teal accent already used for positive diff).
- Keep below/above branches unchanged.

No other files affected.