import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Trophy, Flame, TrendingUp, User, Info } from "lucide-react";
import LeaderboardPodium from "@/components/LeaderboardPodium";
import WeeklyGroupOverview from "@/components/WeeklyGroupOverview";
import DailyGroupOverview from "@/components/DailyGroupOverview";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, startOfYear } from "date-fns";
import MultiColorTargetIcon from "@/components/MultiColorTargetIcon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
interface UserProgress {
  user_id: string;
  display_name: string | null;
  total_pushups: number;
  yearly_goal: number;
  progress_percent: number;
  days_logged: number;
  avatar_url?: string | null;
}
const GroupPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("leaderboard");
  useEffect(() => {
    const fetchGroupProgress = async () => {
      const {
        data,
        error
      } = await supabase.from("user_progress").select("*").order("total_pushups", {
        ascending: false
      });
      if (!error && data) {
        // Fetch avatar URLs from profiles
        const userIds = data.map((u: any) => u.user_id).filter(Boolean);
        const { data: profiles } = await supabase.from("profiles").select("id, avatar_url").in("id", userIds);
        const avatarMap = new Map(profiles?.map((p: any) => [p.id, p.avatar_url]) || []);
        setUsers(data.map((u: any) => ({ ...u, avatar_url: avatarMap.get(u.user_id) || null })));
      }
      setIsLoading(false);
    };
    fetchGroupProgress();
  }, []);
  const stats = useMemo(() => {
    const totalMembers = users.length;
    const totalPushups = users.reduce((sum, u) => sum + u.total_pushups, 0);
    const avgProgress = totalMembers > 0 ? users.reduce((sum, u) => sum + u.progress_percent, 0) / totalMembers : 0;
    const today = new Date();
    const yearStart = startOfYear(today);
    const daysElapsed = differenceInDays(today, yearStart) + 1;
    const expectedProgress = daysElapsed / 365 * 100;
    const onTrackCount = users.filter((u) => u.progress_percent >= expectedProgress).length;
    return {
      totalMembers,
      totalPushups,
      avgProgress,
      onTrackCount,
      expectedProgress
    };
  }, [users]);

  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const el = e.currentTarget as HTMLElement;
    el.dataset.touchStartX = touch.clientX.toString();
    el.dataset.touchStartY = touch.clientY.toString();
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const el = e.currentTarget as HTMLElement;
    const startX = parseFloat(el.dataset.touchStartX || "0");
    const startY = parseFloat(el.dataset.touchStartY || "0");
    const diffX = touch.clientX - startX;
    const diffY = touch.clientY - startY;
    // Only switch tabs if swipe is predominantly horizontal (ratio > 2) and exceeds threshold
    // Also ignore if the touch started inside a horizontally scrollable element
    const target = e.target as HTMLElement;
    const isInsideScrollable = target.closest("[data-horizontal-scroll]");
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
          <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-full bg-transparent border border-white flex items-center justify-center hover:bg-white/10 transition-colors">
            <User className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Header */}
        <header className="mb-6 animate-fade-in">
          <h1 className="text-4xl font-black text-foreground tracking-tight pt-[20px] py-0">Group</h1>
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
              {users.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">No members yet. Be the first!</p>
                </div>
              ) : (
                <LeaderboardPodium users={users} />
              )}

              {/* Group Stats Cards */}
              <div className="grid grid-cols-2 gap-3 mb-4 animate-slide-up" style={{
              animationDelay: "0.1s"
            }}>
                <div className="bg-card rounded-2xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#C029DE]/20 flex items-center justify-center mx-auto mb-2">
                    <Flame className="w-5 h-5 text-[#C029DE]" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalPushups.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Push-ups</p>
                </div>
                
                <div className="bg-card rounded-2xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#0ABAB5]/20 flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-5 h-5 text-[#0ABAB5]" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {Math.round(stats.avgProgress)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Avg. yr Prog.</p>
                </div>
              </div>

              {/* Members on Track Card */}
              <div className="bg-card rounded-2xl p-4 text-center mb-6 animate-slide-up" style={{
              animationDelay: "0.15s"
            }}>
                <div className="w-10 h-10 rounded-full bg-[#0ABAB5]/20 flex items-center justify-center mx-auto mb-2">
                  <MultiColorTargetIcon size={20} />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.onTrackCount} / {stats.totalMembers}
                </p>
                <p className="text-xs text-muted-foreground">
                  Members on track<br />(≥{stats.expectedProgress.toFixed(0)}% exp. yr. Prog.)
                </p>
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

              {/* Motivational Banner */}
              <div className="bg-card rounded-2xl p-5 mb-6 shadow-none animate-slide-up" style={{
              animationDelay: "0.15s"
            }}>
                <p className="text-sm text-foreground font-medium leading-relaxed">
                  💪 Every push-up counts! When we work together, we stay accountable and motivated. 
                  Your effort inspires others to keep going.
                </p>
              </div>

              {/* Goal Card */}
              <div className="bg-card rounded-2xl p-6 mb-6 animate-slide-up" style={{
              animationDelay: "0.2s"
            }}>
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Group Goal {new Date().getFullYear()}
                </h2>

                <div className="h-px mb-4 bg-[#3b404f]" />
                
                <div className="flex items-center justify-between">
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

                {/* Progress bar */}
                <div className="mt-6 h-3 rounded-full overflow-hidden bg-[#3b404f]">
                  <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700" style={{
                  width: `${stats.avgProgress}%`
                }} />
                </div>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {Math.round(stats.avgProgress)}% average progress
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