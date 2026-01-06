import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";

const DAILY_TARGET = 82; // 82 push-ups per day per person

interface DailyGroupEntry {
  date: string;
  total_count: number;
}

const DailyGroupOverview = () => {
  const [todayTotal, setTodayTotal] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const fetchDailyData = async () => {
      const today = format(new Date(), "yyyy-MM-dd");

      // Fetch today's push up entries
      const { data: entries } = await supabase
        .from("push_up_entries")
        .select("count")
        .eq("date", today);

      if (entries) {
        const total = entries.reduce((sum, entry) => sum + entry.count, 0);
        setTodayTotal(total);
      }

      // Fetch member count (users with 82+ push-ups)
      const { data: users } = await supabase
        .from("user_progress")
        .select("user_id, total_pushups");

      if (users) {
        const activeMembers = users.filter((u) => u.total_pushups >= 82).length;
        setMemberCount(activeMembers);
      }

      setIsLoaded(true);
    };

    fetchDailyData();
  }, []);

  const dailyTarget = DAILY_TARGET * Math.max(memberCount, 1);
  const percentage = dailyTarget > 0 ? Math.round((todayTotal / dailyTarget) * 100) : 0;

  if (!isLoaded) {
    return (
      <div className="bg-card rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/2 mb-4" />
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card rounded-2xl p-6 animate-slide-up">
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full text-left mb-4 hover:opacity-80 transition-opacity">
            <h2 className="text-lg font-bold text-foreground">Daily Group</h2>
            {isOpen ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4">
          {/* Date Display */}
          <p className="text-primary font-medium text-base">
            {format(new Date(), "EEEE, MMM d")}
          </p>

          {/* Daily Summary */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            <div>
              <p className="text-2xl font-black text-foreground">{todayTotal.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">group push-ups</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${percentage >= 100 ? "text-primary" : "text-foreground"}`}>
                {percentage}%
              </p>
              <p className="text-sm text-muted-foreground">of {dailyTarget.toLocaleString()} target</p>
            </div>
          </div>

          {/* Progress bar with overflow */}
          <div className="h-2 bg-muted rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500 absolute left-0 top-0"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
            {percentage > 100 && (
              <div
                className="h-full rounded-full transition-all duration-500 absolute left-0 top-0"
                style={{
                  width: `${Math.min(percentage, 200)}%`,
                  background:
                    percentage >= 200
                      ? "linear-gradient(to right, #C029DE, #C029DE99)"
                      : "linear-gradient(to right, hsl(var(--overflow)), hsl(var(--overflow) / 0.6))",
                }}
              />
            )}
          </div>

          {/* Member count note */}
          <p className="text-xs text-muted-foreground text-center">
            Based on {memberCount} active {memberCount === 1 ? "member" : "members"} (82+ push-ups)
          </p>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default DailyGroupOverview;
