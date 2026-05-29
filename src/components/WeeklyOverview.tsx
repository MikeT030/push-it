import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, isSameDay } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePushUpData } from "@/hooks/usePushUpData";
import WeeklyBarChart from "./WeeklyBarChart";
const DAILY_TARGET = 82;
const YEAR_START = new Date(2026, 0, 1);

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const weekRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const weekOptions = useMemo((): WeekOption[] => {
    const today = new Date();
    const weeks: WeekOption[] = [];
    let weekStart = new Date(YEAR_START);
    let weekNumber = 1;
    while (weekStart <= today) {
      let weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      weeks.push({
        weekNumber,
        startDate: weekStart,
        endDate: weekEnd,
        label: `Week ${weekNumber} (${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")})`
      });
      weekStart = addWeeks(startOfWeek(weekEnd, { weekStartsOn: 1 }), 1);
      weekNumber++;
    }
    return weeks;
  }, []);

  // Default to current (last) week
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(weekOptions.length - 1);
  const selectedWeek = weekOptions[selectedWeekIndex];

  const scrollToCenter = useCallback((index: number) => {
    const container = scrollRef.current;
    const button = weekRefs.current.get(index);
    if (container && button) {
      const scrollLeft = button.offsetLeft - container.clientWidth / 2 + button.clientWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const currentIndex = weekOptions.length - 1;
    const attempts = [0, 100, 300, 500];
    attempts.forEach((delay) => {
      setTimeout(() => scrollToCenter(currentIndex), delay);
    });
  }, [weekOptions.length, scrollToCenter]);

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
    const weeklyTarget = countableDays.length * DAILY_TARGET;
    const percentage = weeklyTarget > 0 ? Math.round(total / weeklyTarget * 100) : 0;
    return { days: dailyLogs, total, percentage, weeklyTarget };
  }, [selectedWeek, getEntryForDate, isLoaded]);

  if (!isLoaded) {
    return <div className="bg-card rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/2 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted rounded" />)}
        </div>
      </div>;
  }
  return <Collapsible open={isOpen} onOpenChange={setIsOpen} className="col-span-2">
      <div className="rounded-2xl p-6 animate-slide-up" style={{
      animationDelay: "0.25s",
      background: "rgba(42,47,58,0.70)"
    }}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full text-left mb-4 hover:opacity-80 transition-opacity">
            <h2 className="text-lg font-bold text-foreground">Weekly</h2>
            {isOpen ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
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
      <div className="flex items-center justify-between mb-4 p-3" onClick={(e) => e.stopPropagation()}>
        <div>
          <p className="text-2xl font-black text-foreground">{weeklyData.total}</p>
          <p className="text-sm text-muted-foreground">PU logged</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">
            {weeklyData.percentage}%
          </p>
          <p className="text-sm text-muted-foreground">of {weeklyData.weeklyTarget} target</p>
        </div>
      </div>

      {/* Bar Chart */}
      <WeeklyBarChart days={weeklyData.days} dailyTarget={DAILY_TARGET} />

        <CollapsibleContent className="space-y-4">
          <div>
            {weeklyData.days.map((day, index) => (
              <div key={format(day.date, "yyyy-MM-dd")}>
                <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${day.isBeforeYearStart ? "opacity-40" : ""}`}>
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
                  <span className={`font-bold ${day.isBeforeYearStart ? "text-muted-foreground" : day.count > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                    {day.isBeforeYearStart ? "—" : day.count > 0 ? day.count : "—"}
                  </span>
                </div>
                {index < weeklyData.days.length - 1 && (
                  <div className="h-px mx-3" style={{ backgroundColor: "#575F78" }} />
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>;
};
export default WeeklyOverview;