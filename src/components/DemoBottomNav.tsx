import { useState } from "react";

const MuscleIcon = ({ className, fill = "#0ABAB5" }: { className?: string; strokeWidth?: number; fill?: string }) => (
  <span className={className}>
    <svg viewBox="0 0 96 86" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path fillRule="evenodd" clipRule="evenodd" d="M26.836 85.328C26.532 85.328 26.228 85.248 25.94 85.108C18.14 81.2 0 67.188 0 21.232C0 9.084 10.524 0 19.928 0C21.468 0 22.956 0.24 24.36 0.704C30.212 2.652 32.824 10.072 31.896 15.824C30.856 22.232 25.792 25.576 19.168 23.876C19.052 29.4 23.364 35.144 27.556 40.732C29.604 43.468 31.592 46.116 33 48.704C35.328 41.688 39.276 35.228 55.96 34.78C56.808 25.208 63.828 16.124 76.5 16.124C83.056 16.124 88.884 19.192 92.488 24.524C96.604 30.608 97.112 38.728 93.88 46.808C90.796 52.988 85.26 56.3 81.436 57.16C80.084 64.956 70.776 79.068 61.612 82.112C56.648 83.768 50.176 83.768 43.908 83.768C37.964 83.768 31.816 83.768 27.468 85.212C27.264 85.296 27.052 85.328 26.836 85.328Z" fill={fill}/>
    </svg>
  </span>
);

const GroupSportsIcon = ({ className }: { className?: string; strokeWidth?: number }) => (
  <span className={className}>
    <svg viewBox="0 0 77 79" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M38.5 16C42.9183 16 46.5 12.4183 46.5 8C46.5 3.58172 42.9183 0 38.5 0C34.0817 0 30.5 3.58172 30.5 8C30.5 12.4183 34.0817 16 38.5 16Z"/>
      <path d="M14.5999 26.4004C19.0181 26.4004 22.5999 22.8187 22.5999 18.4004C22.5999 13.9821 19.0181 10.4004 14.5999 10.4004C10.1816 10.4004 6.59985 13.9821 6.59985 18.4004C6.59985 22.8187 10.1816 26.4004 14.5999 26.4004Z"/>
      <path d="M61.8999 26.4004C66.3182 26.4004 69.8999 22.8187 69.8999 18.4004C69.8999 13.9821 66.3182 10.4004 61.8999 10.4004C57.4816 10.4004 53.8999 13.9821 53.8999 18.4004C53.8999 22.8187 57.4816 26.4004 61.8999 26.4004Z"/>
      <path d="M68.5 29.1998H55.2C50.8 29.1998 47.2 32.7998 47.2 37.1998V44.1998C46.1 43.4998 44.9 42.9998 43.7 42.5998V36.1998C43.7 30.8998 47.6 26.3998 52.8 25.6998C51.5 24.0998 50.7 22.2998 50.4 20.2998C50 19.0998 47.7 18.7998 46.1 18.7998H30.8C29.1 18.7998 26.6 18.7998 26.2 20.4998C25.9 22.3998 25.1 24.0998 23.9 25.5998C29.1 26.3998 32.9 30.7998 32.9 36.0998V42.0998C31.6 42.4998 30.3 42.9998 29 43.6998V37.0998C29 32.6998 25.4 29.0998 21 29.0998H8C3.6 29.0998 0 32.6998 0 37.0998V47.6998C0 52.0998 3.6 55.6998 8 55.6998H20.2C17.9 65.4998 24 75.2998 33.8 77.5998C43.6 79.8998 53.4 73.7998 55.7 63.9998C56.3 61.2998 56.3 58.3998 55.7 55.6998H68.5C72.9 55.6998 76.5 52.0998 76.5 47.6998V37.1998C76.4 32.7998 72.9 29.1998 68.5 29.1998ZM37.9 75.8998C29 75.8998 21.9 68.6998 21.9 59.7998C21.9 50.8998 29.1 43.7998 38 43.7998C46.9 43.7998 54 50.9998 54 59.7998C54 68.6998 46.8 75.8998 37.9 75.8998Z"/>
      <path d="M37.9 71.6998C31.3 71.6998 26 66.3998 26 59.7998C26 56.6998 27.2 53.7998 29.3 51.4998C29.6 51.0998 30.1 50.8998 30.5 51.1998C30.9 51.4998 31.1 51.9998 30.8 52.3998C30.7 52.4998 30.7 52.5998 30.6 52.5998C26.7 56.4998 26.8 62.8998 30.7 66.6998C34.6 70.5998 41 70.4998 44.8 66.5998C48.7 62.6998 48.6 56.2998 44.7 52.4998C42.8 50.6998 40.3 49.5998 37.7 49.5998C37.2 49.5998 36.8 49.1998 36.8 48.6998C36.8 48.1998 37.2 47.7998 37.7 47.7998C44.3 47.7998 49.6 53.0998 49.6 59.6998C49.6 66.2998 44.4 71.6998 37.9 71.6998ZM37.9 57.0998C37.4 57.0998 37 56.6998 37 56.1998C37 55.6998 37.4 55.2998 37.9 55.2998C40.4 55.2998 42.5 57.2998 42.5 59.8998C42.5 62.4998 40.5 64.4998 37.9 64.4998C37.4 64.4998 37 64.0998 37 63.5998C37 63.0998 37.4 62.6998 37.9 62.6998C39.4 62.6998 40.6 61.4998 40.6 59.9998C40.6 58.2998 39.4 57.0998 37.9 57.0998ZM44.3 59.7998C44.3 56.2998 41.4 53.3998 37.9 53.3998C37.4 53.3998 37 52.9998 37 52.4998C37 51.9998 37.4 51.5998 37.9 51.5998C42.4 51.5998 46.1 55.2998 46.1 59.7998C46.1 64.2998 42.4 67.9998 37.9 67.9998C33.4 67.9998 29.7 64.2998 29.7 59.7998C29.7 59.2998 30.1 58.8998 30.6 58.8998C31.1 58.8998 31.5 59.2998 31.5 59.7998C31.5 63.2998 34.4 66.1998 37.9 66.1998C41.4 66.1998 44.3 63.3998 44.3 59.7998Z"/>
    </svg>
  </span>
);

