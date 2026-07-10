import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { User, LogOut, Pencil, Check, X, Shield, Share2 } from "lucide-react";
import PlayerCardPanel from "@/components/PlayerCardPanel";
import defaultAvatar from "@/assets/default-avatar.svg";
import { usePushUpData } from "@/hooks/usePushUpData";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  const [playerCardOpen, setPlayerCardOpen] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(() => {
    try {
      const raw = localStorage.getItem("share-button-enabled");
      return raw ? JSON.parse(raw) : false;
    } catch {
      return false;
    }
  });

  const handleShareToggle = (checked: boolean) => {
    setShareEnabled(checked);
    try {
      localStorage.setItem("share-button-enabled", JSON.stringify(checked));
    } catch {}
  };

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
      toast.error("Failed to save name");
      return;
    }
    setDisplayName(trimmedValue);
    setIsEditing(false);
    toast.success("Name saved!");
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
      {/* Animated Top Gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-[28rem] opacity-80 blur-3xl pointer-events-none animated-aurora"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
        }}
      />

      <div className="relative max-w-lg mx-auto px-6 space-y-6 py-[32px]">
        {/* Header */}
        <header className="mb-4 animate-fade-in flex items-center gap-2">
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Profile
          </h1>
        </header>

        {/* Profile Card */}
        <div className="bg-card/40 rounded-2xl p-6 animate-slide-up pt-[10px] pb-[10px] px-[10px] border border-[#3B404F]">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center shadow-xl shadow-primary/20 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            style={{ background: "linear-gradient(135deg, #BEE7FD, #ECF5FF)" }}
            onClick={() => setPlayerCardOpen(true)}
          >
              {selectedAvatar ? (
                <img src={selectedAvatar.src} alt={selectedAvatar.name} className="w-full h-full object-cover" />
              ) : (
                <img src={defaultAvatar} alt="Default avatar" className="w-16 h-16 object-contain opacity-60" />
              )}
            </div>
          </div>
 
          {/* Name */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Name
              </label>
              {isEditing ? <div className="flex gap-2 mt-1.5">
                  <Input value={editValue} onChange={e => setEditValue(e.target.value)} maxLength={30} placeholder="Enter your name" className="h-12 bg-transparent border-0 border-b border-[#EEEEEE] mb-[20px]" autoFocus />
                  <Button size="icon" onClick={saveNickname} className="h-12 w-12 shrink-0">
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={cancelEditing} className="h-12 w-12 shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div> : <div className="h-12 bg-transparent border-0 border-b border-[#EEEEEE] px-3 flex items-center justify-between mt-1.5 mb-[20px] cursor-pointer transition-colors" onClick={startEditing}>
                  <span className="text-foreground font-medium">
                    {displayName || "Set a name"}
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

        {/* Share Toggle Card */}
        <div className="bg-card/40 rounded-2xl p-6 animate-slide-up pt-[10px] pb-[10px] px-[10px] border border-[#3B404F]" style={{ animationDelay: "0.02s" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Share2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg text-foreground font-semibold">Share button</h2>
                <p className="text-sm text-muted-foreground">Show the share button on the daily card</p>
              </div>
            </div>
            <Switch
              id="share-toggle"
              checked={shareEnabled}
              onCheckedChange={handleShareToggle}
              aria-label="Toggle share button"
            />
          </div>
        </div>

        {/* Player Card */}
        <div className="animate-slide-up" style={{ animationDelay: "0.03s" }}>
          <PlayerCardPanel open={playerCardOpen} onOpenChange={setPlayerCardOpen} />
        </div>

        {/* Admin Card */}
        {isAdmin && (
          <div className="bg-card/40 rounded-2xl p-6 animate-slide-up pt-[10px] pb-[10px] px-[10px] border border-[#3B404F]" style={{ animationDelay: "0.03s" }}>
            <h2 className="text-lg text-foreground font-semibold mb-4">Admin</h2>
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
        <div className="bg-card/40 rounded-2xl p-6 animate-slide-up pt-[10px] pb-[10px] px-[10px] border border-[#3B404F]" style={{
        animationDelay: "0.1s"
      }}>
          <h2 className="text-lg text-foreground font-semibold mb-[6px]">
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
        <div className="rounded-2xl p-6 animate-slide-up" style={{
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