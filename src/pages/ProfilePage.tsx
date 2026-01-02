import { User, LogOut } from "lucide-react";
import { usePushUpData } from "@/hooks/usePushUpData";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ProfilePage = () => {
  const { yearlyGoal, dailyTarget } = usePushUpData();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
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

          {/* Email */}
          <div className="space-y-4">
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
