import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useGoalSetThisYear = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["profile-goal-set-year", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("goal_set_year")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.goal_set_year ?? null) as number | null;
    },
  });

  const currentYear = new Date().getFullYear();
  const goalSetYear = data ?? null;

  return {
    goalSetYear,
    isSetThisYear: goalSetYear === currentYear,
    isLoading: !!userId && isLoading,
  };
};
