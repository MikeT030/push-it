import { useState } from "react";
import { TrendingUp, Flame } from "lucide-react";
import defaultAvatar from "@/assets/default-avatar.svg";
import defaultAvatarList from "@/assets/default-avatar-list.svg";
import { useNavigate } from "react-router-dom";
import { getAvatarById } from "@/data/avatars";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent } from
"@/components/ui/dialog";
import PlayerCard from "@/components/PlayerCard";

interface UserProgress {
  user_id: string;
  display_name: string | null;
  total_pushups: number;
  yearly_goal: number;
  progress_percent: number;
  days_logged: number;
  avatar_url?: string | null;
  streak?: number;
  avg_pushups?: number;
}

interface LeaderboardPodiumProps {
  users: UserProgress[];
}

const rankColors = [
"bg-gradient-to-b from-yellow-500 to-yellow-700",
"bg-gradient-to-b from-gray-300 to-gray-500",
"bg-gradient-to-b from-amber-600 to-amber-800"];

const rankTextColors = [
"text-yellow-500",
"text-gray-300",
"text-amber-600"];

const rankBadgeColors = [
"bg-yellow-600 text-black",
"bg-gray-400 text-black",
"bg-amber-700 text-white"];


const PodiumAvatar = ({ user, rank, onClick }: {user: UserProgress;rank: number;onClick: () => void;}) => {
  const avatar = getAvatarById(user.avatar_url ?? null);
  const sizes = [
  "w-20 h-20",
  "w-16 h-16",
  "w-14 h-14"];


  return (
    <div className="flex flex-col items-center gap-1.5 relative cursor-pointer" onClick={onClick}>
      {/* Rank badge */}
      <div className={`hidden absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${rankBadgeColors[rank]}`}>
        {rank + 1}
      </div>
      
      {/* Avatar */}
      <div className={`${sizes[rank]} rounded-full overflow-hidden border-2 ${rank === 0 ? "border-yellow-500" : rank === 1 ? "border-gray-400" : "border-amber-700"} flex items-center justify-center`} style={{ background: "linear-gradient(135deg, #BEE7FD, #ECF5FF)" }}>
        {avatar ?
        <img src={avatar.src} alt={user.display_name || "User"} className="w-full h-full object-cover" /> :
        <img src={defaultAvatar} alt="Default avatar" className="w-3/4 h-3/4 object-contain" />
        }
      </div>

      {/* Name + Streak */}
      <p className="text-xs text-foreground truncate max-w-[80px] text-center font-bold">
        {user.display_name || `Member`}
      </p>
      <p className="font-medium text-foreground text-xs flex items-center gap-0.5 justify-center">
        <Flame className="w-3 h-3 text-[#FF2C2C]" fill="#FF2C2C" /> <span className="font-bold">{user.streak ?? 0}d</span> streak
      </p>
      <p className="font-medium text-foreground flex items-center gap-0.5 justify-center text-xs">
        <span className="text-sm font-bold text-primary">Ø</span> <span className="font-bold">{Math.round(user.avg_pushups ?? 0)}</span> Avg. PU
      </p>

      {/* Goal + Score badges (matched widths) */}
      <div className="inline-flex flex-col items-stretch gap-1">
        {user.yearly_goal !== 30000 && (
          <div className={`flex items-center justify-center gap-1 rounded-full px-2.5 py-[2px] border ${rank === 0 ? "border-yellow-500" : rank === 1 ? "border-gray-300" : "border-amber-600"}`}>
            <span className={`text-[10px] font-bold ${rankTextColors[rank]}`}>+{Math.round((user.yearly_goal - 30000) / 1000)}K</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 pt-[4px] border border-[#575F78]">
          <span className="text-sm font-bold text-foreground">{user.total_pushups.toLocaleString()}</span>
        </div>
      </div>

    </div>);
};

const LeaderboardPodium = ({ users }: LeaderboardPodiumProps) => {
  const top3 = users.slice(0, 3);
  const rest = users.slice(3);
  const [selectedUser, setSelectedUser] = useState<UserProgress | null>(null);
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const podiumHeights = ["h-20", "h-28", "h-14"];

  return (
    <div className="animate-slide-up">
      {/* Podium Section */}
      {top3.length >= 1 &&
      <div className="mb-3">
          <div className="flex items-end justify-center gap-4 mb-2 pt-[10px]">
            {top3.length >= 2 && <PodiumAvatar user={top3[1]} rank={1} onClick={() => setSelectedUser(top3[1])} />}
            <PodiumAvatar user={top3[0]} rank={0} onClick={() => setSelectedUser(top3[0])} />
            {top3.length >= 3 && <PodiumAvatar user={top3[2]} rank={2} onClick={() => setSelectedUser(top3[2])} />}
          </div>

          <div className="flex items-end justify-center gap-1 mx-auto max-w-[280px] pt-[8px]">
            {top3.length >= 2 &&
          <div className={`flex-1 ${podiumHeights[0]} rounded-t-lg bg-gradient-to-b from-gray-300 to-gray-600 flex items-center justify-center opacity-80`}>
                <span className="text-2xl font-black text-gray-900/50">2</span>
              </div>
          }
            <div className={`flex-1 ${podiumHeights[1]} rounded-t-lg bg-gradient-to-b from-yellow-400 to-yellow-700 flex items-center justify-center opacity-80`}>
              <span className="text-3xl font-black text-yellow-950/50">1</span>
            </div>
            {top3.length >= 3 &&
          <div className={`flex-1 ${podiumHeights[2]} rounded-t-lg bg-gradient-to-b from-amber-500 to-amber-800 flex items-center justify-center opacity-80`}>
                <span className="text-xl font-black text-amber-950/50">3</span>
              </div>
          }
          </div>
        </div>
      }

      {/* Remaining users list */}
      {rest.length > 0 &&
      <div className="bg-card/40 rounded-t-2xl overflow-hidden">
          {rest.map((user, index) => {
          const avatar = getAvatarById(user.avatar_url ?? null);
          return (
            <div
              key={user.user_id}
              className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors ${index < rest.length - 1 ? "border-b border-[#3A404F]" : ""}`}
              onClick={() => setSelectedUser(user)}>

                <span className="text-sm font-bold text-muted-foreground w-5 text-center">
                  {index + 4}
                </span>

                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #BEE7FD, #ECF5FF)" }}>
                  {avatar ?
                <img src={avatar.src} alt={user.display_name || "User"} className="w-full h-full object-cover" /> :
                <img src={defaultAvatarList} alt="Default avatar" className="w-3/4 h-3/4 object-contain" />
                }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.display_name || `Member ${index + 4}`}
                  </p>
                  <p className="text-xs text-foreground flex items-center gap-0.5"><Flame className="w-3 h-3 text-[#FF2C2C]" fill="#FF2C2C" /> <span className="font-bold">{user.streak ?? 0}d</span> streak</p>
                  <p className="text-xs text-foreground flex items-center gap-0.5"><span className="text-xs font-bold text-primary">Ø</span> <span className="font-bold">{Math.round(user.avg_pushups ?? 0)}</span> Avg. PU</p>
                  {user.yearly_goal !== 30000 && (
                    <div className="inline-flex items-center gap-1 rounded-full px-1.5 py-[2px] border border-white/60 mt-1">
                      <span className="text-[10px] font-bold text-white">+{Math.round((user.yearly_goal - 30000) / 1000)}K</span>
                    </div>
                  )}
                </div>


                <div className="flex items-center gap-1 rounded-full px-2.5 py-1">
                  <span className="text-sm font-bold text-foreground">{user.total_pushups.toLocaleString()}</span>
                </div>
              </div>);
        })}
        </div>
      }

      {/* Player Card Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-sm p-6 bg-transparent border-none shadow-none" hideCloseButton>
          {selectedUser &&
          <PlayerCard
            displayName={selectedUser.display_name || "Unknown"}
            avatar={getAvatarById(selectedUser.avatar_url ?? null)}
            totalPushUps={selectedUser.total_pushups}
            yearlyGoal={selectedUser.yearly_goal}
            currentStreak={selectedUser.streak ?? 0}
            weeklyAverage={Math.round(selectedUser.avg_pushups ?? 0)}
            yearProgress={selectedUser.progress_percent}
            daysWithEntries={selectedUser.days_logged}
            onAvatarClick={
            authUser?.id === selectedUser.user_id ?
            () => {
              setSelectedUser(null);
              navigate("/profile?openAvatar=true");
            } :
            undefined
            } />

          }
        </DialogContent>
      </Dialog>
    </div>);
};

export default LeaderboardPodium;