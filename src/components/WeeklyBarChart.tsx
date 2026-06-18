import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";

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
  const [cycle, setCycle] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(false);
    setCycle((c) => c + 1);
  }, [days]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isInView = () => {
      const rect = el.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    };

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
    <div ref={containerRef} className="flex items-end justify-between gap-1 h-28 mb-4 pt-3">
      {days.map((day, i) => {
        const percentage = day.isBeforeYearStart ? 0 : (day.count / dailyTarget) * 100;
        const isQuadTarget = percentage >= 301;
        const isTripleTarget = percentage >= 201 && percentage < 301;
        const isDoubleTarget = percentage >= 101 && percentage < 201;

        const getColorHex = () => {
          if (day.isBeforeYearStart || day.count === 0) return null;
          if (isQuadTarget) return "#FF2C2C";
          if (isTripleTarget) return "#BA25D8";
          if (isDoubleTarget) return "#7036FF";
          return "#0ABAB5";
        };

        const colorHex = getColorHex();

        const heightPercentage = (day.count / maxCount) * 100;
        const targetHeight =
          day.isBeforeYearStart || day.count === 0
            ? "4px"
            : `${Math.max(heightPercentage, 8)}%`;

        const denom = Math.max(percentage, 1);
        const rawStops: { color: string; y: number }[] = [
          { color: "#0ABAB5", y: 0 },
          { color: "#0ABAB5", y: 100 },
          { color: "#7036FF", y: 100 },
          { color: "#7036FF", y: 200 },
          { color: "#BA25D8", y: 200 },
          { color: "#BA25D8", y: 300 },
          { color: "#FF2C2C", y: 300 },
          { color: "#FF2C2C", y: 400 },
        ];
        const gradient = `linear-gradient(to top, ${rawStops
          .map((s) => `${s.color} ${(s.y / denom) * 100}%`)
          .join(", ")})`;
        const boundaries: { y: number; outer: string; inner: string }[] = [
          { y: 100, outer: "#0ABAB5", inner: "#7036FF" },
          { y: 200, outer: "#7036FF", inner: "#BA25D8" },
          { y: 300, outer: "#BA25D8", inner: "#FF2C2C" },
        ].filter((b) => percentage > b.y);

        const sweep =
          percentage >= 301
            ? { from: "#BA25D8", to: "#FF2C2C" }
            : percentage >= 201
            ? { from: "#7036FF", to: "#BA25D8" }
            : percentage >= 101
            ? { from: "#0ABAB5", to: "#7036FF" }
            : null;

        const hasFill = !!colorHex;

        return (
          <div
            key={format(day.date, "yyyy-MM-dd")}
            className="flex flex-col items-center flex-1 h-full"
          >
            <div className="relative flex-1 w-full flex items-end justify-center">
              {/* Track background */}
              <div className="absolute inset-x-0 top-0 bottom-0 flex justify-center pointer-events-none">
                <div className="w-full max-w-[28px] h-full rounded-full bg-white/5" />
              </div>

              {/* Bar */}
              <div
                ref={(el) => (barRefs.current[i] = el)}
                className="relative w-full max-w-[28px] rounded-full"
                style={{
                  height: animate ? targetHeight : "0px",
                  transition: "height 1400ms cubic-bezier(0.33, 1, 0.68, 1)",
                  backgroundColor: hasFill ? undefined : "transparent",
                  boxShadow: colorHex ? `0 0 12px ${colorHex}55` : undefined,
                }}
              >
                {/* Fill layer (clipped to bar shape) */}
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  {hasFill && (percentage < 100 ? (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: "#0ABAB5" }}
                    />
                  ) : (
                    <>
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{ background: gradient }}
                      />
                      {boundaries.map((b) => (
                        <div
                          key={b.y}
                          className="absolute left-1/2 rounded-full flex items-center justify-center"
                          style={{
                            bottom: `${(b.y / denom) * 100}%`,
                            width: 6,
                            height: 6,
                            transform: "translate(-50%, 50%)",
                            backgroundColor: b.outer,
                          }}
                        >
                          <div
                            className="rounded-full"
                            style={{ width: 3, height: 3, backgroundColor: b.inner }}
                          />
                        </div>
                      ))}
                    </>
                  ))}

                  {/* Final sweep: paint bar top-to-bottom with last tier's two colors */}
                  {hasFill && sweep && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `linear-gradient(to top, ${sweep.from}, ${sweep.to})`,
                        clipPath: animate ? "inset(0 0 0 0)" : "inset(100% 0 0 0)",
                        WebkitClipPath: animate ? "inset(0 0 0 0)" : "inset(100% 0 0 0)",
                        transition:
                          "clip-path 900ms cubic-bezier(0.65, 0, 0.35, 1) 1100ms, -webkit-clip-path 900ms cubic-bezier(0.65, 0, 0.35, 1) 1100ms",
                      }}
                    />
                  )}
                </div>

                {/* Count badge on top of bar */}
                {!day.isBeforeYearStart && day.count > 0 && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 -top-3 flex items-center justify-center rounded-full bg-background border-2 shadow-md"
                    style={{
                      borderColor: colorHex ?? "hsl(var(--muted))",
                      minWidth: "26px",
                      height: "22px",
                      padding: "0 4px",
                      opacity: animate ? 1 : 0,
                      transform: `translate(-50%, ${animate ? "0" : "6px"})`,
                      transition: "opacity 600ms ease 900ms, transform 600ms ease 900ms",
                    }}
                  >
                    <span className="text-[10px] font-bold leading-none text-white">
                      {day.count}
                    </span>
                  </div>
                )}
              </div>
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
