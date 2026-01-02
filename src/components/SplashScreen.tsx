import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-all duration-500 ${
        isExiting ? "opacity-0 scale-110" : "opacity-100 scale-100"
      }`}
    >
      <div className="relative">
        {/* Animated rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border-4 border-primary/20 animate-ping" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-2 border-primary/40 animate-pulse" />
        </div>
        
        {/* Logo/Icon */}
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/30">
          <svg
            className="w-14 h-14 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
      </div>

      <h1 className="mt-8 text-5xl font-black tracking-tight text-foreground">
        Push-it
      </h1>
      <p className="mt-2 text-muted-foreground text-lg font-medium">
        30,000 push-ups challenge
      </p>
      
      {/* Loading indicator */}
      <div className="mt-12 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default SplashScreen;
