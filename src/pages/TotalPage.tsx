import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfYear, differenceInDays, eachDayOfInterval, subDays } from "date-fns";
import { TrendingUp, Flame, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import defaultAvatarWhite from "@/assets/default-avatar-white.svg";
import { Button } from "@/components/ui/button";
import { usePushUpData } from "@/hooks/usePushUpData";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import ProgressRing from "@/components/ProgressRing";
import MultiColorTargetIcon from "@/components/MultiColorTargetIcon";
import WeeklyOverview from "@/components/WeeklyOverview";
import MountainGoalCard from "@/components/MountainGoalCard";
import LineChartGoalCard from "@/components/LineChartGoalCard";
import DailySection from "@/components/DailySection";

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

    let streak = 0;
    let checkDate = today;
    // If today has an entry, count it; otherwise skip (day isn't over yet)
    if (getEntryForDate(checkDate) > 0) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      checkDate = subDays(checkDate, 1);
    }
    while (true) {
      const count = getEntryForDate(checkDate);
      if (count > 0) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    const last7Days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today
    });
    const last7Total = last7Days.reduce((sum, day) => sum + getEntryForDate(day), 0);
    const weeklyAvg = Math.round(last7Total / 7);
    const allTimeAvg = daysElapsed > 0 ? totalPushUps / daysElapsed : 0;
    const expectedByNow = Math.round(daysElapsed / 365 * yearlyGoal);
    const paceStatus = totalPushUps >= expectedByNow ? "ahead" : "behind";
    const paceDiff = Math.abs(totalPushUps - expectedByNow);
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
    unit: "​",
    icon: null,
    customIcon: <MultiColorTargetIcon size={20} />,
    color: ""
  }, {
    label: "Avg. /d",
    value: `${Math.round(stats.allTimeAvg || 0)}`,
    unit: "​",
    icon: TrendingUp,
    color: "text-primary"
  }, {
    label: "Streak",
    value: `${stats.streak}`,
    unit: "​",
    icon: Flame,
    color: "text-[#C029DE]"
  }, {
    label: "Remaining",
    value: `${stats.daysRemaining}`,
    unit: "​",
    icon: Calendar,
    color: "text-[#0ABAB5]"
  }], [stats, getEntryForDate]);

  if (!isLoaded) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>;
  }

  return <div className="min-h-screen bg-background pb-32 safe-top">
      {/* Animated Top Gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-[28rem] opacity-80 blur-3xl pointer-events-none animated-aurora"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
        }}
      />

      
      <div className="relative max-w-lg mx-auto px-6 space-y-6 py-[32px]">
        {/* Profile Button + Header */}
        <div className="flex justify-between items-center mb-4 animate-fade-in pb-[20px]">
          <h1 className="text-4xl font-black text-foreground tracking-tight">You Push</h1>
          <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: avatar ? "linear-gradient(135deg, #BEE7FD, #ECF5FF)" : "transparent", border: avatar ? "none" : "1px solid white" }}>
            {avatar ? (
              <img src={avatar.src} alt={avatar.name} className="w-full h-full object-cover" />
            ) : (
              <img src={defaultAvatarWhite} alt="User" className="w-5 h-5 object-contain" />
            )}
          </button>
        </div>

        {/* Date */}
        <header className="animate-fade-in">
          <p className="text-sm text-[#ffffff] font-medium uppercase tracking-wide">
            {format(new Date(), "EEEE, d. MMMM")}
          </p>
        </header>


        {/* Daily Push-ups + Calendar */}
        <div>
          <DailySection />
        </div>

        {/* Weekly Overview & Goal Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Weekly Overview Card */}
          <WeeklyOverview />
        </div>

        {/* Stats Strip - Horizontally Scrollable */}
        <div className="flex gap-3 overflow-x-auto -mx-2 px-2 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {statCards.filter(s => s.label !== "Today" && s.label !== "Remaining" && s.label !== "Avg. /d" && s.label !== "Streak").map((stat, index) => {
            const Icon = stat.icon;
            return <div key={stat.label} className="flex-shrink-0 bg-card/40 rounded-2xl p-5 animate-slide-up" style={{
              minWidth: "140px",
              animationDelay: `${0.1 + index * 0.05}s`
            }}>
                <div className="flex items-center gap-2 mb-3">
                  {stat.customIcon ? stat.customIcon : Icon && <Icon className={`w-5 h-5 ${stat.color}`} />}
                  <p className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </p>
                </div>
                <p className="text-[1.625rem] font-black text-foreground">
                  {stat.value}
                  <span className="text-base font-medium text-muted-foreground ml-1">
                    {stat.unit}
                  </span>
                </p>
              </div>;
          })}
        </div>

        {/* Main Progress Card */}
        <div className="bg-card/40 rounded-2xl p-6 animate-slide-up">

          <h2 className="text-lg font-bold text-foreground mb-4">Yearly</h2>

          <div className="h-px mb-4 bg-[#3b404f]" />

          {/* Progress bar */}
          <div className="mb-2 h-3 rounded-full overflow-hidden bg-[#3b404f]">
            <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700" style={{
              width: `${yearProgress}%`
            }} />
          </div>
          <p className="text-sm text-muted-foreground mb-4 text-left">
            Day {stats.daysElapsed} of 365
          </p>

          <div className="flex items-center gap-6">
            <div className="flex-1 flex items-start gap-8">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="font-black text-[#0ab8b2] text-xl">
                  {totalPushUps.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-xl font-bold text-foreground">
                  {remaining.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Goal</p>
                <p className="text-xl font-bold text-foreground">
                  {yearlyGoal.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Inset cut-out group: pace + projected completion */}
          <div className="mt-4 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] ring-1 ring-white/5 p-3 space-y-2 pt-[20px] pb-[20px]">
            {/* Pace indicator */}
            <div>
              <p className="text-sm font-medium text-left text-muted-foreground">
                {stats.paceStatus === "ahead" ? "🎉 " : "💪 "}
                <span className={stats.paceStatus === "ahead" ? "text-primary font-semibold" : "text-[#C029DE] font-semibold"}>
                  {stats.paceDiff.toLocaleString()}
                </span>{" "}
                push-ups {stats.paceStatus === "ahead" ? "above" : "below"} Target 82/d
              </p>
            </div>

            {/* Projected completion date */}
            <div>
              <p className="text-sm text-muted-foreground text-left">
                {stats.allTimeAvg > 0 ? <>
                    🎯 Hitting {Math.round(yearlyGoal / 1000)}K on{" "}
                    <span className="font-semibold text-foreground">
                      {format(new Date(Date.now() + remaining / stats.allTimeAvg * 24 * 60 * 60 * 1000), "MMMM d, yyyy")}
                    </span>
                  </> : "Start logging push-ups to see your projected completion date"}
              </p>
            </div>
          </div>
        </div>


      </div>
    </div>;
};
export default TotalPage;
