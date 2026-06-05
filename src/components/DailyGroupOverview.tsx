import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { format, eachDayOfInterval, isSameDay } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useGroupEntries, useGroupProfiles, useGroupUserProgress } from "@/hooks/useGroupData";

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

interface MemberBarProps {
  cycleKey: string;
  name: string;
  count: number;
  memberPct: number;
  isOpen: boolean;
}

const MemberBar = ({ cycleKey, name, count, memberPct, isOpen }: MemberBarProps) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  // Reset and replay animation whenever the day selection (or open state) changes.
  useEffect(() => {
    setAnimate(false);
    const el = barRef.current;
    if (el) {
      // Force a reflow so the next paint sees the reset width.
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      el.offsetHeight;
    }
    if (!isOpen) return;
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(() => setAnimate(true));
      (barRef as any).__r2 = r2;
    });
    return () => {
      cancelAnimationFrame(r1);
      const r2 = (barRef as any).__r2;
      if (r2) cancelAnimationFrame(r2);
    };
  }, [cycleKey, isOpen]);

  const tierColor =
    count === 0
      ? "#3B404F"
      : memberPct >= 301
      ? "#FF3366"
      : memberPct >= 201
      ? "#C029DE"
      : memberPct >= 101
      ? "#7036FF"
      : "#0ABAB5";

  const denom = Math.max(memberPct, 1);
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
  const boundaries: { x: number; outer: string; inner: string }[] = [
    { x: 100, outer: "#0ABAB5", inner: "#7036FF" },
    { x: 200, outer: "#7036FF", inner: "#C029DE" },
    { x: 300, outer: "#C029DE", inner: "#FF3366" },
  ].filter((b) => memberPct > b.x);

  const clipStyle = {
    clipPath: animate ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
    WebkitClipPath: animate ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
    transition:
      "clip-path 1600ms cubic-bezier(0.16, 1, 0.3, 1), -webkit-clip-path 1600ms cubic-bezier(0.16, 1, 0.3, 1)",
  } as const;

  return (
    <div className="py-3 px-3 flex items-center gap-3">
      <span className="text-sm text-foreground w-16 shrink-0 truncate">{name}</span>

      {/* Track + animated fill */}
      <div className="flex-1 relative h-2 rounded-full bg-white/5">
        <div
          ref={barRef}
          className="absolute inset-0 rounded-full overflow-hidden"
          style={clipStyle}
        >
          {memberPct < 100 ? (
            <div
              className="h-full rounded-full"
              style={{ width: `${memberPct}%`, backgroundColor: "#0ABAB5" }}
            />
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Count badge */}
      <div
        className="shrink-0 flex items-center justify-center rounded-full bg-background border-2"
        style={{
          borderColor: tierColor,
          minWidth: "44px",
          height: "22px",
          padding: "0 6px",
          opacity: animate ? 1 : 0,
          transform: `translateY(${animate ? "0" : "4px"})`,
          transition: "opacity 600ms ease 1200ms, transform 600ms ease 1200ms",
        }}
      >
        <span
          className="text-[11px] font-bold leading-none"
          style={{ color: tierColor }}
        >
          {count.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
const DailyGroupOverview = () => {

  const entriesQuery = useGroupEntries();
  const profilesQuery = useGroupProfiles();
  const usersQuery = useGroupUserProgress();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const isLoaded =
    !entriesQuery.isLoading && !profilesQuery.isLoading && !usersQuery.isLoading;
  const allEntries = entriesQuery.data || [];

  const profiles = useMemo(() => {
    const map = new Map<string, { name: string | null; goal: number }>();
    (profilesQuery.data || []).forEach((p) => {
      map.set(p.id, { name: p.display_name, goal: p.yearly_goal });
    });
    return map;
  }, [profilesQuery.data]);

  const memberCount = useMemo(
    () => (usersQuery.data || []).filter((u) => u.total_pushups >= 82).length,
    [usersQuery.data]
  );

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
      <div className="bg-card/40 rounded-2xl p-6 animate-slide-up pt-[10px] mb-[10px] px-[10px] border border-[#3B404F] pb-[12px]">
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity mb-[6px] pl-[10px] rounded-2xl border-0 py-0 pt-0 pb-0 mt-0">
            <h2 className="text-lg text-foreground font-semibold">Daily We Push</h2>
            {isOpen ?
            <ChevronDown className="w-5 h-5 text-muted-foreground" /> :

            <ChevronRight className="w-5 h-5 text-muted-foreground" />
            }
          </button>
        </CollapsibleTrigger>

        <div className="h-px mb-4 mx-[10px] bg-[#3b404f]" />

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
                  background:
                    'radial-gradient(circle at 50% 55%, rgba(42,47,58,0.55) 0%, rgba(31,36,46,0.45) 60%, rgba(22,26,34,0.35) 100%)',
                  backdropFilter: 'blur(6px) saturate(1.2)',
                  WebkitBackdropFilter: 'blur(6px) saturate(1.2)',
                  boxShadow: [
                    'inset 0 2px 4px rgba(0,0,0,0.55)',
                    'inset 0 -1px 2px rgba(255,255,255,0.07)',
                    'inset 0 0 0 1px rgba(255,255,255,0.06)',
                    '0 2px 6px rgba(0,0,0,0.3)',
                    '0 6px 14px rgba(0,0,0,0.25)',
                  ].join(', '),
                }}
                className={`relative overflow-hidden flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 ease-out active:translate-y-[1px] active:scale-[0.98] ${
                  isSelected ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span
                  className="pointer-events-none absolute inset-x-[18%] top-[10%] h-[18%] rounded-full opacity-30"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)',
                    filter: 'blur(3px)',
                  }}
                />
                <span className="relative">
                  {format(day.date, "EEE, MMM d")}
                  {day.isToday && " · Today"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Daily Summary */}
        <div className="flex items-center justify-between p-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity pl-[10px] pt-[10px] pr-[10px] pb-[10px]" onClick={() => setIsOpen((prev) => !prev)}>
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
        <div className="px-[10px]">{(() => {
          const barTransform = {
            transform: "scaleX(1)",
            transformOrigin: "left",
            transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
          } as const;
          if (dayTotal === 0) {
            return (
              <div
                className="h-2 rounded-full relative mb-4 border"
                style={{ borderColor: "#0ABAB5", ...barTransform }}
              />
            );
          }
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
        })()}</div>

        <CollapsibleContent className="space-y-4">

          {/* Member Contributions List */}
          {memberContributions.length > 0 ?
          <div>
              {memberContributions.map((member, index) => {
                const personalTarget = Math.max(1, member.goal / 365);
                const memberPct = (member.count / personalTarget) * 100;
                return (
                <div key={member.user_id}>
                  <MemberBar
                    cycleKey={`${selectedDateStr}-${isOpen}`}
                    name={member.display_name || "Member"}
                    count={member.count}
                    memberPct={memberPct}
                    isOpen={isOpen}
                  />
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
