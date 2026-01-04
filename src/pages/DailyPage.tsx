import { useState, useEffect, useMemo } from "react";
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isFuture, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Minus, Share2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePushUpData } from "@/hooks/usePushUpData";
import ProgressRing from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const DailyPage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [inputValue, setInputValue] = useState("");
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
      setInputValue(value);
      setEntryForDate(selectedDate, num);
    }
  };
  const adjustCount = (delta: number) => {
    const newCount = Math.max(0, Math.min(9999, currentCount + delta));
    setEntryForDate(selectedDate, newCount);
    setInputValue(newCount > 0 ? newCount.toString() : "");
  };

  const handleShare = async () => {
    const streak = getCurrentStreak();
    const progressPercent = Math.round(progress);
    const dateStr = format(selectedDate, "MMMM d, yyyy");
    
    const shareText = `💪 I did ${currentCount} push-ups on ${dateStr}!\n📊 ${progressPercent}% of daily target (${dailyTarget})\n🔥 ${streak} day streak\n\n#PushIt #Fitness`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Push-ups",
          text: shareText,
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
          description: "Share your progress anywhere",
        });
      } catch (error) {
        toast({
          title: "Could not copy",
          description: "Please try again",
          variant: "destructive",
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
      <div className="px-6 pt-8">
        {/* Add Push-ups Button & Profile */}
        <div className="flex justify-between items-center mb-4 animate-fade-in">
          <Button
            disabled
            variant="outline"
            className="rounded-full px-5 py-2 border-2 border-transparent text-transparent bg-transparent pointer-events-none opacity-0"
          >
            <Plus className="w-4 h-4" />
            Add push-ups
          </Button>
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          >
            <User className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-black text-foreground tracking-tight">Daily</h1>
          <p className="text-lg text-muted-foreground mt-1">
            {format(selectedDate, "EEEE, dd.MM.yyyy")}
          </p>
        </header>

        <div className="bg-card rounded-2xl p-6 mb-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium mb-1">
                Daily Progress
              </p>
              <p className="text-5xl font-black text-foreground">
                {currentCount}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                of {dailyTarget} target
              </p>
            </div>
            <ProgressRing progress={progress} size={100} strokeWidth={10} />
          </div>

          {/* Input Controls */}
          {isEditable && <div className="mt-6 flex items-center gap-2 sm:gap-4">
              <button onClick={() => adjustCount(-10)} className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-muted transition-colors active:scale-95">
                <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <input type="number" inputMode="numeric" value={inputValue} onChange={e => handleInputChange(e.target.value)} placeholder="0" className="flex-1 min-w-0 h-12 sm:h-14 bg-white/[0.14] rounded-xl text-center text-xl sm:text-2xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              
              <button onClick={() => adjustCount(10)} className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors active:scale-95">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>}

          {!isEditable && <p className="mt-6 text-center text-muted-foreground text-sm">
              Future dates cannot be edited
            </p>}

          {/* Share Button */}
          <Button
            variant="outline"
            onClick={handleShare}
            className="w-full h-12 mt-6 hover:bg-[#0ABAB5] hover:text-white hover:border-[#0ABAB5] active:bg-[#0ABAB5] active:text-white active:border-[#0ABAB5]"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Progress
          </Button>
        </div>

        {/* Calendar Card */}
        <div className="bg-card rounded-2xl p-5 animate-slide-up" style={{
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
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const isFutureDate = isFuture(startOfDay(day));
            const hasEntry = dayCount > 0;
            const metGoal = dayCount >= dailyTarget;
            const exceededGoal = dayCount > dailyTarget;
            return <button key={day.toISOString()} onClick={() => setSelectedDate(day)} disabled={false} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all ${isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : isFutureDate ? "text-muted-foreground/40" : hasEntry ? exceededGoal ? "bg-[hsl(var(--overflow))] text-white" : metGoal ? "bg-primary text-primary-foreground" : "bg-accent/20 text-accent" : "text-foreground hover:bg-muted"} ${isTodayDate && !isSelected ? "ring-2 ring-white" : ""}`}>
                  <span>{format(day, "d")}</span>
                  {hasEntry && !isSelected && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${exceededGoal ? "bg-[hsl(var(--overflow)/0.6)]" : metGoal ? "bg-primary/60" : "bg-accent"}`} />}
                </button>;
          })}
          </div>
        </div>
      </div>
    </div>;
};
export default DailyPage;