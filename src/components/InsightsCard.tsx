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

export default InsightsCard;
