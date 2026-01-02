import { useState, useEffect, useCallback } from "react";
import { format, startOfDay, isAfter, subDays, eachDayOfInterval, startOfYear, differenceInDays } from "date-fns";
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

export const usePushUpData = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PushUpEntry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const yearlyGoal = profile?.yearly_goal ?? DEFAULT_YEARLY_GOAL;
  const dailyTarget = Math.ceil(yearlyGoal / 365);

  // Load data from database
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setProfile(null);
      setIsLoaded(true);
      return;
    }

    const loadData = async () => {
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("yearly_goal")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      // Load entries
      const { data: entriesData } = await supabase
        .from("push_up_entries")
        .select("date, count")
        .eq("user_id", user.id);

      if (entriesData) {
        setEntries(entriesData.map(e => ({ date: e.date, count: e.count })));
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
        toast({ title: "Entry cleared", description: `Removed push-ups for ${format(date, "MMM d")}` });
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
        toast({ title: "Saved!", description: `${count} push-ups recorded for ${format(date, "MMM d")}` });
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
      return Math.min((count / dailyTarget) * 100, 100);
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

  const setYearlyGoal = useCallback(async (newGoal: number) => {
    if (!user) return;

    setProfile(prev => prev ? { ...prev, yearly_goal: newGoal } : { yearly_goal: newGoal });

    await supabase
      .from("profiles")
      .update({ yearly_goal: newGoal })
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
    setYearlyGoal,
  };
};
