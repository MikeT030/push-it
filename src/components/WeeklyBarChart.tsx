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
  // Calculate max value for scaling (at least dailyTarget for reference)
  const maxCount = Math.max(dailyTarget, ...days.map(d => d.count));
  
  return (
    <div className="flex items-end justify-between gap-1 h-16 mb-4">
      {days.map((day) => {
        const percentage = day.isBeforeYearStart ? 0 : (day.count / maxCount) * 100;
        const isOverTarget = day.count >= dailyTarget;
        const isDoubleTarget = day.count >= dailyTarget * 2;
        
        return (
          <div
            key={format(day.date, "yyyy-MM-dd")}
            className="flex flex-col items-center flex-1 h-full"
          >
            {/* Bar container */}
            <div className="flex-1 w-full flex items-end justify-center">
              <div
                className={`w-full max-w-[20px] rounded-t-sm transition-all duration-500 ${
                  day.isBeforeYearStart
                    ? "bg-muted/30"
                    : isDoubleTarget
                    ? "bg-[#C029DE]"
                    : isOverTarget
                    ? "bg-primary"
                    : day.count > 0
                    ? "bg-primary/60"
                    : "bg-muted/50"
                }`}
                style={{
                  height: day.isBeforeYearStart || day.count === 0 
                    ? "4px" 
                    : `${Math.max(percentage, 8)}%`,
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
