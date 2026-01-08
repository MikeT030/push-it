import { Target, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import muscleIcon from "@/assets/muscle-icon.svg";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isGameActive } = useGame();

  const tabs = [
    { id: "total", label: "You", icon: Target, path: "/" },
    { id: "group", label: "Group", icon: Users, path: "/group" },
    { id: "push", label: "Push", icon: null, customIcon: muscleIcon, path: "/daily" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 safe-bottom transition-opacity ${isGameActive ? "pointer-events-none opacity-50" : ""}`}>
      <div className="nav-pill px-1.5 py-1.5 flex items-center gap-1 shadow-2xl shadow-background/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center justify-center gap-2 px-[22px] py-2.5 rounded-full transition-all duration-300 whitespace-nowrap ${
                active
                  ? "bg-[#0ABAB5]/15 text-[#0ABAB5] border border-[#0ABAB5] shadow-lg shadow-[#0ABAB5]/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.customIcon ? (
                <img 
                  src={tab.customIcon} 
                  alt={tab.label} 
                  className="w-5 h-5 flex-shrink-0"
                  style={{
                    filter: active 
                      ? 'none' 
                      : 'grayscale(100%) brightness(0.6)'
                  }}
                />
              ) : Icon ? (
                <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={active ? 2.5 : 2} />
              ) : null}
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
