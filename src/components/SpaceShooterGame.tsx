/**
 * MiniGame — Standalone Space Shooter
 * ====================================
 * A self-contained React canvas game component.
 *
 * Dependencies: react, react-dom (no other libraries required)
 *
 * Assets needed in /public/images/:
 *   - spaceship.png
 *   - space-bg.png, space-bg-2.png, space-bg-3.png, space-bg-4.png, space-bg-5.png
 *
 * Usage:
 *   import MiniGame from './MiniGame-standalone';
 *   <MiniGame onBack={() => navigate('/')} />
 *
 * Controls:
 *   - Arrow keys / WASD: move
 *   - Space: toggle auto-shoot
 *   - E / P: fire plasma bomb
 *   - Mobile: touch to move, bottom-right icon for plasma bombs
 */

import { useEffect, useRef, useCallback, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Vec2 { x: number; y: number }
interface Heart extends Vec2 { active: boolean; color?: string }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; size: number; color: string }
interface Enemy { x: number; y: number; size: number; shape: "circle" | "triangle" | "square" | "diamond" | "hexagon"; color: string; speed: number; active: boolean; hp: number; word: string; isBuzzword?: boolean; glitterPhase?: number }
interface PlasmaHeart extends Vec2 { active: boolean; detonated: boolean }
interface PlasmaShrapnel {
  x: number; y: number; vx: number; vy: number;
  active: boolean;
  canChain: boolean;
  hitEnemy: boolean;
  hitTimer: number;
  life: number;
}
interface CapsuleShip {
  active: boolean;
  x: number; y: number;
  fromLeft: boolean;
  progress: number;
  dropped: boolean;
  startX: number; startY: number;
  peakY: number;
}
interface Wingman {
  x: number; y: number;
  offsetX: number;
  active: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3", "#54a0ff", "#5f27cd", "#01a3a4", "#f368e0"];

const ENEMY_WORDS: string[] = [];
const randomWord = () => "";

// ─── Drawing helpers ─────────────────────────────────────────────────────────

const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color = "#ff4d6d") => {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  const s = size;
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(-s * 0.5, -s * 0.3, -s, s * 0.1, 0, s);
  ctx.bezierCurveTo(s, s * 0.1, s * 0.5, -s * 0.3, 0, s * 0.3);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
};

const SHIP_SIZE = 36;
let shipImg: HTMLImageElement | null = null;
const loadShipImg = () => {
  if (shipImg) return;
  shipImg = new Image();
  shipImg.src = "/images/spaceship.png";
};
loadShipImg();

const SPACE_BG_PATHS = [
  "/images/space-bg.jpg",
  "/images/space-bg-2.jpg",
  "/images/space-bg-3.jpg",
  "/images/space-bg-4.jpg",
  "/images/space-bg-5.jpg",
];
const spaceBgImgs: HTMLImageElement[] = [];
const loadSpaceBgs = () => {
  if (spaceBgImgs.length > 0) return;
  for (const src of SPACE_BG_PATHS) {
    const img = new Image();
    img.src = src;
    spaceBgImgs.push(img);
  }
};
loadSpaceBgs();

let bgIndex = 0;
let bgNextIndex = -1;
let bgTransition = 0;
const BG_TRANSITION_SPEED = 0.008;

interface FallingStar {
  x: number; y: number; speed: number; length: number;
  opacity: number; angle: number; life: number; maxLife: number;
  burning: boolean; burnPhase: number; size: number;
}

const createFallingStar = (W: number, H: number): FallingStar => {
  const burning = Math.random() < 0.3;
  return {
    x: Math.random() * W * 1.2 - W * 0.1,
    y: -10 - Math.random() * 40,
    speed: 1.5 + Math.random() * 3,
    length: burning ? 15 + Math.random() * 25 : 8 + Math.random() * 12,
    opacity: 0.4 + Math.random() * 0.6,
    angle: Math.PI * 0.48 + (Math.random() - 0.5) * 0.15,
    life: 0,
    maxLife: 120 + Math.random() * 200,
    burning,
    burnPhase: Math.random() * Math.PI * 2,
    size: burning ? 2 + Math.random() * 1.5 : 1 + Math.random() * 0.8,
  };
};

let fallingStars: FallingStar[] = [];

