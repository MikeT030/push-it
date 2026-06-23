import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useOnboarded = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["profile-onboarded", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data?.onboarded ?? false;
    },
  });

  return {
    onboarded: data ?? null,
    isLoading: !!userId && isLoading,
  };
};
