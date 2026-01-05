import { useEffect, useState } from "react";
import pushUpsImage from "@/assets/push-ups.png";

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
      {/* Target Icon - Concentric circles */}
      <div className="relative w-40 h-40 flex items-center justify-center mb-8">
      {/* Outer circle - Teal with pulse */}
        <div className="absolute w-40 h-40 rounded-full border-[6px] border-[#0ABAB5] animate-pulse" />
        {/* Middle circle - Purple/Magenta */}
        <div className="absolute w-28 h-28 rounded-full border-[6px] border-[#C029DE]" />
        {/* Inner circle - Blue */}
        <div className="absolute w-16 h-16 rounded-full border-[6px] border-[#4300FF]" />
        {/* Center filled circle */}
        <div className="absolute w-6 h-6 rounded-full bg-[#4300FF]" />
      </div>

      {/* App name with push-ups icon */}
      <div className="flex items-center gap-2">
        <h1 className="text-5xl font-black tracking-tight text-foreground">
          Push-it
        </h1>
        <img 
          src={pushUpsImage} 
          alt="Person doing push-ups" 
          className="h-12 w-auto"
        />
      </div>
      
      <p className="mt-3 text-muted-foreground text-lg font-medium">
        30k push-up challenge
      </p>
    </div>
  );
};

export default SplashScreen;
