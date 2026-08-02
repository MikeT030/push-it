import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface CounterActivity {
  user_id: string;
  date: string;
}

/**
 * Workout ("counter activity") days, persisted in the backend so they survive
 * navigation, reloads and are visible on the group (We Push) page.
 */
export const useCounterActivities = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["counter-activities"],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<CounterActivity[]> => {
      const { data, error } = await supabase
        .from("counter_activities")
        .select("user_id, date");
      if (error) throw error;
      return data ?? [];
    },
  });

  const activities = data ?? [];

  const hasCounterActivity = useCallback(
    (date: Date | string, forUserId?: string) => {
      const key = typeof date === "string" ? date : format(date, "yyyy-MM-dd");
      const uid = forUserId ?? userId;
      return activities.some((a) => a.date === key && a.user_id === uid);
    },
    [activities, userId]
  );

  const toggleCounterActivity = useCallback(
    async (date: Date) => {
      if (!userId) return;
      const key = format(date, "yyyy-MM-dd");
      const exists = activities.some((a) => a.date === key && a.user_id === userId);

      // Optimistic update
      queryClient.setQueryData<CounterActivity[]>(["counter-activities"], (prev) => {
        const base = prev ?? [];
        return exists
          ? base.filter((a) => !(a.date === key && a.user_id === userId))
          : [...base, { user_id: userId, date: key }];
      });

      const { error } = exists
        ? await supabase
            .from("counter_activities")
            .delete()
            .eq("user_id", userId)
            .eq("date", key)
        : await supabase
            .from("counter_activities")
            .insert({ user_id: userId, date: key });

      if (error) {
        toast({ title: "Could not save workout", description: error.message, variant: "destructive" });
      }
      queryClient.invalidateQueries({ queryKey: ["counter-activities"] });
    },
    [userId, activities, queryClient]
  );

  return { activities, hasCounterActivity, toggleCounterActivity };
};
