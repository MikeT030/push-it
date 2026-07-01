import { useMemo, useState, useRef, useEffect } from "react";
import { format, parseISO, startOfWeek, startOfMonth, getDay, subDays } from "date-fns";
import { Sparkles, X, Flame, Calendar, TrendingUp } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { GroupEntry } from "@/hooks/useGroupData";
import wreathIcon from "@/assets/medal.svg";

type InsightsColorVariant =
  | "teal"
  | "purple"
  | "magenta"
  | "amber"
  | "crimson"
  | "emerald"
  | "sky";

interface InsightsCardProps {
  userId?: string | null;
  allEntries?: GroupEntry[];
  colorVariant?: InsightsColorVariant;
  demo?: boolean;
}

function generateDemoEntries(): GroupEntry[] {
  const entries: GroupEntry[] = [];
  const today = new Date();
  const rivals = ["demo-rival-1", "demo-rival-2", "demo-rival-3"];
  for (let i = 209; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, "yyyy-MM-dd");
    const dow = d.getDay();
    const base = [70, 110, 80, 130, 90, 60, 40][dow];
    const wobble = ((i * 9301 + 49297) % 233) - 116;
    let count = Math.max(0, base + Math.round(wobble * 0.4));
    if (i === 12) count = 412;
    if (i === 47) count = 360;
    if (i === 88) count = 300;
    if (dow === 1 && i % 14 === 0) count += 60;
    if (count > 0) {
      entries.push({ user_id: "demo-user", date: dateStr, count });
    }
    rivals.forEach((uid, idx) => {
      const rBase = [50, 70, 60, 80, 55, 45, 35][dow] - idx * 8;
      const rWobble = ((i * (idx + 3) * 1117) % 161) - 80;
      const rCount = Math.max(0, rBase + Math.round(rWobble * 0.5));
      if (rCount > 0) {
        entries.push({ user_id: uid, date: dateStr, count: rCount });
      }
    });
  }
  return entries;
}

