## Why Michi lands on /welcome

When I reset Michi's goal back to 30,000, I also cleared `profiles.goal_set_year` to NULL. `ProtectedRoute` in `src/App.tsx` treats "no current-year goal" as "must onboard" and redirects to `/welcome` on every page load:

```ts
if (!isSetThisYear && location.pathname !== "/welcome") {
  return <Navigate to="/welcome" replace />;
}
```

Since Michi already has push-up entries and an established 30k goal, that redirect is wrong for them.

## Fix

Set `profiles.goal_set_year = 2026` for Michi (id `2daf5b5e-d8fb-4677-9276-bd42337a2a95`). `yearly_goal` stays at 30,000. No code changes.

After the update, Michi will land on `/` (You Push) as normal and the % will reflect total ÷ 30,000.

## Note for the future

The same thing will happen to every user at the Jan 1 rollover (by design — annual recalibrate). If you'd rather not force the welcome screen for returning users with existing entries, that's a separate code change to `ProtectedRoute` — say the word and I'll plan it.