import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInCalendarDays, endOfYear } from "date-fns";
import smallCircleIcon from "@/assets/small-circle-icon.svg";
import muscleIcon from "@/assets/muscle-icon.svg";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRESET_TIERS = [50, 60, 70, 82];

const WelcomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<number | "custom">(82);
  const [customValue, setCustomValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysRemaining = useMemo(() => {
    const today = new Date();
    return Math.max(1, differenceInCalendarDays(endOfYear(today), today) + 1);
  }, []);

  const dailyValue = selected === "custom"
    ? Math.max(0, Math.floor(Number(customValue) || 0))
    : selected;

  const projectedTotal = dailyValue * daysRemaining;

  const handleConfirm = async () => {
    if (!user) return;
    if (dailyValue <= 0) {
      toast.error("Please choose a daily push-up goal");
      return;
    }
    const goal = Math.min(999999, projectedTotal);
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ yearly_goal: goal, onboarded: true })
        .eq("id", user.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["push-up-data", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["profile-onboarded", user.id] });
      toast.success("Goal locked in. Let's push!");
      navigate("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-6 safe-top pt-12 pb-12">
      <div className="w-full max-w-sm animate-fade-in mt-10">

        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img src={smallCircleIcon} alt="" className="w-20 h-20 mb-4" />
          <h1 className="font-black text-white text-2xl">Welcome to the Team</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Set your personal push-up goal for the rest of the year.
          </p>
          <p className="text-muted-foreground/70 mt-1 text-xs">
            <span className="font-bold">{daysRemaining}d</span> remaining in {new Date().getFullYear()}
          </p>
        </div>

        {/* Tier options */}
        <div className="space-y-3">
          {PRESET_TIERS.map((tier) => {
            const total = tier * daysRemaining;
            const isActive = selected === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => setSelected(tier)}
                className={cn(
                  "w-full rounded-2xl p-4 text-left transition-all border",
                  isActive
                    ? "border-[#0ABAB5] bg-[#0ABAB5]/10"
                    : "border-[#3B404F] bg-card/40 hover:border-[#0ABAB5]/50"
                )}
              >
                <div className="flex items-baseline justify-between">
                  <span className={cn("text-lg", isActive ? "text-[#0ABAB5]" : "text-white")}>
                    <span className="font-bold">{tier}</span> PU / day
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ≈ <span className="font-bold text-white">{total.toLocaleString()}</span> by Dec 31
                  </span>
                </div>
              </button>
            );
          })}

          {/* Custom option */}
          <button
            type="button"
            onClick={() => setSelected("custom")}
            className={cn(
              "w-full rounded-2xl p-4 text-left transition-all border",
              selected === "custom"
                ? "border-[#0ABAB5] bg-[#0ABAB5]/10"
                : "border-[#3B404F] bg-card/40 hover:border-[#0ABAB5]/50"
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="number"
                  min={1}
                  max={9999}
                  inputMode="numeric"
                  value={customValue}
                  onChange={(e) => {
                    setCustomValue(e.target.value);
                    setSelected("custom");
                  }}
                  onFocus={() => setSelected("custom")}
                  placeholder="Your #"
                  className={cn(
                    "h-9 w-24 bg-transparent border-0 border-b text-foreground placeholder:text-muted-foreground px-0 font-bold",
                    selected === "custom" ? "border-[#0ABAB5]" : "border-[#EEEEEE]"
                  )}
                />
                <span className={cn("text-sm", selected === "custom" ? "text-[#0ABAB5]" : "text-white")}>
                  PU / day
                </span>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                ≈ <span className="font-bold text-white">
                  {(selected === "custom" ? projectedTotal : 0).toLocaleString()}
                </span> by Dec 31
              </span>
            </div>
          </button>
        </div>

        {/* Info text */}
        <p className="text-xs text-muted-foreground mt-8 leading-relaxed">
          Don't go too low. If you push daily, you will make progress quickly, and what once seemed unreachable will be just a warm-up. But don't overdo it. Please watch your health and check out <span className="text-[#0ABAB5]">How to push-up</span>.
        </p>

        {/* Confirm */}
        <Button
          type="button"
          variant="outline"
          onClick={handleConfirm}
          disabled={isSubmitting || dailyValue <= 0}
          className="w-full h-12 mt-4 bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5] hover:bg-[#0ABAB5] hover:text-white active:bg-[#0ABAB5]/25 active:text-white"
        >
          {isSubmitting ? "Saving..." : "Confirm goal"}
        </Button>

        <p className="text-center text-muted-foreground/50 text-xs mt-8 flex items-center justify-center gap-1">
          You can change this anytime <img src={muscleIcon} alt="" className="w-4 h-4 inline" />
        </p>
      </div>
    </div>
  );
};

export default WelcomePage;
