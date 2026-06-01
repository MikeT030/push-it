DROP VIEW IF EXISTS public.user_progress;

CREATE VIEW public.user_progress
WITH (security_invoker = true)
AS
SELECT p.id AS user_id,
  p.display_name,
  (COALESCE(sum(e.count), 0::bigint))::integer AS total_pushups,
  p.yearly_goal,
  round(((COALESCE(sum(e.count), 0::bigint))::numeric / NULLIF(p.yearly_goal, 0)::numeric) * 100::numeric, 1) AS progress_percent,
  (count(DISTINCT e.date))::integer AS days_logged
FROM profiles p
LEFT JOIN push_up_entries e ON p.id = e.user_id
GROUP BY p.id, p.yearly_goal, p.display_name;

GRANT SELECT ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;