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
  const barRefs = useRef<Array<HTMLDivElement | null>>([]);
  // Bump on every days change to force a fresh animation cycle
  const [cycle, setCycle] = useState(0);
  const [animate, setAnimate] = useState(false);

  // Whenever days change, snap bars to 0 and start a new cycle
  useEffect(() => {
    setAnimate(false);
    setCycle((c) => c + 1);
  }, [days]);

  // Trigger the grow animation when in view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isInView = () => {
      const rect = el.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    };

    // Force a reflow at height 0 so the next height change transitions from 0
    barRefs.current.forEach((b) => {
      if (b) {
        b.style.height = "0px";
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        b.offsetHeight;
      }
    });

    let rafId: number | null = null;
    let rafId2: number | null = null;
    const trigger = () => {
      rafId = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => setAnimate(true));
      });
    };

    if (isInView()) {
      trigger();
      return () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        if (rafId2 !== null) cancelAnimationFrame(rafId2);
      };
    }

    const onScroll = () => {
      if (isInView()) {
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
      if (rafId2 !== null) cancelAnimationFrame(rafId2);
    };
  }, [cycle]);

  const maxCount = Math.max(dailyTarget, ...days.map((d) => d.count));

  return (
    <div ref={containerRef} className="flex items-end justify-between gap-1 h-16 mb-4">
      {days.map((day, i) => {
        const percentage = day.isBeforeYearStart ? 0 : (day.count / dailyTarget) * 100;
        const isQuadTarget = percentage >= 301;
        const isTripleTarget = percentage >= 201 && percentage < 301;
        const isDoubleTarget = percentage >= 101 && percentage < 201;

        const getBarColor = () => {
          if (day.isBeforeYearStart || day.count === 0) return "bg-muted/50";
          if (isQuadTarget) return "bg-[#FF2C2C]";
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
                    ref={(el) => (barRefs.current[i] = el)}
                    className={`w-full max-w-[28px] rounded-t-sm cursor-pointer ${getBarColor()}`}
                    style={{
                      height: animate ? targetHeight : "0px",
                      transition: "height 600ms cubic-bezier(0.22, 1, 0.36, 1)",
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
