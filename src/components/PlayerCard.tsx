import { TrendingUp } from "lucide-react";
import { AvatarOption } from "@/data/avatars";
import muscleIcon from "@/assets/muscle-icon.svg";
import defaultAvatarCard from "@/assets/default-avatar-card.svg";

export const CARD_THEMES = {
  gold: {
    border: "from-gray-300 via-gray-400 to-gray-500",
    bg: "from-amber-50 via-amber-100 to-yellow-100",
    avatarBg: "from-sky-200 via-sky-100 to-blue-50",
    bottomBar: "rgba(255, 209, 107, 0.3), rgba(255, 191, 79, 0.3)",
    footer: "from-amber-100/50 to-yellow-100/50",
    dotColor: "#F6C254",
  },
  midnight: {
    border: "from-slate-500 via-slate-600 to-slate-700",
    bg: "from-slate-800 via-slate-900 to-gray-900",
    avatarBg: "from-slate-700 via-slate-800 to-slate-900",
    bottomBar: "rgba(100, 116, 139, 0.3), rgba(71, 85, 105, 0.3)",
    footer: "from-slate-800/50 to-gray-900/50",
    dotColor: "#334155",
    dark: true,
  },
  ocean: {
    border: "from-cyan-300 via-teal-400 to-cyan-500",
    bg: "from-cyan-50 via-teal-50 to-emerald-50",
    avatarBg: "from-teal-200 via-cyan-100 to-emerald-50",
    bottomBar: "rgba(94, 234, 212, 0.3), rgba(45, 212, 191, 0.3)",
    footer: "from-teal-100/50 to-cyan-100/50",
    dotColor: "#14B8A6",
  },
  rose: {
    border: "from-rose-300 via-pink-400 to-rose-500",
    bg: "from-rose-50 via-pink-50 to-fuchsia-50",
    avatarBg: "from-rose-200 via-pink-100 to-fuchsia-50",
    bottomBar: "rgba(251, 113, 133, 0.3), rgba(244, 63, 94, 0.3)",
    footer: "from-rose-100/50 to-pink-100/50",
    dotColor: "#F43F5E",
  },
} as const;

export type CardTheme = keyof typeof CARD_THEMES;

interface PlayerCardProps {
  displayName: string;
  avatar: AvatarOption | undefined;
  totalPushUps: number;
  yearlyGoal: number;
  currentStreak: number;
  weeklyAverage: number;
  yearProgress: number;
  daysWithEntries: number;
  onAvatarClick?: () => void;
  cardTheme?: CardTheme;
}

