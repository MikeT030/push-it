import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { startOfYear, eachWeekOfInterval, endOfWeek, min, format, differenceInDays } from "date-fns";

interface GroupMountainGoalCardProps {
  totalPushUps: number;
  groupGoal: number;
  progressPercent: number;
  allEntries: { date: string; count: number; user_id: string }[];
  year: number;
  memberCount: number;
  embedded?: boolean;
}

const GroupMountainGoalCard = ({
  totalPushUps,
  groupGoal,
  progressPercent,
  allEntries,
  year,
  embedded,
}: GroupMountainGoalCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [displayCount, setDisplayCount] = useState(0);
  const hasAnimated = useRef(false);
  const [showIdealPace, setShowIdealPace] = useState(true);
  const [showProjection, setShowProjection] = useState(false);

  const animateCount = useCallback((target: number) => {
    const duration = 1200;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animateCount(totalPushUps);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [totalPushUps, animateCount]);

  const chartData = useMemo(() => {
    const today = new Date();
    const yearStart = startOfYear(today);
    const weeks = eachWeekOfInterval({ start: yearStart, end: today }, { weekStartsOn: 1 });
    const dateMap = new Map<string, number>();
    allEntries.forEach((e) => {
      dateMap.set(e.date, (dateMap.get(e.date) || 0) + e.count);
    });
    let cumulative = 0;
    const points: { week: number; total: number }[] = [];
    weeks.forEach((weekStart, i) => {
      const weekEnd = min([endOfWeek(weekStart, { weekStartsOn: 1 }), today]);
      let d = new Date(weekStart);
      while (d <= weekEnd) {
        const key = format(d, "yyyy-MM-dd");
        cumulative += dateMap.get(key) || 0;
        d = new Date(d.getTime() + 86400000);
      }
      points.push({ week: i, total: cumulative });
    });
    return points;
  }, [allEntries]);

  const projectedEOY = useMemo(() => {
    const today = new Date();
    const yearStart = startOfYear(today);
    const daysElapsed = differenceInDays(today, yearStart) + 1;
    if (daysElapsed <= 0) return 0;
    return Math.round((totalPushUps / daysElapsed) * 365);
  }, [totalPushUps]);

  // SVG geometry — mountain spans full width, peak in the middle-top
  const W = 400;
  const H = 220;
  const baseY = 196;
  const peakX = W / 2;
  const peakY = 22;
  const leftBaseX = 18;
  const rightBaseX = W - 18;
  const totalWeeks = 52;

  // Map a (week, value) point to coordinates that climb the LEFT slope of the mountain.
  // x progresses with time from left base to peak; y rises from base to peak proportional to value/goal.
  const climb = (week: number, value: number) => {
    const t = Math.min(week / totalWeeks, 1);
    const v = Math.min(value / groupGoal, 1.1);
    const x = leftBaseX + t * (peakX - leftBaseX);
    const y = baseY - v * (baseY - peakY);
    return { x, y };
  };

  const progressPath = chartData.length
    ? chartData
        .map((p, i) => {
          const { x, y } = climb(p.week, p.total);
          return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" ")
    : "";

  const lastPoint = chartData.length ? chartData[chartData.length - 1] : null;
  const lastCoord = lastPoint ? climb(lastPoint.week, lastPoint.total) : null;
  const peakCoord = { x: peakX, y: peakY };
  const projectedCoord = climb(totalWeeks, projectedEOY);

  // Mountain silhouette with jagged ridge
  const mountainPath = `
    M${leftBaseX},${baseY}
    L${leftBaseX + 38},${baseY - 42}
    L${leftBaseX + 62},${baseY - 30}
    L${leftBaseX + 96},${baseY - 78}
    L${leftBaseX + 126},${baseY - 70}
    L${leftBaseX + 156},${baseY - 130}
    L${peakX - 8},${peakY + 8}
    L${peakX},${peakY}
    L${peakX + 10},${peakY + 12}
    L${peakX + 46},${baseY - 120}
    L${peakX + 72},${baseY - 96}
    L${peakX + 108},${baseY - 60}
    L${peakX + 138},${baseY - 70}
    L${peakX + 164},${baseY - 28}
    L${rightBaseX},${baseY}
    Z
  `;

  // Snow caps near the summit
  const snowPath = `
    M${peakX - 28},${peakY + 28}
    L${peakX - 18},${peakY + 18}
    L${peakX - 8},${peakY + 22}
    L${peakX},${peakY + 10}
    L${peakX + 10},${peakY + 24}
    L${peakX + 22},${peakY + 18}
    L${peakX + 34},${peakY + 36}
    L${peakX + 26},${peakY + 42}
    L${peakX + 4},${peakY + 30}
    L${peakX - 14},${peakY + 40}
    Z
  `;

  const gradientId = useMemo(() => `mtn-${Math.random().toString(36).slice(2)}`, []);

  const chartContent = (
    <>
      <div
        className="rounded-xl p-[2px]"
        style={{
          background: "rgba(154, 170, 216, 0.06)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(154, 170, 216, 0.08)",
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[200px] block" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`${gradientId}-mtn`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ABAB5" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0ABAB5" stopOpacity="0.02" />
            </linearGradient>
            <filter id={`${gradientId}-glow`}>
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Goal line at peak height */}
          <line
            x1={0}
            y1={peakY}
            x2={W}
            y2={peakY}
            stroke="#0ABAB5"
            strokeWidth="1"
            strokeDasharray="3 5"
            opacity="0.25"
          />
          <text x={6} y={peakY - 4} fill="#0ABAB5" fontSize="10" opacity="0.75">
            {(groupGoal / 1000).toFixed(0)}k goal
          </text>

          {/* Mountain body */}
          <path d={mountainPath} fill={`url(#${gradientId}-mtn)`} stroke="#0ABAB5" strokeWidth="1.5" strokeLinejoin="round" opacity="0.9" />
          {/* Snow cap */}
          <path d={snowPath} fill="#E8FBFA" opacity="0.85" />

          {/* Expected pace — climbs the left outline to the peak */}
          {showIdealPace && (
            <line
              x1={leftBaseX}
              y1={baseY}
              x2={peakCoord.x}
              y2={peakCoord.y}
              stroke="#0ABAB5"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.85"
              filter={`url(#${gradientId}-glow)`}
            />
          )}

          {/* Actual progress line climbing the mountain */}
          {progressPath && (
            <path
              d={progressPath}
              fill="none"
              stroke="#C029DE"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${gradientId}-glow)`}
            />
          )}

          {/* Projection from last point continuing toward the peak */}
          {showProjection && lastCoord && (
            <line
              x1={lastCoord.x}
              y1={lastCoord.y}
              x2={projectedCoord.x}
              y2={projectedCoord.y}
              stroke="#C029DE"
              strokeWidth="1.5"
              strokeDasharray="5 4"
              opacity="0.7"
            />
          )}

          {/* Current position marker */}
          {lastCoord && (
            <circle cx={lastCoord.x} cy={lastCoord.y} r="3.5" fill="#C029DE" stroke="#0F1922" strokeWidth="1.5" />
          )}

          {/* Peak flag */}
          <circle cx={peakCoord.x} cy={peakCoord.y} r="3" fill="#0ABAB5" />
        </svg>
      </div>

      <div className="flex justify-between items-center mt-2 pt-3 border-t border-border/30">
        <div>
          <p className="text-xs text-muted-foreground">We Push progress</p>
          <p className="text-xl font-bold text-[#c02bde]">{progressPercent.toFixed(1)}%</p>
        </div>
        <button
          className={`text-center select-none rounded-lg px-3 py-2 border transition-all active:scale-95 ${
            showIdealPace ? "bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5]" : "text-muted-foreground border-[#3B404F]"
          }`}
          onClick={() => setShowIdealPace((v) => !v)}
        >
          <p className="text-[10px] leading-tight">Exp. PU (EOY)</p>
          <p className="text-base font-bold leading-snug">{groupGoal.toLocaleString("de-DE")}</p>
        </button>
        <button
          className={`text-center select-none rounded-lg px-3 py-2 border transition-all active:scale-95 ${
            showProjection ? "bg-[#C029DE]/10 border-[#C029DE] text-[#C029DE]" : "text-muted-foreground border-[#3B404F]"
          }`}
          onClick={() => setShowProjection((v) => !v)}
        >
          <p className="text-[10px] leading-tight">Proj. PU (EOY)</p>
          <p className="text-base font-bold leading-snug">{projectedEOY.toLocaleString("de-DE")}</p>
        </button>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div ref={cardRef} className="mt-4 animate-fade-in">
        <div className="h-px bg-border/30 mb-2" />
        {chartContent}
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="bg-card/40 rounded-2xl p-6 pb-4 mb-6 animate-slide-up overflow-hidden px-[10px]"
      style={{ animationDelay: "0.25s" }}
    >
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <h2 className="text-lg text-foreground font-semibold mb-1">We Push Goal {year}</h2>
          <p className="text-xl font-black text-foreground">{displayCount.toLocaleString("de-DE")} PU</p>
          <p className="text-sm text-muted-foreground mt-1">of {groupGoal.toLocaleString("de-DE")} PU</p>
        </div>
      </div>
      <div className="mt-4">{chartContent}</div>
    </div>
  );
};

export default GroupMountainGoalCard;
