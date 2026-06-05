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

const MuscleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 84 90" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0.709653 64.0509C1.07685 61.3219 1.52998 57.9224 1.87377 53.9888C2.86988 42.6362 18.28 20.0169 21.2721 16.0368C21.858 15.2571 22.3229 14.2162 22.819 13.1129C23.6979 11.148 24.6979 8.92198 26.5339 7.95898C27.6316 7.38589 29.5808 6.64129 31.8387 5.7758C35.659 4.31778 40.4091 2.50107 42.9948 0.707714C43.9441 0.0488562 44.7957 -0.149971 45.5261 0.111233C46.7917 0.567361 47.5378 2.35679 47.7214 3.0117C47.7917 3.23392 49.3308 8.06421 50.284 9.9433C51.0887 11.5261 51.9559 14.3058 51.0418 15.4636C50.6512 15.9626 49.8934 16.1185 48.8229 15.9665C49.3386 14.6722 49.2214 13.0933 48.4558 11.8769C47.1119 9.74051 45.2916 3.99018 45.2916 3.99018C45.3229 4.23968 46.1197 10.0992 47.5807 12.4227C48.2761 13.526 48.28 15.0854 47.5925 16.1263C46.9323 17.1243 45.7486 17.5726 44.1588 17.444C44.9205 10.5007 42.3072 8.41493 42.3072 8.41493C43.815 10.1848 43.4049 15.4947 43.0962 17.5726C42.815 17.8923 41.6431 18.9995 39.1548 18.8864C38.4907 18.8591 37.9829 18.6369 37.5923 18.2003C36.7797 17.2958 36.7407 15.7676 36.7485 15.2647C39.4829 14.7189 39.5063 12.6449 39.5063 12.6449C39.4829 12.6878 39.1391 13.2297 38.2094 13.7092L38.2172 13.6897C36.5453 13.3154 36.7719 10.6722 36.7719 10.641C36.7719 10.641 35.5297 13.0347 36.9164 14.1731C36.1664 14.3602 35.2289 14.4694 34.0414 14.4109C34.0414 14.4109 34.6508 15.5493 35.7211 15.4012C35.725 15.9937 35.8149 17.1399 36.3383 18.1418C34.8813 19.0775 33.5219 19.3426 32.2913 18.9177C29.3811 17.9079 27.971 13.4519 27.9554 13.4051C27.9554 13.4051 28.5179 18.6019 31.846 19.8455C30.1976 22.2665 24.4475 31.1552 24.3303 37.303V37.3849L24.3538 37.4628C24.3772 37.5408 26.6936 45.4119 25.2249 53.587C23.8029 61.5088 16.9903 62.6784 16.7013 62.7212C16.7013 62.7212 21.2209 63.0058 24.0608 59.0682C24.4788 59.1501 24.9319 59.1969 25.4007 59.1969C26.3811 59.1969 27.3851 59.0604 28.0569 58.9474C28.1741 61.6452 25.9905 63.6802 25.9905 63.6802C28.3186 62.347 28.7093 60.6901 29.0882 59.0877C29.639 56.7485 30.1468 54.4913 36.94 52.85C47.6391 50.2692 52.3382 56.9045 52.4172 57.0371C52.4172 57.0371 52.2961 54.8656 50.0813 53.4192C60.6984 41.2523 78.1987 48.4837 80.0508 49.2946C81.168 51.5518 91.1879 73.5357 67.1955 89.8744C67.012 90.003 66.8205 90.0303 66.5744 89.9679C64.3166 89.3909 60.6799 82.2839 58.5079 78.0385C57.3087 75.6954 56.6095 74.3427 56.172 73.8593C54.4219 71.91 51.0469 74.6663 51.0469 74.6663C51.9141 74.2491 54.3789 73.4109 55.3986 74.5454C55.6329 74.8066 56.0626 75.5707 56.59 76.5844C53.7618 78.4479 39.6877 86.5806 20.9254 78.136C25.195 77.1848 27.988 73.8008 27.988 73.8008C18.3551 81.325 3.28061 75.5864 0.776572 73.7852C-0.473448 72.8846 -0.00129212 69.3685 0.709653 64.0509ZM39.7883 69.9845C47.2298 69.6921 49.6791 65.6103 49.6791 65.6103C49.3431 65.9066 41.3 72.7603 30.1437 66.0859C30.1437 66.082 33.714 70.2223 39.7883 69.9845Z" fill="currentColor"/>
    <path d="M52.4606 14.3449C52.5934 12.2865 51.3903 9.82263 51.2106 9.47172C50.2926 7.66279 48.73 2.75839 48.7144 2.71168C48.6988 2.661 48.4839 1.91638 48.0074 1.10156C48.941 1.2575 50.2457 1.64346 50.9136 2.6532C51.6988 3.84225 52.9996 7.15989 53.9528 9.5848C54.6793 11.4366 54.9684 12.1578 55.1325 12.3956C55.2653 12.5906 55.652 13.4833 55.3005 14.0019C54.9723 14.4892 53.9527 14.61 52.4606 14.3449Z" fill="currentColor"/>
    <path d="M45.6084 21.2609C43.6239 21.1011 43.5614 18.6879 43.5575 18.5826H43.5263C43.5888 18.5281 43.6552 18.4735 43.706 18.4267C44.0497 18.4696 44.3739 18.4969 44.6747 18.4969C46.6709 18.4969 47.7451 17.6236 48.292 16.9258C48.3467 16.9375 48.4014 16.9492 48.4561 16.957C48.1045 18.4384 47.1396 21.2649 45.6982 21.2649C45.667 21.2649 45.6396 21.2609 45.6084 21.2609Z" fill="currentColor"/>
  </svg>
);




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

  const scrollMiniToDate = (date: Date, smooth = true) => {
    const el = miniScrollRef.current;
    if (!el) return;
    const idx = miniDays.findIndex((d) => isSameDay(d, date));
    if (idx < 0) return;
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;
    // Today stays at the rightmost; any other day centers in the 3-day view
    const target = isToday(date)
      ? el.scrollWidth - el.clientWidth - 4
      : child.offsetLeft + child.offsetWidth / 2 - el.clientWidth / 2 - 4;
    el.scrollTo({ left: target, behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    if (miniScrollRef.current) {
      miniScrollRef.current.scrollLeft = miniScrollRef.current.scrollWidth - 4;
    }
  }, [isLoaded]);

  // Sync mini strip with selected date
  useEffect(() => {
    if (!isLoaded) return;
    scrollMiniToDate(selectedDate);
  }, [selectedDate, isLoaded]);

  // When calendar closes, reset to today + last 2
  useEffect(() => {
    if (!isLoaded) return;
    if (!isCalendarOpen) {
      setSelectedDate(new Date());
      requestAnimationFrame(() => {
        if (miniScrollRef.current) {
          miniScrollRef.current.scrollLeft = miniScrollRef.current.scrollWidth - 4;
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

  if (!isLoaded) {
    return (
      <div className="bg-card/40 rounded-2xl border border-[#3B404F] overflow-hidden animate-pulse">
        <div className="p-6 pt-[20px] px-[10px] pb-[20px]">
          <div className="h-4 w-12 mx-auto bg-muted/40 rounded mb-3" />
          <div className="h-12 w-16 mx-auto bg-muted/40 rounded mb-4" />
          <div className="h-[138px] w-[138px] mx-auto rounded-full bg-muted/30 mb-6" />
          <div className="h-16 w-full bg-muted/20 rounded" />
        </div>
      </div>
    );
  }

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
            <div className="flex gap-4 pt-4 mt-2 border-t border-b border-[#3B404F] mb-2 overflow-x-auto pb-[20px] mx-[10px]" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              <TooltipProvider delayDuration={0}>
                {items.map((s) => {
                  const isTargetItem = s.label === "Above Tgt" || s.label === "Below Tgt";
                  const content = (
                    <div className="flex-shrink-0 flex items-start gap-2 first:pl-0 last:pr-0" style={{ minWidth: "90px" }}>
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
        <div className="h-px mx-[10px] bg-[#3b404f] mb-[16px]" />
        <p className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 pl-[10px] pr-[10px]">
          {format(visibleMonth, "MMMM yyyy")}
        </p>
        <div
          ref={miniScrollRef}
          onClick={(e) => e.stopPropagation()}
          className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pt-[4px] pb-[4px] ml-[8px] mr-[12px] px-[6px]"
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
