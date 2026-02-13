import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  const dayRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Generate day options from year start to today
  const dayOptions = useMemo((): DayOption[] => {
    const today = new Date();
    const days = eachDayOfInterval({ start: YEAR_START, end: today });

    return days.map((date) => ({
      date,
      label: format(date, "EEEE, MMM d"),
      isToday: isSameDay(date, today)
    })); // Oldest first, newest last (left to right)
  }, []);

  // Set default to today (last item) once dayOptions is ready
  useEffect(() => {
    if (dayOptions.length > 0 && selectedDayIndex === -1) {
      setSelectedDayIndex(dayOptions.length - 1);
    }
  }, [dayOptions, selectedDayIndex]);

  const selectedDay = selectedDayIndex >= 0 ? dayOptions[selectedDayIndex] : dayOptions[dayOptions.length - 1];

  // Scroll to center the selected day
  const scrollToCenter = useCallback((index: number, smooth = true) => {
    const container = scrollRef.current;
    const el = dayRefs.current.get(index);
    if (!container || !el) return;
    const containerWidth = container.offsetWidth;
    const elLeft = el.offsetLeft;
    const elWidth = el.offsetWidth;
    container.scrollTo({
      left: elLeft - containerWidth / 2 + elWidth / 2,
      behavior: smooth ? "smooth" : "instant"
    });
  }, []);

  // Center selected day on mount/visibility
  useEffect(() => {
    if (selectedDayIndex >= 0) {
      const attemptScroll = () => scrollToCenter(selectedDayIndex, false);
      // Multiple attempts to handle tab visibility timing
      const t1 = setTimeout(attemptScroll, 50);
      const t2 = setTimeout(attemptScroll, 200);
      const t3 = setTimeout(attemptScroll, 500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [scrollToCenter, selectedDayIndex]);

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

        {/* Horizontally Scrollable Day Selector */}
        <div
          ref={scrollRef}
          data-horizontal-scroll
          className="flex gap-2 overflow-x-auto mb-4 scrollbar-hide -mx-2 px-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {dayOptions.map((day, index) => (
            <button
              key={format(day.date, "yyyy-MM-dd")}
              ref={(el) => {
                if (el) dayRefs.current.set(index, el);
              }}
              onClick={() => {
                setSelectedDayIndex(index);
                scrollToCenter(index);
                setIsOpen(true);
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                index === selectedDayIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {format(day.date, "EEE, MMM d")}
              {day.isToday && " · Today"}
            </button>
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