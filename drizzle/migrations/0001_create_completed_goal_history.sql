CREATE TABLE public.completed_goal_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_year integer NOT NULL CHECK (challenge_year BETWEEN 2020 AND 2100),
  goal integer NOT NULL CHECK (goal > 0),
  completed_at date NOT NULL,
  total_at_completion integer NOT NULL CHECK (total_at_completion >= 0),
  period_start date NOT NULL,
  period_end date NOT NULL,
  average_pushups integer NOT NULL DEFAULT 0,
  best_day_count integer NOT NULL DEFAULT 0,
  best_day_date date,
  average_day_of_week integer CHECK (average_day_of_week BETWEEN 0 AND 6),
  days_logged integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT completed_goal_history_user_year_goal_key UNIQUE (user_id, challenge_year, goal),
  CONSTRAINT completed_goal_history_period_order CHECK (period_end >= period_start)
);

GRANT SELECT ON public.completed_goal_history TO authenticated;
GRANT ALL ON public.completed_goal_history TO service_role;

ALTER TABLE public.completed_goal_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own completed goals"
ON public.completed_goal_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX completed_goal_history_user_year_idx
ON public.completed_goal_history (user_id, challenge_year DESC, completed_at DESC);

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
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF _reached_goal <= 0 OR _next_goal <= _reached_goal OR _next_goal > 999999 THEN
    RAISE EXCEPTION 'Invalid goal values';
  END IF;

  SELECT yearly_goal INTO _current_goal
  FROM public.profiles
  WHERE id = _user_id
  FOR UPDATE;

  IF _current_goal IS DISTINCT FROM _reached_goal THEN
    RAISE EXCEPTION 'Reached goal does not match the current goal';
  END IF;

  SELECT COALESCE(sum(count), 0)::integer INTO _total
  FROM public.push_up_entries
  WHERE user_id = _user_id;

  IF _total < _reached_goal THEN
    RAISE EXCEPTION 'Goal has not been reached';
  END IF;

  SELECT reached_date INTO _completed_at
  FROM (
    SELECT date AS reached_date,
      sum(count) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
    FROM public.push_up_entries
    WHERE user_id = _user_id
  ) totals
  WHERE running_total >= _reached_goal
  ORDER BY reached_date
  LIMIT 1;

  _completed_at := COALESCE(_completed_at, current_date);
  _year := extract(year from _completed_at)::integer;
  _period_start := make_date(_year, 1, 1);

  SELECT
    count(*)::integer,
    COALESCE(round(avg(count)), 0)::integer
  INTO _days_logged, _average
  FROM public.push_up_entries
  WHERE user_id = _user_id
    AND date BETWEEN _period_start AND _completed_at
    AND count > 0;

  SELECT count, date INTO _best_day_count, _best_day_date
  FROM public.push_up_entries
  WHERE user_id = _user_id
    AND date BETWEEN _period_start AND _completed_at
    AND count > 0
  ORDER BY count DESC, date ASC
  LIMIT 1;

  SELECT extract(dow from date)::integer INTO _average_dow
  FROM public.push_up_entries
  WHERE user_id = _user_id
    AND date BETWEEN _period_start AND _completed_at
    AND count > 0
  GROUP BY extract(dow from date)
  ORDER BY avg(count) DESC, extract(dow from date)
  LIMIT 1;

  SELECT COALESCE(max(streak_length), 0)::integer INTO _best_streak
  FROM (
    SELECT count(*) AS streak_length
    FROM (
      SELECT date, date - (row_number() OVER (ORDER BY date))::integer AS streak_group
      FROM public.push_up_entries
      WHERE user_id = _user_id
        AND date BETWEEN _period_start AND _completed_at
        AND count > 0
    ) dated_entries
    GROUP BY streak_group
  ) streaks;

  INSERT INTO public.completed_goal_history (
    user_id, challenge_year, goal, completed_at, total_at_completion,
    period_start, period_end, average_pushups, best_day_count,
    best_day_date, average_day_of_week, days_logged, best_streak
  ) VALUES (
    _user_id, _year, _reached_goal, _completed_at, _reached_goal,
    _period_start, _completed_at, _average,
    COALESCE(_best_day_count, 0), _best_day_date, _average_dow,
    _days_logged, _best_streak
  ) ON CONFLICT (user_id, challenge_year, goal) DO NOTHING;

  UPDATE public.profiles
  SET yearly_goal = _next_goal,
      celebrated_goal = _reached_goal,
      onboarded = true,
      goal_set_year = extract(year from current_date)::integer
  WHERE id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_goal_and_set_next(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_goal_and_set_next(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_goal_and_set_next(integer, integer) TO service_role;

INSERT INTO public.completed_goal_history (
  user_id, challenge_year, goal, completed_at, total_at_completion,
  period_start, period_end, average_pushups, best_day_count,
  best_day_date, average_day_of_week, days_logged, best_streak
)
SELECT
  p.id,
  extract(year from crossing.completed_at)::integer,
  p.celebrated_goal,
  crossing.completed_at,
  p.celebrated_goal,
  make_date(extract(year from crossing.completed_at)::integer, 1, 1),
  crossing.completed_at,
  COALESCE(stats.average_pushups, 0),
  COALESCE(stats.best_day_count, 0),
  stats.best_day_date,
  stats.average_day_of_week,
  COALESCE(stats.days_logged, 0),
  COALESCE(streaks.best_streak, 0)
FROM public.profiles p
JOIN LATERAL (
  SELECT reached_date AS completed_at
  FROM (
    SELECT e.date AS reached_date,
      sum(e.count) OVER (ORDER BY e.date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
    FROM public.push_up_entries e
    WHERE e.user_id = p.id
  ) running
  WHERE running_total >= p.celebrated_goal
  ORDER BY reached_date
  LIMIT 1
) crossing ON true
LEFT JOIN LATERAL (
  SELECT
    count(*)::integer AS days_logged,
    round(avg(e.count))::integer AS average_pushups,
    (array_agg(e.count ORDER BY e.count DESC, e.date ASC))[1]::integer AS best_day_count,
    (array_agg(e.date ORDER BY e.count DESC, e.date ASC))[1] AS best_day_date,
    (
      SELECT extract(dow from d.date)::integer
      FROM public.push_up_entries d
      WHERE d.user_id = p.id
        AND d.date BETWEEN make_date(extract(year from crossing.completed_at)::integer, 1, 1) AND crossing.completed_at
        AND d.count > 0
      GROUP BY extract(dow from d.date)
      ORDER BY avg(d.count) DESC, extract(dow from d.date)
      LIMIT 1
    ) AS average_day_of_week
  FROM public.push_up_entries e
  WHERE e.user_id = p.id
    AND e.date BETWEEN make_date(extract(year from crossing.completed_at)::integer, 1, 1) AND crossing.completed_at
    AND e.count > 0
) stats ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(max(streak_length), 0)::integer AS best_streak
  FROM (
    SELECT count(*) AS streak_length
    FROM (
      SELECT e.date, e.date - (row_number() OVER (ORDER BY e.date))::integer AS streak_group
      FROM public.push_up_entries e
      WHERE e.user_id = p.id
        AND e.date BETWEEN make_date(extract(year from crossing.completed_at)::integer, 1, 1) AND crossing.completed_at
        AND e.count > 0
    ) dated_entries
    GROUP BY streak_group
  ) grouped_streaks
) streaks ON true
WHERE p.celebrated_goal > 0
ON CONFLICT (user_id, challenge_year, goal) DO NOTHING;