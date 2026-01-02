import { useState, useEffect, useMemo } from "react";
import { Users, Trophy, Flame, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, startOfYear } from "date-fns";

interface UserProgress {
  user_id: string;
  total_pushups: number;
  yearly_goal: number;
  progress_percent: number;
  days_logged: number;
}

const GroupPage = () => {
  const [users, setUsers] = useState<UserProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroupProgress = async () => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .order("total_pushups", { ascending: false });

      if (!error && data) {
        setUsers(data);
      }
      setIsLoading(false);
    };

    fetchGroupProgress();
  }, []);

  const stats = useMemo(() => {
    const totalMembers = users.length;
    const totalPushups = users.reduce((sum, u) => sum + u.total_pushups, 0);
    const avgProgress = totalMembers > 0 
      ? users.reduce((sum, u) => sum + u.progress_percent, 0) / totalMembers 
      : 0;
    
    const today = new Date();
    const yearStart = startOfYear(today);
    const daysElapsed = differenceInDays(today, yearStart) + 1;
    const expectedProgress = (daysElapsed / 365) * 100;
    
    const onTrackCount = users.filter(u => u.progress_percent >= expectedProgress).length;
    
    return { totalMembers, totalPushups, avgProgress, onTrackCount, expectedProgress };
  }, [users]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 safe-top">
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Users className="w-4 h-4" />
            <span className="text-sm font-semibold">Together We're Stronger</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Group Progress
          </h1>
          <p className="text-muted-foreground">
            {stats.totalMembers} {stats.totalMembers === 1 ? "member" : "members"} pushing towards their goals
          </p>
        </div>

        {/* Group Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-8 animate-slide-up">
          <div className="card-glass rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.totalPushups.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total Push-ups</p>
          </div>
          
          <div className="card-glass rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {Math.round(stats.avgProgress)}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Progress</p>
          </div>
          
          <div className="card-glass rounded-2xl p-4 text-center col-span-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.onTrackCount} / {stats.totalMembers}
            </p>
            <p className="text-xs text-muted-foreground">
              Members on track (≥{stats.expectedProgress.toFixed(0)}% expected by now)
            </p>
          </div>
        </div>

        {/* Motivational Banner */}
        <div className="card-glass rounded-2xl p-5 mb-6 border-l-4 border-l-primary animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <p className="text-sm text-foreground font-medium leading-relaxed">
            💪 Every push-up counts! When we work together, we stay accountable and motivated. 
            Your effort inspires others to keep going.
          </p>
        </div>

        {/* Leaderboard */}
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Leaderboard</h2>
          </div>

          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="card-glass rounded-2xl p-6 text-center">
                <p className="text-muted-foreground">No members yet. Be the first!</p>
              </div>
            ) : (
              users.map((user, index) => (
                <div
                  key={user.user_id}
                  className={`card-glass rounded-2xl p-4 transition-all hover:scale-[1.02] ${
                    index === 0 ? "ring-2 ring-accent/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 
                        ? "bg-gradient-to-br from-accent to-accent/60 text-accent-foreground" 
                        : index === 1 
                        ? "bg-gradient-to-br from-muted-foreground to-muted text-foreground"
                        : index === 2
                        ? "bg-gradient-to-br from-accent/60 to-accent/30 text-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {index + 1}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        Member {index + 1}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.days_logged} days logged • Goal: {user.yearly_goal.toLocaleString()}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        {user.total_pushups.toLocaleString()}
                      </p>
                      <p className={`text-xs font-medium ${
                        user.progress_percent >= stats.expectedProgress 
                          ? "text-primary" 
                          : "text-accent"
                      }`}>
                        {user.progress_percent.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        user.progress_percent >= stats.expectedProgress 
                          ? "bg-primary" 
                          : "bg-accent"
                      }`}
                      style={{ width: `${Math.min(user.progress_percent, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <p className="text-sm text-muted-foreground">
            Keep pushing! Your progress motivates the entire group. 🔥
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupPage;
