CREATE OR REPLACE FUNCTION public.complete_goal_and_set_next(
  _reached_goal integer,
  _next_goal integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _current_goal integer;
  _total integer;
  _completion_total integer;
  _completed_at date;
  _year integer;
  _period_start date;
  _days_logged integer;
  _average integer;
  _best_day_count integer;
  _best_day_date date;
  _average_dow integer;
  _best_streak integer;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _reached_goal <= 0 OR _next_goal <= _reached_goal OR _next_goal > 999999 THEN
    RAISE EXCEPTION 'Invalid goal values';
  END IF;

  SELECT yearly_goal INTO _current_goal
  FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF _current_goal IS DISTINCT FROM _reached_goal THEN
    RAISE EXCEPTION 'Reached goal does not match the current goal';
  END IF;

  SELECT COALESCE(sum(count), 0)::integer INTO _total
  FROM public.push_up_entries WHERE user_id = _user_id;
  IF _total < _reached_goal THEN RAISE EXCEPTION 'Goal has not been reached'; END IF;

  SELECT reached_date, running_total::integer
  INTO _completed_at, _completion_total
  FROM (
    SELECT date AS reached_date,
      sum(count) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
    FROM public.push_up_entries WHERE user_id = _user_id
  ) totals
  WHERE running_total >= _reached_goal
  ORDER BY reached_date LIMIT 1;

  _completed_at := COALESCE(_completed_at, current_date);
  _completion_total := COALESCE(_completion_total, _total);
  _year := extract(year from _completed_at)::integer;
  _period_start := make_date(_year, 1, 1);

  SELECT count(*)::integer, COALESCE(round(avg(count)), 0)::integer
  INTO _days_logged, _average
  FROM public.push_up_entries
  WHERE user_id = _user_id AND date BETWEEN _period_start AND _completed_at AND count > 0;

  SELECT count, date INTO _best_day_count, _best_day_date
  FROM public.push_up_entries
  WHERE user_id = _user_id AND date BETWEEN _period_start AND _completed_at AND count > 0
  ORDER BY count DESC, date ASC LIMIT 1;

  SELECT extract(dow from date)::integer INTO _average_dow
  FROM public.push_up_entries
  WHERE user_id = _user_id AND date BETWEEN _period_start AND _completed_at AND count > 0
  GROUP BY extract(dow from date)
  ORDER BY count(*) DESC, extract(dow from date) LIMIT 1;

  SELECT COALESCE(max(streak_length), 0)::integer INTO _best_streak
  FROM (
    SELECT count(*) AS streak_length
    FROM (
      SELECT date, date - (row_number() OVER (ORDER BY date))::integer AS streak_group
      FROM public.push_up_entries
      WHERE user_id = _user_id AND date BETWEEN _period_start AND _completed_at AND count > 0
    ) dated_entries GROUP BY streak_group
  ) streaks;

  INSERT INTO public.completed_goal_history (
    user_id, challenge_year, goal, completed_at, total_at_completion,
    period_start, period_end, average_pushups, best_day_count,
    best_day_date, average_day_of_week, days_logged, best_streak
  ) VALUES (
    _user_id, _year, _reached_goal, _completed_at, _completion_total,
    _period_start, _completed_at, _average, COALESCE(_best_day_count, 0),
    _best_day_date, _average_dow, _days_logged, _best_streak
  ) ON CONFLICT (user_id, challenge_year, goal) DO NOTHING;

  UPDATE public.profiles
  SET yearly_goal = _next_goal, celebrated_goal = _reached_goal,
      onboarded = true, goal_set_year = extract(year from current_date)::integer
  WHERE id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_goal_and_set_next(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_goal_and_set_next(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_goal_and_set_next(integer, integer) TO service_role;