import { Flame } from "lucide-react";
import { AvatarOption } from "@/data/avatars";
import muscleIcon from "@/assets/muscle-icon.svg";
import defaultAvatarCard from "@/assets/default-avatar-card.svg";

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

  const getLevel = () => {
    if (totalPushUps >= 50000) return { label: "LEGEND", color: "from-yellow-400 to-amber-600" };
    if (totalPushUps >= 30000) return { label: "MASTER", color: "from-purple-400 to-purple-600" };
    if (totalPushUps >= 15000) return { label: "EXPERT", color: "from-blue-400 to-blue-600" };
    if (totalPushUps >= 5000) return { label: "ADVANCED", color: "from-green-400 to-green-600" };
    if (totalPushUps >= 1000) return { label: "FIGHTER", color: "from-orange-400 to-orange-600" };
    return { label: "ROOKIE", color: "from-gray-400 to-gray-600" };
  };

  const level = getLevel();
  const filledStars = Math.min(5, Math.ceil(yearProgress / 20));
  const emptyStars = Math.max(0, 5 - filledStars);

  // Shared avatar block — identical in all variants
  const AvatarBlock = (
    <div className="mx-3 mb-2">
      <div
        className={`rounded-lg border-[3px] border-gray-300 overflow-hidden bg-gradient-to-br from-sky-200 via-sky-100 to-blue-50 aspect-square flex items-center justify-center relative ${onAvatarClick ? "cursor-pointer" : ""}`}
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
        <span className="text-[9px] text-gray-500 font-medium">
          {avatar ? avatar.name : "No Avatar"} • Push-Up Challenger
        </span>
        <span className="text-[9px] text-gray-500 font-medium">
          Goal: {yearlyGoal.toLocaleString()}
        </span>
      </div>
    </div>
  );

  // --- Variant 0: Original Light Card ---
  const LightCard = (
    <div className="rounded-2xl p-[6px] bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-2xl">
      <div className="rounded-xl overflow-hidden bg-gradient-to-br from-amber-50 via-amber-100 to-yellow-100 relative">
        {/* Top bar */}
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
            <img src={muscleIcon} alt="" className="w-5 h-5" />
            <span className="text-xl font-black text-gray-800">{totalPushUps.toLocaleString()}</span>
            <span className="text-[10px] font-semibold text-gray-500 uppercase">PU</span>
          </div>
        </div>

        {AvatarBlock}

        <div className="mx-3 h-[2px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

        {/* Stats */}
        <div className="px-4 py-3 space-y-2.5">
          <div className="flex items-start gap-2">
            <Flame className="w-5 h-5 text-[#FF2C2C]" fill="currentColor" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800">Current Streak</span>
                <span className="text-lg font-black text-gray-800">{currentStreak}</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">Consecutive days PU logged</p>
            </div>
          </div>
          <div className="h-[1px] bg-gray-300/50" />
          <div className="flex items-start gap-2">
            <span className="text-xl font-bold text-primary">Ø</span>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800">Weekly Average</span>
                <span className="text-lg font-black text-gray-800">{weeklyAverage}</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">Avg. PU/day in last 7 days</p>
            </div>
          </div>
        </div>

        <div className="mx-3 h-[1px] bg-gray-300" />
        <div className="px-4 py-2 flex justify-between items-center" style={{ background: "linear-gradient(to right, rgba(255, 209, 107, 0.3), rgba(255, 191, 79, 0.3))" }}>
          <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
            <span>Days active: {daysWithEntries}</span>
            <span className="text-gray-300">|</span>
            <span>Progress: {Math.round(yearProgress)}%</span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(filledStars)].map((_, i) => <span key={i} className="text-[10px]">⭐</span>)}
            {[...Array(emptyStars)].map((_, i) => <span key={i} className="text-[10px] opacity-25">⭐</span>)}
          </div>
        </div>

        <div className="px-4 py-1.5 flex justify-between items-center bg-gradient-to-r from-amber-100/50 to-yellow-100/50">
          <span className="text-[8px] text-gray-400 italic">Push-it © 2026</span>
          <span className="text-[8px] text-gray-400">💪 30K Push-Up Challenge</span>
        </div>
      </div>
    </div>
  );

  // --- Variant 1: Dark Glass ---
  const DarkGlassCard = (
    <div className="rounded-2xl p-[6px]" style={{ background: "linear-gradient(135deg, #1a2332, #0F1922, #1a2332)" }}>
      <div className="rounded-xl overflow-hidden relative border border-[#3B404F] bg-[#0F1922]">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0ABAB5]/50 to-transparent" />

        {/* Top bar */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r ${level.color} text-white tracking-wider`}>
              {level.label}
            </span>
            <h3 className="text-lg font-extrabold text-white truncate max-w-[140px]">
              {displayName || "Unknown"}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <img src={muscleIcon} alt="" className="w-5 h-5 brightness-0 invert" />
            <span className="text-xl font-black text-white">{totalPushUps.toLocaleString()}</span>
            <span className="text-[10px] font-semibold text-[#575F78] uppercase">PU</span>
          </div>
        </div>

        {AvatarBlock}

        <div className="mx-3 h-[2px] bg-gradient-to-r from-transparent via-[#3B404F] to-transparent" />

        {/* Stats */}
        <div className="px-4 py-3 space-y-2.5">
          <div className="flex items-start gap-2">
            <Flame className="w-5 h-5 text-[#FF2C2C]" fill="currentColor" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white">Current Streak</span>
                <span className="text-lg font-black text-white">{currentStreak}</span>
              </div>
              <p className="text-[10px] text-[#575F78] leading-tight">Consecutive days PU logged</p>
            </div>
          </div>
          <div className="h-[1px] bg-[#3B404F]/50" />
          <div className="flex items-start gap-2">
            <span className="text-xl font-bold text-[#0ABAB5]">Ø</span>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white">Weekly Average</span>
                <span className="text-lg font-black text-white">{weeklyAverage}</span>
              </div>
              <p className="text-[10px] text-[#575F78] leading-tight">Avg. PU/day in last 7 days</p>
            </div>
          </div>
        </div>

        <div className="mx-3 h-[1px] bg-[#3B404F]" />
        <div className="px-4 py-2 flex justify-between items-center bg-[#161b27]">
          <div className="flex items-center gap-3 text-[10px] text-[#575F78] font-medium">
            <span>Days active: {daysWithEntries}</span>
            <span className="text-[#3B404F]">|</span>
            <span>Progress: {Math.round(yearProgress)}%</span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(filledStars)].map((_, i) => <span key={i} className="text-[10px]">⭐</span>)}
            {[...Array(emptyStars)].map((_, i) => <span key={i} className="text-[10px] opacity-25">⭐</span>)}
          </div>
        </div>

        <div className="px-4 py-1.5 flex justify-between items-center bg-[#0F1922]">
          <span className="text-[8px] text-[#575F78] italic">Push-it © 2026</span>
          <span className="text-[8px] text-[#575F78]">💪 30K Push-Up Challenge</span>
        </div>
      </div>
    </div>
  );

  // --- Variant 2: Dark Minimal ---
  const DarkMinimalCard = (
    <div className="rounded-2xl overflow-hidden border border-[#3B404F] bg-card/40 backdrop-blur-sm relative">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0ABAB5] via-[#7036FF] to-[#C029DE]" />

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r ${level.color} text-white tracking-wider`}>
            {level.label}
          </span>
          <h3 className="text-base font-extrabold text-white truncate max-w-[120px]">
            {displayName || "Unknown"}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <img src={muscleIcon} alt="" className="w-4 h-4 brightness-0 invert" />
          <span className="text-lg font-black text-white">{totalPushUps.toLocaleString()}</span>
          <span className="text-[9px] font-semibold text-[#575F78] uppercase">PU</span>
        </div>
      </div>

      {AvatarBlock}

      {/* Compact stats grid */}
      <div className="px-3 pb-3 space-y-2">
        {/* Streak row */}
        <div className="bg-[#0F1922]/60 rounded-xl px-3 py-2.5 flex items-center justify-between border border-[#3B404F]/50">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#FF2C2C]" fill="currentColor" />
            <div>
              <p className="text-xs font-bold text-white leading-none">Current Streak</p>
              <p className="text-[9px] text-[#575F78] mt-0.5">Consecutive days</p>
            </div>
          </div>
          <span className="text-base font-black text-white">{currentStreak}</span>
        </div>

        {/* Weekly avg row */}
        <div className="bg-[#0F1922]/60 rounded-xl px-3 py-2.5 flex items-center justify-between border border-[#3B404F]/50">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[#0ABAB5]">Ø</span>
            <div>
              <p className="text-xs font-bold text-white leading-none">Weekly Average</p>
              <p className="text-[9px] text-[#575F78] mt-0.5">Last 7 days</p>
            </div>
          </div>
          <span className="text-base font-black text-white">{weeklyAverage}</span>
        </div>

        {/* Progress mini bar */}
        <div className="bg-[#0F1922]/60 rounded-xl px-3 py-2.5 border border-[#3B404F]/50">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-medium text-[#575F78]">Year Progress</span>
            <span className="text-[10px] font-bold text-white">{Math.round(yearProgress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#3B404F] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0ABAB5] to-[#0ABAB5]/70"
              style={{ width: `${Math.min(100, yearProgress)}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-[9px] text-[#575F78]">Days active: {daysWithEntries}</span>
            <div className="flex items-center gap-0.5">
              {[...Array(filledStars)].map((_, i) => <span key={i} className="text-[9px]">⭐</span>)}
              {[...Array(emptyStars)].map((_, i) => <span key={i} className="text-[9px] opacity-25">⭐</span>)}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 flex justify-between items-center border-t border-[#3B404F]/50">
        <span className="text-[8px] text-[#575F78] italic">Push-it © 2026</span>
        <span className="text-[8px] text-[#575F78]">💪 30K Challenge</span>
      </div>
    </div>
  );

  const cards = [LightCard, DarkGlassCard, DarkMinimalCard];

  return (
    <div className="w-full max-w-[320px] mx-auto select-none">
      {/* Dot navigation */}
      <div className="flex justify-center gap-2 mb-3">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => setVariant(i)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              variant === i
                ? "bg-[#0ABAB5] w-4"
                : "bg-[#3B404F] hover:bg-[#575F78]"
            }`}
            aria-label={`Switch to card version ${i + 1}`}
          />
        ))}
      </div>

      {cards[variant]}
    </div>
  );
};

export default PlayerCard;
