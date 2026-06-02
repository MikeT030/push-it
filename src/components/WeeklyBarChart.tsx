import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  // Reset animation whenever the week (days) changes — e.g. via nav arrow tap
  useEffect(() => {
    setAnimate(false);
    const el = containerRef.current;
    if (!el) return;

    // Trigger only once the chart is fully scrolled into view from the bottom
    const isFullyInView = () => {
      const rect = el.getBoundingClientRect();
      return rect.bottom <= window.innerHeight && rect.top >= 0;
    };

    let rafId: number | null = null;
    let rafId2: number | null = null;
    const trigger = () => {
      // Double rAF: ensures bars paint at height 0 before transitioning to target
      rafId = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => setAnimate(true));
      });
    };

    if (isFullyInView()) {
      trigger();
      return () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        if (rafId2 !== null) cancelAnimationFrame(rafId2);
      };
    }

    const onScroll = () => {
      if (isFullyInView()) {
        window.removeEventListener("scroll", onScroll, true);
        window.removeEventListener("resize", onScroll);
        trigger();
      }
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [days]);

  const maxCount = Math.max(dailyTarget, ...days.map((d) => d.count));

  return (
    <div ref={containerRef} className="flex items-end justify-between gap-1 h-16 mb-4">
      {days.map((day) => {
        const percentage = day.isBeforeYearStart ? 0 : (day.count / dailyTarget) * 100;
        const isTripleTarget = percentage >= 201;
        const isDoubleTarget = percentage >= 101 && percentage < 201;

        const getBarColor = () => {
          if (day.isBeforeYearStart || day.count === 0) return "bg-muted/50";
          if (isTripleTarget) return "bg-[#BA25D8]";
          if (isDoubleTarget) return "bg-[#7036FF]";
          return "bg-[#0ABAB5]";
        };

        const heightPercentage = (day.count / maxCount) * 100;
        const targetHeight =
          day.isBeforeYearStart || day.count === 0
            ? "4px"
            : `${Math.max(heightPercentage, 8)}%`;

        return (
          <div
            key={format(day.date, "yyyy-MM-dd")}
            className="flex flex-col items-center flex-1 h-full"
          >
            <div className="flex-1 w-full flex items-end justify-center">
              <Popover>
                <PopoverTrigger asChild>
                  <div
                    className={`w-full max-w-[32px] rounded-t-sm cursor-pointer ${getBarColor()}`}
                    style={{
                      height: animate ? targetHeight : "0px",
                      transition: "height 700ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                </PopoverTrigger>
                <PopoverContent side="top" sideOffset={8} avoidCollisions={false} className="w-auto px-2 py-1">
                  <p className="font-medium text-sm">{day.count} PU</p>
                </PopoverContent>
              </Popover>
            </div>
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
