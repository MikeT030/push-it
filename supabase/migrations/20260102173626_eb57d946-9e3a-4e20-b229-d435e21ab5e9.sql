-- Create a view that aggregates push-up data for all users (for authenticated users only)
-- This only exposes aggregated stats, not individual entries

CREATE VIEW public.user_progress AS
SELECT 
  p.id as user_id,
  COALESCE(SUM(e.count), 0)::integer as total_pushups,
  p.yearly_goal,
  ROUND((COALESCE(SUM(e.count), 0)::numeric / p.yearly_goal * 100), 1) as progress_percent,
  COUNT(DISTINCT e.date)::integer as days_logged
FROM public.profiles p
LEFT JOIN public.push_up_entries e ON p.id = e.user_id
GROUP BY p.id, p.yearly_goal;

-- Enable RLS on the view
ALTER VIEW public.user_progress SET (security_invoker = on);

-- Create a policy to allow authenticated users to see all user progress
CREATE POLICY "Authenticated users can view all user progress" 
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Drop the old restrictive policy first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;