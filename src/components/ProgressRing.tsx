import { useState, useEffect, useId } from "react";
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
  strokeWidth = 3,
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
  const uid = useId().replace(/:/g, '');
  const flamePad = strokeWidth * 22;

  useEffect(() => {
    setIsGameActive(showGame);
  }, [showGame, setIsGameActive]);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Cap each tier at 100%
  const baseProgress = Math.min(progress, 100);
  const tier2Progress = progress > 100 ? Math.min(progress - 100, 100) : 0;
  const tier3Progress = progress > 200 ? Math.min(progress - 200, 100) : 0;
  const tier4Progress = progress > 300 ? Math.min(progress - 300, 100) : 0;
  const tier5Progress = progress > 400 ? Math.min(progress - 400, 100) : 0;

  const baseOffset = circumference - baseProgress / 100 * circumference;
  const tier2Offset = circumference - tier2Progress / 100 * circumference;
  const tier3Offset = circumference - tier3Progress / 100 * circumference;
  const tier4Offset = circumference - tier4Progress / 100 * circumference;
  const tier5Offset = circumference - tier5Progress / 100 * circumference;

  // Arc path for tier 5 mask. The parent <svg> has CSS `-rotate-90`, which also
  // rotates the mask output. So we draw the arc starting at 3 o'clock going
  // clockwise in user space; after the -90deg CSS rotation it visually starts
  // exactly at 12 o'clock and grows clockwise, matching the other progress rings.
  const tier5MaskPath = (() => {
    const cx = size / 2;
    const cy = size / 2;
    const r = radius;
    const frac = tier5Progress / 100;
    if (frac <= 0) return '';
    if (frac >= 0.999) {
      return `M ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
    }
    const theta = 2 * Math.PI * frac;
    const endX = cx + r * Math.cos(theta);
    const endY = cy + r * Math.sin(theta);
    const largeArc = frac > 0.5 ? 1 : 0;
    return `M ${cx + r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`;
  })();


  const baseColor = 'hsl(var(--primary))';
  const tier2Color = '#4300FF';
  const tier3Color = '#C029DE';
  const tier4Color = '#FF2C2C';
  const tier2ColorSoft = 'rgba(67, 0, 255, 0.9)';
  const tier3ColorSoft = 'rgba(192, 41, 222, 0.9)';
  const tier4ColorSoft = 'rgba(255, 44, 44, 0.9)';
  const tier5ColorSoft = 'rgba(255, 140, 0, 0.95)';


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

        <svg className="transform -rotate-90 overflow-visible" width={size} height={size}>
          <defs>
            {/* Soft outer bloom */}
            <filter id={`bloom-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={strokeWidth * 0.9} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Inner highlight along the stroke for a lit/glassy look */}
            <linearGradient id={`sheen-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
            </linearGradient>
            {/* Flame body gradient: deep red -> orange -> yellow -> white-hot core */}
            <radialGradient id={`flameBody-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF2C2C" stopOpacity="0" />
              <stop offset="86%" stopColor="#FF2C2C" stopOpacity="0" />
              <stop offset="92%" stopColor="#FF6A00" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#7A0000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`flameCore-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF6B0">
                <animate attributeName="stop-color" values="#FFF6B0;#FFE066;#FFB000;#FFF6B0" dur="0.9s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#FFB000">
                <animate attributeName="stop-color" values="#FFB000;#FF6A00;#FFE066;#FFB000" dur="0.9s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#FF6A00">
                <animate attributeName="stop-color" values="#FF6A00;#FF2C2C;#FFB000;#FF6A00" dur="0.9s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            {/* Tight flame warp - inner crackle */}
            <filter id={`flameWarp-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
              <feTurbulence type="fractalNoise" baseFrequency="0.03 0.09" numOctaves="3" seed="3" result="noise">
                <animate attributeName="baseFrequency" dur="2.2s" values="0.03 0.09;0.04 0.13;0.03 0.09" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={strokeWidth * 3.2} xChannelSelector="R" yChannelSelector="G" />
            </filter>
            {/* Big tongue warp - large licking flames extending outward */}
            <filter id={`flameWarpBig-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
              <feTurbulence type="fractalNoise" baseFrequency="0.008 0.022" numOctaves="3" seed="7" result="noise">
                <animate attributeName="baseFrequency" dur="1.6s" values="0.008 0.022;0.015 0.04;0.008 0.022" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={strokeWidth * 10} xChannelSelector="R" yChannelSelector="G" result="warped" />
              <feGaussianBlur in="warped" stdDeviation={strokeWidth * 0.6} />
            </filter>
            {/* Mask: confines flame to the progress arc — wide so tongues extend outward */}
              {tier5Progress > 0 && (
                <mask id={`tier5Mask-${uid}`} maskUnits="userSpaceOnUse" x={-flamePad} y={-flamePad} width={size + flamePad * 2} height={size + flamePad * 2}>
                  <rect x={-flamePad} y={-flamePad} width={size + flamePad * 2} height={size + flamePad * 2} fill="black" />
                  <path
                    d={tier5MaskPath}
                    fill="none"
                    stroke="white"
                    strokeWidth={strokeWidth * 12}
                    strokeLinecap="butt"
                  />
                </mask>
              )}
          </defs>



          {/* Background ring - recessed channel */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1a1d24"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#3B404F"
            strokeWidth={Math.max(1, strokeWidth - 2)}
            opacity={0.6}
          />

          {/* Base progress - outer bloom layer */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={baseColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={baseOffset}
            className="transition-all duration-700 ease-out"
            style={{
              opacity: 0.55,
              filter: `blur(${strokeWidth * 0.6}px) drop-shadow(0 0 ${strokeWidth * 1.4}px hsl(var(--primary) / 0.9))`,
            }}
          />
          {/* Base progress - bright core */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={baseColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={baseOffset}
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 ${strokeWidth * 0.6}px hsl(var(--primary) / 0.8))`,
            }}
          />
          {/* Base progress - lit sheen highlight */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#sheen-${uid})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={baseOffset}
            className="transition-all duration-700 ease-out pointer-events-none"
            style={{ mixBlendMode: 'overlay', opacity: 0.85 }}
          />

          {/* Tier 2 ring - 101-200% */}
          {tier2Progress > 0 && (
            <>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={tier2Color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={tier2Offset}
                className="transition-all duration-700 ease-out"
                style={{
                  opacity: 0.6,
                  filter: `blur(${strokeWidth * 0.6}px) drop-shadow(0 0 ${strokeWidth * 1.4}px ${tier2ColorSoft})`,
                }}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={tier2Color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={tier2Offset}
                className="transition-all duration-700 ease-out"
                style={{
                  filter: `drop-shadow(0 0 ${strokeWidth * 0.6}px ${tier2ColorSoft})`,
                }}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={`url(#sheen-${uid})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={tier2Offset}
                className="transition-all duration-700 ease-out pointer-events-none"
                style={{ mixBlendMode: 'overlay', opacity: 0.85 }}
              />
            </>
          )}

          {/* Tier 3 ring - 201-300% */}
          {tier3Progress > 0 && (
            <>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={tier3Color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={tier3Offset}
                className="transition-all duration-700 ease-out"
                style={{
                  opacity: 0.6,
                  filter: `blur(${strokeWidth * 0.6}px) drop-shadow(0 0 ${strokeWidth * 1.4}px ${tier3ColorSoft})`,
                }}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={tier3Color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={tier3Offset}
                className="transition-all duration-700 ease-out"
                style={{
                  filter: `drop-shadow(0 0 ${strokeWidth * 0.6}px ${tier3ColorSoft})`,
                }}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={`url(#sheen-${uid})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={tier3Offset}
                className="transition-all duration-700 ease-out pointer-events-none"
                style={{ mixBlendMode: 'overlay', opacity: 0.85 }}
              />
            </>
          )}

          {/* Tier 4 ring - >=301% */}
          {tier4Progress > 0 && (
            <>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={tier4Color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={tier4Offset}
                className="transition-all duration-700 ease-out"
                style={{
                  opacity: 0.6,
                  filter: `blur(${strokeWidth * 0.6}px) drop-shadow(0 0 ${strokeWidth * 1.4}px ${tier4ColorSoft})`,
                }}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={tier4Color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={tier4Offset}
                className="transition-all duration-700 ease-out"
                style={{
                  filter: `drop-shadow(0 0 ${strokeWidth * 0.6}px ${tier4ColorSoft})`,
                }}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={`url(#sheen-${uid})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={tier4Offset}
                className="transition-all duration-700 ease-out pointer-events-none"
                style={{ mixBlendMode: 'overlay', opacity: 0.85 }}
              />
            </>
          )}

          {/* Tier 5 ring - 401-500%: layered flame ring with outward tongues */}
          {tier5Progress > 0 && (
            <g mask={`url(#tier5Mask-${uid})`}>


              {/* Deep red outer tongues - large, irregular, lick outward */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#C81A00"
                strokeWidth={strokeWidth * 3.2}
                strokeLinecap="round"
                strokeDasharray={`${strokeWidth * 3} ${strokeWidth * 1.4} ${strokeWidth * 5} ${strokeWidth * 1.8} ${strokeWidth * 2} ${strokeWidth * 2.6}`}
                strokeDashoffset={tier5Offset}
                className="pointer-events-none"
                style={{
                  filter: `url(#flameWarpBig-${uid}) drop-shadow(0 0 ${strokeWidth * 2.4}px rgba(255,40,0,0.9))`,
                  opacity: 0.75,
                  mixBlendMode: 'screen',
                }}
              >
                <animate attributeName="stroke-dashoffset" values={`${tier5Offset};${tier5Offset - 22};${tier5Offset + 10};${tier5Offset}`} dur="1.3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.55;0.9;0.6;0.85;0.55" dur="1.1s" repeatCount="indefinite" />
              </circle>

              {/* Orange flame body - main tongues */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#FF6A1F"
                strokeWidth={strokeWidth * 2.2}
                strokeLinecap="round"
                strokeDasharray={`${strokeWidth * 2.4} ${strokeWidth * 0.9} ${strokeWidth * 1.2} ${strokeWidth * 1.6} ${strokeWidth * 3.4} ${strokeWidth * 1.1}`}
                strokeDashoffset={tier5Offset}
                className="pointer-events-none"
                style={{
                  filter: `url(#flameWarpBig-${uid}) drop-shadow(0 0 ${strokeWidth * 1.6}px rgba(255,120,0,0.95))`,
                  opacity: 0.95,
                  mixBlendMode: 'screen',
                }}
              >
                <animate attributeName="stroke-dashoffset" values={`${tier5Offset};${tier5Offset - 18};${tier5Offset + 6};${tier5Offset}`} dur="0.85s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.75;1;0.8;0.95;0.75" dur="0.6s" repeatCount="indefinite" />
              </circle>

              {/* Yellow tongues - bright crackle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#FFC04A"
                strokeWidth={strokeWidth * 1.2}
                strokeLinecap="round"
                strokeDasharray={`${strokeWidth * 1.4} ${strokeWidth * 1.1} ${strokeWidth * 0.4} ${strokeWidth * 1.7} ${strokeWidth * 2.2} ${strokeWidth * 0.9}`}
                strokeDashoffset={tier5Offset}
                className="pointer-events-none"
                style={{
                  filter: `url(#flameWarp-${uid}) drop-shadow(0 0 ${strokeWidth * 0.8}px rgba(255,200,80,0.95))`,
                  mixBlendMode: 'screen',
                }}
              >
                <animate attributeName="stroke-dashoffset" values={`${tier5Offset};${tier5Offset - 14};${tier5Offset + 8};${tier5Offset}`} dur="0.45s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;1;0.7;0.95;0.6" dur="0.35s" repeatCount="indefinite" />
              </circle>

              {/* White-hot core - the lit base ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={`url(#flameCore-${uid})`}
                strokeWidth={Math.max(1.5, strokeWidth * 0.5)}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={tier5Offset}
                className="transition-all duration-700 ease-out pointer-events-none"
                style={{
                  filter: `drop-shadow(0 0 ${strokeWidth * 0.5}px #FFE066) drop-shadow(0 0 ${strokeWidth * 1.2}px rgba(255,180,0,0.9))`,
                }}
              />

              {/* Embers/sparks streaming outward */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#FFF0B0"
                strokeWidth={Math.max(1, strokeWidth * 0.35)}
                strokeLinecap="round"
                strokeDasharray={`${strokeWidth * 0.25} ${strokeWidth * 4}`}
                strokeDashoffset={tier5Offset}
                className="pointer-events-none"
                style={{
                  filter: `url(#flameWarpBig-${uid})`,
                  mixBlendMode: 'screen',
                }}
              >
                <animate attributeName="stroke-dashoffset" values={`${tier5Offset};${tier5Offset - 80}`} dur="1.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;1;0.4;0.9;0.3" dur="0.5s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

        </svg>

        <div
          className={`absolute inset-0 flex items-center justify-center rounded-full overflow-hidden ${enableSunReflection ? 'sun-reflection' : ''}`}
          style={enableGlow ? {
            filter: 'drop-shadow(0 0 12px #BA25D8) drop-shadow(0 0 24px rgba(186, 37, 216, 0.4))'
          } : undefined}>

          {/* Physical haptic button face - translucent glass */}
          <div
            className="relative flex items-center justify-center rounded-full transition-all duration-150 ease-out active:translate-y-[1px] active:scale-[0.98]"
            style={{
              width: `calc(100% - ${strokeWidth * 2 + 4}px)`,
              height: `calc(100% - ${strokeWidth * 2 + 4}px)`,
              transform: isPulsing ? 'translateY(1.5px) scale(0.97)' : undefined,
              background:
                'radial-gradient(circle at 50% 55%, rgba(42,47,58,0.55) 0%, rgba(31,36,46,0.45) 60%, rgba(22,26,34,0.35) 100%)',
              backdropFilter: 'blur(6px) saturate(1.2)',
              WebkitBackdropFilter: 'blur(6px) saturate(1.2)',
              boxShadow: isPulsing
                ? [
                    'inset 0 3px 8px rgba(0,0,0,0.5)',
                    'inset 0 -1px 2px rgba(255,255,255,0.06)',
                    'inset 0 0 0 1px rgba(255,255,255,0.08)',
                  ].join(', ')
                : [
                    'inset 0 2px 4px rgba(0,0,0,0.55)',
                    'inset 0 -1px 2px rgba(255,255,255,0.07)',
                    'inset 0 0 0 1px rgba(255,255,255,0.06)',
                    '0 2px 6px rgba(0,0,0,0.3)',
                    '0 6px 14px rgba(0,0,0,0.25)',
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

            {/* "Push it" label - light gray */}
            <span
              className="pointer-events-none select-none uppercase"
              style={{
                fontFamily: '"Poppins", "Helvetica Neue", Inter, system-ui, sans-serif',
                fontSize: `${Math.max(10, size * 0.11)}px`,
                fontWeight: 900,
                letterSpacing: '0.18em',
                color: 'hsl(0 0% 85%)',
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