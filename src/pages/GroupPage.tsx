import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Users, Trophy, Flame, TrendingUp, Info, List } from "lucide-react";
import defaultAvatarWhite from "@/assets/default-avatar-white.svg";
import defaultAvatarList from "@/assets/default-avatar-list.svg";
import LeaderboardPodium from "@/components/LeaderboardPodium";
import { getAvatarById } from "@/data/avatars";
import WeeklyGroupOverview from "@/components/WeeklyGroupOverview";
import DailyGroupOverview from "@/components/DailyGroupOverview";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, startOfYear } from "date-fns";
import MultiColorTargetIcon from "@/components/MultiColorTargetIcon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GroupLineChartGoalCard from "@/components/GroupLineChartGoalCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import PlayerCard from "@/components/PlayerCard";
import { useAuth } from "@/contexts/AuthContext";
import { useUserAvatar } from "@/hooks/useUserAvatar";

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
    <div className="card-glass rounded-2xl overflow-hidden animate-slide-up">
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
              <p className="text-xs text-primary-foreground">🔥 <span className="font-bold">{user.streak ?? 0}d</span> streak</p>
              <p className="text-xs text-foreground flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3 text-primary" /> <span className="font-bold">{Math.round(user.avg_pushups ?? 0)}</span> Avg. PU
              </p>
            </div>
            <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2.5 py-1">
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
  const [users, setUsers] = useState<UserProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>("alltime");
  const [leaderboardView, setLeaderboardView] = useState<LeaderboardView>("podium");
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [showGroupChart, setShowGroupChart] = useState(true);
  useEffect(() => {
    const fetchGroupProgress = async () => {
      const [
      { data, error },
      { data: profiles },
      { data: entries }] =
      await Promise.all([
      supabase.from("user_progress").select("*").order("total_pushups", { ascending: false }),
      supabase.from("profiles").select("id, avatar_url"),
      supabase.from("push_up_entries").select("date, user_id, count")]
      );

      if (!error && data) {
        const avatarMap = new Map(profiles?.map((p: any) => [p.id, p.avatar_url]) || []);
        const streakMap = new Map<string, number>();
        if (entries) {
          // Group dates by user
          const userDates = new Map<string, Set<string>>();
          entries.forEach((e: any) => {
            if (!userDates.has(e.user_id)) userDates.set(e.user_id, new Set());
            userDates.get(e.user_id)!.add(e.date);
          });
          // Calculate streak for each user
          userDates.forEach((dates, userId) => {
            let streak = 0;
            let checkDate = new Date();
            const todayStr = format(checkDate, "yyyy-MM-dd");
            // If today has an entry, count it; otherwise skip today (day isn't over yet)
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
        }

        // Calculate average push-ups per logged day
        const avgMap = new Map<string, number>();
        if (entries) {
          const userTotals = new Map<string, {total: number;days: Set<string>;}>();
          entries.forEach((e: any) => {
            if (!userTotals.has(e.user_id)) userTotals.set(e.user_id, { total: 0, days: new Set() });
            const ut = userTotals.get(e.user_id)!;
            ut.total += e.count;
            ut.days.add(e.date);
          });
          userTotals.forEach((val, userId) => {
            avgMap.set(userId, val.days.size > 0 ? val.total / val.days.size : 0);
          });
        }

        setAllEntries(entries || []);
        setUsers(data.map((u: any) => ({
          ...u,
          avatar_url: avatarMap.get(u.user_id) || null,
          streak: streakMap.get(u.user_id) || 0,
          avg_pushups: avgMap.get(u.user_id) || 0
        })));
      }
      setIsLoading(false);
    };
    fetchGroupProgress();
  }, []);

  // Compute period-filtered leaderboard users
  const filteredUsers = useMemo(() => {
    if (leaderboardPeriod === "alltime") return users;

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
    sort((a, b) => b.total_pushups - a.total_pushups);
  }, [users, allEntries, leaderboardPeriod]);
  const stats = useMemo(() => {
    const totalMembers = users.length;
    const totalPushups = users.reduce((sum, u) => sum + u.total_pushups, 0);
    const avgProgress = totalMembers > 0 ? users.reduce((sum, u) => sum + u.progress_percent, 0) / totalMembers : 0;
    const today = new Date();
    const yearStart = startOfYear(today);
    const daysElapsed = differenceInDays(today, yearStart) + 1;
    const expectedProgress = daysElapsed / 365 * 100;
    const onTrackCount = users.filter((u) => u.progress_percent >= expectedProgress).length;
    const avgPuPerDay = daysElapsed > 0 ? Math.round(totalPushups / daysElapsed) : 0;
    return {
      totalMembers,
      totalPushups,
      avgProgress,
      onTrackCount,
      expectedProgress,
      avgPuPerDay
    };
  }, [users]);

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
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* Profile Button */}
        <div className="flex justify-end items-center mb-4">
          <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: avatar ? "linear-gradient(135deg, #BEE7FD, #ECF5FF)" : "transparent", border: avatar ? "none" : "1px solid white" }}>
            {avatar ?
          <img src={avatar.src} alt={avatar.name} className="w-full h-full object-cover" /> :

          <img src={defaultAvatarWhite} alt="User" className="w-5 h-5 object-contain" />
          }
          </button>
        </div>

        {/* Header */}
        <header className="mb-6 animate-fade-in">
          <h1 className="text-4xl font-black text-foreground tracking-tight pt-[20px] py-0">We Push</h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mt-1">
            {stats.totalMembers} {stats.totalMembers === 1 ? "member" : "members"} pushing together
          </p>
        </header>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="leaderboard" className="flex-1">Leaderboard</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">Stats</TabsTrigger>
          </TabsList>

          <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="touch-pan-y">
            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="mt-0">
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

                    {period === "weekly" ? "Week" : period === "monthly" ? "Month" : "All-time"}
                  </button>
              )}
              </div>
              {/* View Toggle */}
              <div className="flex justify-center mb-3">
                <button
                onClick={() => setLeaderboardView(leaderboardView === "podium" ? "list" : "podium")}
                className="p-2.5 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
                aria-label="Toggle view">

                  {leaderboardView === "podium" ?
                <List className="w-5 h-5 text-muted-foreground" /> :

                <Trophy className="w-5 h-5 text-muted-foreground" />
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

              {/* Group Stats Cards - Horizontal Scrollable Strip */}
              <div data-horizontal-scroll className="flex gap-3 overflow-x-auto mt-6 mb-6 -mx-2 px-2 scrollbar-hide animate-slide-up" style={{ scrollbarWidth: "none", msOverflowStyle: "none", animationDelay: "0.1s" }}>
                <div className="flex-shrink-0 bg-card/40 rounded-2xl p-5" style={{ minWidth: "140px" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-5 h-5 text-[#C029DE]" />
                    <p className="text-sm text-muted-foreground font-medium">Total</p>
                  </div>
                  <p className="text-[1.625rem] font-black text-foreground">
                    {stats.totalPushups.toLocaleString()}
                    <span className="text-base font-medium text-muted-foreground ml-1">PU</span>
                  </p>
                </div>

                <div className="flex-shrink-0 bg-card/40 rounded-2xl p-5" style={{ minWidth: "140px" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-[#7036FF]" />
                    <p className="text-sm text-muted-foreground font-medium">Avg. PU (day)</p>
                  </div>
                  <p className="text-[1.625rem] font-black text-foreground">
                    {stats.avgPuPerDay.toLocaleString()}
                    <span className="text-base font-medium text-muted-foreground ml-1">PU</span>
                  </p>
                </div>

                <div className="flex-shrink-0 bg-card/40 rounded-2xl p-5" style={{ minWidth: "140px" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-[#0ABAB5]" />
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
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="mt-0">
              {/* Daily Group Overview */}
              <div className="mb-6 animate-slide-up">
                <DailyGroupOverview />
              </div>

              {/* Weekly Group Overview */}
              <div className="mb-6 animate-slide-up" style={{
              animationDelay: "0.1s"
            }}>
                <WeeklyGroupOverview />
              </div>

              {/* Goal Card */}
              <div className="card-glass rounded-2xl p-6 mb-6 animate-slide-up" style={{
              animationDelay: "0.15s"
            }}>
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Group Goal {new Date().getFullYear()}
                </h2>

                <div className="h-px mb-4 bg-[#3b404f]" />
                
                <div className="flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setShowGroupChart(v => !v)}>
                  <div>
                    <p className="text-2xl font-black line-through text-white">
                      {users.filter((u) => u.total_pushups >= 82).reduce((sum, u) => sum + u.yearly_goal, 0).toLocaleString()}
                    </p>
                    <p className="text-4xl font-black text-gradient">
                      {users.filter((u) => u.total_pushups >= 82).reduce((sum, u) => sum + u.yearly_goal - u.total_pushups, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      push-ups remaining
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {users.filter((u) => u.total_pushups >= 82).length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      members
                    </p>
                  </div>
                </div>

                {/* Progress bar - clickable to toggle chart */}
                <div 
                  className="mt-6 h-3 rounded-full overflow-hidden bg-[#3b404f] cursor-pointer active:scale-[0.98] transition-transform relative"
                  onClick={() => setShowGroupChart(v => !v)}
                >
                  <div className={`h-full bg-[#0ABAB5] absolute left-0 top-0 transition-all duration-700 ${
                    stats.expectedProgress > stats.avgProgress ? 'rounded-full' : 'rounded-l-full'
                  }`} style={{
                    width: `${Math.min(stats.expectedProgress, 100)}%`
                  }} />
                  {stats.avgProgress > stats.expectedProgress && (
                    <div className="h-full bg-[#BA25D8] absolute top-0 rounded-r-full transition-all duration-700" style={{
                      left: `${Math.min(stats.expectedProgress, 100)}%`,
                      width: `${Math.min(stats.avgProgress - stats.expectedProgress, 100 - stats.expectedProgress)}%`
                    }} />
                  )}
                  {stats.avgProgress < stats.expectedProgress && (
                    <div className="h-full bg-[#BA25D8] absolute left-0 top-0 rounded-full transition-all duration-700" style={{
                      width: `${Math.min(stats.avgProgress, 100)}%`
                    }} />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {Math.round(stats.avgProgress)}% average progress
                </p>

                {/* Expandable chart section */}
                {showGroupChart && (
                  <GroupLineChartGoalCard
                    totalPushUps={stats.totalPushups}
                    groupGoal={users.reduce((sum, u) => sum + u.yearly_goal, 0)}
                    progressPercent={stats.avgProgress}
                    allEntries={allEntries}
                    year={new Date().getFullYear()}
                    memberCount={users.length}
                    embedded
                  />
                )}
              </div>

              {/* Motivational Banner */}
              <div className="card-glass rounded-2xl p-5 mb-6 shadow-none animate-slide-up" style={{
              animationDelay: "0.25s"
            }}>
                <p className="text-sm text-foreground font-medium leading-relaxed">
                  💪 Every push-up counts! When we work together, we stay accountable and motivated. 
                  Your effort inspires others to keep going.
                </p>
              </div>


              {/* Call to Action */}
              <div className="mt-8 text-center animate-fade-in" style={{
              animationDelay: "0.4s"
            }}>
                <p className="text-sm text-muted-foreground">
                  Keep pushing! Your progress motivates the entire group. 🔥
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>;
};
export default GroupPage;