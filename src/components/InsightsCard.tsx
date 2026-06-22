import { useMemo, useState, useRef, useEffect } from "react";
import { format, parseISO, startOfWeek, startOfMonth, getDay } from "date-fns";
import { Sparkles, X, Trophy, Flame, Calendar, TrendingUp } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { GroupEntry } from "@/hooks/useGroupData";
import wreathIcon from "@/assets/medal.svg";

interface InsightsCardProps {
  userId: string | null;
  allEntries: GroupEntry[];
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const InsightsCard = ({ userId, allEntries }: InsightsCardProps) => {
  const [open, setOpen] = useState(false);

  const insights = useMemo(() => {
    if (!userId) {
      return null;
    }

    const userEntries = allEntries.filter((e) => e.user_id === userId && e.count > 0);

    // ---- Personal bests ----
    let bestDay = { count: 0, date: "" };
    userEntries.forEach((e) => {
      if (e.count > bestDay.count) bestDay = { count: e.count, date: e.date };
    });

    const weekTotalsUser = new Map<string, number>();
    const monthTotalsUser = new Map<string, number>();
    userEntries.forEach((e) => {
      const d = parseISO(e.date);
      const wKey = format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const mKey = format(startOfMonth(d), "yyyy-MM");
      weekTotalsUser.set(wKey, (weekTotalsUser.get(wKey) ?? 0) + e.count);
      monthTotalsUser.set(mKey, (monthTotalsUser.get(mKey) ?? 0) + e.count);
    });

    let bestWeek = { count: 0, key: "" };
    weekTotalsUser.forEach((v, k) => { if (v > bestWeek.count) bestWeek = { count: v, key: k }; });
    let bestMonth = { count: 0, key: "" };
    monthTotalsUser.forEach((v, k) => { if (v > bestMonth.count) bestMonth = { count: v, key: k }; });

    // ---- Winner counts (group-wide) ----
    // Daily winners
    const dailyTotals = new Map<string, Map<string, number>>(); // date -> userId -> count
    const weeklyTotals = new Map<string, Map<string, number>>(); // weekKey -> userId -> count
    const monthlyTotals = new Map<string, Map<string, number>>(); // monthKey -> userId -> count
    allEntries.forEach((e) => {
      if (!e.count) return;
      const d = parseISO(e.date);
      const wKey = format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const mKey = format(startOfMonth(d), "yyyy-MM");
      const addTo = (map: Map<string, Map<string, number>>, key: string) => {
        if (!map.has(key)) map.set(key, new Map());
        const inner = map.get(key)!;
        inner.set(e.user_id, (inner.get(e.user_id) ?? 0) + e.count);
      };
      addTo(dailyTotals, e.date);
      addTo(weeklyTotals, wKey);
      addTo(monthlyTotals, mKey);
    });

    const countWins = (totals: Map<string, Map<string, number>>) => {
      let wins = 0;
      totals.forEach((inner) => {
        let max = 0;
        let winners: string[] = [];
        inner.forEach((v, uid) => {
          if (v > max) { max = v; winners = [uid]; }
          else if (v === max) winners.push(uid);
        });
        if (winners.includes(userId) && max > 0) wins++;
      });
      return wins;
    };

    const dailyWins = countWins(dailyTotals);
    const weeklyWins = countWins(weeklyTotals);
    const monthlyWins = countWins(monthlyTotals);

    // ---- Weekday distribution ----
    const weekdayTotals = new Array(7).fill(0) as number[]; // Mon..Sun
    const weekdayCounts = new Array(7).fill(0) as number[];
    userEntries.forEach((e) => {
      const dow = getDay(parseISO(e.date)); // 0=Sun..6=Sat
      const idx = (dow + 6) % 7; // Mon=0..Sun=6
      weekdayTotals[idx] += e.count;
      weekdayCounts[idx] += 1;
    });
    const weekdayAvg = weekdayTotals.map((t, i) => (weekdayCounts[i] ? t / weekdayCounts[i] : 0));
    const maxAvg = Math.max(...weekdayAvg, 1);

    return {
      bestDay,
      bestWeek,
      bestMonth,
      dailyWins,
      weeklyWins,
      monthlyWins,
      weekdayAvg,
      maxAvg,
      hasData: userEntries.length > 0,
    };
  }, [allEntries, userId]);

  const formatBestDay = (date: string) =>
    date ? format(parseISO(date), "MMM d, yyyy") : "—";
  const formatBestWeek = (key: string) =>
    key ? `Week of ${format(parseISO(key), "MMM d")}` : "—";
  const formatBestMonth = (key: string) =>
    key ? format(parseISO(`${key}-01`), "MMMM yyyy") : "—";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="card-glass rounded-2xl p-5 animate-slide-up">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-medium text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0ABAB5]" />
            Your Insights
          </h2>
        </div>
        <SheetTrigger asChild>
          <Button
            className="mt-4 w-full rounded-full bg-[#0ABAB5] text-black hover:bg-[#0ABAB5]/90 font-semibold"
            disabled={!userId}
          >
            Get your insights
          </Button>
        </SheetTrigger>
      </div>

