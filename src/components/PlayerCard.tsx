import { User, TrendingUp } from "lucide-react";
import { AvatarOption } from "@/data/avatars";
import muscleIcon from "@/assets/muscle-icon.svg";

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
  onAvatarClick
}: PlayerCardProps) => {
  // Determine "level" based on total push-ups
  const getLevel = () => {
    if (totalPushUps >= 50000) return { label: "LEGEND", color: "from-yellow-400 to-amber-600" };
    if (totalPushUps >= 30000) return { label: "MASTER", color: "from-purple-400 to-purple-600" };
    if (totalPushUps >= 15000) return { label: "EXPERT", color: "from-blue-400 to-blue-600" };
    if (totalPushUps >= 5000) return { label: "ADVANCED", color: "from-green-400 to-green-600" };
    if (totalPushUps >= 1000) return { label: "FIGHTER", color: "from-orange-400 to-orange-600" };
    return { label: "ROOKIE", color: "from-gray-400 to-gray-600" };
  };

  const level = getLevel();

  return (
    <div className="w-full max-w-[320px] mx-auto select-none">
      {/* Card outer frame - metallic silver border */}
      <div className="rounded-2xl p-[6px] bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-2xl">
        {/* Card inner */}
        <div className="rounded-xl overflow-hidden bg-gradient-to-br from-amber-50 via-amber-100 to-yellow-100 relative">
          {/* Top bar with name and HP */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r ${level.color} text-white tracking-wider`}>
                {level.label}
              </span>
              <h3 className="text-lg font-extrabold text-gray-800 truncate max-w-[140px]">
                {displayName || "Unknown"}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-gray-500 uppercase">PU</span>
              <span className="text-xl font-black text-gray-800">{totalPushUps.toLocaleString()}</span>
              <img src={muscleIcon} alt="" className="w-5 h-5" />
            </div>
          </div>

          {/* Avatar image frame */}
          <div className="mx-3 mb-2">
            <div
              className={`rounded-lg border-[3px] border-gray-300 overflow-hidden bg-gradient-to-br from-sky-200 via-sky-100 to-blue-50 aspect-square flex items-center justify-center relative ${onAvatarClick ? "cursor-pointer" : ""}`}
              onClick={onAvatarClick}>

              {avatar ?
              <img
                src={avatar.src}
                alt={avatar.name}
                className="w-3/4 h-3/4 object-contain drop-shadow-lg" /> :


              <div className="w-24 h-24 rounded-full bg-gray-800/20 flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-500" />
                </div>
              }
              {/* Decorative sparkles */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full opacity-60 animate-pulse" />
              <div className="absolute top-8 right-6 w-1.5 h-1.5 bg-white rounded-full opacity-40 animate-pulse" style={{ animationDelay: "0.5s" }} />
              <div className="absolute bottom-4 left-3 w-1 h-1 bg-white rounded-full opacity-50 animate-pulse" style={{ animationDelay: "1s" }} />
            </div>
            {/* Sub-info line under image */}
            <div className="flex justify-between items-center px-1 mt-1">
              <span className="text-[9px] text-gray-500 font-medium">
                {avatar ? avatar.name : "No Avatar"} • Push-Up Challenger
              </span>
              <span className="text-[9px] text-gray-500 font-medium">
                Goal: {yearlyGoal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-3 h-[2px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          {/* Stats section */}
          <div className="px-4 py-3 space-y-2.5">
            {/* Streak stat */}
            <div className="flex items-start gap-2">
              <span className="text-lg">🔥</span>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-800">Current Streak</span>
                  <span className="text-lg font-black text-gray-800">{currentStreak}</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Consecutive days PU logged
                
                
                
                
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-gray-300/50" />

            {/* Weekly avg stat */}
            <div className="flex items-start gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-800">Weekly Average</span>
                  <span className="text-lg font-black text-gray-800">{weeklyAverage}</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Avg. PU/day in  last 7 days       

                
                </p>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mx-3 h-[1px] bg-gray-300" />
          <div className="px-4 py-2 flex justify-between items-center" style={{ background: "linear-gradient(to right, rgba(255, 209, 107, 0.3), rgba(255, 191, 79, 0.3))" }}>
            <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
              <span>Days active: {daysWithEntries}</span>
              <span className="text-gray-300">|</span>
              <span>Progress: {Math.round(yearProgress)}%</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, Math.ceil(yearProgress / 20)))].map((_, i) => <span key={i} className="text-[10px]">⭐</span>)}
              {[...Array(Math.max(0, 5 - Math.ceil(yearProgress / 20)))].map((_, i) => <span key={i} className="text-[10px] opacity-25">⭐</span>)}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-1.5 flex justify-between items-center bg-gradient-to-r from-amber-100/50 to-yellow-100/50">
            <span className="text-[8px] text-gray-400 italic">Push-it © 2026</span>
            <span className="text-[8px] text-gray-400">💪 30K Push-Up Challenge</span>
          </div>
        </div>
      </div>
    </div>);};

export default PlayerCard;