const VARIANT_COLORS: Record<InsightsColorVariant, string> = {
  teal: "#0ABAB5",
  purple: "#7036FF",
  magenta: "#C029DE",
  amber: "#F5A623",
  crimson: "#FF2C55",
  emerald: "#22C55E",
  sky: "#38BDF8",
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const InsightsCard = ({ userId, allEntries, colorVariant = "teal" }: InsightsCardProps) => {
  const [open, setOpen] = useState(false);
  const accent = VARIANT_COLORS[colorVariant];

  

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
      const wonKeys: string[] = [];
      totals.forEach((inner, key) => {
        let max = 0;
        let winners: string[] = [];
        inner.forEach((v, uid) => {
          if (v > max) { max = v; winners = [uid]; }
          else if (v === max) winners.push(uid);
        });
        if (winners.includes(userId) && max > 0) wonKeys.push(key);
      });
      return wonKeys;
    };

    const dailyWinKeys = countWins(dailyTotals);
    const weeklyWinKeys = countWins(weeklyTotals);
    const monthlyWinKeys = countWins(monthlyTotals);
    const dailyWins = dailyWinKeys.length;
    const weeklyWins = weeklyWinKeys.length;
    const monthlyWins = monthlyWinKeys.length;

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
      dailyWinKeys,
      weeklyWinKeys,
      monthlyWinKeys,
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
      <div
        className="rounded-2xl p-5 animate-slide-up border border-transparent bg-transparent"
      >
        <SheetTrigger asChild>
          <Button
            variant="outline"
            disabled={!userId}
            className="w-full h-12 gap-2"
            style={{
              backgroundColor: `${accent}1A`,
              borderColor: accent,
              color: accent,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${accent}B3`;
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${accent}1A`;
              e.currentTarget.style.color = accent;
            }}
            onMouseDown={(e) => (e.currentTarget.style.backgroundColor = `${accent}B3`)}
          >
            <Sparkles className="w-5 h-5" />
            Get your insights
          </Button>
        </SheetTrigger>
      </div>


      <SheetContent
        side="bottom"
        hideCloseButton
        className="h-[100dvh] w-full max-w-none rounded-none border-none p-0 overflow-y-auto"
        style={{
          backgroundColor: "#101214",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.14 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\"), radial-gradient(ellipse at top left, #0C2544 0%, #101214 90%)",
        }}
      >
        <div className="safe-top px-6 pt-6 pb-12 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6 mt-5">
            <h2 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6" style={{ color: accent }} />
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
            <div className="bg-card/40 border border-[#3B404F] rounded-2xl p-8 text-center mt-5">
              <p className="text-muted-foreground">
                Log some push-ups to unlock your insights.
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-5">
              {/* Personal bests */}
              <section className="bg-card/40 border border-[#3B404F] rounded-2xl p-5">
                <h3 className="text-lg text-foreground font-semibold mb-1 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#FF2C2C]" fill="#FF2C2C" />
                  Personal bests
                </h3>
                <h4 className="text-xs font-semibold text-foreground mt-[10px] mb-4 hidden">Most Push-Ups</h4>

                <div className="divide-y divide-[#3B404F]">
                  <div className="pb-4">
                    <BestRow label="/day" value={insights.bestDay.count} sub={formatBestDay(insights.bestDay.date)} />
                  </div>
                  <div className="py-4">
                    <BestRow label="/week" value={insights.bestWeek.count} sub={formatBestWeek(insights.bestWeek.key)} />
                  </div>
                  <div className="pt-4">
                    <BestRow label="/month" value={insights.bestMonth.count} sub={formatBestMonth(insights.bestMonth.key)} />
                  </div>
                </div>
              </section>

              {/* Winner counts */}
              <section className="bg-card/40 border border-[#3B404F] rounded-2xl p-5">
                <h3 className="text-lg text-foreground font-semibold mb-4 flex items-center gap-2">
                  <img src={wreathIcon} alt="" className="w-4 h-4" />
                  Group wins
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <WinCell
                    label="Daily"
                    value={insights.dailyWins}
                    items={insights.dailyWinKeys
                      .slice()
                      .sort((a, b) => b.localeCompare(a))
                      .map((k) => format(parseISO(k), "MMM d, yyyy"))}
                    emptyText="No daily wins yet."
                  />
                  <WinCell
                    label="Weekly"
                    value={insights.weeklyWins}
                    items={insights.weeklyWinKeys
                      .slice()
                      .sort((a, b) => b.localeCompare(a))
                      .map((k) => `Week of ${format(parseISO(k), "MMM d, yyyy")}`)}
                    emptyText="No weekly wins yet."
                  />
                  <WinCell
                    label="Monthly"
                    value={insights.monthlyWins}
                    items={insights.monthlyWinKeys
                      .slice()
                      .sort((a, b) => b.localeCompare(a))
                      .map((k) => format(parseISO(`${k}-01`), "MMMM yyyy"))}
                    emptyText="No monthly wins yet."
                  />
                </div>
              </section>

              {/* Weekday distribution */}
              <section className="bg-card/40 border border-[#3B404F] rounded-2xl p-5">
                <h3 className="text-lg text-foreground font-semibold mb-4 flex items-center gap-2">
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
  <div className="flex flex-col items-start">
    <p className="text-2xl font-black text-foreground whitespace-nowrap">
      {value.toLocaleString()}
      <span className="text-xs font-medium text-muted-foreground ml-1">PU</span>
      <span className="text-xs font-medium text-muted-foreground ml-1">{label}</span>
    </p>
    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
  </div>
);




const WinCell = ({
  label,
  value,
  items,
  emptyText,
}: {
  label: string;
  value: number;
  items: string[];
  emptyText: string;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        className="bg-card/40 border border-[#3B404F] rounded-2xl p-3 flex flex-col items-center hover:bg-card/60 transition-colors"
      >
        <p className="text-2xl font-black text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
      </button>
    </PopoverTrigger>
    <PopoverContent
      align="center"
      sideOffset={8}
      className="w-56 p-0 bg-[#1A1D24] border-[#3B404F]"
    >
      <div className="px-4 py-3 border-b border-[#3B404F]">
        <p className="text-xs font-semibold text-foreground">
          {label} wins{value > 0 ? ` · ${value}` : ""}
        </p>
      </div>
      <div className="max-h-64 overflow-y-auto py-1">
        {items.length === 0 ? (
          <p className="px-4 py-3 text-xs text-muted-foreground">{emptyText}</p>
        ) : (
          items.map((item) => (
            <div
              key={item}
              className="px-4 py-2 text-xs text-foreground border-b border-[#3B404F]/50 last:border-b-0"
            >
              {item}
            </div>
          ))
        )}
      </div>
    </PopoverContent>
  </Popover>
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
