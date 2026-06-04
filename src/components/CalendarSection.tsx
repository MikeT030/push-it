import { useState, useEffect, useMemo, useRef } from "react";
import { format, addMonths, subMonths, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isFuture, startOfDay, isSameMonth } from "date-fns";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { usePushUpData } from "@/hooks/usePushUpData";

const CalendarSection = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date());
  const miniScrollRef = useRef<HTMLDivElement>(null);

  const {
    getEntryForDate,
    getDailyProgress,
    isLoaded,
  } = usePushUpData();

  const miniDays = useMemo(() => {
    const today = new Date();
    const days: Date[] = [];
    for (let i = 364; i >= 0; i--) days.push(subDays(today, i));
    return days;
  }, []);

  const scrollMiniToDate = (date: Date) => {
    const el = miniScrollRef.current;
    if (!el) return;
    const idx = miniDays.findIndex((d) => isSameDay(d, date));
    if (idx < 0) return;
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;
    el.scrollLeft = child.offsetLeft + child.offsetWidth - el.clientWidth;
  };

  useEffect(() => {
    if (miniScrollRef.current) {
      miniScrollRef.current.scrollLeft = miniScrollRef.current.scrollWidth;
    }
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (isCalendarOpen) scrollMiniToDate(selectedDate);
  }, [selectedDate, isCalendarOpen, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isCalendarOpen) {
      setSelectedDate(new Date());
      requestAnimationFrame(() => {
        if (miniScrollRef.current) {
          miniScrollRef.current.scrollLeft = miniScrollRef.current.scrollWidth;
        }
      });
    }
  }, [isCalendarOpen, isLoaded]);

  useEffect(() => {
    const el = miniScrollRef.current;
    if (!el) return;
    const updateVisibleMonth = () => {
      const children = Array.from(el.children) as HTMLElement[];
      if (children.length === 0) return;
      const centerX = el.scrollLeft + el.clientWidth / 2;
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < children.length; i++) {
        const c = children[i];
        const mid = c.offsetLeft + c.offsetWidth / 2;
        const d = Math.abs(mid - centerX);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      const day = miniDays[bestIdx];
      if (day) {
        setVisibleMonth((prev) => isSameMonth(prev, day) ? prev : day);
        setCurrentMonth((prev) => isSameMonth(prev, day) ? prev : day);
      }
    };
    updateVisibleMonth();
    el.addEventListener("scroll", updateVisibleMonth, { passive: true });
    return () => el.removeEventListener("scroll", updateVisibleMonth);
  }, [miniDays, isLoaded]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const firstDayOfWeek = (monthStart.getDay() + 6) % 7;

    const prevMonthEnd = endOfMonth(subMonths(currentMonth, 1));
    const prevDays: Date[] = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(prevMonthEnd);
      d.setDate(prevMonthEnd.getDate() - i);
      prevDays.push(d);
    }

    const currentDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const totalSoFar = prevDays.length + currentDays.length;
    const remaining = totalSoFar % 7 === 0 ? 0 : 7 - totalSoFar % 7;
    const nextMonthStart = startOfMonth(addMonths(currentMonth, 1));
    const nextDays: Date[] = [];
    for (let i = 0; i < remaining; i++) {
      const d = new Date(nextMonthStart);
      d.setDate(nextMonthStart.getDate() + i);
      nextDays.push(d);
    }

    return [...prevDays, ...currentDays, ...nextDays];
  }, [currentMonth]);

  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

  if (!isLoaded) return null;

  return (
    <>
      {/* Mini Calendar */}
      <button
        onClick={() => setIsCalendarOpen((v) => !v)}
        className={`w-full card-glass rounded-2xl p-3 pt-6 pb-8 animate-slide-up transition-all duration-300 ease-out hover:opacity-90 px-[10px] ${isCalendarOpen ? "rounded-b-none mb-0 pb-4" : "mb-3"}`}
        aria-label="Toggle calendar"
      >
        <div className="flex items-center justify-between px-1 mb-[6px]">
          <h2 className="text-lg font-bold text-foreground">Calendar</h2>
          {isCalendarOpen ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
        </div>
        <p className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
          {format(visibleMonth, "MMMM yyyy")}
        </p>
        <div
          ref={miniScrollRef}
          onClick={(e) => e.stopPropagation()}
          className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pt-[4px] pb-[4px] pl-0 pr-0 mx-[2px]"
        >
          {miniDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const dayProgress = getDailyProgress(day);
            const dayCount = getEntryForDate(day);
            const hasEntry = dayCount > 0;
            let bg = "";
            let text = "text-foreground";
            if (hasEntry) {
              if (dayProgress >= 300) { bg = "bg-[#FF2C2C]"; text = "text-white"; }
              else if (dayProgress >= 200) { bg = "bg-[#C029DE]"; text = "text-white"; }
              else if (dayProgress >= 100) { bg = "bg-[#7036FF]"; text = "text-white"; }
              else { bg = "bg-[#0ABAB5]/20"; text = "text-[#0ABAB5]"; }
            }
            if (isSelected) { bg = "bg-primary"; text = "text-primary-foreground"; }
            return (
              <div
                key={day.toISOString()}
                onClick={(e) => { e.stopPropagation(); setSelectedDate(day); }}
                style={{ flex: "0 0 calc((100% - 16px) / 3)" }}
                className={`snap-end flex flex-col items-center justify-center rounded-xl py-2 cursor-pointer transition-all ${bg} ${text} ${isTodayDate && !isSelected ? "ring-2 ring-white px-0" : ""}`}
              >
                <span className="text-[10px] uppercase opacity-70">{format(day, "EEE")}</span>
                <span className="text-lg font-bold">{format(day, "d")}</span>
              </div>
            );
          })}
        </div>
      </button>

      {/* Expanded Calendar */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          isCalendarOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!isCalendarOpen}
      >
        <div className="overflow-hidden min-h-0">
          <div className="card-glass rounded-2xl rounded-t-none border-t-0 p-5 pt-2">
            <div className="flex items-center justify-between mb-[6px] px-[10px]">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-muted transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-foreground">{format(currentMonth, "MMMM yyyy")}</h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-muted transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day, i) => <div key={i} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const dayCount = getEntryForDate(day);
                const dayProgress = getDailyProgress(day);
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const isFutureDate = isFuture(startOfDay(day));
                const hasEntry = dayCount > 0;

                const getProgressColor = () => {
                  if (dayProgress >= 300) return { bg: "bg-[#FF2C2C]", text: "text-white", dot: "bg-[#FF2C2C]/60" };
                  if (dayProgress >= 200) return { bg: "bg-[#C029DE]", text: "text-white", dot: "bg-[#C029DE]/60" };
                  if (dayProgress >= 100) return { bg: "bg-[#7036FF]", text: "text-white", dot: "bg-[#7036FF]/60" };
                  if (dayProgress > 0) return { bg: "bg-[#0ABAB5]/20", text: "text-[#0ABAB5]", dot: "bg-[#0ABAB5]" };
                  return { bg: "", text: "text-foreground", dot: "" };
                };
                const colors = getProgressColor();
                return (
                  <button key={day.toISOString()} onClick={() => setSelectedDate(day)} className={`aspect-square rounded-full flex flex-col items-center justify-center text-sm font-medium transition-all ${!isCurrentMonth ? "text-muted-foreground/30" : isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : isFutureDate ? "text-muted-foreground/40" : hasEntry ? `${colors.bg} ${colors.text}` : "text-foreground hover:bg-muted"} ${isTodayDate && !isSelected ? "ring-2 ring-white" : ""}`}>
                    <span>{format(day, "d")}</span>
                    {hasEntry && !isSelected && isCurrentMonth && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${colors.dot}`} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CalendarSection;
