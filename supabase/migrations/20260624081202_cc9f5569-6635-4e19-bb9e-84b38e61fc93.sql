ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS goal_set_year integer;
UPDATE public.profiles SET goal_set_year = EXTRACT(year FROM now())::int WHERE onboarded = true AND goal_set_year IS NULL;