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
  goal: number;
}

interface EntryWithUser {
  date: string;
  count: number;
  user_id: string;
}

const DailyGroupOverview = () => {
  const [allEntries, setAllEntries] = useState<EntryWithUser[]>([]);
  const [profiles, setProfiles] = useState<Map<string, { name: string | null; goal: number }>>(new Map());
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

  // Scroll to a day. For today (last item) align to the right edge so the
  // current day and previous days are visible without empty space to the right.
  const scrollToCenter = useCallback((index: number, smooth = true) => {
    const container = scrollRef.current;
    const el = dayRefs.current.get(index);
    if (!container || !el) return;
    const containerWidth = container.offsetWidth;
    const elLeft = el.offsetLeft;
    const elWidth = el.offsetWidth;
    const isLast = index === dayOptions.length - 1;
    const targetLeft = isLast
      ? container.scrollWidth - containerWidth
      : elLeft - containerWidth / 2 + elWidth / 2;
    container.scrollTo({
      left: targetLeft,
      behavior: smooth ? "smooth" : "instant"
    });
  }, [dayOptions.length]);

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

      // Fetch profiles for display names and yearly goals
      const { data: profilesData } = await supabase.
      from("profiles").
      select("id, display_name, yearly_goal");

      if (profilesData) {
        const profilesMap = new Map<string, { name: string | null; goal: number }>();
        profilesData.forEach((p: any) => {
          profilesMap.set(p.id, { name: p.display_name, goal: Number(p.yearly_goal) || 29930 });
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
    map(([user_id, count]) => {
      const profile = profiles.get(user_id);
      return {
        user_id,
        display_name: profile?.name ?? null,
        count,
        goal: profile?.goal ?? 29930,
      };
    }).
    sort((a, b) => b.count - a.count);

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
      <div className="bg-card/40 rounded-2xl p-6 animate-slide-up pt-[10px] pb-[10px] mb-[10px] px-[10px] border border-[#3B404F]">
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity mb-[6px] mt-[10px] px-[10px] pt-[10px] pb-[10px] rounded-2xl">
            <h2 className="text-lg font-bold text-foreground">Daily We Push</h2>
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
          className="flex gap-2 overflow-x-auto mb-4 scrollbar-hide -mx-2 px-2 pb-[2px] pt-[2px]"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {dayOptions.map((day, index) => {
            const isSelected = index === selectedDayIndex;
            return (
              <button
                key={format(day.date, "yyyy-MM-dd")}
                ref={(el) => {
                  if (el) dayRefs.current.set(index, el);
                }}
                onClick={() => {
                  if (index === selectedDayIndex) {
                    setIsOpen((prev) => !prev);
                  } else {
                    setSelectedDayIndex(index);
                    scrollToCenter(index);
                    setIsOpen(true);
                  }
                }}
                style={{
                  background: `rgba(42,47,58,0.70)`,
                  boxShadow: [
                    'inset 0 2px 4px rgba(0,0,0,0.3)',
                    'inset 0 -1px 2px rgba(255,255,255,0.05)',
                    'inset 0 0 0 1px rgba(255,255,255,0.06)',
                    '0 1px 2px rgba(0,0,0,0.25)',
                  ].join(', '),
                }}
                className={`relative overflow-hidden flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 ease-out active:translate-y-[1px] active:scale-[0.98] ${
                  isSelected ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {format(day.date, "EEE, MMM d")}
                {day.isToday && " · Today"}
              </button>
            );
          })}
        </div>

        {/* Daily Summary */}
        <div className="flex items-center justify-between p-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsOpen((prev) => !prev)}>
          <div>
            <p className="font-black text-foreground text-xl">{dayTotal.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Push-Ups</p>
          </div>
          <div className="text-right">
          <p className="font-bold text-white text-xl">
            {percentage}%
          </p>
            <p className="text-sm text-muted-foreground">of {dailyTarget.toLocaleString()} target</p>
          </div>
        </div>

        {/* Progress bar with tier boundaries */}
        {dayTotal > 0 && (() => {
          const barTransform = {
            transform: isOpen ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: "left",
            transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
          } as const;
          if (percentage < 100) {
            return (
              <div
                className="h-2 rounded-full relative mb-4 border"
                style={{ borderColor: "#0ABAB5", ...barTransform }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${percentage}%`, backgroundColor: "#0ABAB5" }}
                />
              </div>
            );
          }
          const groupDenom = Math.max(percentage, 1);
          const groupStops: { color: string; x: number }[] = [
            { color: "#0ABAB5", x: 0 },
            { color: "#0ABAB5", x: 100 },
            { color: "#7036FF", x: 100 },
            { color: "#7036FF", x: 200 },
            { color: "#C029DE", x: 200 },
            { color: "#C029DE", x: 300 },
            { color: "#FF3366", x: 300 },
            { color: "#FF3366", x: 400 },
          ];
          const groupGradient = `linear-gradient(to right, ${groupStops
            .map((s) => `${s.color} ${(s.x / groupDenom) * 100}%`)
            .join(", ")})`;
          const groupBoundaries: { x: number; outer: string; inner: string }[] = [
            { x: 100, outer: "#0ABAB5", inner: "#7036FF" },
            { x: 200, outer: "#7036FF", inner: "#C029DE" },
            { x: 300, outer: "#C029DE", inner: "#FF3366" },
          ].filter((b) => percentage > b.x);
          return (
            <div
              className="h-2 rounded-full relative mb-4 bg-transparent"
              style={barTransform}
            >
              <div
                className="h-full w-full rounded-full"
                style={{ background: groupGradient }}
              />
              {groupBoundaries.map((b) => (
                <div
                  key={b.x}
                  className="absolute top-1/2 rounded-full flex items-center justify-center"
                  style={{
                    left: `${(b.x / groupDenom) * 100}%`,
                    width: 8,
                    height: 8,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: b.outer,
                  }}
                >
                  <div
                    className="rounded-full"
                    style={{ width: 4, height: 4, backgroundColor: b.inner }}
                  />
                </div>
              ))}
            </div>
          );
        })()}

        <CollapsibleContent className="space-y-4">

          {/* Member Contributions List */}
          {memberContributions.length > 0 ?
          <div>
              {memberContributions.map((member, index) => {
                const personalTarget = Math.max(1, member.goal / 365);
                const memberPct = (member.count / personalTarget) * 100;
                const denom = Math.max(memberPct, 1);
                // Solid tier colors with hard transitions (no fade, no gap).
                const rawStops: { color: string; x: number }[] = [
                  { color: "#0ABAB5", x: 0 },
                  { color: "#0ABAB5", x: 100 },
                  { color: "#7036FF", x: 100 },
                  { color: "#7036FF", x: 200 },
                  { color: "#C029DE", x: 200 },
                  { color: "#C029DE", x: 300 },
                  { color: "#FF3366", x: 300 },
                  { color: "#FF3366", x: 400 },
                ];
                const gradient = `linear-gradient(to right, ${rawStops
                  .map((s) => `${s.color} ${(s.x / denom) * 100}%`)
                  .join(", ")})`;
                // Tier boundary markers: real circles, outer = previous tier, inner = next tier.
                const boundaries: { x: number; outer: string; inner: string }[] = [
                  { x: 100, outer: "#0ABAB5", inner: "#7036FF" },
                  { x: 200, outer: "#7036FF", inner: "#C029DE" },
                  { x: 300, outer: "#C029DE", inner: "#FF3366" },
                ].filter((b) => memberPct > b.x);
                return (
                <div key={member.user_id}>
                  <div className="py-3 px-3 flex items-center gap-3">
                    <span className="text-sm text-foreground w-16 shrink-0 truncate">
                      {member.display_name || "Member"}
                    </span>
                    {memberPct < 100 ? (
                      <div
                        className={`flex-1 h-1.5 rounded-full relative border origin-left ${isOpen ? "animate-expand-bar" : "scale-x-0"}`}
                        style={{ borderColor: "#0ABAB5" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${memberPct}%`, backgroundColor: "#0ABAB5" }}
                        />
                      </div>
                    ) : (
                    <div
                      className={`flex-1 h-1.5 rounded-full relative bg-transparent origin-left ${isOpen ? "animate-expand-bar" : "scale-x-0"}`}
                    >
                      <div
                        className="h-full w-full rounded-full"
                        style={{ background: gradient }}
                      />
                      {boundaries.map((b) => (
                        <div
                          key={b.x}
                          className="absolute top-1/2 rounded-full flex items-center justify-center"
                          style={{
                            left: `${(b.x / denom) * 100}%`,
                            width: 6,
                            height: 6,
                            transform: "translate(-50%, -50%)",
                            backgroundColor: b.outer,
                          }}
                        >
                          <div
                            className="rounded-full"
                            style={{ width: 3, height: 3, backgroundColor: b.inner }}
                          />
                        </div>
                      ))}
                    </div>
                    )}
                    <span className="font-bold text-foreground w-12 shrink-0 text-right">
                      {member.count.toLocaleString()}
                    </span>
                  </div>
                  {index < memberContributions.length - 1 && (
                    <div className="h-px mx-3" style={{ backgroundColor: "#575F78" }} />
                  )}
                </div>
                );
              })}
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