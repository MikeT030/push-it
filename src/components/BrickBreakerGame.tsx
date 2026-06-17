import { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

const BASE_WIDTH = 400;
const BASE_HEIGHT = 550;

interface BrickBreakerGameProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  active: boolean;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

const BRICK_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F8B500", "#FF6F61", "#6B5B95", "#88B04B", "#F7CAC9",
];

interface Ring {
  radius: number;
  lineWidth: number;
  color: string;
  hits: number;
  maxHits: number;
  active: boolean;
}

const BrickBreakerGame = ({ isOpen, onClose }: BrickBreakerGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [score, setScore] = useState(0);
  const scaleRef = useRef({ sx: 1, sy: 1 });
  
  const gameRef = useRef({
    ball: { x: 200, y: 450, dx: 4, dy: -4, radius: 8 } as Ball,
    paddle: { x: 150, y: 520, width: 100, height: 12 } as Paddle,
    bricks: [] as Brick[],
    targetHole: { x: 200, y: 220 },
    rings: [
      { radius: 80, lineWidth: 14, color: "#0ABAB5", hits: 0, maxHits: 10, active: true },  // Outer
      { radius: 60, lineWidth: 14, color: "#C029DE", hits: 0, maxHits: 15, active: true },  // Middle
      { radius: 40, lineWidth: 14, color: "#7036FF", hits: 0, maxHits: 20, active: true },  // Inner
    ] as Ring[],
    passThrough: false, // Ball passes through everything when a ring is destroyed
    passThroughEndTime: 0, // Timestamp when pass-through ends
    hitObjects: new Set<string>(), // Track objects hit during pass-through to apply 3 hits once
  });

  const initGame = useCallback(() => {
    const bricks: Brick[] = [];
    const brickWidth = 45;
    const brickHeight = 18;
    const rows = 5;
    const cols = 8;
    const padding = 6;
    const offsetX = 20;
    const offsetY = 40;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        bricks.push({
          x: offsetX + col * (brickWidth + padding),
          y: offsetY + row * (brickHeight + padding),
          width: brickWidth,
          height: brickHeight,
          color: BRICK_COLORS[(row * cols + col) % BRICK_COLORS.length],
          active: true,
        });
      }
    }

    gameRef.current = {
      ball: { x: 200, y: 450, dx: 4, dy: -4, radius: 8 },
      paddle: { x: 150, y: 520, width: 100, height: 12 },
      bricks,
      targetHole: { x: 200, y: 220 },
      rings: [
        { radius: 80, lineWidth: 14, color: "#0ABAB5", hits: 0, maxHits: 10, active: true },  // Outer
        { radius: 60, lineWidth: 14, color: "#C029DE", hits: 0, maxHits: 15, active: true },  // Middle
        { radius: 40, lineWidth: 14, color: "#7036FF", hits: 0, maxHits: 20, active: true },  // Inner
      ],
      passThrough: false,
      passThroughEndTime: 0,
      hitObjects: new Set<string>(),
    };
    setScore(0);
    setGameState("playing");
  }, []);

  const drawTarget = useCallback((ctx: CanvasRenderingContext2D) => {
    const { targetHole, rings } = gameRef.current;
    const { x, y } = targetHole;

    // Draw each active ring with health indicator
    rings.forEach((ring) => {
      if (ring.active) {
        ctx.beginPath();
        ctx.arc(x, y, ring.radius, 0, Math.PI * 2);
        
        // Fade color based on remaining health
        const healthPercent = 1 - (ring.hits / ring.maxHits);
        ctx.globalAlpha = 0.3 + (healthPercent * 0.7);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.lineWidth;
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Show remaining hits on ring
        const remaining = ring.maxHits - ring.hits;
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${remaining}`, x + ring.radius - 5, y);
      }
    });
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { ball, paddle, bricks } = gameRef.current;
    const { sx, sy } = scaleRef.current;

    // Clear canvas
    ctx.fillStyle = "hsl(240, 10%, 10%)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(sx, sy);

    // Draw bricks
    bricks.forEach((brick) => {
      if (brick.active) {
        ctx.fillStyle = brick.color;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
        ctx.fill();
        
        // Brick shine effect
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.width, brick.height / 3, [4, 4, 0, 0]);
        ctx.fill();
      }
    });

    // Draw target
    drawTarget(ctx);

    // Draw paddle
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, "#667eea");
    gradient.addColorStop(1, "#764ba2");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
    ctx.fill();

    // Draw ball with glow (golden glow when pass-through is active)
    const isPassThrough = gameRef.current.passThrough && Date.now() < gameRef.current.passThroughEndTime;
    ctx.shadowColor = isPassThrough ? "#FFD700" : "#fff";
    ctx.shadowBlur = isPassThrough ? 25 : 15;
    ctx.fillStyle = isPassThrough ? "#FFD700" : "#fff";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }, [drawTarget]);

  const update = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== "playing") return;

    const { ball, paddle, bricks, targetHole } = gameRef.current;

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collisions (use base dimensions for consistent gameplay)
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > BASE_WIDTH) {
      ball.dx = -ball.dx;
    }
    if (ball.y - ball.radius < 0) {
      ball.dy = -ball.dy;
    }

    // Bottom collision (lose)
    if (ball.y + ball.radius > BASE_HEIGHT) {
      setGameState("lost");
      return;
    }

    // Paddle collision
    if (
      ball.y + ball.radius > paddle.y &&
      ball.y - ball.radius < paddle.y + paddle.height &&
      ball.x > paddle.x &&
      ball.x < paddle.x + paddle.width
    ) {
      // Speed boost on paddle hit
      const speedBoost = 1.035;
      const maxSpeed = 12;
      const currentSpeed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
      const newSpeed = Math.min(currentSpeed * speedBoost, maxSpeed);
      
      ball.dy = -Math.abs(ball.dy);
      // Add angle based on where ball hits paddle
      const hitPos = (ball.x - paddle.x) / paddle.width;
      ball.dx = 8 * (hitPos - 0.5);
      
      // Normalize and apply boosted speed
      const angle = Math.atan2(ball.dy, ball.dx);
      ball.dx = Math.cos(angle) * newSpeed;
      ball.dy = Math.sin(angle) * newSpeed;
    }

    // Check if pass-through has expired
    const isPassThroughActive = gameRef.current.passThrough && Date.now() < gameRef.current.passThroughEndTime;
    if (gameRef.current.passThrough && !isPassThroughActive) {
      gameRef.current.passThrough = false;
      gameRef.current.hitObjects.clear();
    }

    // Brick collisions
    if (!isPassThroughActive) {
      bricks.forEach((brick) => {
        if (brick.active) {
          if (
            ball.x + ball.radius > brick.x &&
            ball.x - ball.radius < brick.x + brick.width &&
            ball.y + ball.radius > brick.y &&
            ball.y - ball.radius < brick.y + brick.height
          ) {
            brick.active = false;
            setScore((s) => s + 10);

            // Bounce off brick
            const overlapLeft = ball.x + ball.radius - brick.x;
            const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
            const overlapTop = ball.y + ball.radius - brick.y;
            const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);

            if (minOverlapX < minOverlapY) {
              ball.dx = -ball.dx;
            } else {
              ball.dy = -ball.dy;
            }
          }
        }
      });
    } else {
      // Pass-through mode: deal 3 hits to bricks without bouncing
      bricks.forEach((brick, index) => {
        if (brick.active) {
          if (
            ball.x + ball.radius > brick.x &&
            ball.x - ball.radius < brick.x + brick.width &&
            ball.y + ball.radius > brick.y &&
            ball.y - ball.radius < brick.y + brick.height
          ) {
            const brickKey = `brick_${index}`;
            if (!gameRef.current.hitObjects.has(brickKey)) {
              gameRef.current.hitObjects.add(brickKey);
              brick.active = false;
              setScore((s) => s + 30);
            }
          }
        }
      });
    }

    // Check distance to center for ring collisions
    const distToCenter = Math.sqrt(
      (ball.x - targetHole.x) ** 2 + (ball.y - targetHole.y) ** 2
    );

    // Find the innermost active ring
    const { rings } = gameRef.current;
    const activeRings = rings.filter(r => r.active).sort((a, b) => a.radius - b.radius);
    const innermostRing = activeRings[0];

    // Win condition: all rings must be destroyed
    if (!innermostRing) {
      // All rings destroyed - player wins!
      setGameState("won");
      return;
    }

    // Ring collision detection (from outer to inner)
    if (!isPassThroughActive) {
      for (const ring of rings) {
        if (!ring.active) continue;
        
        const innerEdge = ring.radius - ring.lineWidth / 2;
        const outerEdge = ring.radius + ring.lineWidth / 2;
        
        // Check if ball is touching this ring
        if (distToCenter + ball.radius > innerEdge && distToCenter - ball.radius < outerEdge) {
          // Hit the ring
          ring.hits++;
          
          if (ring.hits >= ring.maxHits) {
            ring.active = false;
            setScore((s) => s + ring.maxHits * 5);
            
            // Enable pass-through for 2 seconds
            gameRef.current.passThrough = true;
            gameRef.current.passThroughEndTime = Date.now() + 2000;
            gameRef.current.hitObjects.clear();
            
            // Spawn new bricks equal to double maxHits
            const brickWidth = 45;
            const brickHeight = 18;
            const padding = 6;
            const cols = 8;
            const offsetX = 20;
            const numBricks = ring.maxHits * 2;
            
            for (let i = 0; i < numBricks; i++) {
              const col = i % cols;
              const row = Math.floor(i / cols);
              gameRef.current.bricks.push({
                x: offsetX + col * (brickWidth + padding),
                y: -30 - row * (brickHeight + padding), // Start above screen
                width: brickWidth,
                height: brickHeight,
                color: ring.color,
                active: true,
              });
            }
          } else {
            setScore((s) => s + 5);
          }
          
          // Bounce off the ring
          const angle = Math.atan2(ball.y - targetHole.y, ball.x - targetHole.x);
          const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
          ball.dx = Math.cos(angle) * speed;
          ball.dy = Math.sin(angle) * speed;
          break; // Only hit one ring per frame
        }
      }
    } else {
      // In pass-through mode: deal 3 hits to rings without bouncing
      for (const ring of rings) {
        if (!ring.active) continue;
        
        const innerEdge = ring.radius - ring.lineWidth / 2;
        const outerEdge = ring.radius + ring.lineWidth / 2;
        
        if (distToCenter + ball.radius > innerEdge && distToCenter - ball.radius < outerEdge) {
          const ringKey = `ring_${ring.radius}`;
          if (!gameRef.current.hitObjects.has(ringKey)) {
            gameRef.current.hitObjects.add(ringKey);
            // Deal 5 hits to the ring
            ring.hits += 5;
            setScore((s) => s + 25); // 5x score for 5 hits
            
            if (ring.hits >= ring.maxHits) {
              ring.active = false;
              setScore((s) => s + ring.maxHits * 5);
              
              // Spawn new bricks equal to double maxHits
              const brickWidth = 45;
              const brickHeight = 18;
              const padding = 6;
              const cols = 8;
              const offsetX = 20;
              const numBricks = ring.maxHits * 2;
              
              for (let i = 0; i < numBricks; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                gameRef.current.bricks.push({
                  x: offsetX + col * (brickWidth + padding),
                  y: -30 - row * (brickHeight + padding),
                  width: brickWidth,
                  height: brickHeight,
                  color: ring.color,
                  active: true,
                });
              }
            }
          }
          // Don't bounce - pass through
        }
      }
    }
    
    // Animate new bricks falling down
    gameRef.current.bricks.forEach((brick) => {
      if (brick.y < 40 && brick.active) {
        brick.y += 2; // Fall speed
      }
    });
  }, [gameState]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    update();
    draw(ctx);

    if (gameState === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [update, draw, gameState]);

  useEffect(() => {
    if (isOpen) {
      initGame();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen, initGame]);

  useEffect(() => {
    if (isOpen && gameState === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen, gameState, gameLoop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      scaleRef.current = {
        sx: canvas.width / BASE_WIDTH,
        sy: canvas.height / BASE_HEIGHT,
      };
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const gameX = (e.clientX - rect.left) / scaleRef.current.sx;
      gameRef.current.paddle.x = Math.max(
        0,
        Math.min(gameX - gameRef.current.paddle.width / 2, BASE_WIDTH - gameRef.current.paddle.width)
      );
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      const rect = canvas.getBoundingClientRect();
      const gameX = (e.touches[0].clientX - rect.left) / scaleRef.current.sx;
      gameRef.current.paddle.x = Math.max(
        0,
        Math.min(gameX - gameRef.current.paddle.width / 2, BASE_WIDTH - gameRef.current.paddle.width)
      );
    };

    if (isOpen) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove);
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black animate-fade-in" style={{ touchAction: "none" }}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-[max(12px,env(safe-area-inset-top,0px))] right-4 z-10 p-2 rounded-full bg-muted/80 hover:bg-muted transition-colors"
      >
        <X className="w-5 h-5 text-foreground" />
      </button>

      {/* Score */}
      <div className="absolute top-[max(12px,env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 z-10 text-foreground font-bold text-lg">
        Score: {score}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: "none" }}
      />

      {/* Game over overlay */}
      {gameState !== "playing" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
          <h2 className="text-3xl font-semibold text-white mb-4">
            {gameState === "won" ? "🎉 You Win!" : "💥 Game Over"}
          </h2>
          <p className="text-white/80 mb-6">Score: {score}</p>
          <button
            onClick={initGame}
            className="px-8 py-3 w-[55%] max-w-[200px] bg-[hsl(293,70%,50%)] text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};
    </div>
  );
};

export default BrickBreakerGame;