const drawShip = (ctx: CanvasRenderingContext2D, x: number, y: number, glowTimer = 0, glowColor = "", blinkTimer = 0, blinkColor = "") => {
  if (glowTimer > 0) {
    const alpha = (glowTimer / 90) * 0.5;
    const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.15;
    const radius = (SHIP_SIZE * 0.8 + 10) * pulse;
    const color = glowColor || "#ff4d6d";
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = alpha * (0.6 + Math.sin(Date.now() * 0.01) * 0.4);
    ctx.shadowColor = color;
    ctx.shadowBlur = 20 + Math.sin(Date.now() * 0.008) * 10;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.75, 0, Math.PI * 2);
    ctx.globalAlpha = alpha * 0.3;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  const flicker = 0.85 + Math.random() * 0.3;
  const flameH = SHIP_SIZE * 0.4 * flicker;
  const flameGrad = ctx.createLinearGradient(x, y + SHIP_SIZE * 0.35, x, y + SHIP_SIZE * 0.35 + flameH);
  flameGrad.addColorStop(0, "#ffffff");
  flameGrad.addColorStop(0.2, "#ffdd44");
  flameGrad.addColorStop(0.6, "#ff8800");
  flameGrad.addColorStop(1, "rgba(255,60,0,0)");
  ctx.beginPath();
  ctx.moveTo(x - SHIP_SIZE * 0.08, y + SHIP_SIZE * 0.35);
  ctx.quadraticCurveTo(x - SHIP_SIZE * 0.05, y + SHIP_SIZE * 0.35 + flameH * 0.6, x, y + SHIP_SIZE * 0.35 + flameH);
  ctx.quadraticCurveTo(x + SHIP_SIZE * 0.05, y + SHIP_SIZE * 0.35 + flameH * 0.6, x + SHIP_SIZE * 0.08, y + SHIP_SIZE * 0.35);
  ctx.fillStyle = flameGrad;
  ctx.fill();
  ctx.restore();

  ctx.save();
  if (shipImg && shipImg.complete && shipImg.naturalWidth > 0) {
    const drawSize = SHIP_SIZE * 1.1;
    ctx.drawImage(shipImg, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);
  } else {
    ctx.translate(x, y);
    ctx.fillStyle = "#e0e0e0";
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-12, 14);
    ctx.lineTo(12, 14);
    ctx.closePath();
    ctx.fill();
  }
  if (blinkTimer > 0) {
    ctx.save();
    const blinkAlpha = Math.min(1, blinkTimer / 10) * (0.4 + 0.35 * Math.sin(Date.now() * 0.04));
    ctx.globalAlpha = blinkAlpha;
    ctx.beginPath();
    ctx.arc(x, y, SHIP_SIZE * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = blinkColor || "#ff0000";
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
};

const drawCapsule = (ctx: CanvasRenderingContext2D, x: number, y: number, facingLeft: boolean) => {
  ctx.save();
  ctx.translate(x, y);
  if (facingLeft) ctx.scale(-1, 1);
  const r = 18;

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  bodyGrad.addColorStop(0, "#ffffff");
  bodyGrad.addColorStop(0.7, "#e8e8e8");
  bodyGrad.addColorStop(1, "#cccccc");
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI + 0.3, -0.3);
  ctx.closePath();
  const domeGrad = ctx.createLinearGradient(0, -r, 0, -r * 0.2);
  domeGrad.addColorStop(0, "#1a1a1a");
  domeGrad.addColorStop(1, "#3a3a3a");
  ctx.fillStyle = domeGrad;
  ctx.fill();

  for (let i = 0; i < 3; i++) {
    const sy = -r * 0.35 + i * 2.5;
    ctx.beginPath();
    const halfW = Math.sqrt(r * r - sy * sy) * 0.95;
    ctx.moveTo(-halfW, sy);
    ctx.lineTo(halfW, sy);
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.beginPath();
  const bandY = r * 0.25;
  const bandH = r * 0.35;
  ctx.rect(-r, bandY, r * 2, bandH);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(0, 0, r - 0.5, 0, Math.PI * 2);
  ctx.fillStyle = "#1a1a1a";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  if (facingLeft) ctx.scale(-1, 1);

  ctx.fillStyle = "#222";
  ctx.font = `bold ${Math.round(r * 0.32)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CAPSULE", 0, -r * 0.05);
  ctx.font = `bold ${Math.round(r * 0.28)}px sans-serif`;
  ctx.fillText("CORP.", 0, r * 0.17);

  ctx.beginPath();
  ctx.arc(r * 0.6, r * 0.38, 3, 0, Math.PI * 2);
  const btnGrad = ctx.createRadialGradient(r * 0.6, r * 0.38, 0.5, r * 0.6, r * 0.38, 3);
  btnGrad.addColorStop(0, "#88ccff");
  btnGrad.addColorStop(1, "#2266aa");
  ctx.fillStyle = btnGrad;
  ctx.fill();
  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.strokeStyle = "#9aadbb";
  ctx.lineWidth = 2;
  const legAngles = [-0.6, -0.2, 0.2, 0.6];
  for (const a of legAngles) {
    const lx = Math.sin(a) * r * 0.7;
    const ly = r - 1;
    const fx = Math.sin(a) * r * 1.2;
    const fy = r + 9;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(fx, fy + 1, 3.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#9aadbb";
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.restore();
};

const drawEnemy = (ctx: CanvasRenderingContext2D, e: Enemy) => {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = e.color;
  ctx.strokeStyle = e.isBuzzword ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.3)";
  ctx.lineWidth = e.isBuzzword ? 2 : 1.5;
  const s = e.size;

  if (e.isBuzzword) {
    ctx.shadowColor = "rgba(255,255,255,0.6)";
    ctx.shadowBlur = 6 + Math.sin((e.glitterPhase || 0) + Date.now() * 0.005) * 4;
  }

  ctx.beginPath();
  switch (e.shape) {
    case "circle":
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      break;
    case "square":
      ctx.rect(-s, -s, s * 2, s * 2);
      break;
    case "triangle":
      ctx.moveTo(0, -s);
      ctx.lineTo(-s, s);
      ctx.lineTo(s, s);
      ctx.closePath();
      break;
    case "diamond":
      ctx.moveTo(0, -s);
      ctx.lineTo(s, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s, 0);
      ctx.closePath();
      break;
    case "hexagon":
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const method = i === 0 ? "moveTo" : "lineTo";
        ctx[method](Math.cos(a) * s, Math.sin(a) * s);
      }
      ctx.closePath();
      break;
  }
  ctx.fill();
  ctx.stroke();

  if (e.isBuzzword) {
    ctx.shadowBlur = 0;
    const t = Date.now() * 0.003 + (e.glitterPhase || 0);
    for (let i = 0; i < 5; i++) {
      const angle = t + i * 1.26;
      const dist = s * 0.5 + Math.sin(t * 2 + i) * s * 0.25;
      const gx = Math.cos(angle) * dist;
      const gy = Math.sin(angle) * dist;
      const alpha = 0.4 + Math.sin(t * 3 + i * 2) * 0.4;
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0, alpha)})`;
      ctx.fillRect(gx - 1.5, gy - 1.5, 3, 3);
    }
  }

  if (e.word) {
    if (e.isBuzzword) {
      ctx.fillStyle = "#000000";
      ctx.font = `bold 14px monospace`;
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      const fontSize = Math.max(7, Math.min(10, s * 0.55));
      ctx.font = `bold ${fontSize}px monospace`;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(e.word, 0, 0, s * 1.6);
  }

  ctx.restore();
};

