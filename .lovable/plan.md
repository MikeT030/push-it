## Add "Above/Below Target" key figure to DailySection

Add a new tile in the key figures strip on the Daily page (You Push), positioned right after the "30k on" tile.

### What it shows
- **Label:** "above target" when the user is ahead of pace, "below target" when behind
- **Value:** the number of push-ups above/below the year-to-date target, shown with a sign and capped at 3 digits (e.g. `+87`, `-142`, `+999` when over 999)
- **Icon:** the uploaded `Party.svg`

### Calculation
```
daysElapsed   = days since Jan 1 (inclusive)
expectedByNow = round(daysElapsed / 365 * yearlyGoal)
diff          = getTotalPushUps() - expectedByNow
value         = (diff >= 0 ? "+" : "−") + min(abs(diff), 999)
label         = diff >= 0 ? "above target" : "below target"
```

The value updates live with the existing entries (same data source already used by the surrounding tiles).

### Implementation notes (technical)
1. Upload `Party.svg` to Lovable Assets via the CLI and reference it as an `<img>` in the tile (icon already sized `w-5 h-5` like its siblings). The SVG fill is black, so we'll render it via `<img>` so it stays as-is — no recolor.
2. In `src/components/DailySection.tsx` (around lines 282–308), compute `expectedByNow` and `diff`, then insert a new entry into the `items` array immediately after the `30k on` entry:
   ```ts
   { label: diff >= 0 ? "above target" : "below target",
     value: (diff >= 0 ? "+" : "−") + Math.min(Math.abs(diff), 999),
     unit: "", Icon: PartyIcon, color: "", isCustomIcon: true }
   ```
3. The render loop already handles `isCustomIcon`, so no JSX changes are needed beyond letting `PartyIcon` accept a `className`. The strip already has horizontal scroll, so adding a 6th tile is safe on mobile.

### Out of scope
- No changes to the Group page or other sections
- No changes to data hooks or backend
