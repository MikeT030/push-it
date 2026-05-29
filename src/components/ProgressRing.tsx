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

          {/* Physical haptic button face - matte with realistic lighting */}
          <div
            className="relative flex items-center justify-center rounded-full transition-all duration-150 ease-out active:translate-y-[1px] active:scale-[0.98] overflow-hidden"
            style={{
              width: `calc(100% - ${strokeWidth * 2 + 4}px)`,
              height: `calc(100% - ${strokeWidth * 2 + 4}px)`,
              transform: isPulsing ? 'translateY(1.5px) scale(0.97)' : undefined,
              background:
                'radial-gradient(circle at 50% 40%, #2f3540 0%, #232834 55%, #161a22 100%)',
              boxShadow: isPulsing
                ? [
                    'inset 0 4px 10px rgba(0,0,0,0.75)',
                    'inset 0 -1px 2px rgba(255,255,255,0.04)',
                    'inset 0 0 0 1px rgba(0,0,0,0.6)',
                  ].join(', ')
                : [
                    // Deep bezel shadow ring (ambient occlusion at the rim)
                    'inset 0 3px 6px rgba(0,0,0,0.85)',
                    'inset 0 -2px 4px rgba(0,0,0,0.5)',
                    // Soft bottom bounce light
                    'inset 0 -6px 14px rgba(120,140,170,0.10)',
                    // Hairline bevel highlight
                    'inset 0 1px 0 rgba(255,255,255,0.06)',
                    'inset 0 0 0 1px rgba(0,0,0,0.55)',
                    // Outer drop
                    '0 2px 6px rgba(0,0,0,0.5)',
                    '0 8px 18px rgba(0,0,0,0.4)',
                  ].join(', '),
            }}
          >
            {/* Top key light - broad soft highlight */}
            <div
              className="pointer-events-none absolute inset-x-[8%] top-[4%] h-[40%] rounded-[50%] opacity-70"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 35%, rgba(255,255,255,0) 70%)',
                filter: 'blur(4px)',
              }}
            />

            {/* Crisp specular sheen at very top */}
            <div
              className="pointer-events-none absolute inset-x-[22%] top-[5%] h-[5%] rounded-full opacity-90"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
                filter: 'blur(1.5px)',
              }}
            />

            {/* Left rim cool light */}
            <div
              className="pointer-events-none absolute left-[2%] top-[15%] w-[18%] h-[70%] opacity-50"
              style={{
                background:
                  'radial-gradient(ellipse at 0% 50%, rgba(140,170,210,0.25) 0%, rgba(140,170,210,0) 70%)',
                filter: 'blur(3px)',
              }}
            />

            {/* Right rim warm light */}
            <div
              className="pointer-events-none absolute right-[2%] top-[20%] w-[18%] h-[65%] opacity-40"
              style={{
                background:
                  'radial-gradient(ellipse at 100% 50%, rgba(220,180,160,0.20) 0%, rgba(220,180,160,0) 70%)',
                filter: 'blur(3px)',
              }}
            />

            {/* Bottom ambient bounce light */}
            <div
              className="pointer-events-none absolute inset-x-[15%] bottom-[3%] h-[25%] rounded-[50%] opacity-55"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 100%, rgba(180,200,230,0.18) 0%, rgba(180,200,230,0) 70%)',
                filter: 'blur(4px)',
              }}
            />

            {/* Inner contact-shadow ring (deepens edge realism) */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                boxShadow:
                  'inset 0 0 18px rgba(0,0,0,0.55), inset 0 0 2px rgba(0,0,0,0.8)',
              }}
            />
          </div>

        </div>


      </div>
      
      <BrickBreakerGame isOpen={showGame} onClose={() => setShowGame(false)} />
    </>);

};

export default ProgressRing;