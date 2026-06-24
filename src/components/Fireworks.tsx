import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Rocket {
  x: number;
  y: number;
  targetY: number;
  vy: number;
  color: string;
  trail: { x: number; y: number; life: number }[];
}

const COLORS = [
  "#0ABAB5", // teal
  "#7036FF", // purple
  "#C029DE", // magenta
  "#FFD93D", // gold
  "#FF6B6B", // red
  "#4DD0E1", // cyan
  "#FF9F1C", // orange
  "#FFFFFF", // white
];

interface FireworksProps {
  className?: string;
}

const Fireworks = ({ className }: FireworksProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const rockets: Rocket[] = [];
    const particles: Particle[] = [];

    const spawnRocket = () => {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const startX = width * (0.1 + Math.random() * 0.8);
      // Burst between top of canvas and ~25% down
      const targetY = height * (0.02 + Math.random() * 0.3);
      rockets.push({
        x: startX,
        y: height,
        targetY,
        vy: -(6 + Math.random() * 3),
        color,
        trail: [],
      });
    };

    const explode = (x: number, y: number, color: string) => {
      const count = 50 + Math.floor(Math.random() * 40);
      const multiColor = Math.random() < 0.4;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
        const speed = 2 + Math.random() * 4;
        const c = multiColor ? COLORS[Math.floor(Math.random() * COLORS.length)] : color;
        const maxLife = 60 + Math.random() * 40;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: maxLife,
          maxLife,
          color: c,
          size: 1.5 + Math.random() * 1.5,
        });
      }
    };

    let raf = 0;
    let lastSpawn = 0;

    const tick = (t: number) => {
      // Trail fade
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(15, 25, 34, 0.22)";
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "lighter";

      // Spawn rockets at intervals
      if (t - lastSpawn > 280 + Math.random() * 220) {
        spawnRocket();
        if (Math.random() < 0.4) spawnRocket();
        lastSpawn = t;
      }

      // Update rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += (Math.random() - 0.5) * 0.4;
        r.y += r.vy;
        r.trail.push({ x: r.x, y: r.y, life: 12 });
        if (r.trail.length > 14) r.trail.shift();

        for (const p of r.trail) {
          p.life -= 1;
          const alpha = Math.max(0, p.life / 12);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
          ctx.fillStyle = r.color;
          ctx.globalAlpha = alpha * 0.9;
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Head glow
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();

        if (r.y <= r.targetY) {
          explode(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 0.04; // gravity
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        // Inner bright core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = alpha * 0.8;
        ctx.fill();

        if (p.life <= 0 || p.y > height + 10) {
          particles.splice(i, 1);
        }
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(tick);
    };

    // Kick off a few rockets immediately for impact
    spawnRocket();
    spawnRocket();
    spawnRocket();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
};

export default Fireworks;
