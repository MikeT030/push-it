import { useState, useEffect, useMemo, useRef } from "react";
import { format, addMonths, subMonths, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isFuture, startOfDay, isSameMonth, startOfYear, differenceInDays } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Minus, ChevronDown, TrendingUp, Flame } from "lucide-react";
import ShareIcon from "@/components/ShareIcon";
import { usePushUpData } from "@/hooks/usePushUpData";
import ProgressRing from "@/components/ProgressRing";
import MuscleConfetti from "@/components/MuscleConfetti";
import { toast } from "@/hooks/use-toast";
import { useGame } from "@/contexts/GameContext";

const DailySection = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [inputValue, setInputValue] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { isGameActive } = useGame();
  const {
    getEntryForDate,
    setEntryForDate,
    getDailyProgress,
    canEditDate,
    dailyTarget,
    isLoaded,
    getCurrentStreak,
    getTotalPushUps
  } = usePushUpData();

  const currentCount = isLoaded ? getEntryForDate(selectedDate) : 0;
  const yesterdayCount = isLoaded ? getEntryForDate(subDays(selectedDate, 1)) : 0;
  const progress = isLoaded ? getDailyProgress(selectedDate) : 0;
  const isEditable = canEditDate(selectedDate);
  const miniScrollRef = useRef<HTMLDivElement>(null);
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date());

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
    // Place selected day as the rightmost of the 3 visible
    el.scrollLeft = child.offsetLeft + child.offsetWidth - el.clientWidth;
  };

  useEffect(() => {
    if (miniScrollRef.current) {
      miniScrollRef.current.scrollLeft = miniScrollRef.current.scrollWidth;
    }
  }, [isLoaded]);

  // Sync mini strip with selected date when calendar is open
  useEffect(() => {
    if (!isLoaded) return;
    if (isCalendarOpen) scrollMiniToDate(selectedDate);
  }, [selectedDate, isCalendarOpen, isLoaded]);

  // When calendar closes, reset to today + last 2
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

  useEffect(() => {
    setInputValue(currentCount > 0 ? currentCount.toString() : "");
  }, [selectedDate, currentCount]);

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

  const handleInputChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (num >= 0 && num <= 9999) {
      const prevCount = currentCount;
      setInputValue(value);
      setEntryForDate(selectedDate, num);
      if (num > prevCount && num > 0) setShowConfetti(true);
    }
  };

  const adjustCount = (delta: number) => {
    const prevCount = currentCount;
    const newCount = Math.max(0, Math.min(9999, currentCount + delta));
    setEntryForDate(selectedDate, newCount);
    setInputValue(newCount > 0 ? newCount.toString() : "");
    if (newCount > prevCount && newCount > 0) setShowConfetti(true);
  };

  const handleShare = async () => {
    const streak = getCurrentStreak();
    const progressPercent = Math.round(progress);
    const dateStr = format(selectedDate, "MMMM d, yyyy");
    const shareText = `💪 I did ${currentCount} push-ups on ${dateStr}!\n📊 ${progressPercent}% of daily target (${dailyTarget})\n🔥 ${streak} day streak\n\n#PushIt`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Push-ups", text: shareText });
      } catch (error) {
        if ((error as Error).name !== "AbortError") console.error("Share failed:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast({ title: "Copied to clipboard!", description: "Share your progress anywhere" });
      } catch {
        toast({ title: "Could not copy", description: "Please try again", variant: "destructive" });
      }
    }
  };

  if (!isLoaded) return null;

  return (
    <>
      <MuscleConfetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Today Card */}
      <div className="bg-card/40 rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: "0.05s" }}>
        <div className="pb-[12px] mb-[20px]">
          <div className="relative flex items-start justify-center">
            <div className="flex flex-col items-center text-center">
              <p className="text-sm text-muted-foreground font-medium mb-1">Today</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-primary">{Math.round(progress)}%</span>
                {isEditable ?
                  <input type="number" inputMode="numeric" value={inputValue} onChange={(e) => handleInputChange(e.target.value)} placeholder="0" className="text-5xl font-black text-foreground bg-transparent border-none outline-none w-[1.2ch] min-w-[1.2ch] focus:ring-0 placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" style={{ width: `${Math.max((inputValue || "0").length, 1)}ch` }} /> :
                  <p className="text-5xl font-black text-foreground">{currentCount}</p>
                }
              </div>
              <p className="text-sm text-muted-foreground mt-1">of {dailyTarget} target</p>
            </div>
            <div className="absolute right-0 top-0 flex flex-col items-end text-right">
              <p className="text-sm text-muted-foreground font-medium mb-1">Yesterday</p>
              <p className="font-black text-[#a7a8aa] text-2xl">{yesterdayCount}</p>
            </div>
          </div>
          <div className="relative flex items-center justify-center mt-[20px]">
            {isEditable &&
              <button onClick={() => adjustCount(-10)} disabled={currentCount < 10} className="absolute left-1/2 -translate-x-[calc(69px+1rem+22px+30px)] w-11 h-11 rounded-full border border-muted-foreground/30 bg-transparent text-foreground hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center">
                <Minus className="w-5 h-5" />
              </button>
            }
            <button onClick={() => isEditable && adjustCount(10)} disabled={!isEditable} className="disabled:opacity-50">
              <ProgressRing progress={progress} size={138} strokeWidth={7} enableGame={false} enableAnimation={false} enableOuterGlow={true} topBadge={currentCount} />
            </button>
            <button onClick={handleShare} aria-label="Share progress" className="absolute left-1/2 translate-x-[calc(69px+1rem+22px+30px-44px)] w-11 h-11 rounded-full border border-[#0ABAB5] bg-[#0ABAB5]/10 text-[#0ABAB5] hover:bg-[#0ABAB5] hover:text-white active:bg-[#0ABAB5]/25 active:text-white transition-colors flex items-center justify-center">
              <ShareIcon size={16} />
            </button>
          </div>
        </div>

        {/* Key Figures: Average & Streak */}
        {(() => {
          const today = new Date();
          const daysElapsed = differenceInDays(today, startOfYear(today)) + 1;
          const total = getTotalPushUps();
          const avg = daysElapsed > 0 ? Math.round(total / daysElapsed) : 0;
          const streak = getCurrentStreak();
          const items = [
            { label: "Average", value: avg, unit: "/day", Icon: TrendingUp, color: "text-primary" },
            { label: "Streak", value: streak, unit: "days", Icon: Flame, color: "text-[#C029DE]" },
          ];
          return (
            <div className="flex gap-3 pt-4 mt-2 border-t border-[#3B404F]">
              {items.map((s) => (
                <div key={s.label} className="flex-1 flex items-center gap-2">
                  <s.Icon className={`w-5 h-5 ${s.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                    <p className="text-xl font-black text-foreground">
                      {s.value}
                      <span className="text-sm font-medium text-muted-foreground ml-1">{s.unit}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Mini Calendar */}
      <button
        onClick={() => setIsCalendarOpen((v) => !v)}
        className={`w-full card-glass rounded-2xl p-3 py-8 animate-slide-up transition-all duration-300 ease-out hover:opacity-90 ${isCalendarOpen ? "rounded-b-none mb-0 pb-4" : "mb-3"}`}
        aria-label="Toggle calendar"
      >
        <div className="flex items-center justify-between mb-3 px-1">
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
              if (dayProgress >= 200) { bg = "bg-[#C029DE]"; text = "text-white"; }
              else if (dayProgress >= 100) { bg = "bg-[#7036FF]"; text = "text-white"; }
              else { bg = "bg-primary/20"; text = "text-primary"; }
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
          <div className={`card-glass rounded-2xl rounded-t-none border-t-0 p-5 pt-2 ${isGameActive ? "pointer-events-none opacity-50" : ""}`}>
            <div className="flex items-center justify-between mb-4">
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
                  if (dayProgress >= 200) return { bg: "bg-[#C029DE]", text: "text-white", dot: "bg-[#C029DE]/60" };
                  if (dayProgress >= 100) return { bg: "bg-[#7036FF]", text: "text-white", dot: "bg-[#7036FF]/60" };
                  if (dayProgress > 0) return { bg: "bg-primary/20", text: "text-primary", dot: "bg-primary" };
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

export default DailySection;
