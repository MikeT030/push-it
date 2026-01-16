import { useMemo, useState } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, isSameDay } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePushUpData } from "@/hooks/usePushUpData";
import WeeklyBarChart from "./WeeklyBarChart";

const DAILY_TARGET = 82; // 82 push-ups per day
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
  const [isOpen, setIsOpen] = useState(false);

  // Generate week options starting from January 1, 2026
  const weekOptions = useMemo((): WeekOption[] => {
    const today = new Date();
    const weeks: WeekOption[] = [];

    // Week 1 starts on January 1, 2026
    let weekStart = new Date(YEAR_START);
    let weekNumber = 1;
    while (weekStart <= today) {
      // Week ends on the following Sunday (or end of partial week)
      let weekEnd: Date;
      if (weekNumber === 1) {
        // First week: Jan 1 to the next Sunday
        weekEnd = endOfWeek(weekStart, {
          weekStartsOn: 1
        });
      } else {
        weekEnd = endOfWeek(weekStart, {
          weekStartsOn: 1
        });
      }
      weeks.push({
        weekNumber,
        startDate: weekStart,
        endDate: weekEnd,
        label: `Week ${weekNumber} (${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")})`
      });

      // Next week starts the day after this week ends
      weekStart = addWeeks(startOfWeek(weekEnd, {
        weekStartsOn: 1
      }), 1);
      weekNumber++;
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
      percentage: 0,
      weeklyTarget: 0
    };

    // Always show full week (Mon-Sun)
    const weekStart = startOfWeek(selectedWeek.startDate, {
      weekStartsOn: 1
    });
    const weekEnd = endOfWeek(selectedWeek.startDate, {
      weekStartsOn: 1
    });
    const allDays = eachDayOfInterval({
      start: weekStart,
      end: weekEnd
    });
    const dailyLogs = allDays.map(day => {
      const isBeforeYearStart = day < YEAR_START;
      return {
        date: day,
        count: isBeforeYearStart ? 0 : getEntryForDate(day),
        isToday: isSameDay(day, new Date()),
        isBeforeYearStart
      };
    });

    // Only count days from YEAR_START onwards for target
    const countableDays = dailyLogs.filter(d => !d.isBeforeYearStart);
    const total = countableDays.reduce((sum, d) => sum + d.count, 0);
    const weeklyTarget = countableDays.length * DAILY_TARGET;
    const percentage = weeklyTarget > 0 ? Math.round(total / weeklyTarget * 100) : 0;
    return {
      days: dailyLogs,
      total,
      percentage,
      weeklyTarget
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
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="col-span-2">
      <div className="bg-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "0.25s" }}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full text-left mb-4 hover:opacity-80 transition-opacity">
            <h2 className="text-lg font-bold text-foreground">Weekly</h2>
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
            <button className="flex items-center gap-2 text-primary font-medium text-base mb-4 hover:opacity-80 transition-opacity">
              {selectedWeek?.label}
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-card/80 backdrop-blur-sm border-border max-h-64 overflow-y-auto z-50" align="start">
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
      <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-xl">
        <div>
          <p className="text-[1.625rem] font-black text-foreground">{weeklyData.total}</p>
          <p className="text-sm text-muted-foreground">push-ups logged</p>
        </div>
        <div className="text-right">
          <p className="text-[1.625rem] font-bold text-white">
            {weeklyData.percentage}%
          </p>
          <p className="text-sm text-muted-foreground">of {weeklyData.weeklyTarget} target</p>
        </div>
      </div>

      {/* Bar Chart */}
      <WeeklyBarChart days={weeklyData.days} dailyTarget={DAILY_TARGET} />

        <CollapsibleContent className="space-y-2">
          {/* Daily Logs List */}
          {weeklyData.days.map(day => (
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
                <span className="text-sm text-muted-foreground">
                  {format(day.date, "MMM d")}
                </span>
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
                {day.isBeforeYearStart ? "—" : day.count > 0 ? day.count : "—"}
              </span>
            </div>
          ))}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
export default WeeklyOverview;