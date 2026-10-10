export type PastChallenge = {
  id: string;
  challenge_year: number;
  goal: number;
  completed_at: string;
  total_at_completion: number;
  period_start: string;
  period_end: string;
  average_pushups: number;
  best_day_count: number;
  best_day_date: string | null;
  average_day_of_week: number | null;
  days_logged: number;
  best_streak: number;
};

export type PastChallengeYear = {
  year: number;
  challenges: PastChallenge[];
};

export const groupPastChallenges = (
  challenges: PastChallenge[],
): PastChallengeYear[] => {
  const byYear = new Map<number, PastChallenge[]>();

  challenges.forEach((challenge) => {
    const yearChallenges = byYear.get(challenge.challenge_year) ?? [];
    yearChallenges.push(challenge);
    byYear.set(challenge.challenge_year, yearChallenges);
  });

  return Array.from(byYear.entries())
    .sort(([yearA], [yearB]) => yearB - yearA)
    .map(([year, yearChallenges]) => ({
      year,
      challenges: [...yearChallenges].sort((a, b) =>
        b.completed_at.localeCompare(a.completed_at),
      ),
    }));
};