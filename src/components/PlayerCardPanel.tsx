import { useState, useEffect } from "react";
import { User, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import PlayerCard from "@/components/PlayerCard";
import { usePushUpData } from "@/hooks/usePushUpData";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useAvatarSelector } from "@/contexts/AvatarSelectorContext";
import { supabase } from "@/integrations/supabase/client";

const PlayerCardPanel = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { avatar } = useUserAvatar();
  const { openAvatarSelector } = useAvatarSelector();
  const {
    getTotalPushUps,
    yearlyGoal,
    getCurrentStreak,
    getWeeklyAverage,
    getYearProgress,
    getDaysWithEntries,
  } = usePushUpData();

  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!user || !open) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
  }, [user, open]);

  const accent = "#0ABAB5";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="rounded-2xl p-5 animate-slide-up border border-transparent bg-transparent">
        <SheetTrigger asChild>
          <Button
            variant="outline"
            disabled={!user}
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
            <User className="w-5 h-5" />
            Player Card
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
              <User className="w-6 h-6" style={{ color: accent }} />
              Player Card
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center border border-[#3B404F] hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          <div className="flex justify-center">
            <PlayerCard
              displayName={displayName}
              avatar={avatar ?? undefined}
              totalPushUps={getTotalPushUps()}
              yearlyGoal={yearlyGoal}
              currentStreak={getCurrentStreak()}
              weeklyAverage={getWeeklyAverage()}
              yearProgress={getYearProgress()}
              daysWithEntries={getDaysWithEntries().length}
              onAvatarClick={() => {
                setOpen(false);
                openAvatarSelector("card");
              }}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PlayerCardPanel;
