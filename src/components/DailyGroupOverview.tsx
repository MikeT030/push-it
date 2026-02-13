import { useState, useEffect, useMemo, useRef } from "react";
import { format, eachDayOfInterval, isSameDay } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(-1);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate day options from year start to today
  const dayOptions = useMemo((): DayOption[] => {
    const today = new Date();
    const days = eachDayOfInterval({ start: YEAR_START, end: today });

    return days.map((date) => ({
      date,
      label: format(date, "EEE, MMM d"),
      isToday: isSameDay(date, today)
    }));
  }, []);

  // Set initial selection to today (last item) and scroll to center
  useEffect(() => {
    if (dayOptions.length > 0 && selectedDayIndex === -1) {
      const todayIdx = dayOptions.length - 1;
      setSelectedDayIndex(todayIdx);
    }
  }, [dayOptions, selectedDayIndex]);

  // Scroll selected day to center
  useEffect(() => {
    if (selectedDayIndex >= 0 && scrollRef.current) {
      const container = scrollRef.current;
      const activeEl = container.children[selectedDayIndex] as HTMLElement;
      if (activeEl) {
        const scrollLeft = activeEl.offsetLeft - container.offsetWidth / 2 + activeEl.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  }, [selectedDayIndex]);

  const selectedDay = selectedDayIndex >= 0 ? dayOptions[selectedDayIndex] : dayOptions[dayOptions.length - 1];
  useEffect(() => {
    const fetchDailyData = async () => {
      // Fetch all push up entries with user_id
      const { data: entries } = await supabase.
      from("push_up_entries").
      select("date, count, user_id");

      if (entries) {
        setAllEntries(entries);
      }

      // Fetch profiles for display names
      const { data: profilesData } = await supabase.
      from("profiles").
      select("id, display_name");

      if (profilesData) {
        const profilesMap = new Map<string, string | null>();
        profilesData.forEach((p) => {
          profilesMap.set(p.id, p.display_name);
        });
        setProfiles(profilesMap);
      }

      // Fetch member count (users with 82+ push-ups)
      const { data: users } = await supabase.
      from("user_progress").
      select("user_id, total_pushups");

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

    const contributions: MemberContribution[] = Array.from(userTotals.entries()).
    map(([user_id, count]) => ({
      user_id,
      display_name: profiles.get(user_id) || null,
      count
    })).
    sort((a, b) => b.count - a.count); // Sort by count descending

    const total = contributions.reduce((sum, c) => sum + c.count, 0);

    return { dayTotal: total, memberContributions: contributions };
  }, [allEntries, selectedDateStr, profiles]);

  const dailyTarget = DAILY_TARGET * Math.max(memberCount, 1);
  const percentage = dailyTarget > 0 ? Math.round(dayTotal / dailyTarget * 100) : 0;

  if (!isLoaded) {
    return (
      <div className="bg-card rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/2 mb-4" />
        <div className="h-16 bg-muted rounded" />
      </div>);

  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card rounded-2xl p-6 animate-slide-up">
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full text-left mb-4 hover:opacity-80 transition-opacity">
            <h2 className="text-lg font-bold text-foreground">Daily Group</h2>
            {isOpen ?
            <ChevronDown className="w-5 h-5 text-muted-foreground" /> :

            <ChevronRight className="w-5 h-5 text-muted-foreground" />
            }
          </button>
        </CollapsibleTrigger>

        <div className="h-px mb-4 bg-[#3b404f]" />

        {/* Horizontal scrollable day selector */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {dayOptions.map((day, index) => (
            <div key={format(day.date, "yyyy-MM-dd")} className="flex items-center flex-shrink-0">
              {index > 0 && (
                <div className="w-px h-4 bg-[#3A404F] mr-2" />
              )}
              <button
                onClick={() => setSelectedDayIndex(index)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  index === selectedDayIndex
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {day.isToday ? "Today" : day.label}
              </button>
            </div>
          ))}
        </div>

        {/* Daily Summary */}
        <div className="flex items-center justify-between p-3 mb-4">
          <div>
            <p className="text-2xl font-black text-foreground">{dayTotal.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">group push-ups</p>
          </div>
          <div className="text-right">
          <p className="text-2xl font-bold text-white">
            {percentage}%
          </p>
            <p className="text-sm text-muted-foreground">of {dailyTarget.toLocaleString()} target</p>
          </div>
        </div>

        {/* Progress bar with overflow */}
        <div className="h-2 rounded-full overflow-hidden relative mb-4 bg-[#3b404f]">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500 absolute left-0 top-0"
            style={{ width: `${Math.min(percentage, 100)}%` }} />

          {percentage > 100 &&
          <div
            className="h-full rounded-full transition-all duration-500 absolute left-0 top-0"
            style={{
              width: `${Math.min(percentage, 200)}%`,
              background:
              percentage >= 200 ?
              "linear-gradient(to right, #C029DE, #C029DE99)" :
              "linear-gradient(to right, hsl(var(--overflow)), hsl(var(--overflow) / 0.6))"
            }} />

          }
        </div>

        <CollapsibleContent className="space-y-4">

          {/* Member Contributions List */}
          {memberContributions.length > 0 ?
          <div className="space-y-2">
              {memberContributions.map((member, index) =>
            <div
              key={member.user_id}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">

                  <span className="text-sm text-foreground">
                    {member.display_name || "Member"}
                  </span>
                  <span className="font-bold text-foreground">
                    {member.count.toLocaleString()}
                  </span>
                </div>
            )}
            </div> :

          <p className="text-sm text-muted-foreground text-center py-2">
              No push-ups logged for this day
            </p>
          }

          {/* Member count note */}
          <p className="text-xs text-muted-foreground text-center">
            Based on {memberCount} active {memberCount === 1 ? "member" : "members"} (82+ push-ups)
          </p>
        </CollapsibleContent>
      </div>
    </Collapsible>);

};

export default DailyGroupOverview;