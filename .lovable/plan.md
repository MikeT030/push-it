# Reset two users to their initial 30k goal

Two users currently have non-30k yearly goals from recalibrations:

| User | Email | Current `yearly_goal` | New |
|---|---|---|---|
| Thomas | th.gruhl@gmail.com | 15,580 | **30,000** |
| nomis | zion.jones@icloud.com | 38,000 | **30,000** |

## Change

Run a single data update against `public.profiles`:

```sql
UPDATE public.profiles
SET yearly_goal = 30000, updated_at = now()
WHERE id IN (
  '4a2a3fa0-cef9-4234-aa4d-4f932fc93ba6', -- Thomas
  'eee4a752-12de-4052-82cd-8a3e4a98a354'  -- nomis
);
```

No code changes. All push-up entries remain intact; only the goal resets, which removes the "+14K"/"+8K" recalibration delta from their stats.
