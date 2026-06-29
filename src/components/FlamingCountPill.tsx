import { useLayoutEffect, useRef, useState } from "react";
import PillFlame from "./PillFlame";

interface FlamingCountPillProps {
  count: number;
  colorHex: string | null;
  onFire: boolean;
  animate: boolean;
}

const FlamingCountPill = ({ count, colorHex, onFire, animate }: FlamingCountPillProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setDims({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [count]);

  return (
    <div
      ref={ref}
      className="absolute left-1/2 -translate-x-1/2 -top-3 flex items-center justify-center rounded-full bg-background border-2 shadow-md"
      style={{
        borderColor: onFire ? "#FF2C2C" : colorHex ?? "hsl(var(--muted))",
        minWidth: "26px",
        height: "22px",
        padding: "0 4px",
        opacity: animate ? 1 : 0,
        transform: `translate(-50%, ${animate ? "0" : "6px"})`,
        transition: "opacity 600ms ease 900ms, transform 600ms ease 900ms",
        boxShadow: onFire ? "0 0 14px rgba(255,90,0,0.7)" : undefined,
      }}
    >
      {onFire && dims && <PillFlame width={dims.w} height={dims.h} />}
      <span className="text-[10px] font-bold leading-none text-white relative">
        {count}
      </span>
    </div>
  );
};

export default FlamingCountPill;
