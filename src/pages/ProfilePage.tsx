import { useState } from "react";
import { User, Edit3, Check, X } from "lucide-react";
import { usePushUpData } from "@/hooks/usePushUpData";

const ProfilePage = () => {
  const { userName, setUserName } = usePushUpData();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(userName);

  const handleSave = () => {
    if (editValue.trim()) {
      setUserName(editValue.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(userName);
    setIsEditing(false);
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

          {/* Name Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                Display Name
              </label>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-primary text-sm font-medium hover:text-primary/80 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoFocus
                  className="flex-1 h-12 bg-secondary rounded-xl px-4 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  maxLength={30}
                />
                <button
                  onClick={handleSave}
                  className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCancel}
                  className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="h-12 bg-secondary rounded-xl px-4 flex items-center">
                <span className="text-foreground font-medium">{userName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="card-glass rounded-2xl p-6 mt-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-lg font-bold text-foreground mb-4">
            About Push-it
          </h2>
          <div className="space-y-3 text-muted-foreground text-sm">
            <p>
              Push-it helps you track your daily push-ups and reach your goal of{" "}
              <span className="text-primary font-semibold">30,000 push-ups</span> per year.
            </p>
            <p>
              That's just <span className="text-foreground font-semibold">82 push-ups</span> per day.
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
