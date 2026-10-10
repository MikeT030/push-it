# Past Challenges: multiple goals per year

## What will change
- Move the year out of each challenge card and render it as a section heading, such as **2025**.
- Group completed goals by year, newest year first; a later year automatically gets its own section.
- Render every reached goal as a separate card within its year section, ordered by completion date from newest to oldest.
- Replace the current year label inside each card with the milestone it represents, for example **30,000 PU Goal**.
- Keep the existing card details, but freeze them at the moment that specific goal was reached: total, goal, completion period/date, average, best day, average push-up weekday, days logged, and best streak.
- Preserve the current dark glass-card styling and spacing shown in the reference image.

## Save real challenge history
- Add a private per-user completed-goal history in Lovable Cloud. Each record stores the reached goal, calendar year, completion date, total at completion, and the calculated milestone statistics.
- Protect the history so users can only read their own records. The app will create snapshots only through controlled goal-completion logic, preventing users from fabricating achievements.
- When a reached goal is celebrated and the user chooses the next goal, save that reached milestone once. A uniqueness rule will prevent duplicate cards for the same user, year, and goal.
- Backfill one card for each user's latest known celebrated goal. Derive the earliest completion date and snapshot statistics from their existing push-up entries where possible; do not invent older milestones that the current data cannot prove.

## Screen integration
- Replace the duplicated demo arrays with one shared Past Challenges view and real history loading.
- Use the same grouped view in the profile layer and the existing standalone Past Challenges screen so both stay consistent.
- Include clear loading and empty states without changing the profile-page placement or opening behavior.

## Verification
- Add focused tests for the core rules: two reached goals in 2025 produce one **2025** heading with two distinct cards; a 2026 goal produces a separate **2026** section; milestone snapshots do not change after later push-ups; duplicate completion handling creates only one card.
- Verify the celebration-to-new-goal flow, the profile Past Challenges layer, and the reorganized screen at the current mobile size.

## Technical details
- Create a `completed_goal_history` table with explicit authenticated/service grants, row-level protection, snapshot fields, timestamps, and a unique `(user_id, year, goal)` constraint.
- Add a protected database function that atomically validates the reached goal, calculates the snapshot from entries up to completion, inserts the history record, and updates the celebrated/current goal state.
- Update generated database types through the supported workflow and add a small history query hook plus shared grouped presentation component.
