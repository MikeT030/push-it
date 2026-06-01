import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

const RINGS = [
  { r: 73, color: "#0ABAB5", delay: 0 },
  { r: 53, color: "#4300FF", delay: 0.3 },
  { r: 33, color: "#C029DE", delay: 0.6 },
  { r: 13, color: "#FF2C2C", delay: 0.9 },
];

const DURATION = 1.6; // seconds per ring
const TOTAL = DURATION + RINGS[RINGS.length - 1].delay; // last ring finishes

const MORPH_MS = 900;
const FADE_MS = 500;

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isMorphing, setIsMorphing] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const totalMs = TOTAL * 1000;
    const t1 = setTimeout(() => setIsMorphing(true), totalMs);
    // Reveal auth content once the image has reached its final position
    const t2 = setTimeout(() => {
      sessionStorage.setItem("splashShown", "true");
      setIsFadingOut(true);
    }, totalMs + MORPH_MS);
    const t3 = setTimeout(onComplete, totalMs + MORPH_MS + FADE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);


  return (
    <div
      style={{
        backgroundImage: isFadingOut
          ? undefined
          : `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.14 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"), radial-gradient(ellipse at top left, #0C2544 0%, #101214 90%)`,
        backgroundColor: isFadingOut ? "transparent" : "#101214",
        backgroundAttachment: "fixed",
        transition: `opacity ${FADE_MS}ms ease-out, background-color ${FADE_MS}ms ease-out`,
        opacity: isFadingOut ? 0 : 1,
        pointerEvents: isFadingOut ? "none" : "auto",
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
    >
      <style>{`
        @keyframes splash-ring-fill {
          from { stroke-dashoffset: var(--circumference); }
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      <div
        className="relative w-40 h-40 flex items-center justify-center mb-8"
        style={{
          transition: `transform ${MORPH_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          transform: isMorphing
            ? "translateY(-180px) scale(0.5)"
            : "translateY(0) scale(1)",
        }}
      >
        <svg
          width="160"
          height="160"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: "rotate(-90deg)" }}
        >
          {RINGS.map(({ r, color, delay }) => {
            const c = 2 * Math.PI * r;
            return (
              <circle
                key={r}
                cx="80"
                cy="80"
                r={r}
                stroke={color}
                strokeWidth={14}
                strokeLinecap="butt"
                style={{
                  // @ts-ignore CSS custom property
                  "--circumference": c,
                  strokeDasharray: c,
                  strokeDashoffset: c,
                  animation: `splash-ring-fill ${DURATION}s ease-out ${delay}s forwards`,
                }}
              />
            );
          })}
        </svg>
      </div>

      <div
        style={{
          transition: `opacity ${MORPH_MS}ms ease-out`,
          opacity: isMorphing ? 0 : 1,
        }}
      >
        <h1 className="text-5xl font-black tracking-tight text-foreground text-center">Push-it</h1>
        <p className="mt-3 text-muted-foreground text-lg font-medium text-center">30k push-up challenge</p>
      </div>
    </div>
  );
};

export default SplashScreen;
