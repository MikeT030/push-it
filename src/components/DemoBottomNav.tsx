import { useState } from "react";
import { Users } from "lucide-react";

const MuscleIcon = ({ className }: { className?: string; strokeWidth?: number }) => (
  <span className={className} style={{ display: 'inline-flex' }} dangerouslySetInnerHTML={{
    __html: `<svg width="30" height="30" viewBox="0 0 96 86" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M26.836 85.328C26.532 85.328 26.228 85.248 25.94 85.108C18.14 81.2 0 67.188 0 21.232C0 9.084 10.524 0 19.928 0C21.468 0 22.956 0.24 24.36 0.704C30.212 2.652 32.824 10.072 31.896 15.824C30.856 22.232 25.792 25.576 19.168 23.876C19.052 29.4 23.364 35.144 27.556 40.732C29.604 43.468 31.592 46.116 33 48.704C35.328 41.688 39.276 35.228 55.96 34.78C56.808 25.208 63.828 16.124 76.5 16.124C83.056 16.124 88.884 19.192 92.488 24.524C96.604 30.608 97.112 38.728 93.88 46.808C90.796 52.988 85.26 56.3 81.436 57.16C80.084 64.956 70.776 79.068 61.612 82.112C56.648 83.768 50.176 83.768 43.908 83.768C37.964 83.768 31.816 83.768 27.468 85.212C27.264 85.296 27.052 85.328 26.836 85.328ZM19.932 4.012C12.564 4.012 4.004 11.536 4.004 21.244C4.004 63.576 19.576 77.124 27.036 81.18C31.88 79.772 37.988 79.772 43.912 79.772C49.856 79.772 56 79.764 60.348 78.328C68.764 75.524 77.604 60.648 77.604 55.392C77.604 54.292 78.5 53.392 79.604 53.392C81.808 53.392 87.368 50.916 90.232 45.18C92.9 38.504 92.54 31.74 89.172 26.772C86.32 22.548 81.704 20.14 76.496 20.14C65.076 20.14 59.872 28.748 59.872 36.756C59.872 37.856 58.972 38.756 57.872 38.756C40.08 38.756 38.244 44.96 35.92 52.828C35.608 53.884 35.292 54.944 34.932 56.024C34.62 56.944 33.672 57.524 32.716 57.36C31.748 57.204 31.036 56.368 31.036 55.392C31.036 52.072 27.784 47.736 24.344 43.144C19.292 36.396 13.568 28.772 15.572 20.748C15.716 20.18 16.084 19.716 16.6 19.452C17.112 19.196 17.716 19.156 18.252 19.372C19.852 20.012 21.312 20.336 22.576 20.336C26.508 20.336 27.628 17.104 27.94 15.184C28.6 11.112 26.772 5.732 23.088 4.5C22.104 4.184 21.044 4.012 19.932 4.012Z" fill="currentColor"/></svg>`
  }} />
);

/**
 * Sandbox copy of BottomNav. Edit freely to iterate on the design.
 * Not wired to react-router — uses local state for the active tab.
 */
const DemoBottomNav = () => {
  const tabs = [
    { id: "total", label: "You Push", icon: MuscleIcon },
    { id: "group", label: "We Push", icon: Users },
  ];

  const [activeId, setActiveId] = useState("total");

  return (
    <div className="relative w-full">
      <div className="nav-bar p-3 flex items-stretch justify-between gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeId === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveId(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-2 py-[9px] rounded-2xl transition-all duration-300 backdrop-blur-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-2px_4px_rgba(0,0,0,0.35),0_8px_24px_rgba(0,0,0,0.45)] active:translate-y-[1px] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.4)] ${
                active
                  ? "text-[#0ABAB5] border-[#0ABAB5]/70 bg-gradient-to-b from-white/10 to-white/[0.02]"
                  : "text-foreground border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.01] hover:from-white/10"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className="font-semibold text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DemoBottomNav;
