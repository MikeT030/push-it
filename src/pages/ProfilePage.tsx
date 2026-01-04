import { useState, useEffect } from "react";
import { User, LogOut, Pencil, Check, X, Download, Users } from "lucide-react";
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

  const handleBackup = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("push_up_entries")
      .select("id, user_id, date, count, created_at, updated_at")
      .order("date", { ascending: true });

    if (error) {
      toast.error("Failed to export data");
      return;
    }

    if (!data || data.length === 0) {
      toast.info("No push-up entries to export");
      return;
    }

    const headers = ["id", "user_id", "date", "count", "created_at", "updated_at"];
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => `"${row[h as keyof typeof row] ?? ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pushups_backup_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${data.length} entries`);
  };

  const handleUsersBackup = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, yearly_goal, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to export users data");
      return;
    }

    if (!data || data.length === 0) {
      toast.info("No users to export");
      return;
    }

    const headers = ["id", "display_name", "yearly_goal", "created_at", "updated_at"];
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => `"${row[h as keyof typeof row] ?? ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `users_backup_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${data.length} users`);
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
        <div className="bg-card rounded-2xl p-6 animate-slide-up">
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
                  className="h-12 bg-white/[0.14] rounded-xl px-4 flex items-center justify-between mt-1.5 cursor-pointer hover:bg-white/20 transition-colors"
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
              <div className="h-12 bg-white/[0.14] rounded-xl px-4 flex items-center mt-1.5">
                <span className="text-foreground font-medium">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Backups Card */}
        <div className="bg-card rounded-2xl p-6 mt-6 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <h2 className="text-lg font-bold text-foreground mb-4">
            Backups
          </h2>
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={handleBackup}
              className="w-full h-12 hover:bg-[#C029DE] hover:text-white hover:border-[#C029DE] active:bg-[#C029DE] active:text-white active:border-[#C029DE]"
            >
              <Download className="w-4 h-4 mr-2" />
              Push Ups Backup
            </Button>
            <Button
              variant="outline"
              onClick={handleUsersBackup}
              className="w-full h-12 hover:bg-[#C029DE] hover:text-white hover:border-[#C029DE] active:bg-[#C029DE] active:text-white active:border-[#C029DE]"
            >
              <Users className="w-4 h-4 mr-2" />
              Users Backup
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-card rounded-2xl p-6 mt-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
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

        {/* Sign Out Card */}
        <div className="bg-card rounded-2xl p-6 mt-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full h-12"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
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
