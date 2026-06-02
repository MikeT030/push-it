## Goal
Stack the weekday (e.g., "Mon") and the date (e.g., "May 25") vertically in the WeeklyOverview daily list, left-aligned — matching the layout used in the "Weekly We Push" (Daily Section) div.

## File
- `src/components/WeeklyOverview.tsx` (around lines 175–186)

## Change
Replace the horizontal `flex items-center gap-3` wrapper around the weekday span and date span with a vertical `flex flex-col items-start` wrapper, so the weekday sits on top of the date.

The "Today" badge stays inline; it can remain next to the weekday in a small horizontal row, with the date below.