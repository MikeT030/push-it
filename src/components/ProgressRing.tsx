import { useState, useEffect } from "react";
import BrickBreakerGame from "./BrickBreakerGame";
import { useGame } from "@/contexts/GameContext";

interface ProgressRingProps {
  progress: number; // 0 to 100+
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const ProgressRing = ({
  progress,
  size = 120,
  strokeWidth = 12,
  className = "",
}: ProgressRingProps) => {
  const [showGame, setShowGame] = useState(false);
  const { setIsGameActive } = useGame();
  
  useEffect(() => {
    setIsGameActive(showGame);
  }, [showGame, setIsGameActive]);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Cap base progress at 100%, calculate overflow
  const baseProgress = Math.min(progress, 100);
  const overflowProgress = progress > 100 ? Math.min(progress - 100, 100) : 0;
  
  const baseOffset = circumference - (baseProgress / 100) * circumference;
  const overflowOffset = circumference - (overflowProgress / 100) * circumference;

  return (
    <>
      <div 
        className={`relative cursor-pointer ${className}`} 
        style={{ width: size, height: size }}
        onClick={() => setShowGame(true)}
      >
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
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
              filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))",
            }}
          />
          {/* Overflow ring - only visible when > 100% */}
          {overflowProgress > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={progress >= 200 ? '#C029DE' : 'hsl(var(--overflow))'}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={overflowOffset}
              className="transition-all duration-700 ease-out"
              style={{
                filter: `drop-shadow(0 0 8px ${progress >= 200 ? 'rgba(192, 41, 222, 0.5)' : 'hsl(var(--overflow) / 0.5)'})`,
              }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="text-2xl font-bold"
            style={{ color: '#ffffff' }}
          >
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      
      <BrickBreakerGame isOpen={showGame} onClose={() => setShowGame(false)} />
    </>
  );
};

export default ProgressRing;
