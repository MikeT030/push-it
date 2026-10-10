import { describe, expect, test } from "bun:test";
import { groupPastChallenges } from "./pastChallenges";

const challenge = (id, year, goal, completedAt) => ({
  id,
  challenge_year: year,
  goal,
  completed_at: completedAt,
  total_at_completion: goal,
  period_start: `${year}-01-01`,
  period_end: completedAt,
  average_pushups: 100,
  best_day_count: 200,
  best_day_date: completedAt,
  average_day_of_week: 1,
  days_logged: 100,
  best_streak: 10,
});

describe("groupPastChallenges", () => {
  test("puts two reached goals under one 2025 heading", () => {
    const groups = groupPastChallenges([
      challenge("30k", 2025, 30000, "2025-08-01"),
      challenge("40k", 2025, 40000, "2025-11-01"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.year).toBe(2025);
    expect(groups[0]?.challenges.map((item) => item.goal)).toEqual([40000, 30000]);
  });

  test("creates a separate newest-first section for 2026", () => {
    const groups = groupPastChallenges([
      challenge("2025", 2025, 30000, "2025-08-01"),
      challenge("2026", 2026, 30000, "2026-07-01"),
    ]);
    expect(groups.map((group) => group.year)).toEqual([2026, 2025]);
  });
});