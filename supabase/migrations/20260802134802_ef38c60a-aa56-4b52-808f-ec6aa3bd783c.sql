CREATE TABLE public.counter_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counter_activities TO authenticated;
GRANT ALL ON public.counter_activities TO service_role;
ALTER TABLE public.counter_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view counter activities" ON public.counter_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add their own counter activities" ON public.counter_activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own counter activities" ON public.counter_activities FOR DELETE TO authenticated USING (auth.uid() = user_id);