import { useState, useEffect, useCallback } from "react";
import { format, parseISO, startOfYear, differenceInDays, isAfter, startOfDay } from "date-fns";

interface PushUpEntry {
  date: string; // YYYY-MM-DD
  count: number;
}

interface UserData {
  name: string;
  entries: PushUpEntry[];
}

const STORAGE_KEY = "pushit_user_data";
const YEARLY_GOAL = 30000;
const DAILY_TARGET = 82;

const getDefaultUserData = (): UserData => ({
  name: "User",
  entries: [],
});

export const usePushUpData = () => {
  const [userData, setUserData] = useState<UserData>(getDefaultUserData);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUserData(JSON.parse(stored));
      } catch {
        setUserData(getDefaultUserData());
      }
    }
    setIsLoaded(true);
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    }
  }, [userData, isLoaded]);

  const getEntryForDate = useCallback(
    (date: Date): number => {
      const dateStr = format(date, "yyyy-MM-dd");
      const entry = userData.entries.find((e) => e.date === dateStr);
      return entry?.count ?? 0;
    },
    [userData.entries]
  );

  const setEntryForDate = useCallback((date: Date, count: number) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setUserData((prev) => {
      const existingIndex = prev.entries.findIndex((e) => e.date === dateStr);
      const newEntries = [...prev.entries];

      if (existingIndex >= 0) {
        if (count === 0) {
          newEntries.splice(existingIndex, 1);
        } else {
          newEntries[existingIndex] = { date: dateStr, count };
        }
      } else if (count > 0) {
        newEntries.push({ date: dateStr, count });
      }

      return { ...prev, entries: newEntries };
    });
  }, []);

  const getTotalPushUps = useCallback((): number => {
    return userData.entries.reduce((sum, entry) => sum + entry.count, 0);
  }, [userData.entries]);

  const getYearProgress = useCallback((): number => {
    const total = getTotalPushUps();
    return Math.min((total / YEARLY_GOAL) * 100, 100);
  }, [getTotalPushUps]);

  const getDailyProgress = useCallback(
    (date: Date): number => {
      const count = getEntryForDate(date);
      return Math.min((count / DAILY_TARGET) * 100, 100);
    },
    [getEntryForDate]
  );

  const getDaysWithEntries = useCallback((): string[] => {
    return userData.entries.map((e) => e.date);
  }, [userData.entries]);

  const setUserName = useCallback((name: string) => {
    setUserData((prev) => ({ ...prev, name }));
  }, []);

  const canEditDate = (date: Date): boolean => {
    const today = startOfDay(new Date());
    const targetDate = startOfDay(date);
    return !isAfter(targetDate, today);
  };

  return {
    userName: userData.name,
    setUserName,
    getEntryForDate,
    setEntryForDate,
    getTotalPushUps,
    getYearProgress,
    getDailyProgress,
    getDaysWithEntries,
    canEditDate,
    yearlyGoal: YEARLY_GOAL,
    dailyTarget: DAILY_TARGET,
    isLoaded,
  };
};
