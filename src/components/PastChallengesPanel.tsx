import { useState } from "react";
import { Trophy, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import smallCircleIcon from "@/assets/small-circle-icon.svg";

type PastChallenge = {
  year: number;
  total: number;
  goal: number;
  period: string;
  daysLogged: number;
  bestStreak: number;
  bestDayDate: string;
  bestDayCount: number;
  avgDayOfWeek: string;
};

// Demo data — first (and so far only) completed challenge.
const PAST_CHALLENGES: PastChallenge[] = [
  {
    year: 2025,
    total: 31420,
    goal: 30000,
    period: "Jan 1 – Dec 31, 2025",
    daysLogged: 312,
    bestStreak: 84,
    bestDayDate: "Jul 14, 2025",
    bestDayCount: 520,
    avgDayOfWeek: "Wednesday",
  },
];

interface PastChallengesPanelProps {
  trigger?: React.ReactNode;
}

const PastChallengesPanel = ({ trigger }: PastChallengesPanelProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            className="w-full h-12 gap-2"
            style={{
              backgroundColor: "#0ABAB51A",
              borderColor: "#0ABAB5",
              color: "#0ABAB5",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#0ABAB5B3";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#0ABAB51A";
              e.currentTarget.style.color = "#0ABAB5";
            }}
            onMouseDown={(e) => (e.currentTarget.style.backgroundColor = "#0ABAB5B3")}
          >
            Past Challenges
          </Button>
        )}
      </SheetTrigger>

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
        <div className="safe-top px-6 pt-6 pb-12 max-w-sm mx-auto">
          <div className="flex items-start justify-between mb-6 mt-5">
            <img src={smallCircleIcon} alt="" className="w-14 h-14 mt-1" />
            <button
              onClick={() => setOpen(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center border border-[#3B404F] hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-8 flex flex-col items-center">
            <h2 className="text-3xl font-black text-foreground tracking-tight">
              Past Challenges
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Every year you push gets archived here.
            </p>
          </div>

          {/* Challenge list */}
          <div className="space-y-3">
            {PAST_CHALLENGES.map((c) => {
              const progressPercent = Math.round((c.total / c.goal) * 100);
              const hitGoal = c.total >= c.goal;
              const avgPu = Math.round(c.total / c.daysLogged);
              return (
                <div
                  key={c.year}
                  className="w-full rounded-2xl p-4 border border-[#3B404F] bg-card/40"
                >
                  {/* Top row */}
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-lg text-white">
                      <span className="font-bold">{c.year}</span>
                    </span>
                    <span
                      className={
                        hitGoal
                          ? "text-xs text-[#0ABAB5] flex items-center gap-1"
                          : "text-xs text-muted-foreground flex items-center gap-1"
                      }
                    >
                      {hitGoal && <Trophy className="w-3 h-3" />}
                      <span className="font-bold">{progressPercent}%</span> of goal
                    </span>
                  </div>

                  {/* Total */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <span className="text-sm text-white">
                      <span className="font-bold">{c.total.toLocaleString()}</span> PU
                    </span>
                  </div>

                  {/* Goal */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Goal</span>
                    <span className="text-sm text-white">
                      <span className="font-bold">{c.goal.toLocaleString()}</span> PU
                    </span>
                  </div>

                  {/* Period */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Period</span>
                    <span className="text-sm text-white">
                      <span className="font-bold">{c.period}</span>
                    </span>
                  </div>
                  <div className="border-b border-[#3B404F] mb-2" />

                  {/* Average push-ups */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Average push-ups</span>
                    <span className="text-sm text-white">
                      <span className="font-bold">{avgPu.toLocaleString()}</span> PU
                    </span>
                  </div>

                  {/* Most PU on a day */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Most PU on a day</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm text-white font-bold cursor-pointer">{c.bestDayCount} PU</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>{c.bestDayDate}</span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Your Push-Up day */}
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Your Push-Up day</span>
                      <span className="text-xs text-muted-foreground">on average</span>
                    </div>
                    <span className="text-sm text-white">
                      <span className="font-bold">{c.avgDayOfWeek}</span>
                    </span>
                  </div>

                  {/* Days logged */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Days logged</span>
                    <span className="text-sm text-white">
                      <span className="font-bold">{c.daysLogged}</span>d
                    </span>
                  </div>

                  {/* Best streak */}
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground">Best streak</span>
                    <span className="text-sm text-white">
                      <span className="font-bold">{c.bestStreak}</span>d
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-muted-foreground/50 text-xs mt-8">
            Your story, one year at a time.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PastChallengesPanel;
