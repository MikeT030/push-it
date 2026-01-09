import { Target, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import muscleIcon from "@/assets/muscle-icon.svg";

const MuscleIcon = ({ className, strokeWidth }: { className?: string; strokeWidth?: number }) => (
  <img src={muscleIcon} alt="Push" className={className} style={{ filter: 'var(--muscle-icon-filter)' }} />
);

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isGameActive } = useGame();

  const tabs = [
    { id: "total", label: "You", icon: Target, path: "/" },
    { id: "group", label: "Group", icon: Users, path: "/group" },
    { id: "daily", label: "Push", icon: MuscleIcon, path: "/daily" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 safe-bottom transition-opacity ${isGameActive ? "pointer-events-none opacity-50" : ""}`}>
      <div className="nav-pill px-2 py-2 flex items-center gap-1 shadow-2xl shadow-background/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 ${
                active
                  ? "bg-[#0ABAB5]/15 text-[#0ABAB5] border border-[#0ABAB5] shadow-lg shadow-[#0ABAB5]/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              {active && (
                <span className="text-sm font-semibold animate-fade-in">
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
