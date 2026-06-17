import { useState, useEffect, useMemo, useRef } from "react";
import { format, addMonths, subMonths, subDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isFuture, startOfDay, isSameMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Minus, ChevronDown } from "lucide-react";
import defaultAvatarWhite from "@/assets/default-avatar-white.svg";
import smallCircleIcon from "@/assets/small-circle-icon-2.svg";
import ShareIcon from "@/components/ShareIcon";
import { useNavigate } from "react-router-dom";
import { usePushUpData } from "@/hooks/usePushUpData";
import ProgressRing from "@/components/ProgressRing";
import MuscleConfetti from "@/components/MuscleConfetti";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useGame } from "@/contexts/GameContext";
import WeeklyOverview from "@/components/WeeklyOverview";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { Switch } from "@/components/ui/switch";
import BrickBreakerGame from "@/components/BrickBreakerGame";
import SpaceShooterGame from "@/components/SpaceShooterGame";
import controllerIcon from "@/assets/controller.svg";
const DailyPage = () => {
  
  const [activeGame, setActiveGame] = useState<"select" | "brickbreaker" | "spaceshooter" | null>(null);
  const navigate = useNavigate();
  const { avatar } = useUserAvatar();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [inputValue, setInputValue] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);
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
  const yesterdayCount = isLoaded ? getEntryForDate(subDays(selectedDate, 1)) : 0;
  const progress = isLoaded ? getDailyProgress(selectedDate) : 0;
  const isEditable = canEditDate(selectedDate);
  const miniScrollRef = useRef<HTMLDivElement>(null);
  const miniDays = useMemo(() => {
    const today = new Date();
    const days: Date[] = [];
    for (let i = 364; i >= 0; i--) days.push(subDays(today, i));
    return days;
  }, []);
  useEffect(() => {
    if (miniScrollRef.current) {
      miniScrollRef.current.scrollLeft = miniScrollRef.current.scrollWidth;
    }
  }, [isLoaded]);
  useEffect(() => {
    setInputValue(currentCount > 0 ? currentCount.toString() : "");
  }, [selectedDate, currentCount]);
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const firstDayOfWeek = (monthStart.getDay() + 6) % 7; // Monday = 0

    // Get days from previous month to fill the first week
    const prevMonthEnd = endOfMonth(subMonths(currentMonth, 1));
    const prevDays: Date[] = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(prevMonthEnd);
      d.setDate(prevMonthEnd.getDate() - i);
      prevDays.push(d);
    }

    const currentDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Fill remaining days from next month to complete the grid
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
        <div className="flex justify-between items-center mb-4 animate-fade-in pb-[20px]">
          <Button disabled variant="outline" className="rounded-full px-5 py-2 border-2 border-transparent text-transparent bg-transparent pointer-events-none opacity-0">
            <Plus className="w-4 h-4" />
            Add push-ups
          </Button>
          <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: avatar ? "linear-gradient(135deg, #BEE7FD, #ECF5FF)" : "transparent", border: avatar ? "none" : "1px solid white" }}>
            {avatar ?
          <img src={avatar.src} alt={avatar.name} className="w-full h-full object-cover" /> :

          <img src={defaultAvatarWhite} alt="User" className="w-5 h-5 object-contain" />
          }
          </button>
        </div>

        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <img src={smallCircleIcon} alt="" className="w-7 h-7" />
            <h1 className="text-4xl font-black text-foreground tracking-tight pt-0">You Push</h1>
          </div>
          <p className="text-lg text-muted-foreground mt-1">
            {format(selectedDate, "EEEE, dd.MM.yyyy")}
          </p>
        </header>



        <div className="flex items-center justify-end mb-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <button
            onClick={() => setActiveGame("select")}
            className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Open mini game"
          >
            <img src={controllerIcon} alt="Game" className="w-6 h-6" />
          </button>
        </div>


        {/* Weekly Overview */}
        <div className={`mt-6 mb-6 animate-slide-up transition-opacity ${isGameActive ? "pointer-events-none opacity-50" : ""}`} style={{ animationDelay: "0.2s" }}>
          <WeeklyOverview />
        </div>
      </div>
      <BrickBreakerGame isOpen={activeGame === "brickbreaker"} onClose={() => setActiveGame(null)} />
      
      {/* Game Selection Modal */}
      {activeGame === "select" && (
        <div className="fixed inset-0 z-50 backdrop-blur-xl bg-[#0F1922]/30 flex items-center justify-center p-4" onClick={() => setActiveGame(null)}>
          <button
            onClick={(e) => { e.stopPropagation(); setActiveGame(null); }}
            className="fixed top-[max(16px,env(safe-area-inset-top,0px))] right-4 z-[51] p-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <div className="rounded-2xl p-6 max-w-sm w-full space-y-4 bg-card/60 backdrop-blur-md border border-border/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl text-foreground font-semibold text-center">Choose a Game</h2>
            <button
              onClick={() => setActiveGame("brickbreaker")}
              className="w-full p-4 rounded-xl border border-border/50 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors text-left"
            >
              <p className="font-semibold text-foreground">🧱 Brick Breaker</p>
              <p className="text-sm text-muted-foreground">Classic brick-breaking action</p>
            </button>
            <button
              onClick={() => setActiveGame("spaceshooter")}
              className="w-full p-4 rounded-xl border border-border/50 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors text-left"
            >
              <p className="font-semibold text-foreground">🚀 Space Shooter</p>
              <p className="text-sm text-muted-foreground">Blast falling objects in space</p>
            </button>
          </div>
        </div>
      )}

      {/* Space Shooter Game */}
      {activeGame === "spaceshooter" && (
        <div className="fixed inset-0 z-50">
          <SpaceShooterGame onBack={() => setActiveGame(null)} />
        </div>
      )}
    </div>;
};
export default DailyPage;