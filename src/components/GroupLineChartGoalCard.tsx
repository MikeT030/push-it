import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { startOfYear, eachWeekOfInterval, endOfWeek, min, format, differenceInDays } from "date-fns";

interface GroupLineChartGoalCardProps {
  totalPushUps: number;
  groupGoal: number;
  progressPercent: number;
  allEntries: {date: string;count: number;user_id: string;}[];
  year: number;
  memberCount: number;
}

const GroupLineChartGoalCard = ({ totalPushUps, groupGoal, progressPercent, allEntries, year, memberCount }: GroupLineChartGoalCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [displayCount, setDisplayCount] = useState(0);
  const hasAnimated = useRef(false);

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
    const points: {week: number;total: number;}[] = [];

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
  }, [allEntries, year]);

  const avgPuPerDay = useMemo(() => {
    const today = new Date();
    const yearStart = startOfYear(today);
    const daysElapsed = differenceInDays(today, yearStart) + 1;
    return daysElapsed > 0 ? Math.round(totalPushUps / daysElapsed) : 0;
  }, [totalPushUps]);

  const projectedEOY = useMemo(() => {
    const today = new Date();
    const yearStart = startOfYear(today);
    const daysElapsed = differenceInDays(today, yearStart) + 1;
    if (daysElapsed <= 0) return 0;
    return Math.round((totalPushUps / daysElapsed) * 365);
  }, [totalPushUps]);

  const W = 360;
  const H = 180;
  const padX = 0;
  const padTop = 10;
  const padBot = 18;
  const totalWeeks = 52;
  const maxY = groupGoal;

  const toX = (week: number) => padX + week / totalWeeks * (W - padX * 2);
  const toY = (val: number) => padTop + (1 - val / maxY) * (H - padTop - padBot);

  const linePath = chartData.length > 0 ?
  chartData.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.week)},${toY(p.total)}`).join(" ") :
  "";

  const areaPath = linePath ?
  `${linePath} L${toX(chartData[chartData.length - 1].week)},${H - padBot} L${toX(0)},${H - padBot} Z` :
  "";

  const gradientId = useMemo(() => `group-line-grad-${Math.random().toString(36).slice(2)}`, []);

  return (
    <div ref={cardRef} className="card-glass rounded-2xl p-6 pb-4 mb-6 animate-slide-up overflow-hidden" style={{ animationDelay: "0.25s" }}>
      {/* Header */}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">
            Group Goal {year}
          </h2>
          <p className="text-4xl font-black text-foreground">
            {displayCount.toLocaleString("de-DE")} PU
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            of {groupGoal.toLocaleString("de-DE")} PU
          </p>
        </div>
      </div>

      {/* Line Chart SVG */}
      <div className="mt-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[160px] block" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ABAB5" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0ABAB5" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
          {linePath && <path d={linePath} fill="none" stroke="#0ABAB5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Ideal pace line */}
          <line
            x1={toX(0)} y1={toY(0)} x2={toX(totalWeeks)} y2={toY(groupGoal)}
            stroke="#9CA3AF" strokeWidth="1" strokeDasharray="6 4" opacity="0.2" />


          {/* Goal line */}
          <line
            x1={padX} y1={toY(groupGoal)} x2={W} y2={toY(groupGoal)}
            stroke="#0ABAB5" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />


          {/* X-axis labels (Weeks) */}
          <text x={toX(0)} y={H - 2} fill="#9CA3AF" fontSize="11" textAnchor="start" opacity="0.6">W1</text>
          <text x={toX(13)} y={H - 2} fill="#9CA3AF" fontSize="11" textAnchor="middle" opacity="0.6">W13</text>
          <text x={toX(26)} y={H - 2} fill="#9CA3AF" fontSize="11" textAnchor="middle" opacity="0.6">W26</text>
          <text x={toX(39)} y={H - 2} fill="#9CA3AF" fontSize="11" textAnchor="middle" opacity="0.6">W39</text>
          <text x={toX(52)} y={H - 2} fill="#9CA3AF" fontSize="11" textAnchor="end" opacity="0.6">W52</text>

          {/* Y-axis labels (Push-ups) */}
          <text x={4} y={toY(0) + 4} fill="#9CA3AF" fontSize="11" textAnchor="start" opacity="0.6">0</text>
          <text x={4} y={toY(groupGoal / 2) + 3} fill="#9CA3AF" fontSize="11" textAnchor="start" opacity="0.6">{(groupGoal / 2 / 1000).toFixed(0)}k</text>
          <text x={4} y={toY(groupGoal) + 10} fill="#9CA3AF" fontSize="11" textAnchor="start" opacity="0.6">{(groupGoal / 1000).toFixed(0)}k</text>
        </svg>
      </div>

      {/* Stats below graph */}
      <div className="flex justify-between items-center mt-2 pt-3 border-t border-border/30">
        <div>
          <p className="text-xs text-muted-foreground">Group progress</p>
          <p className="text-xl font-bold text-[#0ABAB5]">{progressPercent.toFixed(1)}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Avg. PU (day)</p>
          <p className="text-xl font-bold text-foreground">{avgPuPerDay.toLocaleString("de-DE")}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Proj. PU (EOY)</p>
          <p className="text-xl font-bold text-foreground">{projectedEOY.toLocaleString("de-DE")}</p>
        </div>
      </div>
    </div>);

};

export default GroupLineChartGoalCard;