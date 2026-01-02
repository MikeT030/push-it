import { useState, useEffect } from "react";
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isFuture, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";
import { usePushUpData } from "@/hooks/usePushUpData";
import ProgressRing from "@/components/ProgressRing";

const DailyPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [inputValue, setInputValue] = useState("");
  
  const {
    getEntryForDate,
    setEntryForDate,
    getDailyProgress,
    canEditDate,
    dailyTarget,
  } = usePushUpData();

  const currentCount = getEntryForDate(selectedDate);
  const progress = getDailyProgress(selectedDate);
  const isEditable = canEditDate(selectedDate);

  useEffect(() => {
    setInputValue(currentCount > 0 ? currentCount.toString() : "");
  }, [selectedDate, currentCount]);

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

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDayOfWeek = startOfMonth(currentMonth).getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="min-h-screen bg-background pb-32 safe-top">
      <div className="px-6 pt-12">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-black text-foreground tracking-tight">
            TODAY
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            {format(selectedDate, "EEEE, dd.MM.yyyy")}
          </p>
        </header>

        {/* Progress Card */}
        <div className="card-glass rounded-2xl p-6 mb-6 animate-slide-up">
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
          {isEditable && (
          <div className="mt-6 flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => adjustCount(-10)}
                className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-muted transition-colors active:scale-95"
              >
                <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <input
                type="number"
                inputMode="numeric"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="0"
                className="flex-1 min-w-0 h-12 sm:h-14 bg-secondary rounded-xl text-center text-xl sm:text-2xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              
              <button
                onClick={() => adjustCount(10)}
                className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors active:scale-95"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}

          {!isEditable && (
            <p className="mt-6 text-center text-muted-foreground text-sm">
              Future dates cannot be edited
            </p>
          )}
        </div>

        {/* Calendar Card */}
        <div className="card-glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subDays(currentMonth, 30))}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <button
              onClick={() => setCurrentMonth(addDays(currentMonth, 30))}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, i) => (
              <div
                key={i}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {monthDays.map((day) => {
              const dayCount = getEntryForDate(day);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const isFutureDate = isFuture(startOfDay(day));
              const hasEntry = dayCount > 0;
              const metGoal = dayCount >= dailyTarget;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  disabled={false}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : isTodayDate
                      ? "bg-secondary text-foreground ring-2 ring-primary/50"
                      : isFutureDate
                      ? "text-muted-foreground/40"
                      : hasEntry
                      ? metGoal
                        ? "bg-primary/20 text-primary"
                        : "bg-accent/20 text-accent"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span>{format(day, "d")}</span>
                  {hasEntry && !isSelected && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        metGoal ? "bg-primary" : "bg-accent"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyPage;
