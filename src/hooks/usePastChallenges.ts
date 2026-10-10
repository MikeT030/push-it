import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { PastChallenge } from "@/lib/pastChallenges";

export const usePastChallenges = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["past-challenges", userId],
    enabled: !!userId,
    queryFn: async (): Promise<PastChallenge[]> => {
      const { data, error } = await supabase
        .from("completed_goal_history")
        .select(
          "id, challenge_year, goal, completed_at, total_at_completion, period_start, period_end, average_pushups, best_day_count, best_day_date, average_day_of_week, days_logged, best_streak",
        )
        .eq("user_id", userId ?? "")
        .order("challenge_year", { ascending: false })
        .order("completed_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
};