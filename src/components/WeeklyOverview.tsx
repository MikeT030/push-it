import { useMemo, useState } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, isSameDay, differenceInWeeks } from "date-fns";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePushUpData } from "@/hooks/usePushUpData";
const WEEKLY_TARGET = 82;
const YEAR_START = new Date(2026, 0, 1); // January 1, 2026

interface WeekOption {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  label: string;
}
const WeeklyOverview = () => {
  const {
    getEntryForDate,
    isLoaded
  } = usePushUpData();

  // Generate week options starting from Week 1 of 2026
  const weekOptions = useMemo((): WeekOption[] => {
    const today = new Date();
    const week1Start = startOfWeek(YEAR_START, {
      weekStartsOn: 1
    });
    const currentWeekStart = startOfWeek(today, {
      weekStartsOn: 1
    });
    const totalWeeks = Math.max(1, differenceInWeeks(currentWeekStart, week1Start) + 1);
    const weeks: WeekOption[] = [];
    for (let i = 0; i < totalWeeks; i++) {
      const weekStart = addWeeks(week1Start, i);
      const weekEnd = endOfWeek(weekStart, {
        weekStartsOn: 1
      });
      weeks.push({
        weekNumber: i + 1,
        startDate: weekStart,
        endDate: weekEnd,
        label: `Week ${i + 1} (${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")})`
      });
    }
    return weeks.reverse(); // Most recent first
  }, []);

  // Default to most recent (current) week
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const selectedWeek = weekOptions[selectedWeekIndex];

  // Get daily logs for selected week
  const weeklyData = useMemo(() => {
    if (!selectedWeek || !isLoaded) return {
      days: [],
      total: 0,
      percentage: 0
    };
    const days = eachDayOfInterval({
      start: selectedWeek.startDate,
      end: selectedWeek.endDate
    });
    const dailyLogs = days.map(day => ({
      date: day,
      count: getEntryForDate(day),
      isToday: isSameDay(day, new Date())
    }));
    const total = dailyLogs.reduce((sum, d) => sum + d.count, 0);
    const percentage = Math.min(Math.round(total / WEEKLY_TARGET * 100), 100);
    return {
      days: dailyLogs,
      total,
      percentage
    };
  }, [selectedWeek, getEntryForDate, isLoaded]);
  if (!isLoaded) {
    return <div className="bg-card rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/2 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted rounded" />)}
        </div>
      </div>;
  }
  return <div className="col-span-2 bg-card rounded-2xl p-6 animate-slide-up" style={{
    animationDelay: "0.25s"
  }}>
      <h2 className="text-lg font-bold text-foreground mb-4">Weekly overview</h2>

      {/* Week Selector Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 text-primary font-medium text-base mb-4 hover:opacity-80 transition-opacity">
            {selectedWeek?.label}
            <ChevronDown className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-card/80 backdrop-blur-sm border-border max-h-64 overflow-y-auto z-50" align="start">
          {weekOptions.map((week, index) => <DropdownMenuItem key={week.weekNumber} onClick={() => setSelectedWeekIndex(index)} className={`cursor-pointer ${index === selectedWeekIndex ? "bg-primary/10 text-primary" : ""}`}>
              {week.label}
            </DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Weekly Summary */}
      <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-xl">
        <div>
          <p className="text-2xl font-black text-foreground">{weeklyData.total}</p>
          <p className="text-sm text-muted-foreground">push-ups logged</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${weeklyData.percentage >= 100 ? "text-primary" : "text-foreground"}`}>
            {weeklyData.percentage}%
          </p>
          <p className="text-sm text-muted-foreground">of {WEEKLY_TARGET} target</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden mb-4">
        <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500" style={{
        width: `${weeklyData.percentage}%`
      }} />
      </div>

      {/* Daily Logs List */}
      <div className="space-y-2">
        {weeklyData.days.map(day => <div key={format(day.date, "yyyy-MM-dd")} className={`flex items-center justify-between py-2 px-3 rounded-lg ${day.isToday ? "bg-primary/10 border border-primary/20" : "bg-muted/30"}`}>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${day.isToday ? "text-primary" : "text-muted-foreground"}`}>
                {format(day.date, "EEE")}
              </span>
              <span className="text-sm text-muted-foreground">
                {format(day.date, "MMM d")}
              </span>
              {day.isToday && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                  Today
                </span>}
            </div>
            <span className={`font-bold ${day.count > 0 ? "text-foreground" : "text-muted-foreground"}`}>
              {day.count > 0 ? day.count : "—"}
            </span>
          </div>)}
      </div>
    </div>;
};
export default WeeklyOverview;