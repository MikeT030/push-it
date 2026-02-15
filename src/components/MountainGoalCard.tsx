import { useMemo, useRef, useState, useEffect } from "react";

interface MountainGoalCardProps {
  remaining: number;
  yearProgress: number;
  daysElapsed: number;
  year: number;
}

const MountainGoalCard = ({ remaining, yearProgress, daysElapsed, year }: MountainGoalCardProps) => {
  const mountainId = useMemo(() => `mountain-clip-${Math.random().toString(36).slice(2)}`, []);
  const gradientId = useMemo(() => `mountain-gradient-${Math.random().toString(36).slice(2)}`, []);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [displayCount, setDisplayCount] = useState<number | null>(null);
  const startValue = 30000;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (remaining <= 0) return;
    if (displayCount === null) {
      setDisplayCount(startValue);
      return;
    }
    if (displayCount <= remaining) {
      setDisplayCount(remaining);
      return;
    }
    const diff = displayCount - remaining;
    const step = Math.max(1, Math.floor(diff / 30));
    const timer = setTimeout(() => {
      setDisplayCount(prev => Math.max(remaining, (prev ?? startValue) - step));
    }, 16);
    return () => clearTimeout(timer);
  }, [displayCount, remaining]);

  // Closed path for clipping/filling
  const mountainPath = "M0,300 L0,280 Q20,270 40,260 L60,240 Q80,230 90,210 L110,200 Q130,195 140,180 L160,170 Q170,155 180,150 L200,130 Q210,120 220,115 L240,100 Q260,85 270,75 L290,60 Q300,50 310,40 L320,25 Q325,18 330,12 L335,8 Q338,5 340,3 L342,2 L345,8 Q348,15 350,20 L355,35 Q358,45 360,55 L360,300 Z";
  // Open path for the visible hill outline (no bottom or right edge)
  const hillOutline = "M0,280 Q20,270 40,260 L60,240 Q80,230 90,210 L110,200 Q130,195 140,180 L160,170 Q170,155 180,150 L200,130 Q210,120 220,115 L240,100 Q260,85 270,75 L290,60 Q300,50 310,40 L320,25 Q325,18 330,12 L335,8 Q338,5 340,3 L342,2 L345,8 Q348,15 350,20 L355,35 Q358,45 360,55";

  // Fill width: progress fills from left to right
  const fillWidth = isVisible ? (yearProgress / 100) * 360 : 0;

  return (
    <div ref={cardRef} className="col-span-2 bg-card rounded-2xl p-6 pb-4 animate-slide-up overflow-hidden" style={{ animationDelay: "0.4s" }}>
      {/* Text content */}
      <div className="relative z-10">
        <h2 className="text-lg font-bold text-foreground mb-4">
          Personal Goal {year}
        </h2>
        
        <p className="text-4xl font-black text-foreground">
          {(displayCount ?? startValue).toLocaleString("de-DE")}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          PU remaining
        </p>
      </div>

      {/* Mountain SVG */}
      <div className="mt-0 -mx-6">
        <svg
          viewBox="0 -30 360 330"
          preserveAspectRatio="none"
          className="w-full h-[180px] block"
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
            d={hillOutline}
            fill="none"
            stroke="#0ABAB5"
            strokeWidth="2"
          />

          <text
            x="330"
            y="-8"
            textAnchor="middle"
            fill="white"
            fontSize="20"
            fontWeight="800"
            style={{ fontFamily: "inherit" }}
          >
            30K
          </text>

          <rect
            x="0"
            y="0"
            width={fillWidth}
            height="300"
            fill="#0ABAB5"
            opacity="0.3"
            clipPath={`url(#${mountainId})`}
            style={{ transition: "width 2s ease-out" }}
          />
        </svg>
      </div>

      {/* Footer */}
      <p className="text-sm text-muted-foreground text-center pt-2">
        Day {daysElapsed} of 365 ({yearProgress.toFixed(1)}%)
      </p>
    </div>
  );
};

export default MountainGoalCard;
