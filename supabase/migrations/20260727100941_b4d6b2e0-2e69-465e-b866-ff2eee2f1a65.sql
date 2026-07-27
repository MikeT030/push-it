
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS profiles_is_test_idx ON public.profiles(is_test);

-- Rebuild the leaderboard view to include is_test so callers can filter.
DROP VIEW IF EXISTS public.user_progress;
CREATE VIEW public.user_progress
WITH (security_invoker = on) AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.is_test,
  COALESCE(sum(e.count), 0::bigint)::integer AS total_pushups,
  p.yearly_goal,
  round(COALESCE(sum(e.count), 0::bigint)::numeric / NULLIF(p.yearly_goal, 0)::numeric * 100::numeric, 1) AS progress_percent,
  count(DISTINCT e.date)::integer AS days_logged
FROM public.profiles p
LEFT JOIN public.push_up_entries e ON p.id = e.user_id
GROUP BY p.id, p.yearly_goal, p.display_name, p.is_test;

GRANT SELECT ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;
