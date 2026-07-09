import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Download, Users, Target } from "lucide-react";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import LeaderboardPodium from "@/components/LeaderboardPodium";
import GroupLineChartGoalCard from "@/components/GroupLineChartGoalCard";
import GroupMountainGoalCard from "@/components/GroupMountainGoalCard";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PlayerCard from "@/components/PlayerCard";
import DemoBottomNav from "@/components/DemoBottomNav";
import DailySection from "@/components/DailySection";
import CalendarSection from "@/components/CalendarSection";
import { getAvatarById } from "@/data/avatars";
import { useDemoNav, setDemoNavEnabled } from "@/hooks/useDemoNav";
import { useGroupUserProgress, useGroupEntries } from "@/hooks/useGroupData";
import InsightsCard from "@/components/InsightsCard";
import PushTheRightWayPanel from "@/components/PushTheRightWayPanel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const AdminPage = () => {
  const { isAdmin, loading } = useIsAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();
  const demoNavActive = useDemoNav();

  const progressQuery = useGroupUserProgress();
  const entriesQuery = useGroupEntries();
  const realAllEntries = entriesQuery.data || [];

  const realStats = useMemo(() => {
    const progress = progressQuery.data || [];
    const cutoff = format(subDays(new Date(), 30), "yyyy-MM-dd");
    const activeIds = new Set<string>();
    realAllEntries.forEach((e: any) => {
      if (e.date >= cutoff && e.count > 0) activeIds.add(e.user_id);
    });
    const activeUsers = progress.filter((u: any) => activeIds.has(u.user_id));
    const totalPushups = progress.reduce((sum: number, u: any) => sum + u.total_pushups, 0);
    const avgProgress =
      activeUsers.length > 0
        ? activeUsers.reduce((sum: number, u: any) => sum + u.progress_percent, 0) / activeUsers.length
        : 0;
    const activeUserCount = activeIds.size;
    return {
      totalPushups,
      avgProgress,
      activeUserCount,
      groupGoal: activeUserCount * 82 * 365,
    };
  }, [progressQuery.data, realAllEntries]);





  const handleBackup = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("push_up_entries")
      .select("id, user_id, date, count, created_at, updated_at")
      .eq("user_id", user.id)
      .order("date", { ascending: true });
    if (error) {
      toast.error("Failed to export data");
      return;
    }
    if (!data || data.length === 0) {
      toast.info("No push-up entries to export");
      return;
    }
    const headers = ["id", "user_id", "date", "count", "created_at", "updated_at"];
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => `"${row[h as keyof typeof row] ?? ""}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pushups_backup_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} entries`);
  };

  const handleUsersBackup = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, yearly_goal, created_at, updated_at")
      .eq("id", user.id)
      .order("created_at", { ascending: true });
    if (error) {
      toast.error("Failed to export users data");
      return;
    }
    if (!data || data.length === 0) {
      toast.info("No profile to export");
      return;
    }
    const headers = ["id", "display_name", "yearly_goal", "created_at", "updated_at"];
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => `"${row[h as keyof typeof row] ?? ""}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `profile_backup_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported your profile`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  const demoAvatar = getAvatarById("kangaroo");

  return (
    <div className="min-h-screen bg-background pb-32 safe-top">
      <div className="px-6 pt-12">
        <div className="mb-2 -ml-2 -mt-10 animate-fade-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
            className="h-10 w-10 border border-white text-white hover:bg-white hover:text-black active:bg-white active:text-black"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        <header className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-black text-foreground tracking-tight">
            Admin
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            Restricted area
          </p>
        </header>

        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 animate-slide-up">


          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg text-foreground font-semibold">Welcome, admin</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            This is the admin area. Admin tools and controls will live here.
          </p>
        </div>

        {/* Backups Card */}
        <div className="bg-card/40 rounded-2xl p-6 mt-6 animate-slide-up pt-[10px] pb-[10px] mb-[10px] px-[10px] border border-[#3B404F]" style={{ animationDelay: "0.03s" }}>
          <h2 className="text-lg text-foreground font-semibold mb-4">Backups</h2>
          <div className="flex flex-col gap-3">
            <Button variant="outline" onClick={handleBackup} className="w-full h-12 bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5] hover:bg-[#0ABAB5] hover:text-white active:bg-[#0ABAB5]/25 active:text-white">
              <Download className="w-4 h-4 mr-2" />
              Push Ups Backup
            </Button>
            <Button variant="outline" onClick={handleUsersBackup} className="w-full h-12 bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5] hover:bg-[#0ABAB5] hover:text-white active:bg-[#0ABAB5]/25 active:text-white">
              <Users className="w-4 h-4 mr-2" />
              Users Backup
            </Button>
          </div>
        </div>

        {/* Recalibrate Your Goal */}
        <div className="bg-card/40 rounded-2xl mt-6 animate-slide-up pt-[10px] pb-[10px] mb-[10px] px-[10px] border border-[#3B404F]" style={{ animationDelay: "0.034s" }}>
          <Button
            variant="outline"
            onClick={() => navigate("/welcome-recalibrate")}
            className="w-full h-12 bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5] hover:bg-[#0ABAB5] hover:text-white active:bg-[#0ABAB5]/25 active:text-white"
          >
            <Target className="w-4 h-4 mr-2" />
            Recalibrate Your Goal
          </Button>
        </div>

        {/* Welcome */}

        <div className="bg-card/40 rounded-2xl mt-6 animate-slide-up pt-[10px] pb-[10px] mb-[10px] px-[10px] border border-[#3B404F]" style={{ animationDelay: "0.035s" }}>
          <Button
            variant="outline"
            onClick={() => navigate("/welcome")}
            className="w-full h-12 bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5] hover:bg-[#0ABAB5] hover:text-white active:bg-[#0ABAB5]/25 active:text-white"
          >
            <Target className="w-4 h-4 mr-2" />
            Welcome
          </Button>
        </div>


        {/* Past Challenges */}
        <div className="bg-card/40 rounded-2xl mt-6 animate-slide-up pt-[10px] pb-[10px] mb-[10px] px-[10px] border border-[#3B404F]" style={{ animationDelay: "0.037s" }}>
          <Button
            variant="outline"
            onClick={() => navigate("/past-challenges")}
            className="w-full h-12 bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5] hover:bg-[#0ABAB5] hover:text-white active:bg-[#0ABAB5]/25 active:text-white"
          >
            <Target className="w-4 h-4 mr-2" />
            Past Challenges
          </Button>
        </div>

        {/* Demo Insights Panel Button */}
        <div className="mt-6 animate-slide-up" style={{ animationDelay: "0.038s" }}>
          <InsightsCard demo />
        </div>

        {/* Demo Your Insights Card */}
        <div className="mt-6 animate-slide-up" style={{ animationDelay: "0.03s" }}>
          <Accordion type="single" collapsible>
            <AccordionItem value="demo-insights" className="border-none">
              <AccordionTrigger className="hover:no-underline py-2">
                <div className="text-left">
                  <h2 className="text-lg text-foreground font-semibold">
                    Demo Your Insights
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sandbox copy of the Your Insights card. Edit it here before rolling
                    changes out to all users.
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <InsightsCard
                  userId="2daf5b5e-d8fb-4677-9276-bd42337a2a95"
                  allEntries={realAllEntries}
                />
                <div className="mt-4 space-y-4">
                  <InsightsCard
                    userId="2daf5b5e-d8fb-4677-9276-bd42337a2a95"
                    allEntries={realAllEntries}
                    colorVariant="purple"
                  />
                  <InsightsCard
                    userId="2daf5b5e-d8fb-4677-9276-bd42337a2a95"
                    allEntries={realAllEntries}
                    colorVariant="magenta"
                  />
                  <InsightsCard
                    userId="2daf5b5e-d8fb-4677-9276-bd42337a2a95"
                    allEntries={realAllEntries}
                    colorVariant="amber"
                  />
                  <InsightsCard
                    userId="2daf5b5e-d8fb-4677-9276-bd42337a2a95"
                    allEntries={realAllEntries}
                    colorVariant="crimson"
                  />
                  <InsightsCard
                    userId="2daf5b5e-d8fb-4677-9276-bd42337a2a95"
                    allEntries={realAllEntries}
                    colorVariant="emerald"
                  />
                  <InsightsCard
                    userId="2daf5b5e-d8fb-4677-9276-bd42337a2a95"
                    allEntries={realAllEntries}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>


        {/* Welcome V2 preview */}
        <div className="mt-6 animate-slide-up" style={{ animationDelay: "0.032s" }}>
          <Button
            variant="outline"
            onClick={() => navigate("/welcome-v2")}
            className="w-full h-12 bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5] hover:bg-[#0ABAB5] hover:text-white active:bg-[#0ABAB5]/25 active:text-white"
          >
            Adjust Goal. 30k hit
          </Button>
        </div>

        {/* Demo Group Goal Card */}
        <div className="mt-6 animate-slide-up" style={{ animationDelay: "0.035s" }}>
          <h2 className="text-lg text-foreground font-semibold mb-2">
            Demo Group Goal Card
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Sandbox copy of the We Push Goal card. Edit it here before rolling
            changes out to all users.
          </p>
          <GroupMountainGoalCard
            totalPushUps={realStats.totalPushups}
            groupGoal={realStats.groupGoal}
            progressPercent={realStats.avgProgress}
            allEntries={realAllEntries}
            year={new Date().getFullYear()}
            memberCount={realStats.activeUserCount}
          />
        </div>


        {/* Demo Leaderboard List */}
        <div className="mt-6 animate-slide-up" style={{ animationDelay: "0.045s" }}>
          <h2 className="text-lg text-foreground font-semibold mb-4">Demo Leaderboard List</h2>
          <LeaderboardPodium
            users={[
              { user_id: "demo-1", display_name: "MichiPU", avatar_url: "tiger", total_pushups: 17352, yearly_goal: 44000, progress_percent: 39, days_logged: 120, streak: 42, avg_pushups: 145 },
              { user_id: "demo-2", display_name: "FoxFit", avatar_url: "fox", total_pushups: 14210, yearly_goal: 30000, progress_percent: 47, days_logged: 110, streak: 28, avg_pushups: 129 },
              { user_id: "demo-3", display_name: "PandaPower", avatar_url: "panda", total_pushups: 12880, yearly_goal: 38000, progress_percent: 34, days_logged: 105, streak: 19, avg_pushups: 123 },
              { user_id: "demo-4", display_name: "KangaKing", avatar_url: "kangaroo", total_pushups: 11540, yearly_goal: 30000, progress_percent: 38, days_logged: 98, streak: 14, avg_pushups: 118 },
              { user_id: "demo-5", display_name: "WolfWarrior", avatar_url: "wolf", total_pushups: 9820, yearly_goal: 36000, progress_percent: 27, days_logged: 92, streak: 11, avg_pushups: 107 },
              { user_id: "demo-6", display_name: "BearBeast", avatar_url: "bear", total_pushups: 8430, yearly_goal: 30000, progress_percent: 28, days_logged: 84, streak: 7, avg_pushups: 100 },
              { user_id: "demo-7", display_name: "LionLift", avatar_url: "lion", total_pushups: 6710, yearly_goal: 30000, progress_percent: 22, days_logged: 70, streak: 4, avg_pushups: 96 },
            ]}
          />
        </div>




        {/* Demo Player Card */}
        <div className="mt-6 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <h2 className="text-lg text-foreground font-semibold mb-2">
            Demo Player Card
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Sandbox copy of the Player Card. Edit it here before rolling changes
            out to all users.
          </p>
          <div className="py-4">
            <PlayerCard
              displayName="MichiPU"
              avatar={demoAvatar}
              totalPushUps={17352}
              yearlyGoal={30000}
              currentStreak={148}
              weeklyAverage={117}
              yearProgress={58}
              daysWithEntries={148}
            />
          </div>
        </div>

        {/* Demo Daily Section */}
        <div className="mt-6 animate-slide-up" style={{ animationDelay: "0.075s" }}>
          <h2 className="text-lg text-foreground font-semibold mb-2">
            Demo Daily Section
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Sandbox copy of the Daily Section. Edit it here before rolling
            changes out to all users.
          </p>
          <DailySection />
        </div>

        {/* Demo Calendar Section */}
        <div className="mt-6 animate-slide-up" style={{ animationDelay: "0.09s" }}>
          <h2 className="text-lg text-foreground font-semibold mb-2">
            Demo Calendar
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Sandbox copy of the Calendar. Edit it here before rolling changes
            out to all users.
          </p>
          <CalendarSection />
        </div>

        {/* Demo Bottom Navigation */}
        <div className="mt-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-lg text-foreground font-semibold mb-2">
            Demo Bottom Navigation
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Sandbox copy of the bottom nav. Edit it here before rolling changes
            out to all users.
          </p>
          <Button
            onClick={() => setDemoNavEnabled(!demoNavActive)}
            variant={demoNavActive ? "destructive" : "default"}
            className="mb-4 w-full"
          >
            {demoNavActive ? "Deactivate Demo Nav" : "Activate Demo Nav"}
          </Button>
          <div className="py-4">
            <DemoBottomNav />
          </div>
        </div>
      </div>

      {demoNavActive && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <DemoBottomNav />
        </div>
      )}
    </div>
  );
};

export default AdminPage;
