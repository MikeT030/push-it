import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { startOfYear, eachWeekOfInterval, endOfWeek, min, format, differenceInDays } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";

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
  memberCount,
  embedded,
}: GroupMountainGoalCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [displayCount, setDisplayCount] = useState(0);
  const hasAnimated = useRef(false);
  const [showIdealPace, setShowIdealPace] = useState(true);
  const [showProjection, setShowProjection] = useState(false);
  const [showChart, setShowChart] = useState(false);

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

  // Left ridge points — the exact vertices of the mountain's left slope, from base up to peak.
  const leftRidge = [
    { x: leftBaseX, y: baseY },
    { x: leftBaseX + 38, y: baseY - 42 },
    { x: leftBaseX + 62, y: baseY - 30 },
    { x: leftBaseX + 96, y: baseY - 78 },
    { x: leftBaseX + 126, y: baseY - 70 },
    { x: leftBaseX + 156, y: baseY - 130 },
    { x: peakX - 8, y: peakY + 8 },
    { x: peakX, y: peakY },
  ];

  const segLens: number[] = [];
  let ridgeLen = 0;
  for (let i = 1; i < leftRidge.length; i++) {
    const l = Math.hypot(leftRidge[i].x - leftRidge[i - 1].x, leftRidge[i].y - leftRidge[i - 1].y);
    segLens.push(l);
    ridgeLen += l;
  }

  // Build a path along the left ridge from base up to the given fraction (0..1) of total ridge length.
  const ridgePath = (f: number) => {
    const frac = Math.max(0, Math.min(1, f));
    const target = frac * ridgeLen;
    let acc = 0;
    let d = `M${leftRidge[0].x},${leftRidge[0].y}`;
    for (let i = 0; i < segLens.length; i++) {
      if (acc + segLens[i] >= target) {
        const t = segLens[i] === 0 ? 0 : (target - acc) / segLens[i];
        const p0 = leftRidge[i];
        const p1 = leftRidge[i + 1];
        const x = p0.x + (p1.x - p0.x) * t;
        const y = p0.y + (p1.y - p0.y) * t;
        d += ` L${x.toFixed(2)},${y.toFixed(2)}`;
        return { d, end: { x, y } };
      }
      acc += segLens[i];
      d += ` L${leftRidge[i + 1].x},${leftRidge[i + 1].y}`;
    }
    const last = leftRidge[leftRidge.length - 1];
    return { d, end: { x: last.x, y: last.y } };
  };

  const safeGoal = groupGoal > 0 ? groupGoal : 1;
  const progressFrac = Math.min(totalPushUps / safeGoal, 1);
  const projectionFrac = Math.min(projectedEOY / safeGoal, 1);

  const progress = ridgePath(progressFrac);
  const idealPath = ridgePath(1);
  const projection = ridgePath(projectionFrac);
  const peakCoord = { x: peakX, y: peakY };


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
              <stop offset="0%" stopColor="#5A6273" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3B404F" stopOpacity="0.15" />
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

          {/* Mountain body — muted gray fill, light gray outline */}
          <path
            d={mountainPath}
            fill={`url(#${gradientId}-mtn)`}
            stroke="#4B5260"
            strokeWidth="1.5"
            strokeLinejoin="round"
            opacity="0.95"
          />
          {/* Snow cap */}
          <path d={snowPath} fill="#E8FBFA" opacity="0.85" />

          {/* Expected pace — dashed line following the exact left ridge to the peak */}
          {showIdealPace && (
            <path
              d={idealPath.d}
              fill="none"
              stroke="#0ABAB5"
              strokeWidth="2"
              strokeDasharray="6 4"
              strokeLinejoin="round"
              opacity="0.85"
              filter={`url(#${gradientId}-glow)`}
            />
          )}

          {/* Actual progress — solid line along the ridge up to current progress */}
          {progressFrac > 0 && (
            <path
              d={progress.d}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${gradientId}-glow)`}
            />
          )}

          {/* Projection — dashed along the ridge from current point to projected EOY */}
          {showProjection && projectionFrac > progressFrac && (
            <path
              d={projection.d}
              fill="none"
              stroke="#C029DE"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              strokeLinejoin="round"
              opacity="0.7"
            />
          )}

          {/* Current position marker */}
          <circle cx={progress.end.x} cy={progress.end.y} r="3.5" fill="#C029DE" stroke="#0F1922" strokeWidth="1.5" />

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

  const today = new Date();
  const yearStart = startOfYear(today);
  const daysElapsed = differenceInDays(today, yearStart) + 1;
  const expectedProgress = Math.min((daysElapsed / 365) * 100, 100);
  const avgProgress = progressPercent;
  const remaining = Math.max(groupGoal - totalPushUps, 0);

  return (
    <div
      ref={cardRef}
      className="bg-card/40 rounded-2xl animate-slide-up pt-[10px] mb-[10px] px-[10px] border border-[#3B404F] pb-[12px]"
      style={{ animationDelay: "0.25s" }}
    >
      <div
        className="flex items-center justify-between cursor-pointer mb-[6px] pl-[10px] pr-[10px]"
        onClick={() => setShowChart((v) => !v)}
      >
        <h2 className="text-lg text-foreground font-semibold">
          We Push Goal {year}
        </h2>
        {showChart ? (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      <div className="h-px mb-4 mx-[10px] bg-[#3b404f]" />

      <div className="flex items-center gap-6 mx-[10px] mt-2">
        <div className="flex-1 flex items-start gap-8">
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="font-black text-[#0ab8b2] text-xl">
              {totalPushUps.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-xl font-bold text-foreground">
              {remaining.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Goal</p>
            <p className="text-xl font-bold text-foreground">
              {groupGoal.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div
        className="mt-4 h-3 rounded-full overflow-hidden bg-[#3b404f] cursor-pointer active:scale-[0.98] transition-transform relative mx-[10px]"
        onClick={() => setShowChart((v) => !v)}
      >
        <div
          className={`h-full bg-[#0ABAB5] absolute left-0 top-0 transition-all duration-700 ${
            expectedProgress > avgProgress ? "rounded-full" : "rounded-l-full"
          }`}
          style={{ width: `${Math.min(expectedProgress, 100)}%` }}
        />
        {avgProgress > expectedProgress && (
          <div
            className="h-full bg-[#BA25D8] absolute top-0 rounded-r-full transition-all duration-700"
            style={{
              left: `${Math.min(expectedProgress, 100)}%`,
              width: `${Math.min(avgProgress - expectedProgress, 100 - expectedProgress)}%`,
            }}
          />
        )}
        {avgProgress < expectedProgress && (
          <div
            className="h-full bg-[#BA25D8] absolute left-0 top-0 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(avgProgress, 100)}%` }}
          />
        )}
      </div>
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className="w-2 h-2 rounded-full bg-[#BA25D8]" />
        <p className="text-sm text-muted-foreground">
          {Math.round(avgProgress)}% average progress, {memberCount} act. members
        </p>
      </div>


      {showChart && <div className="mt-4">{chartContent}</div>}
    </div>
  );
};

export default GroupMountainGoalCard;
