import { useState, useEffect } from "react";
import { User, LogOut, Pencil, Check, X } from "lucide-react";
import { usePushUpData } from "@/hooks/usePushUpData";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ProfilePage = () => {
  const { yearlyGoal, dailyTarget } = usePushUpData();
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.display_name) {
        setDisplayName(data.display_name);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  const startEditing = () => {
    setEditValue(displayName);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const saveNickname = async () => {
    if (!user) return;

    const trimmedValue = editValue.trim().slice(0, 30);

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: trimmedValue || null })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to save nickname");
      return;
    }

    setDisplayName(trimmedValue);
    setIsEditing(false);
    toast.success("Nickname saved!");
  };

  return (
    <div className="min-h-screen bg-background pb-32 safe-top">
      <div className="px-6 pt-12">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-black text-foreground tracking-tight">
            Profile
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            Your account settings
          </p>
        </header>

        {/* Profile Card */}
        <div className="card-glass rounded-2xl p-6 animate-slide-up">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl shadow-primary/20">
              <User className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>

          {/* Nickname */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Nickname
              </label>
              {isEditing ? (
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    maxLength={30}
                    placeholder="Enter your nickname"
                    className="h-12"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    onClick={saveNickname}
                    className="h-12 w-12 shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={cancelEditing}
                    className="h-12 w-12 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="h-12 bg-secondary rounded-xl px-4 flex items-center justify-between mt-1.5 cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={startEditing}
                >
                  <span className="text-foreground font-medium">
                    {displayName || "Set a nickname"}
                  </span>
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <div className="h-12 bg-secondary rounded-xl px-4 flex items-center mt-1.5">
                <span className="text-foreground font-medium">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full mt-6 h-12"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Info Card */}
        <div className="card-glass rounded-2xl p-6 mt-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-lg font-bold text-foreground mb-4">
            About Push-it
          </h2>
          <div className="space-y-3 text-muted-foreground text-sm">
            <p>
              Push-it helps you track your daily push-ups and reach your goal of{" "}
              <span className="text-primary font-semibold">{yearlyGoal.toLocaleString()} push-ups</span> per year.
            </p>
            <p>
              That's just <span className="text-foreground font-semibold">{dailyTarget} push-ups</span> per day.
              You've got this! 💪
            </p>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-muted-foreground/50 text-xs mt-8">
          Push-it v1.0.0
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
