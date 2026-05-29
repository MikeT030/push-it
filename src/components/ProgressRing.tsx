import { useState, useEffect } from "react";
import BrickBreakerGame from "./BrickBreakerGame";
import { useGame } from "@/contexts/GameContext";

interface ProgressRingProps {
  progress: number; // 0 to 100+
  size?: number;
  strokeWidth?: number;
  className?: string;
  enableGame?: boolean;
  enableAnimation?: boolean;
  enableGlow?: boolean;
  enableSunReflection?: boolean;
  enableOuterGlow?: boolean;
  topBadge?: React.ReactNode;
}

const ProgressRing = ({
  progress,
  size = 120,
  strokeWidth = 12,
  className = "",
  enableGame = false,
  enableAnimation = true,
  enableGlow = false,
  enableSunReflection = false,
  enableOuterGlow = false,
  topBadge
}: ProgressRingProps) => {
  const [showGame, setShowGame] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const { setIsGameActive } = useGame();

  useEffect(() => {
    setIsGameActive(showGame);
  }, [showGame, setIsGameActive]);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Cap base progress at 100%, calculate overflow
  const baseProgress = Math.min(progress, 100);
  const overflowProgress = progress > 100 ? Math.min(progress - 100, 100) : 0;

  const baseOffset = circumference - baseProgress / 100 * circumference;
  const overflowOffset = circumference - overflowProgress / 100 * circumference;

  return (
    <>
      <div
        className={`relative ${enableGame ? 'cursor-pointer' : ''} ${className}`}
        style={{
          width: size,
          height: size,
        }}
        onClick={() => {
          setIsPulsing(true);
          setTimeout(() => setIsPulsing(false), 180);
          if (enableGame) setShowGame(true);
        }}>

        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#3B404F"
            strokeWidth={strokeWidth} />

          {/* Base progress ring (green/primary) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={baseOffset}
            className="transition-all duration-700 ease-out"
            style={{
              filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))"
            }} />

          {/* Overflow ring - only visible when > 100% */}
          {overflowProgress > 0 &&
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={progress >= 200 ? '#C029DE' : '#7036FF'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={overflowOffset}
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${progress >= 200 ? 'rgba(192, 41, 222, 0.5)' : 'rgba(112, 54, 255, 0.5)'})`
            }} />

          }
        </svg>
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-full overflow-hidden ${enableSunReflection ? 'sun-reflection' : ''}`}
          style={enableGlow ? {
            filter: 'drop-shadow(0 0 12px #BA25D8) drop-shadow(0 0 24px rgba(186, 37, 216, 0.4))'
          } : undefined}>

          {/* Physical haptic button face - flat matte dark */}
          <div
            className="relative flex items-center justify-center rounded-full transition-all duration-150 ease-out active:translate-y-[1px] active:scale-[0.98]"
            style={{
              width: `calc(100% - ${strokeWidth * 2 + 4}px)`,
              height: `calc(100% - ${strokeWidth * 2 + 4}px)`,
              transform: isPulsing ? 'translateY(1.5px) scale(0.97)' : undefined,
              background:
                'radial-gradient(circle at 50% 55%, #2a2f3a 0%, #1f242e 60%, #161a22 100%)',
              boxShadow: isPulsing
                ? [
                    'inset 0 3px 8px rgba(0,0,0,0.7)',
                    'inset 0 -1px 2px rgba(255,255,255,0.04)',
                    'inset 0 0 0 1px rgba(0,0,0,0.6)',
                  ].join(', ')
                : [
                    'inset 0 2px 4px rgba(0,0,0,0.8)',
                    'inset 0 -1px 2px rgba(255,255,255,0.05)',
                    'inset 0 0 0 1px rgba(0,0,0,0.5)',
                    '0 2px 6px rgba(0,0,0,0.45)',
                    '0 6px 14px rgba(0,0,0,0.35)',
                  ].join(', '),
            }}
          >
            {/* Very subtle top sheen - matte, not glossy */}
            <div
              className="pointer-events-none absolute inset-x-[18%] top-[10%] h-[8%] rounded-full opacity-30"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)',
                filter: 'blur(3px)',
              }}
            />

            {/* "Push it" label - primary color at 60% opacity */}
            <span
              className="pointer-events-none select-none uppercase"
              style={{
                fontFamily: '"Helvetica Neue", Inter, system-ui, sans-serif',
                fontSize: `${Math.max(10, size * 0.11)}px`,
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: 'hsl(var(--primary) / 0.6)',
              }}
            >
              Push it
            </span>
          </div>

        </div>


      </div>
      
      <BrickBreakerGame isOpen={showGame} onClose={() => setShowGame(false)} />
    </>);

};

export default ProgressRing;