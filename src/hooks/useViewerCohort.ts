import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns the current viewer's demo/real cohort. Used to sandbox demo users:
 * demo accounts only see other demo accounts across leaderboard, group,
 * charts, and past challenges — and vice-versa.
 */
export const useViewerCohort = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const q = useQuery({
    queryKey: ["viewer-cohort", userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_test, created_at")
        .eq("id", userId!)
        .maybeSingle();
      return {
        isTest: !!data?.is_test,
        createdAt: (data as any)?.created_at as string | null,
      };
    },
  });

  return {
    isTest: q.data?.isTest ?? false,
    createdAt: q.data?.createdAt ?? null,
    isLoading: q.isLoading,
  };
};
