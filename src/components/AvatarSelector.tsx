import { useState, useEffect } from "react";
import { Check, User, X } from "lucide-react";
import { avatarOptions, AvatarOption } from "@/data/avatars";
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import PlayerCard, { CARD_THEMES, CardTheme } from "@/components/PlayerCard";
import { usePushUpData } from "@/hooks/usePushUpData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AvatarSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAvatarId: string | null;
  onSelect: (avatar: AvatarOption) => void;
  defaultTab?: "card" | "avatar";
}

const AvatarSelector = ({
  open,
  onOpenChange,
  selectedAvatarId,
  onSelect,
  defaultTab = "card",
}: AvatarSelectorProps) => {
  const [activeTab, setActiveTab] = useState<"card" | "avatar">(defaultTab);
  const { user } = useAuth();

  useEffect(() => {
    if (open) setActiveTab(defaultTab);
  }, [open, defaultTab]);
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
    // Fetch display name and all taken avatars in parallel
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

  const selectedAvatar = selectedAvatarId
    ? avatarOptions.find((a) => a.id === selectedAvatarId)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none p-0" hideCloseButton>
        {/* Close button row */}
        <div className="flex justify-end px-4 pb-0 flex-shrink-0" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
          <DialogClose className="rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring">
            <X className="w-6 h-6" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("card")}
            className={cn(
              "flex-1 py-1.5 text-sm font-semibold transition-colors relative",
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
              "flex-1 py-1.5 text-sm font-semibold transition-colors relative",
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
          <div className="p-6 overflow-y-auto h-[75vh]">
            <PlayerCard
              displayName={displayName}
              avatar={selectedAvatar}
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
          <div className="p-4 overflow-y-auto h-[75vh]">
            <div className="grid grid-cols-4 gap-4 p-1">
              {/* No avatar option */}
              <button
                onClick={() => {
                  onSelect({ id: "", name: "None", src: "" });
                  onOpenChange(false);
                }}
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden transition-all duration-200",
                  "hover:scale-105 hover:ring-2 hover:ring-primary/50",
                  "focus:outline-none focus:ring-2 focus:ring-primary",
                  "bg-white/10 flex items-center justify-center",
                  (!selectedAvatarId || selectedAvatarId === "") &&
                    "ring-2 ring-primary"
                )}
              >
                <span className="text-muted-foreground text-xs font-medium">
                  None
                </span>
                {(!selectedAvatarId || selectedAvatarId === "") && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </button>
              {avatarOptions.map((avatar) => {
                const isTaken = takenAvatarIds.has(avatar.id);
                return (
                  <button
                    key={avatar.id}
                    onClick={() => {
                      if (isTaken) return;
                      onSelect(avatar);
                      onOpenChange(false);
                    }}
                    disabled={isTaken}
                    className={cn(
                      "relative aspect-square rounded-xl overflow-hidden transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-primary",
                      isTaken
                        ? "cursor-not-allowed opacity-40"
                        : "hover:scale-105 hover:ring-2 hover:ring-primary/50",
                      selectedAvatarId === avatar.id && "ring-2 ring-primary"
                    )}
                  >
                    <img
                      src={avatar.src}
                      alt={avatar.name}
                      loading="lazy"
                      decoding="async"
                      className={cn(
                        "w-full h-full object-cover bg-white/10",
                        isTaken && "grayscale"
                      )}
                    />
                    {selectedAvatarId === avatar.id && (
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AvatarSelector;
