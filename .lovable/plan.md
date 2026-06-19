## Problem
The current `recommendedBoost` logic picks the highest boost where `BASE_GOAL + boost*1000 <= projectedEOY`, effectively rounding down. For Michi (20.7K on day 170, avg 122/day → EOY ~44.5K), this yields +10K even though +15K is barely 500 over the projection.

## Fix
1. Change the rounding from "largest ≤ projection" to "closest to projection" (nearest boost).
   - For 44.5K: +15K = 45K, difference 440; +10K = 40K, difference 4,560. → +15K wins.
2. Move the existing suggestion text inside the dropdown menu, below the buttons row.
   - Existing copy: "Based on your pace, +{recommendedBoost}K is a good fit"

## File
`src/pages/TotalPage.tsx` — update `recommendedBoost` useMemo and reposition the suggestion `<p>` inside the menu dropdown.

No schema or backend changes needed.