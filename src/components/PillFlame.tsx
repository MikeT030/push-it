import { useId } from "react";

interface PillFlameProps {
  width: number;
  height: number;
  radius?: number;
  /** Padding around the pill so flame tongues don't get clipped */
  pad?: number;
  /** Border thickness of the pill this flame wraps (so we offset onto the outer edge) */
  borderWidth?: number;
}

/**
 * Flame outline that wraps around a pill/rounded-rect shape.
 * Mirrors the layered animated flame look from ProgressRing (>=401% tier).
 */
const PillFlame = ({ width, height, radius, pad = 14, borderWidth = 2 }: PillFlameProps) => {
  const uid = useId().replace(/:/g, "");
  const r = radius ?? height / 2;

  const W = width + pad * 2;
  const H = height + pad * 2;
  // Pill path inside the padded viewBox
  const x = pad;
  const y = pad;
  const w = width;
  const h = height;
  const pillPath = `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;

  const sw = 2; // base stroke width unit

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="pointer-events-none overflow-visible absolute"
      style={{ left: -(pad + borderWidth), top: -(pad + borderWidth) }}
    >
      <defs>
        <filter id={`pfWarp-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03 0.09" numOctaves="3" seed="3" result="noise">
            <animate attributeName="baseFrequency" dur="2.2s" values="0.03 0.09;0.04 0.13;0.03 0.09" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={sw * 3.2} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`pfWarpBig-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.022" numOctaves="3" seed="7" result="noise">
            <animate attributeName="baseFrequency" dur="1.6s" values="0.008 0.022;0.015 0.04;0.008 0.022" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={sw * 10} xChannelSelector="R" yChannelSelector="G" result="warped" />
          <feGaussianBlur in="warped" stdDeviation={sw * 0.6} />
        </filter>
        <linearGradient id={`pfCore-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
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
      </defs>

      {/* Deep red tongues */}
      <path
        d={pillPath}
        fill="none"
        stroke="#C81A00"
        strokeWidth={sw * 3.2}
        strokeLinecap="round"
        strokeDasharray={`${sw * 3} ${sw * 1.4} ${sw * 5} ${sw * 1.8} ${sw * 2} ${sw * 2.6}`}
        style={{
          filter: `url(#pfWarpBig-${uid}) drop-shadow(0 0 ${sw * 2.4}px rgba(255,40,0,0.9))`,
          opacity: 0.75,
          mixBlendMode: "screen",
        }}
      >
        <animate attributeName="stroke-dashoffset" values="0;-22;10;0" dur="1.3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.55;0.9;0.6;0.85;0.55" dur="1.1s" repeatCount="indefinite" />
      </path>

      {/* Orange main tongues */}
      <path
        d={pillPath}
        fill="none"
        stroke="#FF6A1F"
        strokeWidth={sw * 2.2}
        strokeLinecap="round"
        strokeDasharray={`${sw * 2.4} ${sw * 0.9} ${sw * 1.2} ${sw * 1.6} ${sw * 3.4} ${sw * 1.1}`}
        style={{
          filter: `url(#pfWarpBig-${uid}) drop-shadow(0 0 ${sw * 1.6}px rgba(255,120,0,0.95))`,
          opacity: 0.95,
          mixBlendMode: "screen",
        }}
      >
        <animate attributeName="stroke-dashoffset" values="0;-18;6;0" dur="0.85s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.75;1;0.8;0.95;0.75" dur="0.6s" repeatCount="indefinite" />
      </path>

      {/* Yellow crackle */}
      <path
        d={pillPath}
        fill="none"
        stroke="#FFC04A"
        strokeWidth={sw * 1.2}
        strokeLinecap="round"
        strokeDasharray={`${sw * 1.4} ${sw * 1.1} ${sw * 0.4} ${sw * 1.7} ${sw * 2.2} ${sw * 0.9}`}
        style={{
          filter: `url(#pfWarp-${uid}) drop-shadow(0 0 ${sw * 0.8}px rgba(255,200,80,0.95))`,
          mixBlendMode: "screen",
        }}
      >
        <animate attributeName="stroke-dashoffset" values="0;-14;8;0" dur="0.45s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;1;0.7;0.95;0.6" dur="0.35s" repeatCount="indefinite" />
      </path>

      {/* White-hot core stroke */}
      <path
        d={pillPath}
        fill="none"
        stroke={`url(#pfCore-${uid})`}
        strokeWidth={Math.max(1.2, sw * 0.55)}
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 ${sw * 0.5}px #FFE066) drop-shadow(0 0 ${sw * 1.2}px rgba(255,180,0,0.9))`,
        }}
      />

      {/* Streaming embers */}
      <path
        d={pillPath}
        fill="none"
        stroke="#FFF0B0"
        strokeWidth={Math.max(1, sw * 0.35)}
        strokeLinecap="round"
        strokeDasharray={`${sw * 0.25} ${sw * 4}`}
        style={{
          filter: `url(#pfWarpBig-${uid})`,
          mixBlendMode: "screen",
        }}
      >
        <animate attributeName="stroke-dashoffset" values="0;-80" dur="1.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;1;0.4;0.9;0.3" dur="0.5s" repeatCount="indefinite" />
      </path>
    </svg>
  );
};

export default PillFlame;
