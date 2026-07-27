import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useViewerCohort } from "@/hooks/useViewerCohort";

// Current-year scope. The app uses 2026 as its year start everywhere
// (see DailyGroupOverview / WeeklyGroupOverview / GroupPage).
const YEAR_START_ISO = "2026-01-01";

const STALE_MS = 60_000;

export interface GroupEntry {
  date: string;
  user_id: string;
  count: number;
}

export interface GroupProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  yearly_goal: number;
  is_test?: boolean;
}

export interface GroupUserProgress {
  user_id: string;
  display_name: string | null;
  total_pushups: number;
  yearly_goal: number;
  progress_percent: number;
  days_logged: number;
  is_test?: boolean;
}

/**
 * All push-up entries for the current year, filtered to the viewer's cohort
 * (demo vs. real). Demo accounts must never affect real leaderboards / charts.
 */
export const useGroupEntries = () => {
  const { isTest, isLoading: cohortLoading } = useViewerCohort();
  return useQuery({
    queryKey: ["group-entries", YEAR_START_ISO, isTest],
    enabled: !cohortLoading,
    staleTime: STALE_MS,
    queryFn: async (): Promise<GroupEntry[]> => {
      // No FK from push_up_entries to profiles, so fetch cohort ids first.
      const { data: profs, error: profErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_test", isTest);
      if (profErr) throw profErr;
      const ids = (profs ?? []).map((p: any) => p.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("push_up_entries")
        .select("date, user_id, count")
        .in("user_id", ids)
        .gte("date", YEAR_START_ISO);
      if (error) throw error;
      return data ?? [];
    },
  });
};

/**
 * Profiles filtered to the viewer's cohort.
 */
export const useGroupProfiles = () => {
  const { isTest, isLoading: cohortLoading } = useViewerCohort();
  return useQuery({
    queryKey: ["group-profiles", isTest],
    enabled: !cohortLoading,
    staleTime: STALE_MS,
    queryFn: async (): Promise<GroupProfile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, yearly_goal, is_test")
        .eq("is_test", isTest);
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        id: p.id,
        display_name: p.display_name ?? null,
        avatar_url: p.avatar_url ?? null,
        yearly_goal: Number(p.yearly_goal) || 29930,
        is_test: !!p.is_test,
      }));
    },
  });
};

/**
 * Per-user aggregates, filtered to the viewer's cohort.
 */
export const useGroupUserProgress = () => {
  const { isTest, isLoading: cohortLoading } = useViewerCohort();
  return useQuery({
    queryKey: ["group-user-progress", isTest],
    enabled: !cohortLoading,
    staleTime: STALE_MS,
    queryFn: async (): Promise<GroupUserProgress[]> => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("is_test", isTest)
        .order("total_pushups", { ascending: false });
      if (error) throw error;
      return (data ?? []) as GroupUserProgress[];
    },
  });
};