/**
 * Sandbox copy of BottomNav. Edge-to-edge glass bar with a vertical
 * divider between the two buttons; buttons feel slightly lifted.
 */
const DemoBottomNav = () => {
  const tabs = [
    { id: "total", label: "You Push", icon: MuscleIcon },
    { id: "group", label: "We Push", icon: GroupSportsIcon },
  ];

  const [activeId, setActiveId] = useState("total");

  return (
    <div className="relative w-full left-1/2 right-1/2 -mx-[50vw] w-screen">
      <div
        className="relative flex items-stretch w-full backdrop-blur-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border-t border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_-8px_24px_rgba(0,0,0,0.45)] pb-[26px] pt-[8px] px-4"
      >
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const active = activeId === tab.id;

          return (
            <div key={tab.id} className="relative flex-1 flex p-2">
              {i > 0 && (
                <span
                  aria-hidden
                  className="absolute left-0 top-3 bottom-3 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent pl-0"
                />
              )}
              <button
                onClick={() => setActiveId(tab.id)}
                className={`flex-1 flex flex-row items-center justify-center gap-2 py-[11px] rounded-2xl border transition-all duration-200 ${
                  active
                    ? "text-[#0ABAB5] border-[#0ABAB5]/70 bg-[#0ABAB5]/10 translate-y-[1px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),inset_0_-1px_0_rgba(255,255,255,0.05)]"
                    : "text-foreground border-transparent bg-transparent shadow-none"
                }`}
              >
                <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
                <span className="font-semibold text-sm">{tab.label}</span>
              </button>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DemoBottomNav;
