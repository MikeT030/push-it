import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
}

export interface GroupUserProgress {
  user_id: string;
  display_name: string | null;
  total_pushups: number;
  yearly_goal: number;
  progress_percent: number;
  days_logged: number;
}

/**
 * All push-up entries for the current year, shared across the group views.
 * Scoped server-side so we don't pull the entire table on every mount.
 */
export const useGroupEntries = () =>
  useQuery({
    queryKey: ["group-entries", YEAR_START_ISO],
    staleTime: STALE_MS,
    queryFn: async (): Promise<GroupEntry[]> => {
      const { data, error } = await supabase
        .from("push_up_entries")
        .select("date, user_id, count")
        .gte("date", YEAR_START_ISO);
      if (error) throw error;
      return data ?? [];
    },
  });

/**
 * All profiles, shared across the group views. Small table, fully cached.
 */
export const useGroupProfiles = () =>
  useQuery({
    queryKey: ["group-profiles"],
    staleTime: STALE_MS,
    queryFn: async (): Promise<GroupProfile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, yearly_goal");
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        id: p.id,
        display_name: p.display_name ?? null,
        avatar_url: p.avatar_url ?? null,
        yearly_goal: Number(p.yearly_goal) || 29930,
      }));
    },
  });

/**
 * Aggregated per-user totals (view). Shared across group views / leaderboard.
 */
export const useGroupUserProgress = () =>
  useQuery({
    queryKey: ["group-user-progress"],
    staleTime: STALE_MS,
    queryFn: async (): Promise<GroupUserProgress[]> => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .order("total_pushups", { ascending: false });
      if (error) throw error;
      return (data ?? []) as GroupUserProgress[];
    },
  });
