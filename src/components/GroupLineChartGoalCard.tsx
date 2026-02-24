import { useMemo } from "react";
import { startOfYear, eachWeekOfInterval, endOfWeek, min, format } from "date-fns";

interface GroupLineChartGoalCardProps {
  totalPushUps: number;
  groupGoal: number;
  progressPercent: number;
  allEntries: { date: string; count: number; user_id: string }[];
  year: number;
}

const GroupLineChartGoalCard = ({ totalPushUps, groupGoal, progressPercent, allEntries, year }: GroupLineChartGoalCardProps) => {
  const chartData = useMemo(() => {
    const today = new Date();
    const yearStart = startOfYear(today);
    const weeks = eachWeekOfInterval({ start: yearStart, end: today }, { weekStartsOn: 1 });

    // Build a date->total map from all entries
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
  }, [allEntries, year]);

  const W = 360;
  const H = 180;
  const padX = 0;
  const padTop = 10;
  const padBot = 18;
  const totalWeeks = 52;
  const maxY = groupGoal;

  const toX = (week: number) => padX + (week / totalWeeks) * (W - padX * 2);
  const toY = (val: number) => padTop + (1 - val / maxY) * (H - padTop - padBot);

  const linePath = chartData.length > 0
    ? chartData.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.week)},${toY(p.total)}`).join(" ")
    : "";

  const areaPath = linePath
    ? `${linePath} L${toX(chartData[chartData.length - 1].week)},${H - padBot} L${toX(0)},${H - padBot} Z`
    : "";

  const gradientId = useMemo(() => `group-line-grad-${Math.random().toString(36).slice(2)}`, []);

  return (
    <div className="card-glass rounded-2xl p-6 pb-4 mb-6 animate-slide-up overflow-hidden" style={{ animationDelay: "0.25s" }}>
      {/* Header */}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">
            Group Goal {year}
          </h2>
          <p className="text-4xl font-black text-foreground">
            {totalPushUps.toLocaleString("de-DE")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            of {groupGoal.toLocaleString("de-DE")} PU
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-[#0ABAB5]">{progressPercent.toFixed(1)}%</span>
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
            stroke="#9CA3AF" strokeWidth="1" strokeDasharray="6 4" opacity="0.2"
          />

          {/* Goal line */}
          <line
            x1={padX} y1={toY(groupGoal)} x2={W} y2={toY(groupGoal)}
            stroke="#0ABAB5" strokeWidth="1" strokeDasharray="4 4" opacity="0.4"
          />

          {/* X-axis labels (Weeks) */}
          <text x={toX(0)} y={H - 2} fill="#9CA3AF" fontSize="9" textAnchor="start" opacity="0.6">W1</text>
          <text x={toX(13)} y={H - 2} fill="#9CA3AF" fontSize="9" textAnchor="middle" opacity="0.6">W13</text>
          <text x={toX(26)} y={H - 2} fill="#9CA3AF" fontSize="9" textAnchor="middle" opacity="0.6">W26</text>
          <text x={toX(39)} y={H - 2} fill="#9CA3AF" fontSize="9" textAnchor="middle" opacity="0.6">W39</text>
          <text x={toX(52)} y={H - 2} fill="#9CA3AF" fontSize="9" textAnchor="end" opacity="0.6">W52</text>

          {/* Y-axis labels (Push-ups) */}
          <text x={4} y={toY(0) + 4} fill="#9CA3AF" fontSize="9" textAnchor="start" opacity="0.6">0</text>
          <text x={4} y={toY(groupGoal / 2) + 3} fill="#9CA3AF" fontSize="9" textAnchor="start" opacity="0.6">{(groupGoal / 2 / 1000).toFixed(0)}k</text>
          <text x={4} y={toY(groupGoal) + 10} fill="#9CA3AF" fontSize="9" textAnchor="start" opacity="0.6">{(groupGoal / 1000).toFixed(0)}k</text>
        </svg>
      </div>
    </div>
  );
};

export default GroupLineChartGoalCard;
