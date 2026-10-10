import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns true when the user has reached their current yearly goal AND that
 * goal has not been celebrated yet. Used to auto-redirect users to
 * /welcome-v2 to celebrate and pick a new goal. Fires for every goal
 * milestone (30k, 40k, ...), not just the first one.
 */
export const useGoalHit = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["goal-hit-30k", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const [{ data: profile }, { data: entries }] = await Promise.all([
        supabase
          .from("profiles")
          .select("yearly_goal, celebrated_goal")
          .eq("id", userId!)
          .maybeSingle(),
        supabase.from("push_up_entries").select("count").eq("user_id", userId!),
      ]);
      const total = (entries ?? []).reduce((sum, e) => sum + (e.count ?? 0), 0);
      const goal = profile?.yearly_goal ?? 30000;
      const celebrated = profile?.celebrated_goal ?? 0;
      return total >= goal && goal > celebrated;
    },
  });

  return {
    hit30k: data ?? false,
    isLoading: !!userId && isLoading,
  };
};
