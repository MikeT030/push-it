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
        className={`relative ${enableGame ? 'cursor-pointer' : ''} ${isPulsing ? 'animate-click-pulse' : ''} ${className}`}
        style={{
          width: size,
          height: size,
          ...(enableOuterGlow && {
            borderRadius: '50%',
            boxShadow: '0 0 0 2px #BA25D8, 0 4px 20px rgba(186, 37, 216, 0.4)'
          })
        }}
        onClick={() => {
          setIsPulsing(true);
          setTimeout(() => setIsPulsing(false), 500);
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

          {/* Physical button face */}
          <div
            className="relative flex items-center justify-center rounded-full transition-transform duration-150 ease-out active:translate-y-[1px] active:scale-[0.985]"
            style={{
              width: `calc(100% - ${strokeWidth * 2 + 4}px)`,
              height: `calc(100% - ${strokeWidth * 2 + 4}px)`,
              background:
                'radial-gradient(circle at 50% 30%, #2a3142 0%, #1a2030 45%, #0d1220 85%, #080c16 100%)',
              boxShadow: [
                'inset 0 2px 2px rgba(255,255,255,0.18)',
                'inset 0 -3px 6px rgba(0,0,0,0.55)',
                'inset 0 0 0 1px rgba(255,255,255,0.06)',
                '0 6px 14px rgba(0,0,0,0.55)',
                '0 2px 4px rgba(0,0,0,0.4)',
              ].join(', '),
            }}
          >
            {/* Top specular highlight */}
            <div
              className="pointer-events-none absolute inset-x-[12%] top-[6%] h-[34%] rounded-full"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0) 75%)',
                filter: 'blur(1px)',
              }}
            />
            {/* Bottom rim glow */}
            <div
              className="pointer-events-none absolute inset-x-[18%] bottom-[6%] h-[18%] rounded-full opacity-60"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(10,186,181,0.25) 0%, rgba(10,186,181,0) 70%)',
                filter: 'blur(2px)',
              }}
            />
            <span className="relative font-medium text-primary text-lg drop-shadow-[0_1px_0_rgba(0,0,0,0.6)]">
              Push it
            </span>
          </div>
        </div>


      </div>
      
      <BrickBreakerGame isOpen={showGame} onClose={() => setShowGame(false)} />
    </>);

};

export default ProgressRing;