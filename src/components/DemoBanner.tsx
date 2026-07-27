import { useViewerCohort } from "@/hooks/useViewerCohort";
import { differenceInCalendarDays } from "date-fns";

const DEMO_TTL_DAYS = 5;

const DemoBanner = () => {
  const { isTest, createdAt } = useViewerCohort();
  if (!isTest) return null;

  let daysLeft: number | null = null;
  if (createdAt) {
    const elapsed = differenceInCalendarDays(new Date(), new Date(createdAt));
    daysLeft = DEMO_TTL_DAYS - elapsed;
  }

  const label =
    daysLeft === null
      ? "Demo account — not on the real leaderboard."
      : daysLeft > 0
      ? `Demo account — expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Not on the real leaderboard.`
      : "Demo account — expired. Awaiting cleanup.";

  return (
    <div className="w-full">
      <div className="mx-auto max-w-md px-3">
        <div className="rounded-full bg-[#0ABAB5]/15 border border-[#0ABAB5]/40 text-[#0ABAB5] text-[11px] leading-tight font-medium px-3 py-1.5 text-center backdrop-blur-md">
          {label}
        </div>
      </div>
    </div>
  );
};

export default DemoBanner;
