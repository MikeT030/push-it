import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfYear, differenceInDays, eachDayOfInterval, subDays } from "date-fns";
import { TrendingUp, Flame, Calendar, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushUpData } from "@/hooks/usePushUpData";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import ProgressRing from "@/components/ProgressRing";
import MultiColorTargetIcon from "@/components/MultiColorTargetIcon";
import WeeklyOverview from "@/components/WeeklyOverview";

const TotalPage = () => {
  const navigate = useNavigate();
  const {
    getTotalPushUps,
    getYearProgress,
    getEntryForDate,
    yearlyGoal,
    dailyTarget,
    isLoaded
  } = usePushUpData();
  const { avatar } = useUserAvatar();
  const totalPushUps = isLoaded ? getTotalPushUps() : 0;
  const yearProgress = isLoaded ? getYearProgress() : 0;
  const remaining = Math.max(0, yearlyGoal - totalPushUps);

  const stats = useMemo(() => {
    if (!isLoaded) {
      return {
        daysElapsed: 0,
        daysRemaining: 365,
        streak: 0,
        weeklyAvg: 0,
        allTimeAvg: 0,
        paceStatus: "behind" as const,
        paceDiff: 0,
        requiredDaily: 0,
        expectedByNow: 0
      };
    }
    const today = new Date();
    const yearStart = startOfYear(today);
    const daysElapsed = differenceInDays(today, yearStart) + 1;
    const daysRemaining = 365 - daysElapsed;

    // Calculate streak
    let streak = 0;
    let checkDate = today;
    while (true) {
      const count = getEntryForDate(checkDate);
      if (count > 0) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    // Calculate weekly average (for display)
    const last7Days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today
    });
    const last7Total = last7Days.reduce((sum, day) => sum + getEntryForDate(day), 0);
    const weeklyAvg = Math.round(last7Total / 7);

    // Calculate all-time average (for projection)
    const allTimeAvg = daysElapsed > 0 ? totalPushUps / daysElapsed : 0;

    // Pace calculation
    const expectedByNow = Math.round(daysElapsed / 365 * yearlyGoal);
    const paceStatus = totalPushUps >= expectedByNow ? "ahead" : "behind";
    const paceDiff = Math.abs(totalPushUps - expectedByNow);

    // Required daily to meet goal
    const requiredDaily = daysRemaining > 0 ? Math.floor(remaining / daysRemaining) : 0;
    return {
      daysElapsed,
      daysRemaining,
      streak,
      weeklyAvg,
      allTimeAvg,
      paceStatus,
      paceDiff,
      requiredDaily,
      expectedByNow
    };
  }, [isLoaded, totalPushUps, getEntryForDate, remaining, yearlyGoal]);

  const statCards = useMemo(() => [{
    label: "Today",
    value: `${getEntryForDate(new Date())}`,
    unit: "P-Ups",
    icon: null,
    customIcon: <MultiColorTargetIcon size={20} />,
    color: ""
  }, {
    label: "Daily Avg.",
    value: `${Math.round(stats.allTimeAvg || 0)}`,
    unit: "/day",
    icon: TrendingUp,
    color: "text-primary"
  }, {
    label: "Days Left",
    value: `${stats.daysRemaining}`,
    unit: "days",
    icon: Calendar,
    color: "text-[#0ABAB5]"
  }, {
    label: "Streak",
    value: `${stats.streak}`,
    unit: "days",
    icon: Flame,
    color: "text-[#C029DE]"
  }], [stats, getEntryForDate]);

  if (!isLoaded) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>;
  }

  return <div className="min-h-screen bg-background pb-32 safe-top">
      {/* Top Gradient */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-r from-[#00D4C8] via-[#E040FB] to-[#7B2FF2] opacity-80 blur-3xl pointer-events-none" />
      
      <div className="relative max-w-lg mx-auto px-6 py-8">
        {/* Add Push-ups Button & Profile */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate("/daily")} className="group relative px-5 py-2.5 rounded-xl font-semibold text-sm
              bg-[#0ABAB5]/15 backdrop-blur-sm border border-[#0ABAB5]/40 text-[#0ABAB5]
              shadow-[0_4px_0_0_rgba(10,186,181,0.3),0_6px_16px_rgba(10,186,181,0.2)]
              hover:bg-[#0ABAB5]/25 hover:border-[#0ABAB5]/60
              hover:shadow-[0_4px_0_0_rgba(10,186,181,0.4),0_8px_20px_rgba(10,186,181,0.3)]
              active:shadow-[0_0px_0_0_rgba(10,186,181,0.2),0_2px_4px_rgba(10,186,181,0.15)]
              active:translate-y-1 active:bg-[#0ABAB5]/30
              transition-all duration-100 ease-out
              flex items-center gap-2">
            <Plus className="w-4 h-4 transition-transform group-active:scale-90" />
            Add Push-Ups
          </button>
          <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-full bg-transparent border border-white flex items-center justify-center hover:bg-white/10 transition-colors">
            <User className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Header */}
        <header className="mb-2 animate-fade-in">
          <h1 className="text-4xl font-black text-foreground tracking-tight pt-[20px]">You</h1>
          <p className="text-sm text-[#ffffff] font-medium uppercase tracking-wide mt-1">
            {format(new Date(), "EEEE, d. MMMM")}
          </p>
        </header>

        {/* Main Progress Card */}
        <div className="bg-card rounded-2xl p-6 mt-6 animate-slide-up">
          <h2 className="text-lg font-bold text-foreground mb-4">Yearly</h2>
          
          <div className="flex items-center gap-6">
            <ProgressRing progress={yearProgress} size={140} strokeWidth={14} enableAnimation={false} />
            
            <div className="flex-1">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-black text-[#0ab8b2]">
                  {totalPushUps.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-xl font-bold text-foreground">
                  {remaining.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Pace indicator */}
          <div className={`mt-4 p-3 rounded-xl ${stats.paceStatus === "ahead" ? "bg-primary/10" : "bg-[#C029DE]/10"}`}>
            <p className={`text-sm font-medium ${stats.paceStatus === "ahead" ? "text-primary" : "text-[#C029DE]"}`}>
              {stats.paceStatus === "ahead" ? "🎉 " : "💪 "}
              You're {stats.paceDiff.toLocaleString()} push-ups {stats.paceStatus} schedule
            </p>
          </div>

          {/* Projected completion date */}
          <div className="mt-3 p-3 rounded-xl bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              {stats.allTimeAvg > 0 ? <>
                  🎯 At this pace you'll hit the {yearlyGoal.toLocaleString()} on{" "}
                  <span className="font-semibold text-foreground">
                    {format(new Date(Date.now() + remaining / stats.allTimeAvg * 24 * 60 * 60 * 1000), "MMMM d, yyyy")}
                  </span>
                </> : "Start logging push-ups to see your projected completion date"}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isClickable = stat.label === "Today";
          return <div key={stat.label} className={`bg-card rounded-2xl p-5 animate-slide-up ${isClickable ? "cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all" : ""}`} style={{
            animationDelay: `${0.1 + index * 0.05}s`,
            ...(isClickable && {
              boxShadow: "0 0 20px 2px rgba(10, 186, 181, 0.32)"
            })
          }} onClick={isClickable ? () => navigate("/daily") : undefined}>
                <div className="flex items-center gap-2 mb-3">
                  {stat.customIcon ? stat.customIcon : Icon && <Icon className={`w-5 h-5 ${stat.color}`} />}
                  <p className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </p>
                </div>
                <p className="text-3xl font-black text-foreground">
                  {stat.value}
                  <span className="text-base font-medium text-muted-foreground ml-1">
                    {stat.unit}
                  </span>
                </p>
              </div>;
        })}
        </div>

        {/* Weekly Overview & Goal Cards Grid */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {/* Weekly Overview Card */}
          <WeeklyOverview />

          {/* Goal Card */}
          <div className="col-span-2 bg-card rounded-2xl p-6 animate-slide-up" style={{
          animationDelay: "0.35s"
        }}>
          <h2 className="text-lg font-bold text-foreground mb-4">
            Personal Goal {new Date().getFullYear()}
          </h2>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-black line-through text-white">
                {yearlyGoal.toLocaleString()}
              </p>
              <p className="text-4xl font-black text-gradient">
                {remaining.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                push-ups remaining
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {dailyTarget}
              </p>
              <p className="text-sm text-muted-foreground">
                per day target
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700" style={{
              width: `${yearProgress}%`
            }} />
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Day {stats.daysElapsed} of 365
          </p>
        </div>
        </div>
      </div>
    </div>;
};

export default TotalPage;
