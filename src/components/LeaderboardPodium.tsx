import { useState } from "react";
import { User, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAvatarById } from "@/data/avatars";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
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
"bg-gradient-to-b from-yellow-400 to-yellow-600",
"bg-gradient-to-b from-gray-300 to-gray-500",
"bg-gradient-to-b from-amber-600 to-amber-800"
];

const rankBadgeColors = [
"bg-yellow-500 text-black",
"bg-gray-400 text-black",
"bg-amber-700 text-white"];


const PodiumAvatar = ({ user, rank, onClick }: {user: UserProgress; rank: number; onClick: () => void}) => {
  const avatar = getAvatarById(user.avatar_url ?? null);
  const sizes = [
  "w-20 h-20",
  "w-16 h-16",
  "w-14 h-14"
  ];

  return (
    <div className="flex flex-col items-center gap-1.5 relative cursor-pointer" onClick={onClick}>
      {/* Rank badge */}
      <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${rankBadgeColors[rank]}`}>
        {rank + 1}
      </div>
      
      {/* Avatar */}
      <div className={`${sizes[rank]} rounded-full overflow-hidden border-2 ${rank === 0 ? "border-yellow-400" : rank === 1 ? "border-gray-400" : "border-amber-700"} bg-muted flex items-center justify-center`}>
        {avatar ?
        <img src={avatar.src} alt={user.display_name || "User"} className="w-full h-full object-cover" /> :
        <User className="w-1/2 h-1/2 text-muted-foreground" />
        }
      </div>

      {/* Name + Streak */}
      <p className="text-xs font-medium text-foreground truncate max-w-[80px] text-center">
        {user.display_name || `Member`}
      </p>
      <p className="text-[10px] font-medium text-[#C029DE]">
        🔥 {user.streak ?? 0}d streak
      </p>
      <p className="text-[10px] font-medium text-foreground flex items-center gap-0.5 justify-center">
        <TrendingUp className="w-3 h-3 text-primary" /> {Math.round(user.avg_pushups ?? 0)} Avg. PU
      </p>

      {/* Score badge */}
      <div className="flex items-center gap-1 bg-muted/80 rounded-full px-2.5 py-0.5">
        <span className="text-sm font-bold text-foreground">{user.total_pushups.toLocaleString()}</span>
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

          <div className="flex items-end justify-center gap-1 mx-auto max-w-[280px]">
            {top3.length >= 2 &&
          <div className={`flex-1 ${podiumHeights[0]} rounded-t-lg bg-gradient-to-b from-[#3B404F] to-[#2A2E3A] flex items-center justify-center`}>
                <span className="text-2xl font-black text-muted-foreground/40">2</span>
              </div>
          }
            <div className={`flex-1 ${podiumHeights[1]} rounded-t-lg bg-gradient-to-b from-[#4A4F5E] to-[#2A2E3A] flex items-center justify-center`}>
              <span className="text-3xl font-black text-muted-foreground/40">1</span>
            </div>
            {top3.length >= 3 &&
          <div className={`flex-1 ${podiumHeights[2]} rounded-t-lg bg-gradient-to-b from-[#333843] to-[#2A2E3A] flex items-center justify-center`}>
                <span className="text-xl font-black text-muted-foreground/40">3</span>
              </div>
          }
          </div>
        </div>
      }

      {/* Remaining users list */}
      {rest.length > 0 &&
      <div className="bg-card rounded-2xl overflow-hidden">
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

                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                  {avatar ?
                <img src={avatar.src} alt={user.display_name || "User"} className="w-full h-full object-cover" /> :
                <User className="w-5 h-5 text-muted-foreground" />
                }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.display_name || `Member ${index + 4}`}
                  </p>
                  <p className="text-xs text-foreground">🔥 {user.streak ?? 0}d streak</p>
                  <p className="text-xs text-foreground flex items-center gap-0.5"><TrendingUp className="w-3 h-3 text-primary" /> {Math.round(user.avg_pushups ?? 0)} Avg. PU</p>
                </div>

                <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2.5 py-1">
                  <span className="text-sm font-bold text-foreground">{user.total_pushups.toLocaleString()}</span>
                </div>
              </div>);
        })}
        </div>
      }

      {/* Player Card Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-sm p-6 bg-transparent border-none shadow-none" hideCloseButton>
          {selectedUser && (
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
                authUser?.id === selectedUser.user_id
                  ? () => {
                      setSelectedUser(null);
                      navigate("/profile?openAvatar=true");
                    }
                  : undefined
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>);
};

export default LeaderboardPodium;
