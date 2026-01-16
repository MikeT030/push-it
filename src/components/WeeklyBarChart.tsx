import { format, isSameDay } from "date-fns";

interface DayData {
  date: Date;
  count: number;
  isToday: boolean;
  isBeforeYearStart: boolean;
}

interface WeeklyBarChartProps {
  days: DayData[];
  dailyTarget: number;
}

const WeeklyBarChart = ({ days, dailyTarget }: WeeklyBarChartProps) => {
  return (
    <div className="flex items-end justify-between gap-1 h-16 mb-4">
      {days.map((day) => {
        const percentage = day.isBeforeYearStart ? 0 : (day.count / dailyTarget) * 100;
        const isTripleTarget = percentage >= 201;
        const isDoubleTarget = percentage >= 101 && percentage < 201;
        const isAtOrBelowTarget = percentage > 0 && percentage <= 100;
        
        // Color coding: up to 100% = #0ABAB5, 101-200% = #4300FF, 201%+ = #BA25D8
        const getBarColor = () => {
          if (day.isBeforeYearStart || day.count === 0) return "bg-muted/50";
          if (isTripleTarget) return "bg-[#BA25D8]";
          if (isDoubleTarget) return "bg-[#4300FF]";
          return "bg-[#0ABAB5]";
        };
        
        // Scale bar height based on max value
        const maxCount = Math.max(dailyTarget, ...days.map(d => d.count));
        const heightPercentage = (day.count / maxCount) * 100;
        
        return (
          <div
            key={format(day.date, "yyyy-MM-dd")}
            className="flex flex-col items-center flex-1 h-full"
          >
            {/* Bar container */}
            <div className="flex-1 w-full flex items-end justify-center">
              <div
                className={`w-full max-w-[14px] rounded-t-sm transition-all duration-500 ${getBarColor()}`}
                style={{
                  height: day.isBeforeYearStart || day.count === 0 
                    ? "4px" 
                    : `${Math.max(heightPercentage, 8)}%`,
                }}
              />
            </div>
            {/* Day label */}
            <span
              className={`text-[10px] mt-1 ${
                day.isToday ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              {format(day.date, "EEE").charAt(0)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyBarChart;
