import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { User, LogOut, Pencil, Check, X, Download, Users, Shield } from "lucide-react";
import defaultAvatar from "@/assets/default-avatar.svg";
import { usePushUpData } from "@/hooks/usePushUpData";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAvatarSelector } from "@/contexts/AvatarSelectorContext";
const ProfilePage = () => {
  const {
    yearlyGoal,
    dailyTarget
  } = usePushUpData();
  const {
    user,
    signOut
  } = useAuth();
  const { avatar: selectedAvatar, avatarId, setAvatarId } = useUserAvatar();
  const [displayName, setDisplayName] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const { openAvatarSelector } = useAvatarSelector();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    if (searchParams.get("openAvatar") === "true") {
      openAvatarSelector("avatar");
      searchParams.delete("openAvatar");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, openAvatarSelector]);
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const {
        data
      } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
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
    const {
      error
    } = await supabase.from("profiles").update({
      display_name: trimmedValue || null
    }).eq("id", user.id);
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
    const {
      data,
      error
    } = await supabase.from("push_up_entries").select("id, user_id, date, count, created_at, updated_at").eq("user_id", user.id).order("date", {
      ascending: true
    });
    if (error) {
      toast.error("Failed to export data");
      return;
    }
    if (!data || data.length === 0) {
      toast.info("No push-up entries to export");
      return;
    }
    const headers = ["id", "user_id", "date", "count", "created_at", "updated_at"];
    const csvContent = [headers.join(","), ...data.map(row => headers.map(h => `"${row[h as keyof typeof row] ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
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
    const {
      data,
      error
    } = await supabase.from("profiles").select("id, display_name, yearly_goal, created_at, updated_at").eq("id", user.id).order("created_at", {
      ascending: true
    });
    if (error) {
      toast.error("Failed to export users data");
      return;
    }
    if (!data || data.length === 0) {
      toast.info("No profile to export");
      return;
    }
    const headers = ["id", "display_name", "yearly_goal", "created_at", "updated_at"];
    const csvContent = [headers.join(","), ...data.map(row => headers.map(h => `"${row[h as keyof typeof row] ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `profile_backup_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported your profile`);
  };

  return <div className="min-h-screen bg-background pb-32 safe-top">
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
        <div className="bg-card/40 rounded-2xl p-6 animate-slide-up">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center shadow-xl shadow-primary/20 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            style={{ background: "linear-gradient(135deg, #BEE7FD, #ECF5FF)" }}
            onClick={() => openAvatarSelector()}
          >
              {selectedAvatar ? (
                <img src={selectedAvatar.src} alt={selectedAvatar.name} className="w-full h-full object-cover" />
              ) : (
                <img src={defaultAvatar} alt="Default avatar" className="w-16 h-16 object-contain opacity-60" />
              )}
            </div>
          </div>

          {/* Nickname */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Nickname
              </label>
              {isEditing ? <div className="flex gap-2 mt-1.5">
                  <Input value={editValue} onChange={e => setEditValue(e.target.value)} maxLength={30} placeholder="Enter your nickname" className="h-12 bg-transparent border-0 border-b border-[#EEEEEE] mb-[20px]" autoFocus />
                  <Button size="icon" onClick={saveNickname} className="h-12 w-12 shrink-0">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={cancelEditing} className="h-12 w-12 shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div> : <div className="h-12 bg-transparent border-0 border-b border-[#EEEEEE] px-3 flex items-center justify-between mt-1.5 mb-[20px] cursor-pointer transition-colors" onClick={startEditing}>
                  <span className="text-foreground font-medium">
                    {displayName || "Set a nickname"}
                  </span>
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </div>}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <div className="h-12 bg-transparent border-0 border-b border-[#EEEEEE] px-3 flex items-center mt-1.5 mb-[20px]">
                <span className="text-foreground font-medium">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Card */}
        {isAdmin && (
          <div className="bg-card/40 rounded-2xl p-6 mt-6 animate-slide-up" style={{ animationDelay: "0.03s" }}>
            <h2 className="text-lg font-bold text-foreground mb-4">Admin</h2>
            <Button
              variant="outline"
              onClick={() => navigate("/admin")}
              className="w-full h-12 bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5] hover:bg-[#0ABAB5] hover:text-white active:bg-[#0ABAB5]/25 active:text-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              Admin area
            </Button>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-card/40 rounded-2xl p-6 mt-6 animate-slide-up" style={{
        animationDelay: "0.1s"
      }}>
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
        <div className="rounded-2xl p-6 mt-6 animate-slide-up" style={{
        animationDelay: "0.15s"
      }}>
          <Button variant="outline" onClick={handleSignOut} className="w-full h-12 bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5] hover:bg-[#0ABAB5] hover:text-white active:bg-[#0ABAB5]/25 active:text-white">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Version */}
        <p className="text-center text-muted-foreground/50 text-xs mt-8">
          Push-it v1.0.0
        </p>
      </div>
    </div>;

};
export default ProfilePage;