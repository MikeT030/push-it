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
  const [gameState, setGameState] = useState<"playing" | "waiting" | "lost">("waiting");
  const [score, setScore] = useState(0);
  
  const gameRef = useRef({
    ball: { x: 200, y: 450, dx: 0, dy: 0, radius: 8 } as Ball,
    paddle: { x: 150, y: 520, width: 100, height: 12 } as Paddle,
    bricks: [] as Brick[],
    targetHole: { x: 200, y: 250, innerRadius: 26, outerRadius: 80 },
    ballOnPaddle: true,
    ringHits: { outer: 0, middle: 0, inner: 0 },
    ringDestroyed: { outer: false, middle: false, inner: false },
  });

  const resetBallToPaddle = useCallback(() => {
    const { paddle } = gameRef.current;
    gameRef.current.ball = {
      x: paddle.x + paddle.width / 2,
      y: paddle.y - 10,
      dx: 0,
      dy: 0,
      radius: 8,
    };
    gameRef.current.ballOnPaddle = true;
    setGameState("waiting");
  }, []);

  const launchBall = useCallback(() => {
    if (gameRef.current.ballOnPaddle && gameState === "waiting") {
      gameRef.current.ball.dx = 4;
      gameRef.current.ball.dy = -5;
      gameRef.current.ballOnPaddle = false;
      setGameState("playing");
    }
  }, [gameState]);

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
      ball: { x: 200, y: 510, dx: 0, dy: 0, radius: 8 },
      paddle: { x: 150, y: 520, width: 100, height: 12 },
      bricks,
      targetHole: { x: 200, y: 220, innerRadius: 26, outerRadius: 80 },
      ballOnPaddle: true,
      ringHits: { outer: 0, middle: 0, inner: 0 },
      ringDestroyed: { outer: false, middle: false, inner: false },
    };
    setScore(0);
    setGameState("waiting");
  }, []);

  const drawTarget = useCallback((ctx: CanvasRenderingContext2D) => {
    const { targetHole, ringDestroyed } = gameRef.current;
    const { x, y, outerRadius } = targetHole;
    
    // Gap angle at the bottom for entry (in radians)
    const gapAngle = 0.6; // Width of the gap
    const gapStart = Math.PI / 2 - gapAngle; // Start just before bottom
    const gapEnd = Math.PI / 2 + gapAngle; // End just after bottom
    
    // Outer circle - Teal (with gap at bottom)
    if (!ringDestroyed.outer) {
      ctx.beginPath();
      ctx.arc(x, y, outerRadius, gapEnd, gapStart + Math.PI * 2);
      ctx.strokeStyle = "#0ABAB5";
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Middle circle - Purple/Magenta (with gap at bottom)
    if (!ringDestroyed.middle) {
      ctx.beginPath();
      ctx.arc(x, y, 60, gapEnd, gapStart + Math.PI * 2);
      ctx.strokeStyle = "#C029DE";
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Inner circle - Blue (with gap at bottom)
    if (!ringDestroyed.inner) {
      ctx.beginPath();
      ctx.arc(x, y, 40, gapEnd, gapStart + Math.PI * 2);
      ctx.strokeStyle = "#4300FF";
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.stroke();
    }
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
    if (!canvas || gameState !== "playing") {
      // Still update ball position when waiting (on paddle)
      if (gameRef.current.ballOnPaddle) {
        const { paddle } = gameRef.current;
        gameRef.current.ball.x = paddle.x + paddle.width / 2;
        gameRef.current.ball.y = paddle.y - 10;
      }
      return;
    }

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

    // Check if ball is in the gap area (bottom entry)
    const angleToCenter = Math.atan2(ball.y - targetHole.y, ball.x - targetHole.x);
    const gapAngle = 0.6;
    const isInGap = angleToCenter > (Math.PI / 2 - gapAngle) && angleToCenter < (Math.PI / 2 + gapAngle);
    
    // Check if ball goes through the hole - score 100 points and reset to paddle
    const distToCenter = Math.sqrt(
      (ball.x - targetHole.x) ** 2 + (ball.y - targetHole.y) ** 2
    );
    if (distToCenter < targetHole.innerRadius - ball.radius) {
      setScore((s) => s + 100);
      resetBallToPaddle();
      return;
    }

    // Target ring collision (bounces off the rings, but not in gap area)
    const { ringDestroyed, ringHits } = gameRef.current;
    const lineWidth = 7; // Half of the stroke width (14/2)
    
    // Define ring radii
    const outerRingRadius = targetHole.outerRadius;
    const middleRingRadius = 60;
    const innerRingRadius = 40;
    
    // Check collision with each ring (from outer to inner)
    if (!isInGap) {
      // Outer ring collision (radius 80, lineWidth 7 -> hits between 73-87)
      if (!ringDestroyed.outer && 
          distToCenter > outerRingRadius - lineWidth && 
          distToCenter < outerRingRadius + lineWidth) {
        ringHits.outer++;
        setScore((s) => s + 1);
        if (ringHits.outer >= 10) {
          ringDestroyed.outer = true;
          setScore((s) => s + 50);
        }
        // Bounce
        const angle = Math.atan2(ball.y - targetHole.y, ball.x - targetHole.x);
        const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
        ball.dx = Math.cos(angle) * speed;
        ball.dy = Math.sin(angle) * speed;
      }
      // Middle ring collision (radius 60)
      else if (!ringDestroyed.middle && 
          distToCenter > middleRingRadius - lineWidth && 
          distToCenter < middleRingRadius + lineWidth) {
        ringHits.middle++;
        setScore((s) => s + 1);
        if (ringHits.middle >= 20) {
          ringDestroyed.middle = true;
          setScore((s) => s + 100);
        }
        // Bounce
        const angle = Math.atan2(ball.y - targetHole.y, ball.x - targetHole.x);
        const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
        ball.dx = Math.cos(angle) * speed;
        ball.dy = Math.sin(angle) * speed;
      }
      // Inner ring collision (radius 40)
      else if (!ringDestroyed.inner && 
          distToCenter > innerRingRadius - lineWidth && 
          distToCenter < innerRingRadius + lineWidth) {
        ringHits.inner++;
        setScore((s) => s + 1);
        if (ringHits.inner >= 50) {
          ringDestroyed.inner = true;
          setScore((s) => s + 200);
        }
        // Bounce
        const angle = Math.atan2(ball.y - targetHole.y, ball.x - targetHole.x);
        const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
        ball.dx = Math.cos(angle) * speed;
        ball.dy = Math.sin(angle) * speed;
      }
    }
  }, [gameState, resetBallToPaddle]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    update();
    draw(ctx);

    if (gameState === "playing" || gameState === "waiting") {
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
          className="rounded-xl mt-8 cursor-pointer"
          onClick={launchBall}
          onTouchStart={launchBall}
        />

        {/* Tap to start hint */}
        {gameState === "waiting" && (
          <div className="absolute inset-0 flex items-end justify-center pb-24 pointer-events-none">
            <p className="text-white/70 text-sm animate-pulse">Tap to launch</p>
          </div>
        )}

        {/* Game over overlay */}
        {gameState === "lost" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-2xl">
            <h2 className="text-3xl font-bold text-white mb-4">
              💥 Game Over
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
