import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfYear, differenceInDays, eachDayOfInterval, subDays } from "date-fns";
import { TrendingUp, Flame, Calendar, ChevronDown, ChevronRight, Wrench } from "lucide-react";

import defaultAvatarWhite from "@/assets/default-avatar-white.svg";
import rocketAsset from "@/assets/rocket.svg.asset.json";
import megaphoneAsset from "@/assets/megaphone.svg.asset.json";
import { Button } from "@/components/ui/button";
import { usePushUpData } from "@/hooks/usePushUpData";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import ProgressRing from "@/components/ProgressRing";
import MultiColorTargetIcon from "@/components/MultiColorTargetIcon";
import WeeklyOverview from "@/components/WeeklyOverview";
import DailySection from "@/components/DailySection";

const TotalPage = () => {
  const navigate = useNavigate();
  const {
    getTotalPushUps,
    getYearProgress,
    getEntryForDate,
    getGoalCompletionDate,
    yearlyGoal: baseYearlyGoal,
    dailyTarget,
    isLoaded
  } = usePushUpData();
  const { avatar } = useUserAvatar();

  const [goalBoost, setGoalBoost] = useState(0); // in thousands
  const [showGoalAdjust, setShowGoalAdjust] = useState(false);
  const yearlyGoal = baseYearlyGoal + goalBoost * 1000;

  const totalPushUps = isLoaded ? getTotalPushUps() : 0;
  const rawYearProgress = isLoaded ? getYearProgress() : 0;
  const yearProgress = baseYearlyGoal > 0
    ? Math.min(100, (rawYearProgress * baseYearlyGoal) / yearlyGoal)
    : rawYearProgress;
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

  const completionDate = useMemo(() => {
    if (!isLoaded || totalPushUps < yearlyGoal) return null;
    return getGoalCompletionDate();
  }, [isLoaded, totalPushUps, yearlyGoal, getGoalCompletionDate]);

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
    color: "text-[#FF2C2C]"
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
        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <DailySection />
        </div>

        {/* Weekly Overview & Goal Cards Grid */}
        <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          {/* Weekly Overview Card */}
          <WeeklyOverview />
        </div>

        {/* Main Progress Card */}
          <div className="bg-card/40 rounded-2xl p-6 animate-slide-up pt-[10px] px-[10px] border border-[#3B404F] pb-[10px] mb-0" style={{ animationDelay: "0.25s" }}>
            <div className="flex items-center mb-[6px] mx-[10px]">
              <h2 className="text-lg text-foreground font-semibold">Yearly</h2>
            </div>

            <div className="h-px mb-4 mx-[10px] bg-[#3b404f]" />

            {/* Progress bar */}
            <div className="mb-2 h-3 rounded-full overflow-hidden bg-[#3b404f] mx-[10px]">
              <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700" style={{
                width: `${yearProgress}%`
              }} />
            </div>
            <p className="text-sm text-muted-foreground mb-4 text-center mx-[10px]">
              Day {stats.daysElapsed} of 365
            </p>

            
              <div className="flex items-center gap-6 mx-[10px]">
                <div className="flex-1 flex items-start gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="font-black text-[#0ab8b2] text-xl">
                      {totalPushUps.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className={`text-xl font-bold ${totalPushUps >= baseYearlyGoal && goalBoost === 0 ? 'text-[#0ab8b2]' : 'text-foreground'}`}>
                      {totalPushUps >= baseYearlyGoal && goalBoost === 0
                        ? `+${(totalPushUps - baseYearlyGoal).toLocaleString()}`
                        : remaining.toLocaleString()}
                    </p>
                  </div>
                  <div className="relative flex flex-col items-center">
                    <div className="flex items-center gap-1.5">
                      <div className="text-left">
                        <p className="text-sm text-muted-foreground">Goal</p>
                        <p className="text-xl font-bold text-foreground">
                          {yearlyGoal.toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowGoalAdjust((s) => !s)}
                        className="focus:outline-none mt-3"
                      >
                        <Wrench size={14} className="text-muted-foreground hover:text-foreground transition-colors" />
                      </button>
                    </div>
                    <div className="mt-1 h-px w-8 bg-white/30 rounded-full" />
                    {showGoalAdjust && (
                      <div
                        className="absolute z-20 top-full left-1/2 -translate-x-1/2 -ml-[38px] mt-2 rounded-xl p-2 backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col gap-1.5 animate-fade-in items-center"
                      >
                        {goalBoost > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setGoalBoost(0);
                              setShowGoalAdjust(false);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground bg-white/0 hover:bg-white/10 border border-white/10 transition-colors"
                          >
                            Reset
                          </button>
                        )}
                        <div className="flex gap-1.5">
                          {[10, 20, 30].map((inc) => (
                            <button
                              key={inc}
                              type="button"
                              onClick={() => {
                                setGoalBoost((b) => b + inc);
                                setShowGoalAdjust(false);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-foreground bg-white/5 hover:bg-white/15 border border-white/10 backdrop-blur-md transition-colors whitespace-nowrap"
                            >
                              +{inc}K
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Inset cut-out group: pace + projected completion */}
              <div className="mt-4 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] ring-1 ring-white/5 p-3 space-y-2 pt-[20px] pb-[20px] mx-[10px]">
                {/* Pace indicator */}
                <div>
                  <p className="text-sm font-medium text-left text-muted-foreground flex items-center gap-1.5">
                    <span
                      className="inline-block w-4 h-4 flex-shrink-0"
                      style={{
                        backgroundColor: "#00C3FF",
                        WebkitMaskImage: `url(${stats.paceStatus === "ahead" ? rocketAsset.url : megaphoneAsset.url})`,
                        maskImage: `url(${stats.paceStatus === "ahead" ? rocketAsset.url : megaphoneAsset.url})`,
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskPosition: "center",
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                      }}
                    />
                    <span>
                      <span className="font-semibold text-slate-50">
                        {stats.paceDiff.toLocaleString()}
                      </span>{" "}
                      push-ups {stats.paceStatus === "ahead" ? "above" : "below"} Target 82/d
                    </span>
                  </p>
                </div>

                {/* Projected completion date */}
                <div>
                  <p className="text-sm text-muted-foreground text-left flex items-center gap-1.5">
                    {completionDate ? <>
                        <MultiColorTargetIcon className="w-4 h-4 flex-shrink-0" />
                        <span>
                          You completed {Math.round(yearlyGoal / 1000)}k PUS on{" "}
                          <span className="font-semibold text-foreground">
                            {format(completionDate, "MMMM d, yyyy")}
                          </span>
                        </span>
                      </> : stats.allTimeAvg > 0 ? <>
                        <MultiColorTargetIcon className="w-4 h-4 flex-shrink-0" />
                        <span>
                          Hitting {Math.round(yearlyGoal / 1000)}K on{" "}
                          <span className="font-semibold text-foreground">
                            {format(new Date(Date.now() + remaining / stats.allTimeAvg * 24 * 60 * 60 * 1000), "MMMM d, yyyy")}
                          </span>
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