const PlayerCard = ({
  displayName,
  avatar,
  totalPushUps,
  yearlyGoal,
  currentStreak,
  weeklyAverage,
  yearProgress,
  daysWithEntries,
  onAvatarClick,
  cardTheme = "gold",
}: PlayerCardProps) => {
  const getLevel = () => {
    if (totalPushUps >= 50000) return { label: "LEGEND", color: "from-yellow-400 to-amber-600" };
    if (totalPushUps >= 30000) return { label: "MASTER", color: "from-purple-400 to-purple-600" };
    if (totalPushUps >= 15000) return { label: "EXPERT", color: "from-blue-400 to-blue-600" };
    if (totalPushUps >= 5000) return { label: "ADVANCED", color: "from-green-400 to-green-600" };
    if (totalPushUps >= 1000) return { label: "FIGHTER", color: "from-orange-400 to-orange-600" };
    return { label: "ROOKIE", color: "from-gray-400 to-gray-600" };
  };

  const level = getLevel();
  const theme = CARD_THEMES[cardTheme];
  const isDark = "dark" in theme && theme.dark;
  const textPrimary = isDark ? "text-gray-100" : "text-gray-800";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const dividerColor = isDark ? "via-gray-600" : "via-gray-300";
  const subDivider = isDark ? "bg-gray-600/50" : "bg-gray-300/50";
  const borderAvatar = isDark ? "border-gray-600" : "border-gray-300";

  return (
    <div className="w-full max-w-[320px] mx-auto select-none">
      <div className={`rounded-2xl p-[6px] bg-gradient-to-br ${theme.border} shadow-2xl`}>
        <div className={`rounded-xl overflow-hidden bg-gradient-to-br ${theme.bg} relative`}>
          {/* Top bar */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r ${level.color} text-white tracking-wider`}>
                {level.label}
              </span>
              <h3 className={`text-lg font-extrabold ${textPrimary} truncate max-w-[140px]`}>
                {displayName || "Unknown"}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-[10px] font-semibold ${textSecondary} uppercase`}>PU</span>
              <span className={`text-xl font-black ${textPrimary}`}>{totalPushUps.toLocaleString()}</span>
              <img src={muscleIcon} alt="" className="w-5 h-5" />
            </div>
          </div>

          {/* Avatar */}
          <div className="mx-3 mb-2">
            <div
              className={`rounded-lg border-[3px] ${borderAvatar} overflow-hidden bg-gradient-to-br ${theme.avatarBg} aspect-square flex items-center justify-center relative ${onAvatarClick ? "cursor-pointer" : ""}`}
              onClick={onAvatarClick}>
              {avatar ? (
                <img src={avatar.src} alt={avatar.name} className="w-3/4 h-3/4 object-contain drop-shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-800/20 flex items-center justify-center">
                  <img src={defaultAvatarCard} alt="Default avatar" className="w-3/4 h-3/4 object-contain" />
                </div>
              )}
              <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full opacity-60 animate-pulse" />
              <div className="absolute top-8 right-6 w-1.5 h-1.5 bg-white rounded-full opacity-40 animate-pulse" style={{ animationDelay: "0.5s" }} />
              <div className="absolute bottom-4 left-3 w-1 h-1 bg-white rounded-full opacity-50 animate-pulse" style={{ animationDelay: "1s" }} />
            </div>
            <div className="flex justify-between items-center px-1 mt-1">
              <span className={`text-[9px] ${textSecondary} font-medium`}>
                {avatar ? avatar.name : "No Avatar"} • Push-Up Challenger
              </span>
              <span className={`text-[9px] ${textSecondary} font-medium`}>
                Goal: {yearlyGoal.toLocaleString()}
              </span>
            </div>
          </div>

          <div className={`mx-3 h-[2px] bg-gradient-to-r from-transparent ${dividerColor} to-transparent`} />

          {/* Stats */}
          <div className="px-4 py-3 space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="text-lg">🔥</span>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-bold ${textPrimary}`}>Current Streak</span>
                  <span className={`text-lg font-black ${textPrimary}`}>{currentStreak}</span>
                </div>
                <p className={`text-[10px] ${textSecondary} leading-tight`}>Consecutive days PU logged</p>
              </div>
            </div>
            <div className={`h-[1px] ${subDivider}`} />
            <div className="flex items-start gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-bold ${textPrimary}`}>Weekly Average</span>
                  <span className={`text-lg font-black ${textPrimary}`}>{weeklyAverage}</span>
                </div>
                <p className={`text-[10px] ${textSecondary} leading-tight`}>Avg. PU/day in last 7 days</p>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className={`mx-3 h-[1px] ${isDark ? "bg-gray-600" : "bg-gray-300"}`} />
          <div className="px-4 py-2 flex justify-between items-center" style={{ background: `linear-gradient(to right, ${theme.bottomBar.split(", ")[0]}, ${theme.bottomBar.split(", ")[1]})` }}>
            <div className={`flex items-center gap-3 text-[10px] ${textSecondary} font-medium`}>
              <span>Days active: {daysWithEntries}</span>
              <span className={isDark ? "text-gray-600" : "text-gray-300"}>|</span>
              <span>Progress: {Math.round(yearProgress)}%</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, Math.ceil(yearProgress / 20)))].map((_, i) => <span key={i} className="text-[10px]">⭐</span>)}
              {[...Array(Math.max(0, 5 - Math.ceil(yearProgress / 20)))].map((_, i) => <span key={i} className="text-[10px] opacity-25">⭐</span>)}
            </div>
          </div>

          {/* Footer */}
          <div className={`px-4 py-1.5 flex justify-between items-center bg-gradient-to-r ${theme.footer}`}>
            <span className={`text-[8px] ${isDark ? "text-gray-500" : "text-gray-400"} italic`}>Push-it © 2026</span>
            <span className={`text-[8px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>💪 30K Push-Up Challenge</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;