import { useState, useEffect, useCallback } from "react";
import { format, parseISO, startOfDay, isAfter, subDays, eachDayOfInterval, startOfYear, differenceInDays } from "date-fns";
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

const DEFAULT_YEARLY_GOAL = 30000;

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

export const usePushUpData = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PushUpEntry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const yearlyGoal = profile?.yearly_goal ?? DEFAULT_YEARLY_GOAL;
  const dailyTarget = Math.round(yearlyGoal / 365);

  // Load data from database
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setProfile(null);
      setIsLoaded(true);
      return;
    }

    const loadData = async () => {
      // Run both queries in parallel instead of sequentially
      const [profileRes, entriesRes] = await Promise.all([
        supabase.from("profiles").select("yearly_goal").eq("id", user.id).maybeSingle(),
        supabase.from("push_up_entries").select("date, count").eq("user_id", user.id),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (entriesRes.data) {
        setEntries(entriesRes.data.map(e => ({ date: e.date, count: e.count })));
      }

      setIsLoaded(true);
    };

    loadData();
  }, [user]);

  const getEntryForDate = useCallback(
    (date: Date): number => {
      const dateStr = format(date, "yyyy-MM-dd");
      const entry = entries.find((e) => e.date === dateStr);
      return entry?.count ?? 0;
    },
    [entries]
  );

  const setEntryForDate = useCallback(async (date: Date, count: number) => {
    if (!user) return;

    // Defence-in-depth: clamp to match server CHECK constraint (0-9999)
    count = Math.max(0, Math.min(9999, Math.floor(Number(count) || 0)));

    const dateStr = format(date, "yyyy-MM-dd");

    // Optimistic update
    setEntries((prev) => {
      const existingIndex = prev.findIndex((e) => e.date === dateStr);
      const newEntries = [...prev];

      if (existingIndex >= 0) {
        if (count === 0) {
          newEntries.splice(existingIndex, 1);
        } else {
          newEntries[existingIndex] = { date: dateStr, count };
        }
      } else if (count > 0) {
        newEntries.push({ date: dateStr, count });
      }

      return newEntries;
    });

    // Persist to database
    if (count === 0) {
      const { error } = await supabase
        .from("push_up_entries")
        .delete()
        .eq("user_id", user.id)
        .eq("date", dateStr);
      
      if (error) {
        toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      } else {
        scheduleSaveToast(dateStr, 0, date, true);
      }
    } else {
      const { error } = await supabase
        .from("push_up_entries")
        .upsert({
          user_id: user.id,
          date: dateStr,
          count,
        }, { onConflict: "user_id,date" });
      
      if (error) {
        toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      } else {
        scheduleSaveToast(dateStr, count, date, false);
      }
    }
  }, [user]);

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

  // Statistics functions
  const getCurrentStreak = useCallback((): number => {
    const today = new Date();
    let streak = 0;
    let checkDate = today;

    // If today has no entry yet, don't break the streak — the day isn't over
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
    
    // Convert push-ups behind to days behind
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

  const setYearlyGoal = useCallback(async (newGoal: number) => {
    if (!user) return;

    // Defence-in-depth: server enforces yearly_goal > 0
    const safeGoal = Math.max(1, Math.floor(Number(newGoal) || DEFAULT_YEARLY_GOAL));

    setProfile(prev => prev ? { ...prev, yearly_goal: safeGoal } : { yearly_goal: safeGoal });

    await supabase
      .from("profiles")
      .update({ yearly_goal: safeGoal })
      .eq("id", user.id);
  }, [user]);

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
    // New statistics
    getCurrentStreak,
    getDaysBehindSchedule,
    getWeeklyAverage,
    getMaxSingleDay,
    setYearlyGoal,
  };
};