      <SheetContent
        side="bottom"
        hideCloseButton
        className="h-[100dvh] w-full max-w-none rounded-none border-none bg-background p-0 overflow-y-auto"
      >
        <div className="safe-top px-6 pt-6 pb-12 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6 mt-5">
            <h2 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#0ABAB5]" />
              Insights
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center border border-[#3B404F] hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {!insights?.hasData ? (
            <div className="card-glass rounded-2xl p-8 text-center mt-5">
              <p className="text-muted-foreground">
                Log some push-ups to unlock your insights.
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-5">
              {/* Personal bests */}
              <section className="card-glass rounded-2xl p-5">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#FF2C2C]" fill="#FF2C2C" />
                  Personal bests
                </h3>
                <h4 className="text-xs font-semibold text-foreground mt-[10px] mb-4">Most Push-Ups</h4>
                <div className="space-y-4">
                  <BestRow
                    label="in a day"
                    value={insights.bestDay.count}
                    sub={formatBestDay(insights.bestDay.date)}
                  />
                  <BestRow
                    label="in a week"
                    value={insights.bestWeek.count}
                    sub={formatBestWeek(insights.bestWeek.key)}
                  />
                  <BestRow
                    label="in a month"
                    value={insights.bestMonth.count}
                    sub={formatBestMonth(insights.bestMonth.key)}
                  />
                </div>
              </section>

              {/* Winner counts */}
              <section className="card-glass rounded-2xl p-5">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <img src={wreathIcon} alt="" className="w-4 h-4" />
                  Group wins
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <WinCell label="Daily" value={insights.dailyWins} />
                  <WinCell label="Weekly" value={insights.weeklyWins} />
                  <WinCell label="Monthly" value={insights.monthlyWins} />
                </div>
              </section>

              {/* Weekday distribution */}
              <section className="card-glass rounded-2xl p-5">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white" />
                  Your push days
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Average push-ups by weekday across your whole history.
                </p>
                <WeekdayBarChart weekdayAvg={insights.weekdayAvg} maxAvg={insights.maxAvg} />
              </section>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const BestRow = ({ label, value, sub }: { label: string; value: number; sub: string }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="min-w-0">
      <p className="text-sm text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground truncate">{sub}</p>
    </div>
    <p className="text-2xl font-black text-foreground whitespace-nowrap">
      {value.toLocaleString()}
      <span className="text-xs font-medium text-muted-foreground ml-1">PU</span>
    </p>
  </div>
);

const WinCell = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl border border-[#3B404F] p-3 flex flex-col items-center">
    <p className="text-2xl font-black text-foreground">{value}</p>
    <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
  </div>
);

interface WeekdayBarChartProps {
  weekdayAvg: number[];
  maxAvg: number;
}

const WeekdayBarChart = ({ weekdayAvg, maxAvg }: WeekdayBarChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [animate, setAnimate] = useState(false);

  const avgBaseline =
    weekdayAvg.reduce((a, b) => a + b, 0) / Math.max(weekdayAvg.length, 1);

  useEffect(() => {
    setAnimate(false);
  }, [weekdayAvg]);

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
  }, [weekdayAvg]);

