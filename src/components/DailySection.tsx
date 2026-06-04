import { useState, useEffect, useMemo, useRef } from "react";
import { format, addMonths, subMonths, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isFuture, startOfDay, isSameMonth, startOfYear, differenceInDays } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Minus, ChevronDown, TrendingUp, Flame, X } from "lucide-react";
import { ControllerIcon } from "@/components/ControllerIcon";
import ShareIcon from "@/components/ShareIcon";
import MultiColorTargetIcon from "@/components/MultiColorTargetIcon";
import partyAsset from "@/assets/party.svg.asset.json";
import megaphoneAsset from "@/assets/megaphone.svg.asset.json";
import rocketAsset from "@/assets/rocket.svg.asset.json";
import { usePushUpData } from "@/hooks/usePushUpData";
import ProgressRing from "@/components/ProgressRing";
import MuscleConfetti from "@/components/MuscleConfetti";
import { toast } from "@/hooks/use-toast";
import { useGame } from "@/contexts/GameContext";
import BrickBreakerGame from "@/components/BrickBreakerGame";
import SpaceShooterGame from "@/components/SpaceShooterGame";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";


const DailySection = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [inputValue, setInputValue] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [activeGame, setActiveGame] = useState<"select" | "brickbreaker" | "spaceshooter" | null>(null);
  const { isGameActive } = useGame();
  const {
    getEntryForDate,
    setEntryForDate,
    getDailyProgress,
    canEditDate,
    dailyTarget,
    yearlyGoal,
    isLoaded,
    getCurrentStreak,
    getTotalPushUps,
    getMaxSingleDay
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

      {/* Combined Today + Calendar Card */}
      <div className="bg-card/40 rounded-2xl border border-[#3B404F] animate-slide-up overflow-hidden" style={{ animationDelay: "0.05s" }}>
      <div className="relative p-6 pt-[20px] px-[10px] pb-[2px]">
        <button
          onClick={() => setActiveGame("select")}
          className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-muted/50 transition-colors z-10"
          aria-label="Open mini game"
        >
          <ControllerIcon className="w-8 h-8 text-[#D9D9D9]" aria-label="Mini game" />
        </button>
        <div className="pb-[12px] mb-[20px]">
          <div className="relative flex items-start justify-center">
            <div className="flex flex-col items-center text-center">
              <p className="text-sm text-muted-foreground font-medium">Today</p>
              {isEditable ?
                <input type="number" inputMode="numeric" value={inputValue} onChange={(e) => handleInputChange(e.target.value)} placeholder="0" className="text-5xl font-black text-foreground bg-transparent border-none outline-none w-[1.2ch] min-w-[1.2ch] focus:ring-0 placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" style={{ width: `${Math.max((inputValue || "0").length, 1)}ch` }} /> :
                <p className="font-black text-foreground text-xl">{currentCount}</p>
              }
              <span className={`font-bold text-primary mt-1 text-base ${currentCount === 0 ? "invisible" : ""}`}>{currentCount > 0 ? `${Math.round(progress)}%` : "0%"}</span>
            </div>
            <div className="absolute right-0 top-0 flex flex-col items-end text-right">
              <p className="text-sm text-muted-foreground font-medium">Yesterday</p>
              <p className="font-black text-[#a7a8aa] text-xl">{yesterdayCount}</p>
            </div>
          </div>
          <div className="relative flex items-center justify-center mt-[20px]">
            {isEditable &&
              <button
                onClick={() => adjustCount(-10)}
                disabled={currentCount < 10}
                aria-label="Decrease by 10"
                className="absolute left-1/2 -translate-x-[calc(69px+1rem+22px+30px)] w-11 h-11 rounded-full flex items-center justify-center text-foreground transition-all duration-150 ease-out active:translate-y-[1px] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
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
              >
                <span
                  className="pointer-events-none absolute inset-x-[18%] top-[10%] h-[8%] rounded-full opacity-30"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)',
                    filter: 'blur(3px)',
                  }}
                />
                <Minus className="lucide lucide-minus w-5 h-5 relative text-slate-100" />
              </button>
            }
            <button onClick={() => isEditable && adjustCount(10)} disabled={!isEditable} className="disabled:opacity-50">
              <ProgressRing progress={progress} size={138} strokeWidth={7} enableGame={false} enableAnimation={false} enableOuterGlow={true} topBadge={currentCount} />
            </button>
            <button
              onClick={handleShare}
              aria-label="Share progress"
              className="absolute left-1/2 translate-x-[calc(69px+1rem+22px+30px-44px)] w-11 h-11 rounded-full flex items-center justify-center text-slate-100 transition-all duration-150 ease-out active:translate-y-[1px] active:scale-[0.98] overflow-hidden"
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
            >
              <span
                className="pointer-events-none absolute inset-x-[18%] top-[10%] h-[8%] rounded-full opacity-30"
                style={{
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)',
                  filter: 'blur(3px)',
                }}
              />
              <ShareIcon size={16} className="relative" />
            </button>
          </div>
        </div>

        {/* Key Figures: Average, Most on a day & Streak */}
        {(() => {
          const today = new Date();
          const daysElapsed = differenceInDays(today, startOfYear(today)) + 1;
          const total = getTotalPushUps();
          const avg = daysElapsed > 0 ? Math.round(total / daysElapsed) : 0;
          const streak = getCurrentStreak();
          const maxDay = getMaxSingleDay();
          const MuscleIcon = ({ className }: { className?: string }) => (
            <svg className={className} viewBox="0 0 96 86" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M26.836 85.328C26.532 85.328 26.228 85.248 25.94 85.108C18.14 81.2 0 67.188 0 21.232C0 9.084 10.524 0 19.928 0C21.468 0 22.956 0.24 24.36 0.704C30.212 2.652 32.824 10.072 31.896 15.824C30.856 22.232 25.792 25.576 19.168 23.876C19.052 29.4 23.364 35.144 27.556 40.732C29.604 43.468 31.592 46.116 33 48.704C35.328 41.688 39.276 35.228 55.96 34.78C56.808 25.208 63.828 16.124 76.5 16.124C83.056 16.124 88.884 19.192 92.488 24.524C96.604 30.608 97.112 38.728 93.88 46.808C90.796 52.988 85.26 56.3 81.436 57.16C80.084 64.956 70.776 79.068 61.612 82.112C56.648 83.768 50.176 83.768 43.908 83.768C37.964 83.768 31.816 83.768 27.468 85.212C27.264 85.296 27.052 85.328 26.836 85.328ZM19.932 4.012C12.564 4.012 4.004 11.536 4.004 21.244C4.004 63.576 19.576 77.124 27.036 81.18C31.88 79.772 37.988 79.772 43.912 79.772C49.856 79.772 56 79.764 60.348 78.328C68.764 75.524 77.604 60.648 77.604 55.392C77.604 54.292 78.5 53.392 79.604 53.392C81.808 53.392 87.368 50.916 90.232 45.18C92.9 38.504 92.54 31.74 89.172 26.772C86.32 22.548 81.704 20.14 76.496 20.14C65.076 20.14 59.872 28.748 59.872 36.756C59.872 37.856 58.972 38.756 57.872 38.756C40.08 38.756 38.244 44.96 35.92 52.828C35.608 53.884 35.292 54.944 34.932 56.024C34.62 56.944 33.672 57.524 32.716 57.36C31.748 57.204 31.036 56.368 31.036 55.392C31.036 52.072 27.784 47.736 24.344 43.144C19.292 36.396 13.568 28.772 15.572 20.748C15.716 20.18 16.084 19.716 16.6 19.452C17.112 19.196 17.716 19.156 18.252 19.372C19.852 20.012 21.312 20.336 22.576 20.336C26.508 20.336 27.628 17.104 27.94 15.184C28.6 11.112 26.772 5.732 23.088 4.5C22.104 4.184 21.044 4.012 19.932 4.012Z" fill="currentColor"/>
            </svg>
          );
          const avgProgress = dailyTarget > 0 ? Math.round((avg / dailyTarget) * 100) : 0;
          const remaining = Math.max(0, yearlyGoal - total);
          const allTimeAvg = daysElapsed > 0 ? total / daysElapsed : 0;
          const projectedDate = allTimeAvg > 0
            ? new Date(Date.now() + (remaining / allTimeAvg) * 24 * 60 * 60 * 1000)
            : null;
          const projectedMonth = projectedDate ? format(projectedDate, "d. MMM") : "—";
          const projectedDays = projectedDate ? Math.max(0, differenceInDays(projectedDate, today)) : 0;
          const expectedByNow = Math.round((daysElapsed / 365) * yearlyGoal);
          const diff = total - expectedByNow;
          const absDiff = Math.abs(diff);
          const diffValue = diff >= 0 ? "+" : "−";
          let diffDisplay: string;
          if (absDiff < 1000) {
            diffDisplay = `${diffValue}${Math.min(absDiff, 999)}`;
          } else {
            const k = absDiff / 1000;
            if (k >= 100) {
              diffDisplay = `${diffValue}${Math.round(k)}k`;
            } else if (k >= 10) {
              const formatted = k.toFixed(1).replace(/\.0$/, "");
              diffDisplay = `${diffValue}${formatted}k`;
            } else {
              const formatted = k.toFixed(2).replace(/\.00$/, "");
              diffDisplay = `${diffValue}${formatted}k`;
            }
          }
          const TargetDiffIcon = ({ className }: { className?: string }) => (
            <div
              className={className}
              style={{
                backgroundColor: "#00C3FF",
                WebkitMaskImage: `url(${diff >= 0 ? rocketAsset.url : megaphoneAsset.url})`,
                maskImage: `url(${diff >= 0 ? rocketAsset.url : megaphoneAsset.url})`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
            />
          );
          const items = [
            { label: "Most PU", value: maxDay, unit: "​", Icon: MuscleIcon, color: "text-[#d291df]", isCustomIcon: true },
            { label: "Avg. daily", value: avg, unit: "​", Icon: TrendingUp, color: "text-primary", isCustomIcon: false },
            { label: `${Math.round(yearlyGoal / 1000)}k on`, value: projectedMonth, unit: "", Icon: MultiColorTargetIcon, color: "", isCustomIcon: true },
            { label: diff >= 0 ? "Above Tgt" : "Below Tgt", value: diffDisplay, unit: "", Icon: TargetDiffIcon, color: "", isCustomIcon: true },
            { label: "Streak", value: streak, unit: "​", Icon: Flame, color: "text-[#FF2C2C]", isCustomIcon: false },
            { label: "Avg. prog.", value: avgProgress, unit: "%", Icon: TrendingUp, color: "text-[#5C33FF]", isCustomIcon: false },
          ];
          const exactDiff = `${diff >= 0 ? "+" : "−"}${absDiff.toLocaleString()}`;
          return (
            <div className="flex gap-4 pt-4 mt-2 border-t border-b border-[#3B404F] mb-2 overflow-x-auto pb-[20px]" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              <TooltipProvider delayDuration={0}>
                {items.map((s) => {
                  const isTargetItem = s.label === "Above Tgt" || s.label === "Below Tgt";
                  const content = (
                    <div className="flex-shrink-0 flex items-start gap-2" style={{ minWidth: "90px" }}>
                      {s.label === "Avg. daily" ? (
                        <span className={`text-xl font-bold ${s.color}`}>Ø</span>
                      ) : s.isCustomIcon ? (
                        <s.Icon className={`w-5 h-5 ${s.color}`} />
                      ) : (
                        <s.Icon className={`w-5 h-5 ${s.color}`} />
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                        <p className="text-xl font-black text-foreground">
                          {s.value}
                          <span className="text-sm font-medium text-muted-foreground ml-1">{s.unit}</span>
                        </p>
                      </div>
                    </div>
                  );
                  return isTargetItem ? (
                    <Tooltip key={s.label}>
                      <TooltipTrigger asChild>
                        {content}
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6} className="bg-popover border border-[#3B404F] text-foreground font-black text-base px-3 py-1.5">
                        {exactDiff}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div key={s.label} className="contents">{content}</div>
                  );
                })}
              </TooltipProvider>
            </div>
          );
        })()}
      </div>

      {/* Mini Calendar */}
      <button
        onClick={() => setIsCalendarOpen((v) => !v)}
        className={`w-full p-3 py-8 transition-all duration-300 ease-out hover:opacity-90 px-[10px] mb-0 pb-[24px] pt-0`}
        aria-label="Toggle calendar"
      >
        <div className="flex items-center justify-between px-1 mb-[6px] pl-[10px] pr-[10px]">
          <h2 className="text-lg text-foreground font-semibold">Calendar</h2>
          {isCalendarOpen ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
        </div>
        <div className="h-px mb-4 bg-[#3b404f]" />
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

            // Determine the base tint for this day (matches prior calendar colors)
            let baseRgb: [number, number, number] | null = null;
            let textColor = "text-foreground";
            if (hasEntry) {
              if (dayProgress >= 300) { baseRgb = [255, 44, 44]; textColor = "text-white"; }
              else if (dayProgress >= 200) { baseRgb = [192, 41, 222]; textColor = "text-white"; }
              else if (dayProgress >= 100) { baseRgb = [112, 54, 255]; textColor = "text-white"; }
              else { baseRgb = [10, 186, 181]; textColor = "text-white"; }
            }
            if (isSelected) { baseRgb = null; textColor = "text-primary"; }

            const tinted = baseRgb !== null;
            const [r, g, b] = baseRgb ?? [42, 47, 58];

            return (
              <div
                key={day.toISOString()}
                onClick={(e) => { e.stopPropagation(); setSelectedDate(day); }}
                style={{
                  flex: "0 0 calc((100% - 16px) / 3)",
                  background: tinted
                    ? `radial-gradient(circle at 50% 55%, rgba(${r},${g},${b},0.75) 0%, rgba(${r},${g},${b},0.6) 60%, rgba(${r},${g},${b},0.45) 100%)`
                    : 'radial-gradient(circle at 50% 55%, rgba(42,47,58,0.55) 0%, rgba(31,36,46,0.45) 60%, rgba(22,26,34,0.35) 100%)',
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
                className={`relative overflow-hidden snap-end flex flex-col items-center justify-center rounded-xl py-2 cursor-pointer transition-all duration-150 ease-out active:translate-y-[1px] active:scale-[0.98] ${textColor} ${isSelected ? "ring-2 ring-primary/60" : isTodayDate ? "ring-2 ring-white" : ""}`}
              >
                <span
                  className="pointer-events-none absolute inset-x-[18%] top-[10%] h-[8%] rounded-full opacity-30"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)',
                    filter: 'blur(3px)',
                  }}
                />
                <span className="relative text-[10px] uppercase opacity-70">{format(day, "EEE")}</span>
                <span className="relative text-lg font-bold">{format(day, "d")}</span>
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
          <div className={`p-5 pt-2 ${isGameActive ? "pointer-events-none opacity-50" : ""}`}>
            <div className="flex items-center justify-between mb-[6px] px-[10px]">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                aria-label="Previous month"
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-100 transition-all duration-150 ease-out active:translate-y-[1px] active:scale-[0.98] overflow-hidden"
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
              >
                <span
                  className="pointer-events-none absolute inset-x-[18%] top-[10%] h-[8%] rounded-full opacity-30"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)',
                    filter: 'blur(3px)',
                  }}
                />
                <ChevronLeft className="w-5 h-5 relative" />
              </button>
              <h2 className="text-lg text-foreground font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                aria-label="Next month"
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-100 transition-all duration-150 ease-out active:translate-y-[1px] active:scale-[0.98] overflow-hidden"
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
              >
                <span
                  className="pointer-events-none absolute inset-x-[18%] top-[10%] h-[8%] rounded-full opacity-30"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)',
                    filter: 'blur(3px)',
                  }}
                />
                <ChevronRight className="w-5 h-5 relative" />
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
                  <button key={day.toISOString()} onClick={() => setSelectedDate(day)} className={`aspect-square rounded-full flex flex-col items-center justify-center text-sm font-medium transition-all ${!isCurrentMonth ? "text-[#CBCCCC]" : isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : isFutureDate ? "text-muted-foreground/40" : hasEntry ? `${colors.bg} ${colors.text}` : "text-foreground hover:bg-muted"} ${isTodayDate && !isSelected ? "ring-2 ring-white" : ""}`}>
                    <span>{format(day, "d")}</span>
                    {hasEntry && !isSelected && isCurrentMonth && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${colors.dot}`} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </div>






      <BrickBreakerGame isOpen={activeGame === "brickbreaker"} onClose={() => setActiveGame(null)} />

      {activeGame === "select" && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setActiveGame(null)}>
          <button
            onClick={(e) => { e.stopPropagation(); setActiveGame(null); }}
            className="fixed top-[56px] right-4 z-[51] p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <div className="rounded-2xl p-6 max-w-sm w-full space-y-4 -mt-[60px]" style={{ backgroundColor: 'rgba(14, 26, 41, 0)' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl text-foreground font-semibold text-center">Choose a Game</h2>
            <button
              onClick={() => setActiveGame("brickbreaker")}
              className="w-full p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-left"
            >
              <p className="font-semibold text-foreground">🧱 Brick Breaker</p>
              <p className="text-sm text-muted-foreground">Classic brick-breaking action</p>
            </button>
            <button
              onClick={() => setActiveGame("spaceshooter")}
              className="w-full p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-left"
            >
              <p className="font-semibold text-foreground">🚀 Space Shooter</p>
              <p className="text-sm text-muted-foreground">Blast falling objects in space</p>
            </button>
          </div>
        </div>
      )}

      {activeGame === "spaceshooter" && (
        <div className="fixed inset-0 z-50">
          <SpaceShooterGame onBack={() => setActiveGame(null)} />
        </div>
      )}
    </>
  );
};

export default DailySection;
