import { useMemo, useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, isSameDay } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";

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

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      // Fetch all push up entries grouped by date
      const { data: entries } = await supabase
        .from("push_up_entries")
        .select("date, count");

      if (entries) {
        // Group by date and sum counts
        const dailyMap = new Map<string, number>();
        entries.forEach((entry) => {
          const current = dailyMap.get(entry.date) || 0;
          dailyMap.set(entry.date, current + entry.count);
        });
        
        const totals: DailyGroupEntry[] = Array.from(dailyMap.entries()).map(([date, total_count]) => ({
          date,
          total_count,
        }));
        setDailyTotals(totals);
      }

      // Fetch member count (users with 82+ push-ups)
      const { data: users } = await supabase
        .from("user_progress")
        .select("user_id, total_pushups");
      
      if (users) {
        const activeMembers = users.filter(u => u.total_pushups >= 82).length;
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
        label: `Week ${weekNumber} (${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")})`,
      });

      weekStart = addWeeks(startOfWeek(weekEnd, { weekStartsOn: 1 }), 1);
      weekNumber++;
    }
    return weeks.reverse();
  }, []);

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const selectedWeek = weekOptions[selectedWeekIndex];

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
      weeklyTarget: 0,
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
        isBeforeYearStart,
      };
    });

    const countableDays = dailyLogs.filter((d) => !d.isBeforeYearStart);
    const total = countableDays.reduce((sum, d) => sum + d.count, 0);
    // Target is per member per day * members * days
    const weeklyTarget = countableDays.length * DAILY_TARGET * Math.max(memberCount, 1);
    const percentage = weeklyTarget > 0 ? Math.round((total / weeklyTarget) * 100) : 0;

    return {
      days: dailyLogs,
      total,
      percentage,
      weeklyTarget,
    };
  }, [selectedWeek, dailyTotals, isLoaded, memberCount]);

  if (!isLoaded) {
    return (
      <div className="bg-card rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/2 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full text-left mb-4 hover:opacity-80 transition-opacity">
            <h2 className="text-lg font-bold text-foreground">Weekly Group</h2>
            {isOpen ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        {/* Week Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 text-primary font-medium text-base hover:opacity-80 transition-opacity mb-4">
              {selectedWeek?.label}
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="bg-card/80 backdrop-blur-sm border-border max-h-64 overflow-y-auto z-50"
            align="start"
          >
            {weekOptions.map((week, index) => (
              <DropdownMenuItem
                key={week.weekNumber}
                onClick={() => setSelectedWeekIndex(index)}
                className={`cursor-pointer ${index === selectedWeekIndex ? "bg-primary/10 text-primary" : ""}`}
              >
                {week.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Weekly Summary */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl mb-4">
          <div>
            <p className="text-2xl font-black text-foreground">{weeklyData.total.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">group push-ups</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">
              {weeklyData.percentage}%
            </p>
            <p className="text-sm text-muted-foreground">of {weeklyData.weeklyTarget.toLocaleString()} target</p>
          </div>
        </div>

        {/* Progress bar with overflow */}
        <div className="h-2 bg-muted rounded-full overflow-hidden relative mb-4">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500 absolute left-0 top-0"
            style={{ width: `${Math.min(weeklyData.percentage, 100)}%` }}
          />
          {weeklyData.percentage > 100 && (
            <div
              className="h-full rounded-full transition-all duration-500 absolute left-0 top-0"
              style={{
                width: `${Math.min(weeklyData.percentage, 200)}%`,
                background:
                  weeklyData.percentage >= 200
                    ? "linear-gradient(to right, #C029DE, #C029DE99)"
                    : "linear-gradient(to right, hsl(var(--overflow)), hsl(var(--overflow) / 0.6))",
              }}
            />
          )}
        </div>

        <CollapsibleContent className="space-y-4">

          {/* Daily Logs List */}
          <div className="space-y-2">
            {weeklyData.days.map((day) => (
              <div
                key={format(day.date, "yyyy-MM-dd")}
                className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                  day.isBeforeYearStart
                    ? "opacity-40"
                    : day.isToday
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${day.isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {format(day.date, "EEE")}
                  </span>
                  <span className="text-sm text-muted-foreground">{format(day.date, "MMM d")}</span>
                  {day.isToday && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
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
            ))}
          </div>

          {/* Member count note */}
          <p className="text-xs text-muted-foreground text-center">
            Based on {memberCount} active {memberCount === 1 ? "member" : "members"} (82+ push-ups)
          </p>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default WeeklyGroupOverview;
