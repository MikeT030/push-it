import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";
import smallCircleIcon from "@/assets/small-circle-icon.svg";
import { Button } from "@/components/ui/button";

type PastChallenge = {
  year: number;
  total: number;
  goal: number;
  daysLogged: number;
  bestStreak: number;
};

// Demo data — first (and so far only) completed challenge.
const PAST_CHALLENGES: PastChallenge[] = [
  {
    year: 2025,
    total: 31420,
    goal: 30000,
    daysLogged: 312,
    bestStreak: 84,
  },
];

const PastChallengesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-6 safe-top pt-12 pb-12">
      <div className="w-full max-w-sm animate-fade-in mt-2">
        {/* Back */}
        <div className="mb-2 -ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10 hover:bg-white hover:text-black active:bg-white active:text-black"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img src={smallCircleIcon} alt="" className="w-20 h-20 mb-4" />
          <h1 className="font-black text-white text-2xl">Past Challenges</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Every year you push gets archived here.
          </p>
        </div>

        {/* Challenge list */}
        <div className="space-y-3">
          {PAST_CHALLENGES.map((c) => {
            const progressPercent = Math.round((c.total / c.goal) * 100);
            const hitGoal = c.total >= c.goal;
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
    </div>
  );
};

export default PastChallengesPage;