  return (
    <div ref={containerRef} className="flex items-end justify-between gap-2 h-32">
      {weekdayAvg.map((avg, i) => {
        const heightPct = maxAvg > 0 ? (avg / maxAvg) * 100 : 0;
        const percentage = avgBaseline > 0 ? (avg / avgBaseline) * 100 : 0;

        const isQuadTarget = percentage >= 301;
        const isTripleTarget = percentage >= 201 && percentage < 301;
        const isDoubleTarget = percentage >= 101 && percentage < 201;

        const getColorHex = () => {
          if (avg === 0) return null;
          if (isQuadTarget) return "#FF2C2C";
          if (isTripleTarget) return "#BA25D8";
          if (isDoubleTarget) return "#7036FF";
          return "#0ABAB5";
        };

        const colorHex = getColorHex();
        const hasFill = !!colorHex;

        const targetHeight = avg === 0 ? "4px" : `${Math.max(heightPct, 4)}%`;

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

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
            <div className="relative flex-1 w-full flex items-end justify-center">
              {/* Track background */}
              <div className="absolute inset-x-0 top-0 bottom-0 flex justify-center pointer-events-none">
                <div className="w-full max-w-[20px] h-full rounded-full bg-white/5" />
              </div>

              {/* Bar */}
              <div
                ref={(el) => (barRefs.current[i] = el)}
                className="relative w-full max-w-[20px] rounded-full"
                style={{
                  height: animate ? targetHeight : "0px",
                  transition:
                    "height 1400ms cubic-bezier(0.33, 1, 0.68, 1)",
                  backgroundColor: hasFill ? undefined : "transparent",
                  boxShadow: colorHex
                    ? `0 0 12px ${colorHex}55`
                    : undefined,
                }}
              >
                {/* Fill layer */}
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  {hasFill &&
                    (percentage < 100 ? (
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
                              style={{
                                width: 3,
                                height: 3,
                                backgroundColor: b.inner,
                              }}
                            />
                          </div>
                        ))}
                      </>
                    ))}

                  {/* Final sweep */}
                  {hasFill && sweep && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `linear-gradient(to top, ${sweep.from}, ${sweep.to})`,
                        clipPath: animate
                          ? "inset(0 0 0 0)"
                          : "inset(100% 0 0 0)",
                        WebkitClipPath: animate
                          ? "inset(0 0 0 0)"
                          : "inset(100% 0 0 0)",
                        transition:
                          "clip-path 900ms cubic-bezier(0.65, 0, 0.35, 1) 1100ms, -webkit-clip-path 900ms cubic-bezier(0.65, 0, 0.35, 1) 1100ms",
                      }}
                    />
                  )}
                </div>

                {/* Count badge */}
                {avg > 0 && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 -top-3 flex items-center justify-center rounded-full bg-background border-2 shadow-md"
                    style={{
                      borderColor: colorHex ?? "hsl(var(--muted))",
                      minWidth: "26px",
                      height: "22px",
                      padding: "0 4px",
                      opacity: animate ? 1 : 0,
                      transform: `translate(-50%, ${animate ? "0" : "6px"})`,
                      transition:
                        "opacity 600ms ease 900ms, transform 600ms ease 900ms",
                    }}
                  >
                    <span className="text-[10px] font-bold leading-none text-white">
                      {Math.round(avg)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <span
              className="text-[10px] text-muted-foreground"
              style={{
                opacity: animate ? 1 : 0,
                transform: animate ? "translateY(0)" : "translateY(4px)",
                transition: "opacity 400ms ease 1200ms, transform 400ms ease 1200ms",
              }}
            >
              {WEEKDAY_LABELS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default InsightsCard;
