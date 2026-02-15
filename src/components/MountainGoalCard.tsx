import { useMemo } from "react";

interface MountainGoalCardProps {
  remaining: number;
  yearProgress: number;
  daysElapsed: number;
  year: number;
}

const MountainGoalCard = ({ remaining, yearProgress, daysElapsed, year }: MountainGoalCardProps) => {
  const mountainId = useMemo(() => `mountain-clip-${Math.random().toString(36).slice(2)}`, []);
  const gradientId = useMemo(() => `mountain-gradient-${Math.random().toString(36).slice(2)}`, []);

  // Mountain path - a rugged hill silhouette rising from bottom-left to a peak at top-right
  const mountainPath = "M0,300 L0,280 Q20,270 40,260 L60,240 Q80,230 90,210 L110,200 Q130,195 140,180 L160,170 Q170,155 180,150 L200,130 Q210,120 220,115 L240,100 Q260,85 270,75 L290,60 Q300,50 310,40 L320,25 Q325,18 330,12 L335,8 Q338,5 340,3 L342,2 L345,8 Q348,15 350,20 L355,35 Q358,45 360,55 L360,300 Z";

  // Fill width: progress fills from left to right
  const fillWidth = (yearProgress / 100) * 360;

  return (
    <div className="col-span-2 bg-card rounded-2xl p-6 pb-4 animate-slide-up overflow-hidden" style={{ animationDelay: "0.4s" }}>
      {/* Text content */}
      <div className="relative z-10">
        <h2 className="text-lg font-bold text-foreground mb-4">
          Personal Goal {year}
        </h2>
        <div className="h-px mb-4 bg-[#3b404f]" />
        <p className="text-4xl font-black text-foreground">
          {remaining.toLocaleString("de-DE")}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          PU remaining
        </p>
      </div>

      {/* Mountain SVG */}
      <div className="mt-4 -mx-6 -mb-0">
        <svg
          viewBox="0 0 360 300"
          preserveAspectRatio="none"
          className="w-full h-[220px]"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ABAB5" />
              <stop offset="50%" stopColor="#7036FF" />
              <stop offset="100%" stopColor="#C029DE" />
            </linearGradient>
            <clipPath id={mountainId}>
              <path d={mountainPath} />
            </clipPath>
          </defs>

          <path
            d={mountainPath}
            fill="none"
            stroke="hsl(var(--muted-foreground) / 0.25)"
            strokeWidth="1.5"
          />

          <rect
            x="0"
            y="0"
            width={fillWidth}
            height="300"
            fill={`url(#${gradientId})`}
            opacity="0.8"
            clipPath={`url(#${mountainId})`}
            className="transition-all duration-1000"
          />
        </svg>
      </div>

      {/* Footer */}
      <p className="text-sm text-muted-foreground text-center pt-2">
        Day {daysElapsed} of 365
      </p>
    </div>
  );
};

export default MountainGoalCard;
