import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import WelcomeShell from "@/components/WelcomeShell";

const WelcomePageV2 = () => {
  const { user } = useAuth();

  const { data: reachedGoal } = useQuery({
    queryKey: ["celebration-goal", user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("yearly_goal")
        .eq("id", user!.id)
        .maybeSingle();
      return data?.yearly_goal ?? 30000;
    },
  });

  const goal = reachedGoal ?? 30000;
  const goalK = goal % 1000 === 0 ? `${goal / 1000}k` : goal.toLocaleString();

  return (
    <WelcomeShell
      headline={
        <>
          You did it!
          <br />
          You hit {goalK} Push-Ups, awesome.
        </>
      }
      tiers={[82, 90, 100]}
      mode="additive"
      showFireworks
      fireworksDelayMs={5000}
      contentOffsetY={-12}
      showBackButton={false}
      celebratedGoal={goal}
    />
  );
};

export default WelcomePageV2;
