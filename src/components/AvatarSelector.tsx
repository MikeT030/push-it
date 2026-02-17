import { useState, useEffect } from "react";
import { Check, User } from "lucide-react";
import { avatarOptions, AvatarOption } from "@/data/avatars";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import PlayerCard from "@/components/PlayerCard";
import { usePushUpData } from "@/hooks/usePushUpData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AvatarSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAvatarId: string | null;
  onSelect: (avatar: AvatarOption) => void;
}

const AvatarSelector = ({
  open,
  onOpenChange,
  selectedAvatarId,
  onSelect,
}: AvatarSelectorProps) => {
  const [activeTab, setActiveTab] = useState<"card" | "avatar">("card");
  const { user } = useAuth();
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

  const selectedAvatar = selectedAvatarId
    ? avatarOptions.find((a) => a.id === selectedAvatarId)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none p-0 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("card")}
            className={cn(
              "flex-1 py-3 text-sm font-semibold transition-colors relative",
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
              "flex-1 py-3 text-sm font-semibold transition-colors relative",
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
          <div className="p-6 flex-1 overflow-y-auto flex">
            <PlayerCard
              displayName={displayName}
              avatar={selectedAvatar}
              totalPushUps={getTotalPushUps()}
              yearlyGoal={yearlyGoal}
              currentStreak={getCurrentStreak()}
              weeklyAverage={getWeeklyAverage()}
              yearProgress={getYearProgress()}
              daysWithEntries={getDaysWithEntries().length}
            />
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-4 gap-4 overflow-y-auto max-h-[65vh] p-1">
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
              {avatarOptions.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => {
                    onSelect(avatar);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "relative aspect-square rounded-xl overflow-hidden transition-all duration-200",
                    "hover:scale-105 hover:ring-2 hover:ring-primary/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary",
                    selectedAvatarId === avatar.id && "ring-2 ring-primary"
                  )}
                >
                  <img
                    src={avatar.src}
                    alt={avatar.name}
                    className="w-full h-full object-cover bg-white/10"
                  />
                  {selectedAvatarId === avatar.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AvatarSelector;
