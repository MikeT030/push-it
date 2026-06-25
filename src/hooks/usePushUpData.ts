import { useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, startOfDay, isAfter, subDays, eachDayOfInterval, startOfYear, endOfYear, differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface PushUpEntry {
  date: string; // YYYY-MM-DD
  count: number;
}

interface Profile {
  yearly_goal: number;
}

interface UserData {
  profile: Profile | null;
  entries: PushUpEntry[];
}

const DEFAULT_YEARLY_GOAL = 30000;
const STALE_MS = 60_000;
const WRITE_DEBOUNCE_MS = 600;

// Debounced toast tracker: shows a single toast 1s after the last update per date
const saveToastTimers = new Map<string, ReturnType<typeof setTimeout>>();
const saveToastLatest = new Map<string, { count: number; date: Date; cleared: boolean }>();
const SAVE_TOAST_DELAY = 1000;

const scheduleSaveToast = (dateStr: string, count: number, date: Date, cleared: boolean) => {
  saveToastLatest.set(dateStr, { count, date, cleared });
  const existing = saveToastTimers.get(dateStr);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    const latest = saveToastLatest.get(dateStr);
    saveToastTimers.delete(dateStr);
    saveToastLatest.delete(dateStr);
    if (!latest) return;
    if (latest.cleared) {
      toast({ title: "Entry cleared", description: `Removed push-ups for ${format(latest.date, "MMM d")}` });
    } else {
      toast({ title: "Saved!", description: `${latest.count} push-ups recorded for ${format(latest.date, "MMM d")}` });
    }
  }, SAVE_TOAST_DELAY);
  saveToastTimers.set(dateStr, timer);
};

// Per-user debounced write queue. Module-level so writes survive component
// unmount (e.g. route change immediately after tapping +10).
type PendingWrite = {
  count: number;
  date: Date;
  timer: ReturnType<typeof setTimeout> | null;
};
const pendingWrites = new Map<string, PendingWrite>(); // key: `${userId}|${dateStr}`

const persistWrite = async (userId: string, dateStr: string) => {
  const key = `${userId}|${dateStr}`;
  const pending = pendingWrites.get(key);
  if (!pending) return;
  pendingWrites.delete(key);

  const { count, date } = pending;
  if (count === 0) {
    const { error } = await supabase
      .from("push_up_entries")
      .delete()
      .eq("user_id", userId)
      .eq("date", dateStr);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      scheduleSaveToast(dateStr, 0, date, true);
    }
  } else {
    const { error } = await supabase
      .from("push_up_entries")
      .upsert(
        { user_id: userId, date: dateStr, count },
        { onConflict: "user_id,date" }
      );
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      scheduleSaveToast(dateStr, count, date, false);
    }
  }
};

const flushAllForUser = async (userId: string) => {
  const keys = Array.from(pendingWrites.keys()).filter(k => k.startsWith(`${userId}|`));
  await Promise.all(
    keys.map(k => {
      const p = pendingWrites.get(k);
      if (p?.timer) clearTimeout(p.timer);
      if (p) p.timer = null;
      const dateStr = k.slice(userId.length + 1);
      return persistWrite(userId, dateStr);
    })
  );
};

