ALTER TABLE public.push_up_entries DROP CONSTRAINT IF EXISTS count_bounds;
ALTER TABLE public.push_up_entries ADD CONSTRAINT count_bounds CHECK (count >= 0 AND count <= 1000);