CREATE INDEX IF NOT EXISTS push_up_entries_user_id_date_idx ON public.push_up_entries (user_id, date);
CREATE INDEX IF NOT EXISTS push_up_entries_date_idx ON public.push_up_entries (date);