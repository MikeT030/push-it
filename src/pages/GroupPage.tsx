import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, differenceInDays } from "date-fns";
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
    <div className="rounded-2xl overflow-hidden animate-slide-up">
      {users.map((user, index) => {
        const avatar = getAvatarById(user.avatar_url ?? null);
        return (
          <div
            key={user.user_id}
            className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors`}
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
              <p className="text-xs text-primary-foreground">🔥 <span className="font-bold">{user.streak ?? 0} day</span> streak</p>
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

  const stats = useMemo(() => {
    const activeUsers = users.filter((u) => u.total_pushups >= 82);
    const totalMembers = activeUsers.length;
    const totalPushups = activeUsers.reduce((sum, u) => sum + u.total_pushups, 0);
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
        {/* Profile Button + Header */}
        <div className="flex justify-between items-center mb-4 animate-fade-in pb-[20px]">
          <h1 className="text-4xl font-black text-foreground tracking-tight">We Push</h1>
          <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: avatar ? "linear-gradient(135deg, #BEE7FD, #ECF5FF)" : "transparent", border: avatar ? "none" : "1px solid white" }}>
            {avatar ?
          <img src={avatar.src} alt={avatar.name} className="w-full h-full object-cover" /> :

          <img src={defaultAvatarWhite} alt="User" className="w-5 h-5 object-contain" />
          }
          </button>
        </div>


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

              {/* Personal Stats Row */}
              {pushUpLoaded && (() => {
                const today = new Date();
                const daysElapsed = differenceInDays(today, startOfYear(today)) + 1;
                const total = getTotalPushUps();
                const avg = daysElapsed > 0 ? Math.round(total / daysElapsed) : 0;
                const streak = getCurrentStreak();
                const maxDay = getMaxSingleDay();
                const MuscleIcon = ({ className }: { className?: string }) => (
                  <svg className={className} viewBox="0 0 96 86" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M26.836 85.328C26.532 85.328 26.228 85.248 25.94 85.108C18.14 81.2 0 67.188 0 21.232C0 9.084 10.524 0 19.928 0C21.468 0 22.956 0.24 24.36 0.704C30.212 2.652 32.824 10.072 31.896 15.824C30.856 22.232 25.792 25.576 19.168 23.876C19.052 29.4 23.364 35.144 27.556 40.732C29.604 43.468 31.592 46.116 33 48.704C35.328 41.688 39.276 35.228 55.96 34.78C56.808 25.208 63.828 16.124 76.5 16.124C83.056 16.124 88.884 19.192 92.488 24.524C96.604 30.608 97.112 38.728 93.88 46.808C90.796 52.988 85.26 56.3 81.436 57.16C80.084 64.956 70.776 79.068 61.612 82.112C56.648 83.768 50.176 83.768 43.908 83.768C37.964 83.768 31.816 83.768 27.468 85.212C27.264 85.296 27.052 85.328 26.836 85.328ZM19.932 4.012C12.564 4.012 4.004 11.536 4.004 21.244C4.004 63.576 19.576 77.124 27.036 81.18C31.88 79.772 37.988 79.772 43.912 79.772C49.856 79.772 56 79.764 60.348 78.328C68.764 75.524 77.604 60.648 77.604 55.392C77.604 54.292 78.5 53.392 79.604 53.392C81.808 53.392 87.368 50.916 90.232 45.18C92.9 38.504 92.54 31.74 89.172 26.772C86.32 22.548 81.704 20.14 76.496 20.14C65.076 20.14 59.872 28.748 59.872 36.756C59.872 37.856 58.972 38.756 57.872 38.756C40.08 38.756 38.244 44.96 35.92 52.828C35.608 53.884 35.292 54.944 34.932 56.024C34.62 56.944 33.672 57.524 32.716 57.36C31.748 57.204 31.036 56.368 31.036 55.392C31.036 52.072 27.784 47.736 24.344 43.144C19.292 36.396 13.568 28.772 15.572 20.748C15.716 20.18 16.084 19.716 16.6 19.452C17.112 19.196 17.716 19.156 18.252 19.372C19.852 20.012 21.312 20.336 22.576 20.336C26.508 20.336 27.628 17.104 27.94 15.184C28.6 11.112 26.772 5.732 23.088 4.5C22.104 4.184 21.044 4.012 19.932 4.012Z" fill="currentColor"/>
                  </svg>
                );
                const items = [
                  { label: "Most", value: maxDay, unit: "PU", Icon: MuscleIcon, color: "text-[#d291df]", isCustomIcon: true },
                  { label: "Average", value: avg, unit: "/d", Icon: TrendingUp, color: "text-primary", isCustomIcon: false },
                  { label: "Streak", value: streak, unit: "d", Icon: Flame, color: "text-[#f97171]", isCustomIcon: false },
                ];
                return (
                  <div className="bg-card/40 rounded-2xl p-6 animate-slide-up mt-4" style={{ animationDelay: "0.05s" }}>
                    <div className="flex gap-3 pt-4 mt-2 border-t border-b border-[#3B404F] pb-4 mb-2">
                      {items.map((s) => (
                        <div key={s.label} className="flex-1 flex items-start gap-2">
                          {s.label === "Average" ? (
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
                      ))}
                    </div>
                  </div>
                );
              })()}

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
                    <span className="text-xl font-bold text-[#7036FF]">Ø</span>
                    <p className="text-sm text-muted-foreground font-medium">Avg. PU (day)</p>
                  </div>
                  <p className="text-[1.625rem] font-black text-foreground">
                    {stats.avgPuPerDay.toLocaleString()}
                    <span className="text-base font-medium text-muted-foreground ml-1">PU</span>
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
              <div className="bg-card/40 rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
                <h2 className="text-lg font-bold text-foreground mb-4">
                  We Push Goal {new Date().getFullYear()}
                </h2>

                <div className="h-px mb-4 bg-[#3b404f]" />
                
                <div className="flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setShowGroupChart(v => !v)}>
                  <div>
                    <p className="font-black line-through text-white text-lg">
                      {users.filter((u) => u.total_pushups >= 82).reduce((sum, u) => sum + u.yearly_goal, 0).toLocaleString()}
                    </p>
                    <p className="font-black text-gradient text-2xl">
                      {users.filter((u) => u.total_pushups >= 82).reduce((sum, u) => sum + u.yearly_goal - u.total_pushups, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      push-ups remaining
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground text-xl">
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