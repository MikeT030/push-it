import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, isSameDay } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import WeeklyBarChart from "./WeeklyBarChart";

const DAILY_TARGET = 82; // 82 push-ups per day per person
const YEAR_START = new Date(2026, 0, 1); // January 1, 2026

interface WeekOption {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  label: string;
}

interface DailyGroupEntry {
  date: string;
  total_count: number;
}

const WeeklyGroupOverview = () => {
  const [dailyTotals, setDailyTotals] = useState<DailyGroupEntry[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const weekRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      // Fetch all push up entries grouped by date
      const { data: entries } = await supabase.
      from("push_up_entries").
      select("date, count");

      if (entries) {
        // Group by date and sum counts
        const dailyMap = new Map<string, number>();
        entries.forEach((entry) => {
          const current = dailyMap.get(entry.date) || 0;
          dailyMap.set(entry.date, current + entry.count);
        });

        const totals: DailyGroupEntry[] = Array.from(dailyMap.entries()).map(([date, total_count]) => ({
          date,
          total_count
        }));
        setDailyTotals(totals);
      }

      // Fetch member count (users with 82+ push-ups)
      const { data: users } = await supabase.
      from("user_progress").
      select("user_id, total_pushups");

      if (users) {
        const activeMembers = users.filter((u) => u.total_pushups >= 82).length;
        setMemberCount(activeMembers);
      }

      setIsLoaded(true);
    };

    fetchGroupData();
  }, []);

  // Generate week options starting from January 1, 2026
  const weekOptions = useMemo((): WeekOption[] => {
    const today = new Date();
    const weeks: WeekOption[] = [];

    let weekStart = new Date(YEAR_START);
    let weekNumber = 1;
    while (weekStart <= today) {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      weeks.push({
        weekNumber,
        startDate: weekStart,
        endDate: weekEnd,
        label: `Week ${weekNumber} (${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")})`
      });

      weekStart = addWeeks(startOfWeek(weekEnd, { weekStartsOn: 1 }), 1);
      weekNumber++;
    }
    return weeks; // Oldest first, newest last (left to right)
  }, []);

  // Set default to current week (last item) once weekOptions is ready
  useEffect(() => {
    if (weekOptions.length > 0 && selectedWeekIndex === -1) {
      setSelectedWeekIndex(weekOptions.length - 1);
    }
  }, [weekOptions, selectedWeekIndex]);

  const selectedWeek = selectedWeekIndex >= 0 ? weekOptions[selectedWeekIndex] : weekOptions[weekOptions.length - 1];

  // Scroll to center the selected week
  const scrollToCenter = useCallback((index: number, smooth = true) => {
    const container = scrollRef.current;
    const el = weekRefs.current.get(index);
    if (!container || !el) return;
    const containerWidth = container.offsetWidth;
    const elLeft = el.offsetLeft;
    const elWidth = el.offsetWidth;
    container.scrollTo({
      left: elLeft - containerWidth / 2 + elWidth / 2,
      behavior: smooth ? "smooth" : "instant"
    });
  }, []);

  // Center selected week on mount/visibility
  useEffect(() => {
    if (selectedWeekIndex >= 0) {
      const attemptScroll = () => scrollToCenter(selectedWeekIndex, false);
      const t1 = setTimeout(attemptScroll, 50);
      const t2 = setTimeout(attemptScroll, 200);
      const t3 = setTimeout(attemptScroll, 500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [scrollToCenter, selectedWeekIndex]);

  const getEntryForDate = (date: Date): number => {
    const dateStr = format(date, "yyyy-MM-dd");
    const entry = dailyTotals.find((e) => e.date === dateStr);
    return entry?.total_count ?? 0;
  };

  // Get weekly data for selected week
  const weeklyData = useMemo(() => {
    if (!selectedWeek || !isLoaded) return {
      days: [],
      total: 0,
      percentage: 0,
      weeklyTarget: 0
    };

    const weekStart = startOfWeek(selectedWeek.startDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedWeek.startDate, { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const dailyLogs = allDays.map((day) => {
      const isBeforeYearStart = day < YEAR_START;
      return {
        date: day,
        count: isBeforeYearStart ? 0 : getEntryForDate(day),
        isToday: isSameDay(day, new Date()),
        isBeforeYearStart
      };
    });

    const countableDays = dailyLogs.filter((d) => !d.isBeforeYearStart);
    const total = countableDays.reduce((sum, d) => sum + d.count, 0);
    // Target is per member per day * members * days
    const weeklyTarget = countableDays.length * DAILY_TARGET * Math.max(memberCount, 1);
    const percentage = weeklyTarget > 0 ? Math.round(total / weeklyTarget * 100) : 0;

    return {
      days: dailyLogs,
      total,
      percentage,
      weeklyTarget
    };
  }, [selectedWeek, dailyTotals, isLoaded, memberCount]);

  if (!isLoaded) {
    return (
      <div className="bg-card rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/2 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) =>
          <div key={i} className="h-10 bg-muted rounded" />
          )}
        </div>
      </div>);

  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card/40 rounded-2xl p-6 animate-slide-up pt-[10px] pb-[10px] mb-[10px]" style={{ animationDelay: "0.15s" }}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity mb-[6px] mt-[10px]">
            <h2 className="text-lg font-bold text-foreground">Weekly We Push</h2>
            {isOpen ?
            <ChevronDown className="w-5 h-5 text-muted-foreground" /> :

            <ChevronRight className="w-5 h-5 text-muted-foreground" />
            }
          </button>
        </CollapsibleTrigger>

        <div className="h-px mb-4 bg-[#3b404f]" />

        {/* Horizontally Scrollable Week Selector */}
        <div
          ref={scrollRef}
          data-horizontal-scroll
          className="flex gap-2 overflow-x-auto mb-4 scrollbar-hide -mx-2 px-2 pb-[2px] pt-[2px]"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {weekOptions.map((week, index) => {
            const isSelected = index === selectedWeekIndex;
            return (
              <button
                key={week.weekNumber}
                ref={(el) => {
                  if (el) weekRefs.current.set(index, el);
                }}
                onClick={() => {
                  if (index === selectedWeekIndex) {
                    setIsOpen((prev) => !prev);
                  } else {
                    setSelectedWeekIndex(index);
                    scrollToCenter(index);
                    setIsOpen(true);
                  }
                }}
                style={{
                  background: `rgba(42,47,58,0.70)`,
                  boxShadow: [
                    'inset 0 2px 4px rgba(0,0,0,0.3)',
                    'inset 0 -1px 2px rgba(255,255,255,0.05)',
                    'inset 0 0 0 1px rgba(255,255,255,0.06)',
                    '0 1px 2px rgba(0,0,0,0.25)',
                  ].join(', '),
                }}
                className={`relative overflow-hidden flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 ease-out active:translate-y-[1px] active:scale-[0.98] ${
                  isSelected ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {`Wk ${week.weekNumber} · ${format(week.startDate, "MMM d")}`}
              </button>
            );
          })}
        </div>

        {/* Weekly Summary */}
        <div className="flex items-center justify-between p-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsOpen((prev) => !prev)}>
          <div>
            <p className="font-black text-foreground text-xl">{weeklyData.total.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Push-Ups</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-white text-xl">
              {weeklyData.percentage}%
            </p>
            <p className="text-sm text-muted-foreground">of {weeklyData.weeklyTarget.toLocaleString()} target</p>
          </div>
        </div>

        {/* Bar Chart */}
        <WeeklyBarChart days={weeklyData.days} dailyTarget={DAILY_TARGET * Math.max(memberCount, 1)} />

        <CollapsibleContent className="space-y-4">

          {/* Daily Logs List */}
          <div>
            {weeklyData.days.map((day, index) => (
              <div key={format(day.date, "yyyy-MM-dd")}>
                <div
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    day.isBeforeYearStart
                      ? "opacity-40"
                      : day.isToday
                        ? ""
                        : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium w-9 text-left ${day.isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {format(day.date, "EEE")}
                    </span>
                    <span className="text-sm text-muted-foreground w-5 text-left">{format(day.date, "d")}</span>
                    <span className="text-sm text-muted-foreground w-8 text-left">{format(day.date, "MMM")}</span>
                    {day.isToday && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium -ml-1">
                        Today
                      </span>
                    )}
                  </div>
                  <span
                    className={`font-bold ${
                      day.isBeforeYearStart ? "text-muted-foreground" : day.count > 0 ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {day.isBeforeYearStart ? "—" : day.count > 0 ? day.count.toLocaleString() : "—"}
                  </span>
                </div>
                {index < weeklyData.days.length - 1 && (
                  <div className="h-px mx-3" style={{ backgroundColor: "#575F78" }} />
                )}
              </div>
            ))}
          </div>

          {/* Member count note */}
          <p className="text-xs text-muted-foreground text-center">
            Based on {memberCount} active {memberCount === 1 ? "member" : "members"} (82+ push-ups)
          </p>
        </CollapsibleContent>
      </div>
    </Collapsible>);

};

export default WeeklyGroupOverview;