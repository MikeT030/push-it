import { useState, useEffect, useCallback } from "react";

interface MuscleParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  delay: number;
  duration: number;
}

interface MuscleConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

const MuscleConfetti = ({ trigger, onComplete }: MuscleConfettiProps) => {
  const [particles, setParticles] = useState<MuscleParticle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const generateParticles = useCallback(() => {
    const newParticles: MuscleParticle[] = [];
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100, // Random x position (0-100%)
        y: -10, // Start above viewport
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.8,
        delay: Math.random() * 0.5,
        duration: 1.5 + Math.random() * 1,
      });
    }

    return newParticles;
  }, []);

  useEffect(() => {
    if (trigger && !isAnimating) {
      setIsAnimating(true);
      setParticles(generateParticles());

      const timeout = setTimeout(() => {
        setIsAnimating(false);
        setParticles([]);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [trigger, isAnimating, generateParticles, onComplete]);

  if (!isAnimating || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-muscle-fall"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        >
          <span className="text-3xl">💪</span>
        </div>
      ))}
    </div>
  );
};

export default MuscleConfetti;