export const usePushUpData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["push-up-data", userId],
    enabled: !!userId,
    staleTime: STALE_MS,
    queryFn: async (): Promise<UserData> => {
      const [profileRes, entriesRes] = await Promise.all([
        supabase.from("profiles").select("yearly_goal").eq("id", userId!).maybeSingle(),
        supabase.from("push_up_entries").select("date, count").eq("user_id", userId!),
      ]);
      return {
        profile: profileRes.data ?? null,
        entries: (entriesRes.data ?? []).map(e => ({ date: e.date, count: e.count })),
      };
    },
  });

  const entries = data?.entries ?? [];
  const profile = data?.profile ?? null;
  const yearlyGoal = profile?.yearly_goal ?? DEFAULT_YEARLY_GOAL;
  const dailyTarget = Math.round(yearlyGoal / 365);
  const isLoaded = !userId ? true : !isLoading;

  // Flush pending writes on hide / unload so we never lose taps
  useEffect(() => {
    if (!userId) return;
    const onHide = () => { flushAllForUser(userId); };
    window.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [userId]);

  const getEntryForDate = useCallback(
    (date: Date): number => {
      const dateStr = format(date, "yyyy-MM-dd");
      const entry = entries.find((e) => e.date === dateStr);
      return entry?.count ?? 0;
    },
    [entries]
  );

  const setEntryForDate = useCallback(async (date: Date, count: number) => {
    if (!userId) return;

    // Defence-in-depth: clamp to match server CHECK constraint (0-9999)
    count = Math.max(0, Math.min(9999, Math.floor(Number(count) || 0)));
    const dateStr = format(date, "yyyy-MM-dd");

    // Optimistic cache update — all subscribers see new value immediately
    queryClient.setQueryData<UserData>(["push-up-data", userId], (prev) => {
      const base: UserData = prev ?? { profile, entries: [] };
      const existingIndex = base.entries.findIndex((e) => e.date === dateStr);
      const newEntries = [...base.entries];
      if (existingIndex >= 0) {
        if (count === 0) newEntries.splice(existingIndex, 1);
        else newEntries[existingIndex] = { date: dateStr, count };
      } else if (count > 0) {
        newEntries.push({ date: dateStr, count });
      }
      return { ...base, entries: newEntries };
    });

    // Debounce the network write — coalesce rapid taps into one upsert
    const key = `${userId}|${dateStr}`;
    const existing = pendingWrites.get(key);
    if (existing?.timer) clearTimeout(existing.timer);
    const entry: PendingWrite = { count, date, timer: null };
    entry.timer = setTimeout(() => {
      persistWrite(userId, dateStr).then(() => {
        // Refresh group/leaderboard caches that depend on this user's entries
        queryClient.invalidateQueries({ queryKey: ["group-entries"] });
        queryClient.invalidateQueries({ queryKey: ["group-user-progress"] });
      });
    }, WRITE_DEBOUNCE_MS);
    pendingWrites.set(key, entry);
  }, [userId, queryClient, profile]);

  const getTotalPushUps = useCallback((): number => {
    return entries.reduce((sum, entry) => sum + entry.count, 0);
  }, [entries]);

  const getYearProgress = useCallback((): number => {
    const total = getTotalPushUps();
    return Math.min((total / yearlyGoal) * 100, 100);
  }, [getTotalPushUps, yearlyGoal]);

  const getDailyProgress = useCallback(
    (date: Date): number => {
      const count = getEntryForDate(date);
      return (count / dailyTarget) * 100;
    },
    [getEntryForDate, dailyTarget]
  );

  const getDaysWithEntries = useCallback((): string[] => {
    return entries.map((e) => e.date);
  }, [entries]);

  const canEditDate = (date: Date): boolean => {
    const today = startOfDay(new Date());
    const targetDate = startOfDay(date);
    return !isAfter(targetDate, today);
  };

  const getCurrentStreak = useCallback((): number => {
    const today = new Date();
    let streak = 0;
    let checkDate = today;

    if (getEntryForDate(checkDate) > 0) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      checkDate = subDays(checkDate, 1);
    }

    while (true) {
      const count = getEntryForDate(checkDate);
      if (count > 0) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    return streak;
  }, [getEntryForDate]);

  const getDaysBehindSchedule = useCallback((): number => {
    const today = new Date();
    const yearStart = startOfYear(today);
    const daysElapsed = differenceInDays(today, yearStart) + 1;
    const expectedByNow = Math.round((daysElapsed / 365) * yearlyGoal);
    const total = getTotalPushUps();
    const behind = expectedByNow - total;
    if (behind <= 0) return 0;
    return Math.ceil(behind / dailyTarget);
  }, [getTotalPushUps, yearlyGoal, dailyTarget]);

  const getWeeklyAverage = useCallback((): number => {
    const today = new Date();
    const last7Days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today,
    });
    const last7Total = last7Days.reduce((sum, day) => sum + getEntryForDate(day), 0);
    return Math.round(last7Total / 7);
  }, [getEntryForDate]);

  const getMaxSingleDay = useCallback((): number => {
    if (entries.length === 0) return 0;
    return Math.max(...entries.map((e) => e.count));
  }, [entries]);

  const getGoalCompletionDate = useCallback((): Date | null => {
    const sorted = [...entries].sort(
      (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
    );
    let cumulative = 0;
    for (const entry of sorted) {
      cumulative += entry.count;
      if (cumulative >= yearlyGoal) {
        return parseISO(entry.date);
      }
    }
    return null;
  }, [entries, yearlyGoal]);

  const setYearlyGoal = useCallback(async (newGoal: number) => {
    if (!userId) return;
    const safeGoal = Math.max(1, Math.floor(Number(newGoal) || DEFAULT_YEARLY_GOAL));

    queryClient.setQueryData<UserData>(["push-up-data", userId], (prev) => {
      const base: UserData = prev ?? { profile: null, entries: [] };
      return { ...base, profile: { ...(base.profile ?? {}), yearly_goal: safeGoal } };
    });

    await supabase
      .from("profiles")
      .update({ yearly_goal: safeGoal })
      .eq("id", userId);
  }, [userId, queryClient]);

  return {
    getEntryForDate,
    setEntryForDate,
    getTotalPushUps,
    getYearProgress,
    getDailyProgress,
    getDaysWithEntries,
    canEditDate,
    yearlyGoal,
    dailyTarget,
    isLoaded,
    getCurrentStreak,
    getDaysBehindSchedule,
    getWeeklyAverage,
    getMaxSingleDay,
    getGoalCompletionDate,
    setYearlyGoal,
  };
};
