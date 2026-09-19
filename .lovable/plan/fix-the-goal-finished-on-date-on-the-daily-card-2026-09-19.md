# Fix the "goal finished on" date on the daily card

## What's wrong

Two issues combine on the test account:

1. The daily pace used for the forecast is the total divided by **every day since 1 January**, not by the days the person has actually been pushing. A brand-new test account with 90 push-ups gets a pace of about 0.34 per day instead of 90 per day.
2. With such a tiny pace, the finish date lands **hundreds of years in the future** — but the card only prints day and month, never the year. So 90 push-ups shows "20. Dec" (of some far-off year) and 89 shows "25. Sep" (of another). The wild jump is just two distant years hidden behind the same short date.

## The fix

The forecast already works off the yearly goal: it takes the push-ups still missing to reach it and divides by the daily pace. Only the pace is wrong. So:

- Keep the remaining-to-goal part as is, but base the pace on the days since the person's **first logged day** (the same active-day basis the card already uses for the "on target" figure), so a fresh account projects from its real daily rate.
- Show the year whenever the projected finish is not in the current year, e.g. "25. Sep 27".
- If the finish is further out than a sensible horizon (more than about 10 years) or the pace is zero, show a dash instead of a misleading date.

## Technical notes

All in `src/components/DailySection.tsx`, inside the key-figures block (lines ~358-373):

- Replace `allTimeAvg = total / daysElapsed` with `total / activeDays` (move the `activeDays` computation above the projection).
- Format with `format(projectedDate, isSameYear(projectedDate, today) ? "d. MMM" : "d. MMM yy")`.
- Guard: if projected days > ~3650, render `—`.
- If the same forecast appears elsewhere (insights/player card), align it the same way.
