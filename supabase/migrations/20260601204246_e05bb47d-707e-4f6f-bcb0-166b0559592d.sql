-- Fix existing invalid data first
UPDATE public.profiles SET yearly_goal = 30000 WHERE yearly_goal <= 0;
UPDATE public.push_up_entries SET count = 9999 WHERE count > 9999;
UPDATE public.push_up_entries SET count = 0 WHERE count < 0;

-- Add CHECK constraints
ALTER TABLE public.profiles ADD CONSTRAINT yearly_goal_positive CHECK (yearly_goal > 0);
ALTER TABLE public.push_up_entries ADD CONSTRAINT count_bounds CHECK (count >= 0 AND count <= 9999);

-- Make view safe with NULLIF as defense in depth
CREATE OR REPLACE VIEW public.user_progress AS
SELECT p.id AS user_id,
   p.display_name,
   COALESCE(sum(e.count), 0::bigint)::integer AS total_pushups,
   p.yearly_goal,
   round(COALESCE(sum(e.count), 0::bigint)::numeric / NULLIF(p.yearly_goal, 0)::numeric * 100::numeric, 1) AS progress_percent,
   count(DISTINCT e.date)::integer AS days_logged
  FROM public.profiles p
    LEFT JOIN public.push_up_entries e ON p.id = e.user_id
 GROUP BY p.id, p.yearly_goal, p.display_name;