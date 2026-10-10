import { format, parseISO } from "date-fns";
import { Trophy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePastChallenges } from "@/hooks/usePastChallenges";
import { groupPastChallenges, type PastChallenge } from "@/lib/pastChallenges";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatDate = (date: string) => format(parseISO(date), "MMM d, yyyy");

const ChallengeCard = ({ challenge }: { challenge: PastChallenge }) => {
  const progressPercent = Math.round((challenge.total_at_completion / challenge.goal) * 100);
  const averageDay = challenge.average_day_of_week === null
    ? "–"
    : DAY_NAMES[challenge.average_day_of_week];

  return (
    <article className="w-full rounded-2xl p-4 border border-border bg-card/40">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h4 className="text-lg text-foreground">
          <span className="font-bold">{challenge.goal.toLocaleString()}</span> PU Goal
        </h4>
        <span className="text-xs text-primary flex items-center gap-1 whitespace-nowrap">
          <Trophy className="w-3 h-3" />
          <span className="font-bold">{progressPercent}%</span> of goal
        </span>
      </div>

      <div className="space-y-2">
        <Stat label="Total" value={<><strong>{challenge.total_at_completion.toLocaleString()}</strong> PU</>} />
        <Stat label="Goal" value={<><strong>{challenge.goal.toLocaleString()}</strong> PU</>} />
        <Stat
          label="Completed"
          value={<strong>{formatDate(challenge.completed_at)}</strong>}
        />
        <Stat
          label="Period"
          value={<strong>{format(parseISO(challenge.period_start), "MMM d")} – {formatDate(challenge.period_end)}</strong>}
        />
        <div className="border-b border-border" />
        <Stat label="Average push-ups" value={<><strong>{challenge.average_pushups.toLocaleString()}</strong> PU</>} />
        <Stat
          label="Most PU on a day"
          value={challenge.best_day_date ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-bold cursor-help">{challenge.best_day_count.toLocaleString()} PU</span>
              </TooltipTrigger>
              <TooltipContent>{formatDate(challenge.best_day_date)}</TooltipContent>
            </Tooltip>
          ) : <strong>–</strong>}
        />
        <Stat label={<>Your Push-Up day<br />on average</>} value={<strong>{averageDay}</strong>} />
        <Stat label="Days logged" value={<><strong>{challenge.days_logged}</strong>d</>} />
        <Stat label="Best streak" value={<><strong>{challenge.best_streak}</strong>d</>} />
      </div>
    </article>
  );
};

const Stat = ({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => (
  <div className="flex items-baseline justify-between gap-4 text-sm">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-foreground text-right">{value}</span>
  </div>
);

const PastChallengesContent = () => {
  const { data = [], isLoading, isError } = usePastChallenges();
  const years = groupPastChallenges(data);

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading your milestones…</p>;
  }

  if (isError) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Your milestones could not be loaded.</p>;
  }

  if (years.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Your reached goals will appear here.</p>;
  }

  return (
    <div className="space-y-8">
      {years.map(({ year, challenges }) => (
        <section key={year} aria-labelledby={`challenge-year-${year}`}>
          <h3 id={`challenge-year-${year}`} className="text-2xl text-foreground mb-3 text-center">
            <span className="font-bold">{year}</span>
          </h3>
          <div className="space-y-3">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default PastChallengesContent;