-- Add display_name column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN display_name TEXT;

-- Update the user_progress view to include display_name
DROP VIEW IF EXISTS public.user_progress;

CREATE VIEW public.user_progress AS
SELECT 
  p.id as user_id,
  p.display_name,
  COALESCE(SUM(e.count), 0)::integer as total_pushups,
  p.yearly_goal,
  ROUND(COALESCE(SUM(e.count), 0)::numeric / p.yearly_goal * 100, 1) as progress_percent,
  COUNT(DISTINCT e.date)::integer as days_logged
FROM public.profiles p
LEFT JOIN public.push_up_entries e ON p.id = e.user_id
GROUP BY p.id, p.yearly_goal, p.display_name;