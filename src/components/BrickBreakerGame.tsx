import { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

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

const BrickBreakerGame = ({ isOpen, onClose }: BrickBreakerGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [score, setScore] = useState(0);
  
  const gameRef = useRef({
    ball: { x: 200, y: 450, dx: 4, dy: -4, radius: 8 } as Ball,
    paddle: { x: 150, y: 520, width: 100, height: 12 } as Paddle,
    bricks: [] as Brick[],
    targetHole: { x: 200, y: 250, innerRadius: 26, outerRadius: 80 },
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
      targetHole: { x: 200, y: 220, innerRadius: 26, outerRadius: 80 },
    };
    setScore(0);
    setGameState("playing");
  }, []);

  const drawTarget = useCallback((ctx: CanvasRenderingContext2D) => {
    const { targetHole } = gameRef.current;
    const { x, y, outerRadius } = targetHole;

    // Outer circle - Teal
    ctx.beginPath();
    ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "#0ABAB5";
    ctx.lineWidth = 14;
    ctx.stroke();

    // Middle circle - Purple/Magenta
    ctx.beginPath();
    ctx.arc(x, y, 60, 0, Math.PI * 2);
    ctx.strokeStyle = "#C029DE";
    ctx.lineWidth = 14;
    ctx.stroke();

    // Inner circle - Blue (this is the hole)
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.strokeStyle = "#4300FF";
    ctx.lineWidth = 14;
    ctx.stroke();
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { ball, paddle, bricks } = gameRef.current;

    // Clear canvas
    ctx.fillStyle = "hsl(240, 10%, 10%)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    // Draw ball with glow
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [drawTarget]);

  const update = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== "playing") return;

    const { ball, paddle, bricks, targetHole } = gameRef.current;

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collisions
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
      ball.dx = -ball.dx;
    }
    if (ball.y - ball.radius < 0) {
      ball.dy = -ball.dy;
    }

    // Bottom collision (lose)
    if (ball.y + ball.radius > canvas.height) {
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
      const speedBoost = 1.05;
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

    // Brick collisions
    bricks.forEach((brick) => {
      if (brick.active) {
        if (
          ball.x + ball.radius > brick.x &&
          ball.x - ball.radius < brick.x + brick.width &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + brick.height
        ) {
          brick.active = false;
          ball.dy = -ball.dy;
          setScore((s) => s + 10);
        }
      }
    });

    // Check if ball goes through the hole (win condition)
    const distToCenter = Math.sqrt(
      (ball.x - targetHole.x) ** 2 + (ball.y - targetHole.y) ** 2
    );
    if (distToCenter < targetHole.innerRadius - ball.radius) {
      setGameState("won");
      return;
    }

    // Target ring collision (bounces off the rings)
    if (distToCenter > targetHole.innerRadius && distToCenter < targetHole.outerRadius + 14) {
      // Calculate bounce direction
      const angle = Math.atan2(ball.y - targetHole.y, ball.x - targetHole.x);
      const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
      ball.dx = Math.cos(angle) * speed;
      ball.dy = Math.sin(angle) * speed;
    }
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
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      gameRef.current.paddle.x = Math.max(
        0,
        Math.min(x - gameRef.current.paddle.width / 2, canvas.width - gameRef.current.paddle.width)
      );
    };

    const handleTouchMove = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !e.touches[0]) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      gameRef.current.paddle.x = Math.max(
        0,
        Math.min(x - gameRef.current.paddle.width / 2, canvas.width - gameRef.current.paddle.width)
      );
    };

    if (isOpen) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fade-in">
      <div className="relative bg-background rounded-2xl p-4 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        {/* Score */}
        <div className="absolute top-3 left-4 text-foreground font-bold text-lg">
          Score: {score}
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={400}
          height={550}
          className="rounded-xl mt-8"
        />

        {/* Game over overlay */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-2xl">
            <h2 className="text-3xl font-bold text-white mb-4">
              {gameState === "won" ? "🎉 You Win!" : "💥 Game Over"}
            </h2>
            <p className="text-white/80 mb-6">Score: {score}</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrickBreakerGame;
