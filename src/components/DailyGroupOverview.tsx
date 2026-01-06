import { useState, useEffect, useMemo } from "react";
import { format, eachDayOfInterval, isSameDay } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

const DAILY_TARGET = 82; // 82 push-ups per day per person
const YEAR_START = new Date(2026, 0, 1); // January 1, 2026

interface DayOption {
  date: Date;
  label: string;
  isToday: boolean;
}

interface MemberContribution {
  user_id: string;
  display_name: string | null;
  count: number;
}

interface EntryWithUser {
  date: string;
  count: number;
  user_id: string;
}

const DailyGroupOverview = () => {
  const [allEntries, setAllEntries] = useState<EntryWithUser[]>([]);
  const [profiles, setProfiles] = useState<Map<string, string | null>>(new Map());
  const [memberCount, setMemberCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Generate day options from year start to today
  const dayOptions = useMemo((): DayOption[] => {
    const today = new Date();
    const days = eachDayOfInterval({ start: YEAR_START, end: today });
    
    return days.map((date) => ({
      date,
      label: format(date, "EEEE, MMM d"),
      isToday: isSameDay(date, today),
    })).reverse(); // Most recent first
  }, []);

  const selectedDay = dayOptions[selectedDayIndex];

  useEffect(() => {
    const fetchDailyData = async () => {
      // Fetch all push up entries with user_id
      const { data: entries } = await supabase
        .from("push_up_entries")
        .select("date, count, user_id");

      if (entries) {
        setAllEntries(entries);
      }

      // Fetch profiles for display names
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, display_name");

      if (profilesData) {
        const profilesMap = new Map<string, string | null>();
        profilesData.forEach((p) => {
          profilesMap.set(p.id, p.display_name);
        });
        setProfiles(profilesMap);
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

  // Calculate data for selected day
  const selectedDateStr = selectedDay ? format(selectedDay.date, "yyyy-MM-dd") : "";
  
  const { dayTotal, memberContributions } = useMemo(() => {
    const dayEntries = allEntries.filter((e) => e.date === selectedDateStr);
    
    // Group by user and sum their counts
    const userTotals = new Map<string, number>();
    dayEntries.forEach((entry) => {
      const current = userTotals.get(entry.user_id) || 0;
      userTotals.set(entry.user_id, current + entry.count);
    });

    const contributions: MemberContribution[] = Array.from(userTotals.entries())
      .map(([user_id, count]) => ({
        user_id,
        display_name: profiles.get(user_id) || null,
        count,
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending

    const total = contributions.reduce((sum, c) => sum + c.count, 0);

    return { dayTotal: total, memberContributions: contributions };
  }, [allEntries, selectedDateStr, profiles]);

  const dailyTarget = DAILY_TARGET * Math.max(memberCount, 1);
  const percentage = dailyTarget > 0 ? Math.round((dayTotal / dailyTarget) * 100) : 0;

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
          {/* Day Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-primary font-medium text-base hover:opacity-80 transition-opacity">
                {selectedDay?.label}
                {selectedDay?.isToday && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                    Today
                  </span>
                )}
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-card/80 backdrop-blur-sm border-border max-h-64 overflow-y-auto z-50"
              align="start"
            >
              {dayOptions.map((day, index) => (
                <DropdownMenuItem
                  key={format(day.date, "yyyy-MM-dd")}
                  onClick={() => setSelectedDayIndex(index)}
                  className={`cursor-pointer ${index === selectedDayIndex ? "bg-primary/10 text-primary" : ""}`}
                >
                  {day.label}
                  {day.isToday && (
                    <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                      Today
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Daily Summary */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            <div>
              <p className="text-2xl font-black text-foreground">{dayTotal.toLocaleString()}</p>
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

          {/* Member Contributions List */}
          {memberContributions.length > 0 ? (
            <div className="space-y-2">
              {memberContributions.map((member, index) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
                >
                  <span className="text-sm text-foreground">
                    {member.display_name || "Member"}
                  </span>
                  <span className="font-bold text-foreground">
                    {member.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No push-ups logged for this day
            </p>
          )}

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
