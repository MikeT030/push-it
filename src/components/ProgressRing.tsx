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

          {/* Physical glass button face */}
          <div
            className="relative flex items-center justify-center rounded-full backdrop-blur-xl transition-transform duration-150 ease-out active:translate-y-[1px] active:scale-[0.985]"
            style={{
              width: `calc(100% - ${strokeWidth * 2 + 4}px)`,
              height: `calc(100% - ${strokeWidth * 2 + 4}px)`,
              background:
                'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.18) 55%, rgba(255,255,255,0.10) 90%, rgba(255,255,255,0.14) 100%)',
              boxShadow: [
                'inset 0 2px 4px rgba(255,255,255,0.35)',
                'inset 0 -4px 12px rgba(255,255,255,0.10)',
                'inset 0 0 0 1px rgba(255,255,255,0.18)',
                '0 10px 24px rgba(0,0,0,0.22)',
                '0 4px 10px rgba(0,0,0,0.12)',
              ].join(', '),
            }}
          >
            {/* Top specular highlight */}
            <div
              className="pointer-events-none absolute inset-x-[14%] top-[8%] h-[36%] rounded-full"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 55%, rgba(255,255,255,0) 85%)',
                filter: 'blur(4px)',
              }}
            />
            {/* Bottom rim glow */}
            <div
              className="pointer-events-none absolute inset-x-[22%] bottom-[8%] h-[20%] rounded-full opacity-50"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(10,186,181,0.22) 0%, rgba(10,186,181,0) 75%)',
                filter: 'blur(5px)',
              }}
            />

            <span
              className="relative font-bold text-lg tracking-wider select-none"
              style={{
                color: 'rgba(245, 248, 252, 0.78)',
                textShadow: [
                  // deep inner shadow (top-left) — light catches the upper inside wall
                  '-1px -1px 0 rgba(0,0,0,0.85)',
                  '0 -1px 2px rgba(0,0,0,0.7)',
                  // bright bottom-right highlight — bevel edge catching light
                  '1px 1px 0 rgba(255,255,255,0.18)',
                  '1px 2px 1px rgba(10,186,181,0.35)',
                  '0 2px 3px rgba(255,255,255,0.08)',
                ].join(', '),
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