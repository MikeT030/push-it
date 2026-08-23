import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, differenceInDays } from "date-fns";
import { Users, Trophy, Flame, TrendingUp, Info, List, BookOpen, Lightbulb } from "lucide-react";
import defaultAvatarWhite from "@/assets/default-avatar-white.svg";
import defaultAvatarList from "@/assets/default-avatar-list.svg";

import LeaderboardPodium from "@/components/LeaderboardPodium";
import { getAvatarById } from "@/data/avatars";
import WeeklyGroupOverview from "@/components/WeeklyGroupOverview";
import DailyGroupOverview from "@/components/DailyGroupOverview";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useGroupEntries, useGroupProfiles, useGroupUserProgress } from "@/hooks/useGroupData";
import MultiColorTargetIcon from "@/components/MultiColorTargetIcon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GroupLineChartGoalCard from "@/components/GroupLineChartGoalCard";
import GroupMountainGoalCard from "@/components/GroupMountainGoalCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import PlayerCard from "@/components/PlayerCard";
import { useAuth } from "@/contexts/AuthContext";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import PushTheRightWayPanel from "@/components/PushTheRightWayPanel";
import InsightsCard from "@/components/InsightsCard";
import DemoBanner from "@/components/DemoBanner";


type LeaderboardPeriod = "weekly" | "monthly" | "alltime";
type LeaderboardView = "podium" | "list";
interface UserProgress {
  user_id: string;
  display_name: string | null;
  total_pushups: number;
  yearly_goal: number;
  progress_percent: number;
  days_logged: number;
  avatar_url?: string | null;
  streak?: number;
  avg_pushups?: number;
}
const LeaderboardListView = ({ users }: {users: UserProgress[];}) => {
  const [selectedUser, setSelectedUser] = useState<UserProgress | null>(null);
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-card/40 rounded-t-2xl overflow-hidden animate-slide-up">
      {users.map((user, index) => {
        const avatar = getAvatarById(user.avatar_url ?? null);
        return (
          <div
            key={user.user_id}
            className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors ${index < users.length - 1 ? "border-b border-[#3A404F]" : ""}`}
            onClick={() => setSelectedUser(user)}>

            <span className="text-sm font-bold text-muted-foreground w-5 text-center">
              {index + 1}
            </span>
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #BEE7FD, #ECF5FF)" }}>
              {avatar ?
              <img src={avatar.src} alt={user.display_name || "User"} className="w-full h-full object-cover" /> :

              <img src={defaultAvatarList} alt="User" className="w-5 h-5 object-contain" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.display_name || `Member ${index + 1}`}
              </p>
              <p className="text-xs text-foreground flex items-center gap-0.5"><Flame className="w-3 h-3 text-[#FF2C2C]" fill="#FF2C2C" /> <span className="font-bold">{user.streak ?? 0}d</span> streak</p>
              <p className="text-xs text-foreground flex items-center gap-0.5"><span className="text-xs font-bold text-primary">Ø</span> <span className="font-bold">{Math.round(user.avg_pushups ?? 0)}</span> Avg. PU</p>
            </div>

            <div className="flex items-center gap-1 rounded-full px-1.5 py-[2px] border border-white/60">
              <span className="text-[10px] font-bold text-white">{Math.round(user.yearly_goal / 1000)}K</span>
            </div>

            <div className="flex items-center gap-1 rounded-full px-2.5 py-1">
              <span className="text-sm font-bold text-foreground">{user.total_pushups.toLocaleString()}</span>
            </div>
          </div>);

      })}

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-sm p-6 bg-transparent border-none shadow-none" hideCloseButton>
          {selectedUser &&
          <PlayerCard
            displayName={selectedUser.display_name || "Unknown"}
            avatar={getAvatarById(selectedUser.avatar_url ?? null)}
            totalPushUps={selectedUser.total_pushups}
            yearlyGoal={selectedUser.yearly_goal}
            currentStreak={selectedUser.streak ?? 0}
            weeklyAverage={Math.round(selectedUser.avg_pushups ?? 0)}
            yearProgress={selectedUser.progress_percent}
            daysWithEntries={selectedUser.days_logged}
            onAvatarClick={
            authUser?.id === selectedUser.user_id ?
            () => {
              setSelectedUser(null);
              navigate("/profile?openAvatar=true");
            } :
            undefined
            } />

          }
        </DialogContent>
      </Dialog>
    </div>);

};

const GroupPage = () => {
  const navigate = useNavigate();
  const { avatar } = useUserAvatar();
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>("weekly");
  const [leaderboardView, setLeaderboardView] = useState<LeaderboardView>("podium");
  
  const [groupSelectedDate, setGroupSelectedDate] = useState<Date>(() => new Date());

  const progressQuery = useGroupUserProgress();
  const profilesQuery = useGroupProfiles();
  const entriesQuery = useGroupEntries();

  const isLoading =
    progressQuery.isLoading || profilesQuery.isLoading || entriesQuery.isLoading;
  const allEntries = entriesQuery.data || [];

  const users = useMemo<UserProgress[]>(() => {
    const data = progressQuery.data || [];
    const profiles = profilesQuery.data || [];
    const entries = entriesQuery.data || [];

    const avatarMap = new Map(profiles.map((p) => [p.id, p.avatar_url]));

    // Streaks
    const userDates = new Map<string, Set<string>>();
    entries.forEach((e) => {
      if (!userDates.has(e.user_id)) userDates.set(e.user_id, new Set());
      userDates.get(e.user_id)!.add(e.date);
    });
    const streakMap = new Map<string, number>();
    userDates.forEach((dates, userId) => {
      let streak = 0;
      let checkDate = new Date();
      const todayStr = format(checkDate, "yyyy-MM-dd");
      if (dates.has(todayStr)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        checkDate = subDays(checkDate, 1);
      }
      while (true) {
        const dateStr = format(checkDate, "yyyy-MM-dd");
        if (dates.has(dateStr)) {
          streak++;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }
      streakMap.set(userId, streak);
    });

    // Average push-ups per logged day
    const avgMap = new Map<string, number>();
    const userTotals = new Map<string, { total: number; days: Set<string> }>();
    entries.forEach((e) => {
      if (!userTotals.has(e.user_id)) userTotals.set(e.user_id, { total: 0, days: new Set() });
      const ut = userTotals.get(e.user_id)!;
      ut.total += e.count;
      ut.days.add(e.date);
    });
    userTotals.forEach((val, userId) => {
      avgMap.set(userId, val.days.size > 0 ? val.total / val.days.size : 0);
    });

    return data.map((u: any) => ({
      ...u,
      avatar_url: avatarMap.get(u.user_id) || null,
      streak: streakMap.get(u.user_id) || 0,
      avg_pushups: avgMap.get(u.user_id) || 0,
    }));
  }, [progressQuery.data, profilesQuery.data, entriesQuery.data]);

  // Compute period-filtered leaderboard users
  const filteredUsers = useMemo(() => {
    if (leaderboardPeriod === "alltime") {
      return users.filter((u) => u.total_pushups > 0);
    }

    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (leaderboardPeriod === "weekly") {
      periodStart = startOfWeek(now, { weekStartsOn: 1 });
      periodEnd = endOfWeek(now, { weekStartsOn: 1 });
    } else {
      periodStart = startOfMonth(now);
      periodEnd = endOfMonth(now);
    }

    const startStr = format(periodStart, "yyyy-MM-dd");
    const endStr = format(periodEnd, "yyyy-MM-dd");

    // Sum entries per user within the period
    const periodTotals = new Map<string, {total: number;days: Set<string>;}>();
    allEntries.forEach((e: any) => {
      if (e.date >= startStr && e.date <= endStr) {
        if (!periodTotals.has(e.user_id)) periodTotals.set(e.user_id, { total: 0, days: new Set() });
        const ut = periodTotals.get(e.user_id)!;
        ut.total += e.count;
        ut.days.add(e.date);
      }
    });

    return users.
    map((u) => {
      const pt = periodTotals.get(u.user_id);
      return {
        ...u,
        total_pushups: pt?.total || 0,
        days_logged: pt?.days.size || 0,
        avg_pushups: pt ? pt.total / pt.days.size : 0
      };
    }).
    filter((u) => u.total_pushups > 0).
    sort((a, b) => b.total_pushups - a.total_pushups);
  }, [users, allEntries, leaderboardPeriod]);

  // Active users = logged at least one push-up in the last 30 calendar days
  const activeUserIds = useMemo(() => {
    const cutoff = format(subDays(new Date(), 30), "yyyy-MM-dd");
    const ids = new Set<string>();
    allEntries.forEach((e: any) => {
      if (e.date >= cutoff && e.count > 0) ids.add(e.user_id);
    });
    return ids;
  }, [allEntries]);

  const activeUserCount = activeUserIds.size;

  const stats = useMemo(() => {
    const activeUsers = users.filter((u) => activeUserIds.has(u.user_id));
    const totalMembers = activeUsers.length;
    // Total push-ups includes ALL users (historical push-ups are never removed)
    const totalPushups = users.reduce((sum, u) => sum + u.total_pushups, 0);
    const avgProgress = totalMembers > 0 ? activeUsers.reduce((sum, u) => sum + u.progress_percent, 0) / totalMembers : 0;
    const today = new Date();
    const yearStart = startOfYear(today);
    const daysElapsed = differenceInDays(today, yearStart) + 1;
    const expectedProgress = daysElapsed / 365 * 100;
    const onTrackCount = activeUsers.filter((u) => u.progress_percent >= expectedProgress).length;
    const avgPuPerDay = daysElapsed > 0 ? Math.round(totalPushups / daysElapsed) : 0;
    return {
      totalMembers,
      totalPushups,
      avgProgress,
      onTrackCount,
      expectedProgress,
      avgPuPerDay
    };
  }, [users, activeUserIds]);


  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const el = e.currentTarget as HTMLElement;
    el.dataset.touchStartX = touch.clientX.toString();
    el.dataset.touchStartY = touch.clientY.toString();
    // Store whether touch started inside a scrollable element
    const target = e.target as HTMLElement;
    el.dataset.touchInsideScrollable = target.closest("[data-horizontal-scroll]") ? "1" : "0";
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const el = e.currentTarget as HTMLElement;
    const startX = parseFloat(el.dataset.touchStartX || "0");
    const startY = parseFloat(el.dataset.touchStartY || "0");
    const diffX = touch.clientX - startX;
    const diffY = touch.clientY - startY;
    const isInsideScrollable = el.dataset.touchInsideScrollable === "1";
    // Only switch tabs if swipe is predominantly horizontal (ratio > 2) and exceeds threshold
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 2 && !isInsideScrollable) {
      if (diffX > 0 && activeTab === "stats") {
        setActiveTab("leaderboard");
      } else if (diffX < 0 && activeTab === "leaderboard") {
        setActiveTab("stats");
      }
    }
  };
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center pb-32">
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

      <div className="relative max-w-lg mx-auto px-6 py-8">
        {/* Demo Banner + Header */}
        <div className="flex flex-col gap-[10px]">
          <DemoBanner />
          <div className="flex justify-between items-center mb-4 animate-fade-in pb-[20px]">
            <div className="flex items-center gap-3">
              
              <h1 className="sr-only">We Push</h1>
            </div>
            <div className="rounded-full bg-card/40 border border-[#3B404F] p-1 flex items-center gap-2">
              <PushTheRightWayPanel
                trigger={
                  <button
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                    aria-label="Open Push the Right Way"
                  >
                    <BookOpen className="w-5 h-5 text-white" />
                  </button>
                }
              />
              <InsightsCard
                userId={authUser?.id ?? null}
                allEntries={allEntries}
                colorVariant="sky"
                trigger={
                  <button
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                    aria-label="Get your insights"
                  >
                    <Lightbulb className="w-5 h-5 text-white" />
                  </button>
                }
              />
              <button onClick={() => navigate("/profile")} className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: avatar ? "linear-gradient(135deg, #BEE7FD, #ECF5FF)" : "transparent", border: avatar ? "none" : "1px solid white" }}>
                {avatar ?
              <img src={avatar.src} alt={avatar.name} className="w-full h-full object-cover" /> :

              <img src={defaultAvatarWhite} alt="User" className="w-4 h-4 object-contain" />
              }
              </button>
            </div>
          </div>
        </div>


        {/* Section Label */}
        <h2 className="text-foreground mb-6 text-xl font-medium animate-fade-in" style={{ animationDelay: "0.05s" }}>Leaderboard & Stats</h2>

        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div>
            <div className="mt-0">

              {/* Period Toggle */}
              <div className="flex gap-1 rounded-full p-1 mb-5 px-[4px]">
                {(["alltime", "weekly", "monthly"] as LeaderboardPeriod[]).map((period) =>
              <button
                key={period}
                onClick={() => setLeaderboardPeriod(period)}
                className={`flex-1 py-2 px-2 rounded-full text-sm font-medium transition-all border ${
                leaderboardPeriod === period ?
                "bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5]" :
                "text-muted-foreground border-[#3B404F]"}`
                }>

                    {period === "weekly" ? "Week" : period === "monthly" ? "Month" : "Year"}
                  </button>
              )}
              </div>
              {/* View Toggle */}
              <div className="flex justify-center mb-3">
                <button
                onClick={() => setLeaderboardView(leaderboardView === "podium" ? "list" : "podium")}
                className="p-2.5 rounded-xl border border-[#D9D9D9] bg-transparent transition-colors"
                aria-label="Toggle view">

                  {leaderboardView === "podium" ?
                <List className="w-5 h-5 text-[#D9D9D9]" /> :

                <Trophy className="w-5 h-5 text-[#D9D9D9]" />
                }
                </button>
              </div>

              {filteredUsers.length === 0 ?
            <div className="p-6 text-center">
                  <p className="text-muted-foreground">No data for this period yet.</p>
                </div> :
            leaderboardView === "podium" ?
            <LeaderboardPodium users={filteredUsers} /> :

            <LeaderboardListView users={filteredUsers} />
            }

              {/* Group Stats Row - attached to leaderboard */}
              <div className="bg-card/40 rounded-b-2xl px-4 pt-[20px] animate-slide-up" style={{ animationDelay: "0.05s" }}>
                <div className="flex gap-6 overflow-x-auto py-4 border-t border-[#575F78] pt-[24px] pb-[24px]" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  <div className="flex-shrink-0 flex items-start gap-2 pl-[4px] pr-[4px]" style={{ minWidth: "90px" }}>
                    <svg className="w-5 h-5 text-[#d291df]" viewBox="0 0 84 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0.709653 64.0509C1.07685 61.3219 1.52998 57.9224 1.87377 53.9888C2.86988 42.6362 18.28 20.0169 21.2721 16.0368C21.858 15.2571 22.3229 14.2162 22.819 13.1129C23.6979 11.148 24.6979 8.92198 26.5339 7.95898C27.6316 7.38589 29.5808 6.64129 31.8387 5.7758C35.659 4.31778 40.4091 2.50107 42.9948 0.707714C43.9441 0.0488562 44.7957 -0.149971 45.5261 0.111233C46.7917 0.567361 47.5378 2.35679 47.7214 3.0117C47.7917 3.23392 49.3308 8.06421 50.284 9.9433C51.0887 11.5261 51.9559 14.3058 51.0418 15.4636C50.6512 15.9626 49.8934 16.1185 48.8229 15.9665C49.3386 14.6722 49.2214 13.0933 48.4558 11.8769C47.1119 9.74051 45.2916 3.99018 45.2916 3.99018C45.3229 4.23968 46.1197 10.0992 47.5807 12.4227C48.2761 13.526 48.28 15.0854 47.5925 16.1263C46.9323 17.1243 45.7486 17.5726 44.1588 17.444C44.9205 10.5007 42.3072 8.41493 42.3072 8.41493C43.815 10.1848 43.4049 15.4947 43.0962 17.5726C42.815 17.8923 41.6431 18.9995 39.1548 18.8864C38.4907 18.8591 37.9829 18.6369 37.5923 18.2003C36.7797 17.2958 36.7407 15.7676 36.7485 15.2647C39.4829 14.7189 39.5063 12.6449 39.5063 12.6449C39.4829 12.6878 39.1391 13.2297 38.2094 13.7092L38.2172 13.6897C36.5453 13.3154 36.7719 10.6722 36.7719 10.641C36.7719 10.641 35.5297 13.0347 36.9164 14.1731C36.1664 14.3602 35.2289 14.4694 34.0414 14.4109C34.0414 14.4109 34.6508 15.5493 35.7211 15.4012C35.725 15.9937 35.8149 17.1399 36.3383 18.1418C34.8813 19.0775 33.5219 19.3426 32.2913 18.9177C29.3811 17.9079 27.971 13.4519 27.9554 13.4051C27.9554 13.4051 28.5179 18.6019 31.846 19.8455C30.1976 22.2665 24.4475 31.1552 24.3303 37.303V37.3849L24.3538 37.4628C24.3772 37.5408 26.6936 45.4119 25.2249 53.587C23.8029 61.5088 16.9903 62.6784 16.7013 62.7212C16.7013 62.7212 21.2209 63.0058 24.0608 59.0682C24.4788 59.1501 24.9319 59.1969 25.4007 59.1969C26.3811 59.1969 27.3851 59.0604 28.0569 58.9474C28.1741 61.6452 25.9905 63.6802 25.9905 63.6802C28.3186 62.347 28.7093 60.6901 29.0882 59.0877C29.639 56.7485 30.1468 54.4913 36.94 52.85C47.6391 50.2692 52.3382 56.9045 52.4172 57.0371C52.4172 57.0371 52.2961 54.8656 50.0813 53.4192C60.6984 41.2523 78.1987 48.4837 80.0508 49.2946C81.168 51.5518 91.1879 73.5357 67.1955 89.8744C67.012 90.003 66.8205 90.0303 66.5744 89.9679C64.3166 89.3909 60.6799 82.2839 58.5079 78.0385C57.3087 75.6954 56.6095 74.3427 56.172 73.8593C54.4219 71.91 51.0469 74.6663 51.0469 74.6663C51.9141 74.2491 54.3789 73.4109 55.3986 74.5454C55.6329 74.8066 56.0626 75.5707 56.59 76.5844C53.7618 78.4479 39.6877 86.5806 20.9254 78.136C25.195 77.1848 27.988 73.8008 27.988 73.8008C18.3551 81.325 3.28061 75.5864 0.776572 73.7852C-0.473448 72.8846 -0.00129212 69.3685 0.709653 64.0509ZM39.7883 69.9845C47.2298 69.6921 49.6791 65.6103 49.6791 65.6103C49.3431 65.9066 41.3 72.7603 30.1437 66.0859C30.1437 66.082 33.714 70.2223 39.7883 69.9845Z" fill="currentColor"/>
                      <path d="M52.4606 14.3449C52.5934 12.2865 51.3903 9.82263 51.2106 9.47172C50.2926 7.66279 48.73 2.75839 48.7144 2.71168C48.6988 2.661 48.4839 1.91638 48.0074 1.10156C48.941 1.2575 50.2457 1.64346 50.9136 2.6532C51.6988 3.84225 52.9996 7.15989 53.9528 9.5848C54.6793 11.4366 54.9684 12.1578 55.1325 12.3956C55.2653 12.5906 55.652 13.4833 55.3005 14.0019C54.9723 14.4892 53.9527 14.61 52.4606 14.3449Z" fill="currentColor"/>
                      <path d="M45.6084 21.2609C43.6239 21.1011 43.5614 18.6879 43.5575 18.5826H43.5263C43.5888 18.5281 43.6552 18.4735 43.706 18.4267C44.0497 18.4696 44.3739 18.4969 44.6747 18.4969C46.6709 18.4969 47.7451 17.6236 48.292 16.9258C48.3467 16.9375 48.4014 16.9492 48.4561 16.957C48.1045 18.4384 47.1396 21.2649 45.6982 21.2649C45.667 21.2649 45.6396 21.2609 45.6084 21.2609Z" fill="currentColor"/>
                    </svg>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Total PU</p>
                      <p className="text-xl font-black text-foreground">
                        {stats.totalPushups.toLocaleString()}
                        <span className="text-sm font-medium text-muted-foreground ml-1">​</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-start gap-2 pl-[4px] pr-[4px]" style={{ minWidth: "90px" }}>
                    <span className="text-xl font-bold text-[#0ABAB5]">Ø</span>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Avg. PU/day</p>
                      <p className="text-xl font-black text-foreground">
                        {stats.avgPuPerDay.toLocaleString()}
                        <span className="text-sm font-medium text-muted-foreground ml-1">​</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-start gap-2 pl-[4px] pr-[4px]" style={{ minWidth: "90px" }}>
                    <TrendingUp className="w-5 h-5 text-[#7036FF]" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Avg. prog.</p>
                      <p className="text-xl font-black text-foreground">
                        {Math.round(stats.avgProgress)}
                        <span className="text-sm font-medium text-muted-foreground ml-1">%</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-start gap-2 pl-[4px] pr-[4px]" style={{ minWidth: "90px" }}>
                    <MultiColorTargetIcon size={20} />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">On track</p>
                      <p className="text-xl font-black text-foreground">
                        {stats.onTrackCount}
                        <span className="text-sm font-medium text-muted-foreground ml-1">/ {stats.totalMembers}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Stats Cards - Horizontal Scrollable Strip */}
              <div data-horizontal-scroll className="hidden flex gap-3 overflow-x-auto mt-6 mb-6 -mx-2 px-2 scrollbar-hide animate-slide-up" style={{ scrollbarWidth: "none", msOverflowStyle: "none", animationDelay: "0.1s" }}>
                <div className="flex-shrink-0 bg-card/40 rounded-2xl p-5" style={{ minWidth: "140px" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-5 h-5 text-[#FF2C2C]" fill="#FF2C2C" />
                    <p className="text-sm text-muted-foreground font-medium">Most PU</p>
                  </div>
                  <p className="text-[1.625rem] font-black text-foreground">
                    {stats.totalPushups.toLocaleString()}
                    <span className="text-base font-medium text-muted-foreground ml-1">​</span>
                  </p>
                </div>

                <div className="flex-shrink-0 bg-card/40 rounded-2xl p-5" style={{ minWidth: "140px" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl font-bold text-[#7036FF]">Ø</span>
                    <p className="text-sm text-muted-foreground font-medium">Avg. /d</p>
                  </div>
                  <p className="text-[1.625rem] font-black text-foreground">
                    {stats.avgPuPerDay.toLocaleString()}
                    <span className="text-base font-medium text-muted-foreground ml-1">​</span>
                  </p>
                </div>

                <div className="flex-shrink-0 bg-card/40 rounded-2xl p-5" style={{ minWidth: "140px" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl font-bold text-[#0ABAB5]">Ø</span>
                    <p className="text-sm text-muted-foreground font-medium">Avg. Prog. (yr)</p>
                  </div>
                  <p className="text-[1.625rem] font-black text-foreground">
                    {Math.round(stats.avgProgress)}
                    <span className="text-base font-medium text-muted-foreground ml-1">%</span>
                  </p>
                </div>

                <div className="flex-shrink-0 bg-card/40 rounded-2xl p-5" style={{ minWidth: "140px" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <MultiColorTargetIcon size={20} />
                    <p className="text-sm text-muted-foreground font-medium">On track</p>
                  </div>
                  <p className="text-[1.625rem] font-black text-foreground">
                    {stats.onTrackCount}
                    <span className="text-base font-medium text-muted-foreground ml-1">/ {stats.totalMembers}</span>
                  </p>
                </div>
              </div>

              {/* Daily Group Overview */}
              <div className="mb-3 mt-3 animate-slide-up">
                <DailyGroupOverview
                  selectedDate={groupSelectedDate}
                  onSelectedDateChange={setGroupSelectedDate}
                />
              </div>



              {/* Weekly Group Overview */}
              <div className="mb-3 animate-slide-up" style={{
              animationDelay: "0.1s"
            }}>
                <WeeklyGroupOverview
                  selectedDate={groupSelectedDate}
                  onSelectedDateChange={setGroupSelectedDate}
                />
              </div>

              {/* Goal Card */}
              <GroupMountainGoalCard
                totalPushUps={stats.totalPushups}
                groupGoal={activeUserCount * 82 * 365}
                progressPercent={stats.avgProgress}
                allEntries={allEntries}
                year={new Date().getFullYear()}
                memberCount={activeUserCount}
              />
            </div>

            {/* Call to Action */}
            <div className="mt-8 text-center animate-fade-in" style={{
              animationDelay: "0.4s"
            }}>
              <p className="text-sm text-muted-foreground">
                Keep pushing! Your progress motivates the entire group. 🔥
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default GroupPage;