import { Calendar, BarChart3, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: "daily", label: "Daily", icon: Calendar, path: "/" },
    { id: "total", label: "Total", icon: BarChart3, path: "/total" },
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 safe-bottom">
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
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
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
