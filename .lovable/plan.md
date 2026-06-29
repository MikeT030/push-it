## Why STIZZLE shows 790%

Their stored yearly goal is **187** and they've logged **1,477** push-ups → 1477 / 187 ≈ **7.9** → the player card prints `Math.round(yearProgress)%` = **790%**. The progress bar width is clamped to 100% but the text label isn't, so the raw number leaks through.

## Fix

Reset STIZZLE's `yearly_goal` back to the default **30,000** in the `profiles` table. After the update their year progress will read ~5%.

No code changes — data only.

### Technical detail
- One UPDATE on `public.profiles` where `id = 66e94dd8-9497-471b-8d2b-8721bad09a9d` setting `yearly_goal = 30000`.
- Optionally clear `goal_set_year` so the welcome/recalibrate flow can re-offer them a goal this year if desired (not included by default — say the word if you want it).
