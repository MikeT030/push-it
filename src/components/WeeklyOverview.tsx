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
      <div className="bg-card/40 rounded-2xl p-6 animate-slide-up pt-[10px] mb-[10px] px-[10px] border border-[#3B404F] pb-[12px]" style={{
      animationDelay: "0.25s"
    }}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity mb-[6px] px-[10px] rounded-2xl border-0 py-0 pt-0 pb-0 mt-0">
            <h2 className="text-lg text-foreground font-semibold">Weekly</h2>
            {isOpen ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
          </button>
        </CollapsibleTrigger>

        <div className="h-px mb-6 mx-[10px] bg-[#3b404f]" />

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
                  background:
                    'radial-gradient(circle at 50% 55%, rgba(42,47,58,0.55) 0%, rgba(31,36,46,0.45) 60%, rgba(22,26,34,0.35) 100%)',
                  backdropFilter: 'blur(6px) saturate(1.2)',
                  WebkitBackdropFilter: 'blur(6px) saturate(1.2)',
                  boxShadow: [
                    'inset 0 2px 4px rgba(0,0,0,0.55)',
                    'inset 0 -1px 2px rgba(255,255,255,0.07)',
                    'inset 0 0 0 1px rgba(255,255,255,0.06)',
                    '0 2px 6px rgba(0,0,0,0.3)',
                    '0 6px 14px rgba(0,0,0,0.25)',
                  ].join(', '),
                }}
                className={`relative overflow-hidden flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 ease-out active:translate-y-[1px] active:scale-[0.98] ${
                  isSelected ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span
                  className="pointer-events-none absolute inset-x-[18%] top-[10%] h-[18%] rounded-full opacity-30"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)',
                    filter: 'blur(3px)',
                  }}
                />
                <span className="relative">{`Wk ${week.weekNumber} · ${format(week.startDate, "MMM d")}`}</span>
              </button>
            );
          })}
        </div>

      {/* Weekly Summary */}
      <div className="flex items-center justify-between px-[10px] pt-[10px] pb-[10px] mb-[16px]" onClick={(e) => e.stopPropagation()}>
        <div>
          <p className="font-black text-foreground text-xl">{weeklyData.total}</p>
          <p className="text-sm text-muted-foreground">PU logged</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-white text-xl">
            {weeklyData.percentage}%
          </p>
          <p className="text-sm text-muted-foreground">of {weeklyData.weeklyTarget} target</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="mx-[10px]">
        <WeeklyBarChart days={weeklyData.days} dailyTarget={DAILY_TARGET} />
      </div>

        <CollapsibleContent className="space-y-4">
          <div>
            {weeklyData.days.map((day, index) => (
              <div key={format(day.date, "yyyy-MM-dd")}>
                <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${day.isBeforeYearStart ? "opacity-40" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium w-9 text-left ${day.isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {format(day.date, "EEE")}
                    </span>
                    <span className="text-sm text-muted-foreground w-5 text-left">{format(day.date, "d")}</span>
                    <span className="text-sm text-muted-foreground w-8 text-left">{format(day.date, "MMM")}</span>
                    {day.isToday && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium -ml-1">
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