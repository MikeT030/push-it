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

  // The mountain's peak now represents the LARGER of expected (goal) or projected EOY.
  // Whichever is bigger reaches the tip; the smaller one sits partway down the ridge.
  const peakValue = Math.max(groupGoal, projectedEOY, 1);
  const expectedFrac = Math.min(groupGoal / peakValue, 1);
  const projectionFrac = Math.min(projectedEOY / peakValue, 1);
  const progressFrac = Math.min(totalPushUps / peakValue, 1);

  const progress = ridgePath(progressFrac);
  const expectedPath = ridgePath(expectedFrac);
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

  // Second mountain — zooms in and pushes first tier fully down when projection toggled on
  const hasSecondTier = projectedEOY > groupGoal;
  const tierActive = showProjection && hasSecondTier;

  // Second mountain geometry — snow at the BOTTOM (the new ground line)
  const m2PeakX = peakX;
  const m2PeakY = peakY - 12;
  const m2BaseY = baseY;

  // Second mountain left ridge — for the projection progress line along its slope
  const m2LeftRidge = [
    { x: leftBaseX + 32, y: m2BaseY },
    { x: leftBaseX + 60, y: m2BaseY - 64 },
    { x: leftBaseX + 86, y: m2BaseY - 46 },
    { x: leftBaseX + 114, y: m2BaseY - 100 },
    { x: leftBaseX + 144, y: m2BaseY - 84 },
    { x: leftBaseX + 170, y: m2BaseY - 146 },
    { x: m2PeakX - 6, y: m2PeakY + 6 },
    { x: m2PeakX, y: m2PeakY },
  ];
  const m2SegLens: number[] = [];
  let m2RidgeLen = 0;
  for (let i = 1; i < m2LeftRidge.length; i++) {
    const l = Math.hypot(m2LeftRidge[i].x - m2LeftRidge[i - 1].x, m2LeftRidge[i].y - m2LeftRidge[i - 1].y);
    m2SegLens.push(l);
    m2RidgeLen += l;
  }
  const m2RidgePath = (f: number) => {
    const frac = Math.max(0, Math.min(1, f));
    const target = frac * m2RidgeLen;
    let acc = 0;
    let d = `M${m2LeftRidge[0].x},${m2LeftRidge[0].y}`;
    for (let i = 0; i < m2SegLens.length; i++) {
      if (acc + m2SegLens[i] >= target) {
        const t = m2SegLens[i] === 0 ? 0 : (target - acc) / m2SegLens[i];
        const p0 = m2LeftRidge[i];
        const p1 = m2LeftRidge[i + 1];
        const x = p0.x + (p1.x - p0.x) * t;
        const y = p0.y + (p1.y - p0.y) * t;
        d += ` L${x.toFixed(2)},${y.toFixed(2)}`;
        return { d, end: { x, y } };
      }
      acc += m2SegLens[i];
      d += ` L${m2LeftRidge[i + 1].x},${m2LeftRidge[i + 1].y}`;
    }
    const last = m2LeftRidge[m2LeftRidge.length - 1];
    return { d, end: { x: last.x, y: last.y } };
  };
  const safeProj = projectedEOY > 0 ? projectedEOY : 1;
  const m2ProgressFrac = Math.min(totalPushUps / safeProj, 1);
  const m2Progress = m2RidgePath(m2ProgressFrac);
  const m2Full = m2RidgePath(1);
  const mountain2Path = `
    M${leftBaseX + 32},${m2BaseY}
    L${leftBaseX + 60},${m2BaseY - 64}
    L${leftBaseX + 86},${m2BaseY - 46}
    L${leftBaseX + 114},${m2BaseY - 100}
    L${leftBaseX + 144},${m2BaseY - 84}
    L${leftBaseX + 170},${m2BaseY - 146}
    L${m2PeakX - 6},${m2PeakY + 6}
    L${m2PeakX},${m2PeakY}
    L${m2PeakX + 6},${m2PeakY + 6}
    L${m2PeakX + 30},${m2BaseY - 136}
    L${m2PeakX + 56},${m2BaseY - 106}
    L${m2PeakX + 86},${m2BaseY - 78}
    L${m2PeakX + 114},${m2BaseY - 88}
    L${m2PeakX + 140},${m2BaseY - 42}
    L${rightBaseX - 32},${m2BaseY}
    Z
  `;
  // Snow structure at the BOTTOM of mountain 2 — jagged white band across its base
  const m2SnowPath = `
    M${leftBaseX + 32},${m2BaseY}
    L${leftBaseX + 56},${m2BaseY - 10}
    L${leftBaseX + 84},${m2BaseY - 4}
    L${leftBaseX + 116},${m2BaseY - 14}
    L${leftBaseX + 150},${m2BaseY - 6}
    L${leftBaseX + 170},${m2BaseY - 16}
    L${m2PeakX - 10},${m2BaseY - 8}
    L${m2PeakX + 28},${m2BaseY - 18}
    L${m2PeakX + 62},${m2BaseY - 6}
    L${m2PeakX + 102},${m2BaseY - 14}
    L${m2PeakX + 140},${m2BaseY - 4}
    L${rightBaseX - 32},${m2BaseY - 12}
    L${rightBaseX - 32},${m2BaseY}
    Z
  `;

  const chartContent = (
    <>
      <div
        className="rounded-xl p-[2px] overflow-hidden"
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
            <linearGradient id={`${gradientId}-mtn2`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ABAB5" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#0ABAB5" stopOpacity="0.18" />
            </linearGradient>
            <filter id={`${gradientId}-glow`}>
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id={`${gradientId}-clip`}>
              <rect x="0" y="0" width={W} height={H} />
            </clipPath>
          </defs>

          <g clipPath={`url(#${gradientId}-clip)`}>
            <g>
              {/* Expected (goal) horizontal reference line at its ridge height */}
              <line
                x1={0}
                y1={expectedPath.end.y}
                x2={W}
                y2={expectedPath.end.y}
                stroke="#0ABAB5"
                strokeWidth="1"
                strokeDasharray="3 5"
                opacity="0.3"
              />
              <text x={6} y={expectedPath.end.y - 4} fill="#0ABAB5" fontSize={showIdealPace ? "14" : "12"} opacity="0.8">
                {(groupGoal / 1000).toFixed(0)}k goal
              </text>

              {/* Projected horizontal reference line at its ridge height */}
              <line
                x1={0}
                y1={projection.end.y}
                x2={W}
                y2={projection.end.y}
                stroke="#0ABAB5"
                strokeWidth="1"
                strokeDasharray="3 5"
                opacity="0.3"
              />
              <text
                x={W - 6}
                y={projection.end.y - 4}
                fill="#0ABAB5"
                fontSize={showProjection ? "14" : "12"}
                opacity="0.85"
                textAnchor="end"
              >
                {(projectedEOY / 1000).toFixed(0)}k projected
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

              {/* Expected pace — dashed teal along the ridge up to expected fraction */}
              {showIdealPace && (
                <path
                  d={expectedPath.d}
                  fill="none"
                  stroke="#0ABAB5"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  strokeLinejoin="round"
                  opacity="0.9"
                  filter={`url(#${gradientId}-glow)`}
                />
              )}

              {/* Projection — dashed teal along the ridge up to projected fraction */}
              {showProjection && (
                <path
                  d={projection.d}
                  fill="none"
                  stroke="#0ABAB5"
                  strokeWidth="2.5"
                  strokeDasharray="5 4"
                  strokeLinejoin="round"
                  opacity="0.9"
                  filter={`url(#${gradientId}-glow)`}
                />
              )}

              {/* Actual progress — solid teal line along the ridge up to current progress */}
              {progressFrac > 0 && (
                <path
                  d={progress.d}
                  fill="none"
                  stroke="#0ABAB5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#${gradientId}-glow)`}
                />
              )}

              {/* Current position marker */}
              <circle cx={progress.end.x} cy={progress.end.y} r="3.5" fill="#0ABAB5" stroke="#0F1922" strokeWidth="1.5" />

              {/* Tip marker — colored by whichever value is the peak */}
              <circle
                cx={peakCoord.x}
                cy={peakCoord.y}
                r="3"
                fill={projectedEOY >= groupGoal ? "#0ABAB5" : "#0ABAB5"}
              />
            </g>
          </g>


        </svg>
      </div>

      <div className="flex justify-between items-center mt-2 pt-3 border-t border-border/30">
        <div>
          <p className="text-xs text-muted-foreground">We Push progress</p>
          <p className="text-xl font-bold text-white">{progressPercent.toFixed(1)}%</p>
        </div>
        <button
          className={`text-center select-none rounded-lg px-3 py-2 border transition-all active:scale-95 ${
            showIdealPace ? "bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5]" : "text-muted-foreground border-[#3B404F]"
          }`}
          onClick={() => {
            setShowIdealPace(true);
            setShowProjection(false);
          }}
        >
          <p className="text-[10px] leading-tight">Exp. PU (EOY)</p>
          <p className="text-base font-bold leading-snug">{groupGoal.toLocaleString("de-DE")}</p>
        </button>
        <button
          className={`text-center select-none rounded-lg px-3 py-2 border transition-all active:scale-95 ${
            showProjection ? "bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5]" : "text-muted-foreground border-[#3B404F]"
          }`}
          onClick={() => {
            setShowProjection(true);
            setShowIdealPace(false);
          }}
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
            className="h-full bg-[#0ABAB5] absolute top-0 rounded-r-full transition-all duration-700"
            style={{
              left: `${Math.min(expectedProgress, 100)}%`,
              width: `${Math.min(avgProgress - expectedProgress, 100 - expectedProgress)}%`,
            }}
          />
        )}
        {avgProgress < expectedProgress && (
          <div
            className="h-full bg-[#0ABAB5] absolute left-0 top-0 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(avgProgress, 100)}%` }}
          />
        )}
      </div>
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className="w-2 h-2 rounded-full bg-[#0ABAB5]" />
        <p className="text-sm text-muted-foreground">Average progress {avgProgress.toFixed(1)}%</p>
      </div>


      {showChart && <div className="mt-6">{chartContent}</div>}
    </div>
  );
};

export default GroupMountainGoalCard;
