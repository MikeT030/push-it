import { useMemo } from "react";
import { startOfYear, eachWeekOfInterval, endOfWeek, format, differenceInDays, min } from "date-fns";

interface LineChartGoalCardProps {
  totalPushUps: number;
  yearlyGoal: number;
  yearProgress: number;
  getEntryForDate: (date: Date) => number;
  year: number;
}

const LineChartGoalCard = ({ totalPushUps, yearlyGoal, yearProgress, getEntryForDate, year }: LineChartGoalCardProps) => {
  const chartData = useMemo(() => {
    const today = new Date();
    const yearStart = startOfYear(today);
    const weeks = eachWeekOfInterval({ start: yearStart, end: today }, { weekStartsOn: 1 });

    let cumulative = 0;
    const points: { week: number; total: number }[] = [];

    weeks.forEach((weekStart, i) => {
      const weekEnd = min([endOfWeek(weekStart, { weekStartsOn: 1 }), today]);
      // Sum days in this week
      let d = new Date(weekStart);
      while (d <= weekEnd) {
        cumulative += getEntryForDate(d);
        d = new Date(d.getTime() + 86400000);
      }
      points.push({ week: i, total: cumulative });
    });

    return points;
  }, [getEntryForDate, year]);

  // SVG dimensions
  const W = 360;
  const H = 160;
  const padX = 0;
  const padTop = 10;
  const padBot = 0;

  const totalWeeks = 52;
  const maxY = yearlyGoal;

  const toX = (week: number) => padX + (week / totalWeeks) * (W - padX * 2);
  const toY = (val: number) => padTop + (1 - val / maxY) * (H - padTop - padBot);

  // Build line path
  const linePath = chartData.length > 0
    ? chartData.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.week)},${toY(p.total)}`).join(" ")
    : "";

  // Build filled area path
  const areaPath = linePath
    ? `${linePath} L${toX(chartData[chartData.length - 1].week)},${H} L${toX(0)},${H} Z`
    : "";

  const gradientId = useMemo(() => `line-grad-${Math.random().toString(36).slice(2)}`, []);

  return (
    <div className="col-span-2 bg-card rounded-2xl p-6 pb-4 animate-slide-up overflow-hidden" style={{ animationDelay: "0.5s" }}>
      {/* Header */}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">
            Progress {year}
          </h2>
          <p className="text-4xl font-black text-foreground">
            {totalPushUps.toLocaleString("de-DE")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            of {yearlyGoal.toLocaleString("de-DE")} PU
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-[#0ABAB5]">{yearProgress.toFixed(1)}%</span>
        </div>
      </div>

      {/* Line Chart SVG */}
      <div className="mt-4">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-[140px] block">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ABAB5" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0ABAB5" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Filled area */}
          {areaPath && (
            <path d={areaPath} fill={`url(#${gradientId})`} />
          )}

          {/* Line */}
          {linePath && (
            <path d={linePath} fill="none" stroke="#0ABAB5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Goal line (dashed) */}
          <line
            x1={padX}
            y1={toY(yearlyGoal)}
            x2={W}
            y2={toY(yearlyGoal)}
            stroke="#0ABAB5"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.4"
          />
        </svg>
      </div>
    </div>
  );
};

export default LineChartGoalCard;
