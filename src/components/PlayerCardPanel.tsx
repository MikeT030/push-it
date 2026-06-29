import { useState, useEffect } from "react";
import { User, X, Check } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import PlayerCard from "@/components/PlayerCard";
import { usePushUpData } from "@/hooks/usePushUpData";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { avatarOptions, AvatarOption } from "@/data/avatars";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PlayerCardPanel = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"card" | "avatar">("card");
  const { user } = useAuth();
  const { avatarId, avatar, setAvatarId } = useUserAvatar();
  const {
    getTotalPushUps,
    yearlyGoal,
    getCurrentStreak,
    getWeeklyAverage,
    getYearProgress,
    getDaysWithEntries,
  } = usePushUpData();

  const [displayName, setDisplayName] = useState("");
  const [takenAvatarIds, setTakenAvatarIds] = useState<Set<string>>(new Set());

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

    supabase
      .from("profiles")
      .select("id, avatar_url")
      .not("avatar_url", "is", null)
      .neq("avatar_url", "")
      .then(({ data }) => {
        if (data) {
          const taken = new Set<string>(
            data.filter((p) => p.id !== user.id).map((p) => p.avatar_url!)
          );
          setTakenAvatarIds(taken);
        }
      });
  }, [user, open]);

  useEffect(() => {
    if (open) setActiveTab("card");
  }, [open]);

  const accent = "#0ABAB5";

  const handleAvatarSelect = async (option: AvatarOption) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: option.id || null })
      .eq("id", user.id);
    if (error) {
      toast.error("Failed to save avatar");
      return;
    }
    setAvatarId(option.id || null);
    toast.success(option.id ? "Avatar updated!" : "Avatar removed!");
  };

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

          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            <button
              onClick={() => setActiveTab("card")}
              className={cn(
                "flex-1 py-2 text-sm font-semibold transition-colors relative",
                activeTab === "card"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              User Card
              {activeTab === "card" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("avatar")}
              className={cn(
                "flex-1 py-2 text-sm font-semibold transition-colors relative",
                activeTab === "avatar"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Choose Avatar
              {activeTab === "avatar" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
              )}
            </button>
          </div>

          {activeTab === "card" ? (
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
                onAvatarClick={() => setActiveTab("avatar")}
              />
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 p-1">
              <button
                onClick={() => handleAvatarSelect({ id: "", name: "None", src: "" })}
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden transition-all duration-200",
                  "hover:scale-105 hover:ring-2 hover:ring-primary/50",
                  "focus:outline-none focus:ring-2 focus:ring-primary",
                  "bg-white/10 flex items-center justify-center",
                  (!avatarId || avatarId === "") && "ring-2 ring-primary"
                )}
              >
                <span className="text-muted-foreground text-xs font-medium">None</span>
                {(!avatarId || avatarId === "") && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </button>
              {avatarOptions.map((option) => {
                const isTaken = takenAvatarIds.has(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (isTaken) return;
                      handleAvatarSelect(option);
                    }}
                    disabled={isTaken}
                    className={cn(
                      "relative aspect-square rounded-xl overflow-hidden transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-primary",
                      isTaken
                        ? "cursor-not-allowed opacity-40"
                        : "hover:scale-105 hover:ring-2 hover:ring-primary/50",
                      avatarId === option.id && "ring-2 ring-primary"
                    )}
                  >
                    <img
                      src={option.src}
                      alt={option.name}
                      loading="lazy"
                      decoding="async"
                      className={cn(
                        "w-full h-full object-cover bg-white/10",
                        isTaken && "grayscale"
                      )}
                    />
                    {avatarId === option.id && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PlayerCardPanel;
