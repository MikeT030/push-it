import { useState, useEffect, useMemo, useRef } from "react";
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isFuture, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Minus, User } from "lucide-react";
import ShareIcon from "@/components/ShareIcon";
import { useNavigate } from "react-router-dom";
import { usePushUpData } from "@/hooks/usePushUpData";
import ProgressRing from "@/components/ProgressRing";
import MuscleConfetti from "@/components/MuscleConfetti";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useGame } from "@/contexts/GameContext";
import WeeklyOverview from "@/components/WeeklyOverview";
const DailyPage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [inputValue, setInputValue] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const {
    isGameActive
  } = useGame();
  const previousCountRef = useRef<number>(0);
  const {
    getEntryForDate,
    setEntryForDate,
    getDailyProgress,
    canEditDate,
    dailyTarget,
    isLoaded,
    getCurrentStreak
  } = usePushUpData();
  const currentCount = isLoaded ? getEntryForDate(selectedDate) : 0;
  const progress = isLoaded ? getDailyProgress(selectedDate) : 0;
  const isEditable = canEditDate(selectedDate);
  useEffect(() => {
    setInputValue(currentCount > 0 ? currentCount.toString() : "");
  }, [selectedDate, currentCount]);
  const monthDays = useMemo(() => eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  }), [currentMonth]);
  const firstDayOfWeek = startOfMonth(currentMonth).getDay();
  const emptyDays = useMemo(() => Array(firstDayOfWeek).fill(null), [firstDayOfWeek]);
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const handleInputChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (num >= 0 && num <= 9999) {
      const prevCount = currentCount;
      setInputValue(value);
      setEntryForDate(selectedDate, num);

      // Trigger confetti when count increases
      if (num > prevCount && num > 0) {
        setShowConfetti(true);
      }
    }
  };
  const adjustCount = (delta: number) => {
    const prevCount = currentCount;
    const newCount = Math.max(0, Math.min(9999, currentCount + delta));
    setEntryForDate(selectedDate, newCount);
    setInputValue(newCount > 0 ? newCount.toString() : "");

    // Trigger confetti when count increases
    if (newCount > prevCount && newCount > 0) {
      setShowConfetti(true);
    }
  };
  const handleShare = async () => {
    const streak = getCurrentStreak();
    const progressPercent = Math.round(progress);
    const dateStr = format(selectedDate, "MMMM d, yyyy");
    const shareText = `💪 I did ${currentCount} push-ups on ${dateStr}!\n📊 ${progressPercent}% of daily target (${dailyTarget})\n🔥 ${streak} day streak\n\n#PushIt`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Push-ups",
          text: shareText
        });
      } catch (error) {
        // User cancelled or share failed - silently ignore
        if ((error as Error).name !== "AbortError") {
          console.error("Share failed:", error);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to clipboard!",
          description: "Share your progress anywhere"
        });
      } catch (error) {
        toast({
          title: "Could not copy",
          description: "Please try again",
          variant: "destructive"
        });
      }
    }
  };
  if (!isLoaded) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>;
  }
  return <div className="min-h-screen bg-background pb-32 safe-top">
      <MuscleConfetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      <div className="px-6 pt-8">
        {/* Add Push-ups Button & Profile */}
        <div className="flex justify-between items-center mb-4 animate-fade-in">
          <Button disabled variant="outline" className="rounded-full px-5 py-2 border-2 border-transparent text-transparent bg-transparent pointer-events-none opacity-0">
            <Plus className="w-4 h-4" />
            Add push-ups
          </Button>
          <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-full bg-transparent border border-white flex items-center justify-center hover:bg-white/10 transition-colors">
            <User className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-black text-foreground tracking-tight pt-[20px]">Push</h1>
          <p className="text-lg text-muted-foreground mt-1">
            {format(selectedDate, "EEEE, dd.MM.yyyy")}
          </p>
        </header>

        <div className="bg-card rounded-2xl p-6 mb-6 animate-slide-up">
          <div className="flex items-center justify-between pb-[12px]">
            <div className="flex flex-col items-start">
              <p className="text-sm text-muted-foreground font-medium mb-1">
                Today
              </p>
              {isEditable ? <input type="number" inputMode="numeric" value={inputValue} onChange={e => handleInputChange(e.target.value)} placeholder="0" className="text-5xl font-black text-foreground bg-transparent border-none outline-none w-32 focus:ring-0 placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /> : <p className="text-5xl font-black text-foreground">
                  {currentCount}
                </p>}
              <p className="text-sm text-muted-foreground mt-1">
                of {dailyTarget} target
              </p>
            </div>
            <ProgressRing progress={progress} size={120} strokeWidth={12} enableGame={true} enableAnimation={false} enableOuterGlow={true} />
          </div>

          {/* Input Controls */}

          {!isEditable && <p className="mt-6 text-center text-muted-foreground text-sm">
              Future dates cannot be edited
            </p>}

          {/* Share Button */}
          <Button variant="outline" onClick={handleShare} className="w-full h-12 mt-6 bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5] hover:bg-[#0ABAB5] hover:text-white active:bg-[#0ABAB5]/25 active:text-white">
            <ShareIcon className="mr-2" size={16} />
            Share Progress
          </Button>
        </div>

        {/* Calendar Card */}
        <div className={`bg-card rounded-2xl p-5 animate-slide-up transition-opacity ${isGameActive ? "pointer-events-none opacity-50" : ""}`} style={{
        animationDelay: "0.1s"
      }}>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subDays(currentMonth, 30))} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-muted transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button onClick={() => setCurrentMonth(addDays(currentMonth, 30))} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-muted transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, i) => <div key={i} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>)}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
            {monthDays.map(day => {
            const dayCount = getEntryForDate(day);
            const dayProgress = getDailyProgress(day);
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const isFutureDate = isFuture(startOfDay(day));
            const hasEntry = dayCount > 0;

            // Color based on progress percentage
            const getProgressColor = () => {
              if (dayProgress >= 200) return {
                bg: "bg-[#C029DE]",
                text: "text-white",
                dot: "bg-[#C029DE]/60"
              };
              if (dayProgress >= 100) return {
                bg: "bg-[hsl(var(--overflow))]",
                text: "text-white",
                dot: "bg-[hsl(var(--overflow)/0.6)]"
              };
              if (dayProgress > 0) return {
                bg: "bg-primary/20",
                text: "text-primary",
                dot: "bg-primary"
              };
              return {
                bg: "",
                text: "text-foreground",
                dot: ""
              };
            };
            const colors = getProgressColor();
            return <button key={day.toISOString()} onClick={() => setSelectedDate(day)} disabled={false} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all ${isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : isFutureDate ? "text-muted-foreground/40" : hasEntry ? `${colors.bg} ${colors.text}` : "text-foreground hover:bg-muted"} ${isTodayDate && !isSelected ? "ring-2 ring-white" : ""}`}>
                  <span>{format(day, "d")}</span>
                  {hasEntry && !isSelected && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${colors.dot}`} />}
                </button>;
          })}
          </div>
        </div>

        {/* Weekly Overview */}
        <div className={`mt-6 mb-6 transition-opacity ${isGameActive ? "pointer-events-none opacity-50" : ""}`}>
          <WeeklyOverview />
        </div>
      </div>
    </div>;
};
export default DailyPage;