const drawPlasmaHeart = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  const r = 11;
  ctx.save();
  ctx.shadowColor = "#c44dff";
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI, Math.PI * 2);
  ctx.fillStyle = "#ff69b4";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#222";
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.lineTo(x + r, y);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#333";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#555";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#222";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = "#ff69b4";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x - 4, y - 6, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fill();

  ctx.restore();
};

// ─── Component ───────────────────────────────────────────────────────────────

interface MiniGameProps {
  /** Called when user clicks the "Back" button. If omitted, no back button is shown. */
  onBack?: () => void;
}

const MiniGame = ({ onBack }: MiniGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);
  const [plasmaBombs, setPlasmaBombs] = useState(0);
  const [showExtraMsg, setShowExtraMsg] = useState(false);
  const stateRef = useRef({
    ship: { x: 0, y: 0 },
    dualBlaster: false,
    tripleBlaster: false,
    hearts: [] as Heart[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    keys: {} as Record<string, boolean>,
    score: 0,
    lives: 3,
    gameOver: false,
    lastShot: 0,
    wave: 0,
    waveEnemies: [] as Enemy[],
    waveDelay: 0,
    waveSpawnIndex: 0,
    waveSpawnTimer: 0,
    difficulty: 1,
    touch: null as { x: number; y: number } | null,
    moveTouchId: null as number | null,
    isShooting: false,
    autoShoot: true,
    plasmaBombs: 0,
    plasmaHearts: [] as PlasmaHeart[],
    plasmaShrapnel: [] as PlasmaShrapnel[],
    capsule: null as CapsuleShip | null,
    lastExtraWave: 0,
    extraPickup: null as { x: number; y: number; vy: number; active: boolean } | null,
    heartPickup: null as { x: number; y: number; vy: number; active: boolean } | null,
    lastHeartWave: 0,
    buzzwordTimer: 0,
    shipGlowTimer: 0,
    shipGlowColor: "",
    shipBlinkTimer: 0,
    shipBlinkColor: "",
    wingmen: [] as Wingman[],
    normalKills: 0,
    lastWingmanThreshold: 0,
  });

  const restart = useCallback(() => {
    const s = stateRef.current;
    s.hearts = [];
    s.enemies = [];
    s.particles = [];
    s.waveEnemies = [];
    s.score = 0;
    s.lives = 3;
    s.gameOver = false;
    s.wave = 0;
    s.waveDelay = 60;
    s.waveSpawnIndex = 0;
    s.waveSpawnTimer = 0;
    s.difficulty = 1;
    s.autoShoot = true;
    s.dualBlaster = false;
    s.tripleBlaster = false;
    s.plasmaBombs = 0;
    s.plasmaHearts = [];
    s.plasmaShrapnel = [];
    s.capsule = null;
    s.lastExtraWave = 0;
    s.extraPickup = null;
    s.heartPickup = null;
    s.lastHeartWave = 0;
    s.buzzwordTimer = 0;
    s.shipBlinkTimer = 0;
    s.shipBlinkColor = "";
    s.wingmen = [];
    s.normalKills = 0;
    s.lastWingmanThreshold = 0;
    setPlasmaBombs(0);
    setShowExtraMsg(false);
    setLives(3);
    setGameOver(false);
    bgIndex = 0;
    bgNextIndex = -1;
    bgTransition = 0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      stateRef.current.ship.x = canvas.width / 2;
      stateRef.current.ship.y = canvas.height - 50;
    };
    resize();
    window.addEventListener("resize", resize);

    const spacePressed = { current: false };
    const onKey = (e: KeyboardEvent, down: boolean) => {
      stateRef.current.keys[e.key] = down;
      if (e.key === " ") {
        e.preventDefault();
        if (down && !spacePressed.current && !stateRef.current.gameOver) {
          stateRef.current.autoShoot = !stateRef.current.autoShoot;
        }
        spacePressed.current = down;
      }
    };
    window.addEventListener("keydown", (e) => onKey(e, true));
    window.addEventListener("keyup", (e) => onKey(e, false));

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.touch = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseDown = (_e: MouseEvent) => {};
    const onMouseUp = (_e: MouseEvent) => {};
    const onMouseLeave = () => {
      stateRef.current.touch = null;
      stateRef.current.isShooting = false;
    };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      const rect = canvas.getBoundingClientRect();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const tx = t.clientX - rect.left;
        const ty = t.clientY - rect.top;

        if (s.gameOver) { restart(); return; }

        const H = canvas.height;
        const W = canvas.width;

        if (tx > W - 60 && ty > H - 60) {
          if (s.plasmaBombs > 0) {
            s.plasmaBombs--;
            setPlasmaBombs(s.plasmaBombs);
            s.plasmaHearts.push({
              x: s.ship.x,
              y: s.ship.y - 20,
              active: true,
              detonated: false,
            });
          }
          continue;
        }

        if (s.moveTouchId === null) {
          s.moveTouchId = t.identifier;
          s.touch = { x: tx, y: ty };
        }
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      const rect = canvas.getBoundingClientRect();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === s.moveTouchId) {
          s.touch = { x: t.clientX - rect.left, y: t.clientY - rect.top };
          break;
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      const s = stateRef.current;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === s.moveTouchId) {
          s.touch = null;
          s.moveTouchId = null;
          break;
        }
      }
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    const FORMATIONS: ((w: number, wave: number) => { x: number; y: number }[])[] = [
      (w, _wave) => {
        const count = 5 + Math.min(_wave, 5);
        return Array.from({ length: count }, (_, i) => ({
          x: w / 2 + (i - count / 2) * 50,
          y: -30 - Math.abs(i - count / 2) * 40,
        }));
      },
      (w, _wave) => {
        const cols = 4 + Math.min(_wave, 4);
        const rows = 2 + Math.min(Math.floor(_wave / 3), 2);
        const pts: { x: number; y: number }[] = [];
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++)
            pts.push({ x: w * 0.2 + (c / (cols - 1)) * w * 0.6, y: -30 - r * 45 });
        return pts;
      },
      (w, _wave) => {
        const count = 6 + Math.min(_wave, 6);
        return Array.from({ length: count }, (_, i) => {
          const angle = Math.PI + (i / (count - 1)) * Math.PI;
          return { x: w / 2 + Math.cos(angle) * (w * 0.3), y: -30 - Math.sin(angle) * 80 };
        });
      },
    ];

    const buildWave = () => {
      const s = stateRef.current;
      s.wave++;
      s.difficulty = 1 + (s.wave - 1) * 0.4;

      if (s.wave > 1 && (s.wave - 1) % 4 === 0 && bgNextIndex < 0) {
        const nextIdx = (bgIndex + 1) % spaceBgImgs.length;
        bgNextIndex = nextIdx;
        bgTransition = 0;
      }
      const shapes: Enemy["shape"][] = ["circle", "triangle", "square", "diamond", "hexagon"];
      const formation = FORMATIONS[s.wave % FORMATIONS.length];
      const positions = formation(canvas.width, s.wave);

      let enemyPositions = positions;
      const waveMilestone = Math.floor((s.wave - 1) / 5);
      if (waveMilestone > 0) {
        const additionalEnemies = waveMilestone * 2;
        for (let i = 0; i < additionalEnemies; i++) {
          const randomX = Math.random() * canvas.width;
          const randomY = Math.random() * (canvas.height * 0.3) - 50;
          enemyPositions = [...enemyPositions, { x: randomX, y: randomY }];
        }
      }

      s.waveEnemies = enemyPositions.map((pos) => {
        const size = 12 + Math.random() * 14;
        const baseSpeed = 1 + Math.random() * 1 + s.difficulty * 0.25;
        const speedBoost = waveMilestone * 0.15;
        return {
          x: pos.x, y: pos.y, size,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          speed: baseSpeed + speedBoost,
          active: true, hp: 1, word: "",
        };
      });
      s.waveSpawnIndex = 0;
      s.waveSpawnTimer = 0;
    };

    const spawnParticles = (x: number, y: number, count: number) => {
      const s = stateRef.current;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        s.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 40 + Math.random() * 30,
          size: 4 + Math.random() * 6,
          color: ["#ff4d6d", "#ff758f", "#ff8fa3", "#ffb3c1"][Math.floor(Math.random() * 4)],
        });
      }
    };

    const detonatePlasma = (x: number, y: number, canChain: boolean) => {
      const s = stateRef.current;
      const count = canChain ? 150 : 20;
      for (let i = 0; i < count; i++) {
        const baseAngle = (i / count) * Math.PI * 2;
        const jitter = (Math.random() - 0.5) * 0.45;
        const angle = baseAngle + jitter;
        const speed = 3 + Math.random() * 6;
        s.plasmaShrapnel.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          active: true,
          canChain,
          hitEnemy: false,
          hitTimer: 0,
          life: canChain ? 140 + Math.random() * 60 : 60 + Math.random() * 30,
        });
      }
      spawnParticles(x, y, 12);
    };

    const spawnCapsule = () => {
      const s = stateRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const fromLeft = Math.random() > 0.5;
      s.capsule = {
        active: true,
        x: fromLeft ? -30 : W + 30,
        y: H * 0.7,
        fromLeft,
        progress: 0,
        dropped: false,
        startX: fromLeft ? -30 : W + 30,
        startY: H * 0.7,
        peakY: H * 0.25,
      };
    };

    const loop = () => {
      const s = stateRef.current;
      const W = canvas.width;
      const H = canvas.height;

      const drawBg = (img: HTMLImageElement, alpha: number) => {
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.globalAlpha = alpha;
          const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
          const bw = img.naturalWidth * scale;
          const bh = img.naturalHeight * scale;
          ctx.drawImage(img, (W - bw) / 2, (H - bh) / 2, bw, bh);
          ctx.restore();
        }
      };

      if (bgNextIndex >= 0) {
        bgTransition += BG_TRANSITION_SPEED;
        if (bgTransition >= 1) {
          bgIndex = bgNextIndex;
          bgNextIndex = -1;
          bgTransition = 0;
        }
      }

      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, W, H);
      if (bgNextIndex >= 0) {
        drawBg(spaceBgImgs[bgIndex], 1 - bgTransition);
        drawBg(spaceBgImgs[bgNextIndex], bgTransition);
      } else {
        drawBg(spaceBgImgs[bgIndex], 1);
      }

      while (fallingStars.length < 9) {
        fallingStars.push(createFallingStar(W, H));
      }

      for (let i = fallingStars.length - 1; i >= 0; i--) {
        const star = fallingStars[i];
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.life++;

        const lifeRatio = star.life / star.maxLife;
        const fade = lifeRatio < 0.1 ? lifeRatio / 0.1
          : lifeRatio > 0.7 ? 1 - (lifeRatio - 0.7) / 0.3
          : 1;
        const alpha = star.opacity * fade;

        if (star.life > star.maxLife || star.y > H + 20 || star.x > W + 20 || star.x < -20) {
          fallingStars[i] = createFallingStar(W, H);
          continue;
        }

        ctx.save();
        if (star.burning) {
          const trailLen = star.length;
          const tailX = star.x - Math.cos(star.angle) * trailLen;
          const tailY = star.y - Math.sin(star.angle) * trailLen;
          const flicker = 0.7 + Math.sin(star.burnPhase + star.life * 0.3) * 0.3;

          ctx.shadowColor = `rgba(180, 100, 255, ${alpha * 0.6 * flicker})`;
          ctx.shadowBlur = 12;

          const grad = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
          grad.addColorStop(0, `rgba(100, 50, 180, 0)`);
          grad.addColorStop(0.4, `rgba(200, 120, 255, ${alpha * 0.4 * flicker})`);
          grad.addColorStop(0.7, `rgba(255, 200, 100, ${alpha * 0.8 * flicker})`);
          grad.addColorStop(1, `rgba(255, 255, 220, ${alpha * flicker})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = star.size * 1.5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(star.x, star.y);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 240, ${alpha * flicker})`;
          ctx.fill();
        } else {
          const tailX = star.x - Math.cos(star.angle) * star.length;
          const tailY = star.y - Math.sin(star.angle) * star.length;
          const grad = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
          grad.addColorStop(0, `rgba(255, 255, 255, 0)`);
          grad.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = star.size;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(star.x, star.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (!s.gameOver) {
        const speed = 12;
        const hasKeyInput = s.keys["ArrowLeft"] || s.keys["a"] || s.keys["ArrowRight"] || s.keys["d"] || s.keys["ArrowUp"] || s.keys["w"] || s.keys["ArrowDown"] || s.keys["s"];
        if (hasKeyInput) {
          if (s.keys["ArrowLeft"] || s.keys["a"]) s.ship.x -= speed;
          if (s.keys["ArrowRight"] || s.keys["d"]) s.ship.x += speed;
          if (s.keys["ArrowUp"] || s.keys["w"]) s.ship.y -= speed;
          if (s.keys["ArrowDown"] || s.keys["s"]) s.ship.y += speed;
          s.touch = null;
        } else if (s.touch) {
          const touchOffsetY = 60;
          const targetX = s.touch.x;
          const targetY = s.touch.y - touchOffsetY;
          const dx = targetX - s.ship.x;
          const dy = targetY - s.ship.y;
          if (Math.abs(dx) > 2) s.ship.x += dx * 0.18;
          if (Math.abs(dy) > 2) s.ship.y += dy * 0.18;
        }
        s.ship.x = Math.max(5, Math.min(W - 5, s.ship.x));
        s.ship.y = Math.max(20, Math.min(H - 10, s.ship.y));

        s.wingmen.forEach((wm) => {
          if (!wm.active) return;
          wm.x = s.ship.x + wm.offsetX;
          wm.y = s.ship.y + 8;
        });

        const now = Date.now();
        if ((s.keys[" "] || s.isShooting || s.autoShoot) && now - s.lastShot > 180) {
          if (!s.dualBlaster) {
            s.hearts.push({ x: s.ship.x, y: s.ship.y - 20, active: true });
          } else if (s.dualBlaster && !s.tripleBlaster) {
            s.hearts.push({ x: s.ship.x - 12, y: s.ship.y - 14, active: true, color: "#48dbfb" });
            s.hearts.push({ x: s.ship.x + 12, y: s.ship.y - 14, active: true, color: "#48dbfb" });
          } else {
            s.hearts.push({ x: s.ship.x, y: s.ship.y - 20, active: true });
            s.hearts.push({ x: s.ship.x - 12, y: s.ship.y - 14, active: true, color: "#48dbfb" });
            s.hearts.push({ x: s.ship.x + 12, y: s.ship.y - 14, active: true, color: "#48dbfb" });
          }
          s.wingmen.forEach((wm) => {
            if (wm.active) {
              s.hearts.push({ x: wm.x, y: wm.y - 20, active: true });
            }
          });
          s.lastShot = now;
        }

        if ((s.keys["e"] || s.keys["p"]) && s.plasmaBombs > 0) {
          s.keys["e"] = false;
          s.keys["p"] = false;
          s.plasmaBombs--;
          setPlasmaBombs(s.plasmaBombs);
          s.plasmaHearts.push({
            x: s.ship.x,
            y: s.ship.y - 20,
            active: true,
            detonated: false,
          });
        }

        s.hearts.forEach((h) => { if (h.active) h.y -= 7; });
        s.hearts = s.hearts.filter((h) => h.active && h.y > -20);

        s.plasmaHearts.forEach((ph) => {
          if (!ph.active || ph.detonated) return;
          ph.y -= 7;
          const detonateY = H * 0.3;
          if (ph.y <= detonateY) {
            ph.detonated = true;
            ph.active = false;
            detonatePlasma(ph.x, ph.y, true);
          }
          if (ph.active) {
            for (const e of s.enemies) {
              if (!e.active) continue;
              const dist = Math.hypot(ph.x - e.x, ph.y - e.y);
              if (dist < e.size + 14) {
                ph.detonated = true;
                ph.active = false;
                detonatePlasma(ph.x, ph.y, true);
                break;
              }
            }
          }
        });
        s.plasmaHearts = s.plasmaHearts.filter((ph) => ph.active);

        s.plasmaShrapnel.forEach((sh) => {
          if (!sh.active) return;
          sh.x += sh.vx;
          sh.y += sh.vy;
          sh.vx *= 0.98;
          sh.vy *= 0.98;
          sh.life--;
          if (sh.life <= 0) {
            sh.active = false;
            return;
          }
          if (sh.hitEnemy) {
            sh.hitTimer--;
            if (sh.hitTimer <= 0 && sh.canChain) {
              sh.active = false;
              detonatePlasma(sh.x, sh.y, false);
              return;
            }
          }
          if (sh.x < -30 || sh.x > W + 30 || sh.y < -30 || sh.y > H + 30) {
            sh.active = false;
            return;
          }
          for (const e of s.enemies) {
            if (!e.active) continue;
            const dist = Math.hypot(sh.x - e.x, sh.y - e.y);
            if (dist < e.size + 8) {
              e.hp--;
              if (e.hp <= 0) {
                e.active = false;
                s.score += 100;
                setScore(s.score);
                spawnParticles(e.x, e.y, 8);
              }
              sh.hitEnemy = true;
              sh.hitTimer = 30;
              break;
            }
          }
        });
        s.plasmaShrapnel = s.plasmaShrapnel.filter((sh) => sh.active);

        if (s.enemies.length === 0 && s.waveEnemies.length === 0) {
          if (s.waveDelay <= 0) {
            if (s.wave >= 5 && !s.dualBlaster) {
              s.dualBlaster = true;
            }
            if (s.wave >= 10 && !s.tripleBlaster) {
              s.tripleBlaster = true;
            }
            if (s.wave > 0 && s.wave % 2 === 0 && s.wave !== s.lastExtraWave && !s.capsule) {
              s.lastExtraWave = s.wave;
              spawnCapsule();
            }
            if (s.wave > 0 && s.wave % 5 === 0 && s.wave !== s.lastHeartWave && s.lives < 3 && !s.heartPickup) {
              s.lastHeartWave = s.wave;
              s.heartPickup = {
                x: Math.random() * (W * 0.6) + W * 0.2,
                y: -20,
                vy: 3,
                active: true,
              };
            }
            buildWave();
            s.waveDelay = 90;
          } else {
            s.waveDelay--;
          }
        }
        if (s.waveEnemies.length > 0) {
          s.waveSpawnTimer++;
          if (s.waveSpawnTimer % 8 === 0) {
            s.enemies.push(s.waveEnemies.shift()!);
          }
        }

        if (s.capsule && s.capsule.active) {
          const c = s.capsule;
          c.progress += 0.005;
          const t = c.progress;
          const endX = c.fromLeft ? W + 30 : -30;
          c.x = c.startX + (endX - c.startX) * t;
          c.y = c.startY - Math.sin(t * Math.PI) * (c.startY - c.peakY);

          if (t >= 0.5 && !c.dropped) {
            c.dropped = true;
            s.extraPickup = { x: c.x, y: c.y, vy: 1.5, active: true };
          }

          if (t >= 1.0) {
            s.capsule = null;
          }
        }

        if (s.extraPickup && s.extraPickup.active) {
          s.extraPickup.y += s.extraPickup.vy;
          const dist = Math.hypot(s.extraPickup.x - s.ship.x, s.extraPickup.y - s.ship.y);
          if (dist < 30) {
            s.extraPickup.active = false;
            s.extraPickup = null;
            s.plasmaBombs += 2;
            setPlasmaBombs(s.plasmaBombs);
            s.shipGlowTimer = 90;
            s.shipGlowColor = "#c44dff";
            s.shipBlinkTimer = 20;
            s.shipBlinkColor = "#e040fb";
            setShowExtraMsg(true);
            setTimeout(() => setShowExtraMsg(false), 4000);
          } else if (s.extraPickup && s.extraPickup.y > H + 20) {
            s.extraPickup = null;
          }
        }

        if (s.heartPickup && s.heartPickup.active) {
          s.heartPickup.y += s.heartPickup.vy;
          const dist = Math.hypot(s.heartPickup.x - s.ship.x, s.heartPickup.y - s.ship.y);
          if (dist < 30) {
            s.heartPickup.active = false;
            s.heartPickup = null;
            if (s.lives < 3) {
              s.lives++;
              setLives(s.lives);
              s.shipGlowTimer = 90;
              s.shipGlowColor = "#ff4d6d";
              s.shipBlinkTimer = 20;
              s.shipBlinkColor = "#00e5ff";
            }
          } else if (s.heartPickup && s.heartPickup.y > H + 20) {
            s.heartPickup = null;
          }
        }

        s.buzzwordTimer++;
        if (s.buzzwordTimer > 180 + Math.random() * 300) {
          s.buzzwordTimer = 0;
          const bSize = 28 + Math.random() * 12;
          const shapes: Enemy["shape"][] = ["circle", "square", "diamond", "hexagon"];
          s.enemies.push({
            x: Math.random() * (W * 0.7) + W * 0.15,
            y: -bSize,
            size: bSize,
            shape: shapes[Math.floor(Math.random() * shapes.length)],
            color: "#c8c8c8",
            speed: 0.6 + Math.random() * 0.6,
            active: true,
            hp: 3,
            word: randomWord(),
            isBuzzword: true,
            glitterPhase: Math.random() * Math.PI * 2,
          });
        }

        s.enemies.forEach((e) => { if (e.active) e.y += e.speed; });

        s.hearts.forEach((h) => {
          if (!h.active) return;
          s.enemies.forEach((e) => {
            if (!e.active) return;
            const dist = Math.hypot(h.x - e.x, h.y - e.y);
            if (dist < e.size + 6) {
              h.active = false;
              e.hp--;
              if (e.hp <= 0) {
                e.active = false;
                s.score += e.isBuzzword ? 250 : 100;
                setScore(s.score);
                spawnParticles(e.x, e.y, 12);
                if (!e.isBuzzword) {
                  s.normalKills++;
                  const threshold = Math.floor(s.normalKills / 40);
                  if (threshold > s.lastWingmanThreshold) {
                    s.lastWingmanThreshold = threshold;
                    const count = s.wingmen.filter(w => w.active).length;
                    if (count < 2) {
                      const side = count % 2 === 0 ? -1 : 1;
                      const tier = Math.floor(count / 2) + 1;
                      const offsetX = side * (35 + tier * 20);
                      s.wingmen.push({ x: s.ship.x + offsetX, y: s.ship.y + 8, offsetX, active: true });
                    }
                  }
                }
              } else {
                spawnParticles(e.x, e.y, 4);
              }
            }
          });
        });

        s.enemies.forEach((e) => {
          if (!e.active) return;
          if (e.y > H + e.size) {
            e.active = false;
            s.lives--;
            setLives(s.lives);
            if (s.lives <= 0) { s.gameOver = true; setGameOver(true); }
          }
          const dist = Math.hypot(e.x - s.ship.x, e.y - s.ship.y);
          if (dist < e.size + 14) {
            e.active = false;
            spawnParticles(s.ship.x, s.ship.y, 8);
            s.shipBlinkTimer = 20;
            s.shipBlinkColor = "#ff0000";
            s.lives--;
            setLives(s.lives);
            if (s.lives <= 0) { s.gameOver = true; setGameOver(true); }
          }
          if (e.active) {
            for (const wm of s.wingmen) {
              if (!wm.active) continue;
              const wDist = Math.hypot(e.x - wm.x, e.y - wm.y);
              if (wDist < e.size + 14) {
                e.active = false;
                wm.active = false;
                spawnParticles(wm.x, wm.y, 10);
                break;
              }
            }
          }
        });

        s.enemies = s.enemies.filter((e) => e.active);

        s.particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05;
          p.life--;
        });
        s.particles = s.particles.filter((p) => p.life > 0);
      }

      // Draw enemies
      s.enemies.forEach((e) => drawEnemy(ctx, e));

      // Draw hearts (projectiles)
      s.hearts.forEach((h) => {
        if (h.active) drawHeart(ctx, h.x, h.y, 8, h.color || "#ff4d6d");
      });

      // Draw plasma hearts in flight
      s.plasmaHearts.forEach((ph) => {
        if (ph.active) drawPlasmaHeart(ctx, ph.x, ph.y);
      });

      // Draw plasma shrapnel hearts
      s.plasmaShrapnel.forEach((sh) => {
        if (!sh.active) return;
        const alpha = sh.hitEnemy ? 0.5 + (sh.hitTimer / 30) * 0.5 : Math.min(1, sh.life / 30);
        ctx.globalAlpha = alpha;
        const size = sh.canChain ? 7 : 5;
        const color = sh.canChain
          ? ["#d94dff", "#ff4d6d", "#f0a0ff", "#c44dff"][Math.floor(Math.abs(sh.x * 7) % 4)]
          : ["#ff4d6d", "#ff758f", "#ff8fa3", "#ffb3c1"][Math.floor(Math.abs(sh.x * 7) % 4)];
        drawHeart(ctx, sh.x, sh.y, size, color);
        ctx.globalAlpha = 1;
      });

      // Draw particles
      s.particles.forEach((p) => {
        ctx.globalAlpha = p.life / 70;
        drawHeart(ctx, p.x, p.y, p.size, p.color);
        ctx.globalAlpha = 1;
      });

      // Draw capsule ship
      if (s.capsule && s.capsule.active) {
        drawCapsule(ctx, s.capsule.x, s.capsule.y, !s.capsule.fromLeft);
      }

      // Draw extra pickup
      if (s.extraPickup && s.extraPickup.active) {
        const ex = s.extraPickup.x;
        const ey = s.extraPickup.y;
        const sz = 16;
        const cut = sz * 0.38;
        ctx.save();
        ctx.shadowColor = "#ff4444";
        ctx.shadowBlur = 10 + Math.sin(Date.now() * 0.008) * 4;
        ctx.beginPath();
        ctx.moveTo(ex - sz + cut, ey - sz);
        ctx.lineTo(ex + sz - cut, ey - sz);
        ctx.lineTo(ex + sz, ey - sz + cut);
        ctx.lineTo(ex + sz, ey + sz - cut);
        ctx.lineTo(ex + sz - cut, ey + sz);
        ctx.lineTo(ex - sz + cut, ey + sz);
        ctx.lineTo(ex - sz, ey + sz - cut);
        ctx.lineTo(ex - sz, ey - sz + cut);
        ctx.closePath();
        const grad = ctx.createLinearGradient(ex - sz, ey - sz, ex + sz, ey + sz);
        grad.addColorStop(0, "#7a7a7a");
        grad.addColorStop(0.3, "#b0b0b0");
        grad.addColorStop(0.5, "#9a9a9a");
        grad.addColorStop(0.7, "#b8b8b8");
        grad.addColorStop(1, "#6a6a6a");
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = "#555";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
        const innerW = sz * 0.9;
        const innerH = sz * 0.75;
        ctx.fillStyle = "rgba(200, 30, 30, 0.25)";
        ctx.fillRect(ex - innerW, ey - innerH, innerW * 2, innerH * 2);
        ctx.strokeStyle = "rgba(255, 60, 60, 0.6)";
        ctx.lineWidth = 1;
        ctx.strokeRect(ex - innerW, ey - innerH, innerW * 2, innerH * 2);
        ctx.fillStyle = "#ff3333";
        ctx.font = `bold ${Math.round(sz * 0.85)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("HB", ex, ey + 1);
        ctx.restore();
      }

      // Draw heart pickup
      if (s.heartPickup && s.heartPickup.active) {
        const hx = s.heartPickup.x;
        const hy = s.heartPickup.y;
        ctx.save();
        ctx.shadowColor = "#ff4d6d";
        ctx.shadowBlur = 12 + Math.sin(Date.now() * 0.008) * 6;
        drawHeart(ctx, hx, hy, 14, "#ff4d6d");
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(hx, hy + 5, 16 + Math.sin(Date.now() * 0.006) * 3, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,77,109,0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // Draw ships
      if (!s.gameOver) {
        if (s.shipGlowTimer > 0) s.shipGlowTimer--;
        if (s.shipBlinkTimer > 0) s.shipBlinkTimer--;
        drawShip(ctx, s.ship.x, s.ship.y, s.shipGlowTimer, s.shipGlowColor, s.shipBlinkTimer, s.shipBlinkColor);
        s.wingmen.forEach((wm) => {
          if (wm.active) {
            drawShip(ctx, wm.x, wm.y, 0, "");
          }
        });
        s.wingmen = s.wingmen.filter(w => w.active);

        if (s.plasmaBombs > 0) {
          const bx = W - 34;
          const by = H - 34;
          ctx.save();
          ctx.beginPath();
          ctx.arc(bx, by, 24, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(100,0,180,0.3)";
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "rgba(200,100,255,0.5)";
          ctx.stroke();
          ctx.restore();
          drawPlasmaHeart(ctx, bx, by);
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff";
          ctx.fillText(`x${s.plasmaBombs}`, bx, by + 20);
        }
      }

      // Game over
      if (s.gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", W / 2, H / 2 - 20);
        ctx.font = "18px sans-serif";
        ctx.fillStyle = "#ff4d6d";
        ctx.fillText(`Score: ${s.score}`, W / 2, H / 2 + 20);
        ctx.fillStyle = "#aaa";
        ctx.font = "14px sans-serif";
        ctx.fillText("Press ENTER or tap to restart", W / 2, H / 2 + 55);
      }

      animId = requestAnimationFrame(loop);
    };

    const onRestart = (e: KeyboardEvent) => {
      if (e.key === "Enter" && stateRef.current.gameOver) restart();
    };
    const onTapRestart = () => {
      if (stateRef.current.gameOver) restart();
    };
    window.addEventListener("keydown", onRestart);
    canvas.addEventListener("click", onTapRestart);

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onRestart);
      canvas.removeEventListener("click", onTapRestart);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [restart]);

  const toggleAutoShoot = () => {
    const s = stateRef.current;
    if (!s.gameOver) s.autoShoot = !s.autoShoot;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0a0a0f", display: "flex", flexDirection: "column" }}>
      {/* HUD bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 56px 8px 16px", paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)", background: "rgba(0,0,0,0.5)", zIndex: 10 }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{ color: "rgba(255,255,255,0.7)", background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontFamily: "sans-serif" }}
          >
            ← Back
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "16px", fontFamily: "sans-serif", marginLeft: onBack ? 0 : "auto" }}>
          <span style={{ color: "rgba(255,255,255,0.8)" }}>Score: <span style={{ color: "#ff4d6d", fontWeight: "bold" }}>{score}</span></span>
          {plasmaBombs > 0 && (
            <span style={{ color: "#d94dff", fontWeight: "bold", fontSize: "14px" }}>💣 {plasmaBombs}</span>
          )}
          <span style={{ color: "rgba(255,255,255,0.8)" }}>
            Lives: {Array.from({ length: lives }).map((_, i) => (
              <span key={i} style={{ color: "#ff4d6d", fontSize: "14px" }}>❤️</span>
            ))}
          </span>
        </div>
      </div>
      {/* Extra message overlay */}
      {showExtraMsg && (
        <div style={{
          position: "absolute", top: "64px", left: "50%", transform: "translateX(-50%)", zIndex: 20,
          background: "rgba(217,77,255,0.2)", border: "1px solid #d94dff", borderRadius: "8px",
          padding: "8px 16px", textAlign: "center",
        }}>
          <span style={{ color: "#f0a0ff", fontWeight: "bold", fontSize: "14px" }}>+2 Plasma Heart Bombs!</span>
          <br />
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
            Press <kbd style={{ background: "rgba(255,255,255,0.2)", padding: "0 4px", borderRadius: "3px" }}>E</kbd> or <kbd style={{ background: "rgba(255,255,255,0.2)", padding: "0 4px", borderRadius: "3px" }}>P</kbd> to fire
          </span>
        </div>
      )}
      {/* Auto-shoot button */}
      <div style={{ position: "absolute", bottom: "48px", left: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", zIndex: 20, pointerEvents: "none" }}>
        <span style={{ fontSize: "12px", fontWeight: "bold", color: "rgba(34,211,238,0.6)" }}>Blaster</span>
        <button
          onClick={toggleAutoShoot}
          style={{
            pointerEvents: "auto",
            width: "56px", height: "56px", borderRadius: "50%",
            fontWeight: "bold", fontSize: "12px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
            ...(stateRef.current.autoShoot
              ? { background: "rgba(34,211,238,0.6)", color: "rgba(255,255,255,0.9)", border: "none", boxShadow: "0 0 15px rgba(34,211,238,0.3)" }
              : { background: "transparent", color: "rgba(34,211,238,0.6)", border: "2px solid rgba(34,211,238,0.6)" }
            ),
          }}
        >
          {stateRef.current.autoShoot ? "ON" : "OFF"}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        style={{ flex: 1, width: "100%", outline: "none", touchAction: "none" }}
        tabIndex={0}
      />
      <div style={{ textAlign: "center", padding: "8px", color: "rgba(255,255,255,0.4)", fontSize: "12px", fontFamily: "sans-serif", background: "rgba(0,0,0,0.5)" }}>
        Arrow keys / WASD to move · Space to toggle auto-shoot · E/P for plasma bombs · Mobile: tap bomb icon
      </div>
    </div>
  );
};

export default MiniGame;
