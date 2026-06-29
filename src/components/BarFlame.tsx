import { useMemo } from "react";

interface BarFlameProps {
  orientation?: "vertical" | "horizontal";
  size?: number; // px on the long axis
}

/**
 * Small animated flame, matching the >=401% flame on ProgressRing.
 * Used as an overlay on bar tips when a bar reaches the flame tier.
 */
const BarFlame = ({ orientation = "vertical", size = 28 }: BarFlameProps) => {
  const uid = useMemo(() => Math.random().toString(36).slice(2, 9), []);
  const long = size;
  const short = Math.round(size * 0.75);
  const w = orientation === "vertical" ? short : long;
  const h = orientation === "vertical" ? long : short;
  const vbW = 24;
  const vbH = 32;

  return (
    <svg
      width={w}
      height={h}
      viewBox={orientation === "vertical" ? `0 0 ${vbW} ${vbH}` : `0 0 ${vbH} ${vbW}`}
      className="pointer-events-none overflow-visible"
      style={{
        transform: orientation === "horizontal" ? "rotate(-90deg)" : undefined,
        transformOrigin: "center",
      }}
    >
      <defs>
        <filter id={`bfWarp-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 0.09" numOctaves="2" seed="4">
            <animate
              attributeName="baseFrequency"
              values="0.04 0.09;0.06 0.12;0.04 0.09"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="5" />
        </filter>
        <radialGradient id={`bfBody-${uid}`} cx="50%" cy="68%" r="55%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="25%" stopColor="#FFD24A" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#FF6A00" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FF2C2C" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`bfHalo-${uid}`} cx="50%" cy="70%" r="60%">
          <stop offset="0%" stopColor="#FF6A00" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FF2C2C" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Halo */}
      <ellipse cx="12" cy="22" rx="11" ry="14" fill={`url(#bfHalo-${uid})`}>
        <animate attributeName="ry" values="13;15;13" dur="1.2s" repeatCount="indefinite" />
      </ellipse>

      {/* Main tongue */}
      <path
        d="M12 32 C 4 24, 6 14, 12 2 C 18 14, 20 24, 12 32 Z"
        fill={`url(#bfBody-${uid})`}
        filter={`url(#bfWarp-${uid})`}
      >
        <animate
          attributeName="d"
          values="M12 32 C 4 24, 6 14, 12 2 C 18 14, 20 24, 12 32 Z;
                  M12 32 C 5 23, 7 13, 12 4 C 17 13, 19 23, 12 32 Z;
                  M12 32 C 4 24, 6 14, 12 2 C 18 14, 20 24, 12 32 Z"
          dur="0.8s"
          repeatCount="indefinite"
        />
      </path>

      {/* White-hot core */}
      <ellipse cx="12" cy="24" rx="2.6" ry="4.4" fill="#FFFFFF" opacity="0.9">
        <animate attributeName="ry" values="3.5;5;3.5" dur="0.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;1;0.7" dur="0.6s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
};

export default BarFlame;
