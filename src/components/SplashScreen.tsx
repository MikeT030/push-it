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
      style={{
        backgroundColor: "#101214",
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.14 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"), radial-gradient(ellipse at top left, #0C2544 0%, #101214 90%)`,
        backgroundAttachment: "fixed"
      }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-500 ${
        isExiting ? "opacity-0 scale-110" : "opacity-100 scale-100"
      }`}
    >
      {/* Target Icon - Concentric circles */}
      <div className="relative w-40 h-40 flex items-center justify-center mb-8">
        {/* Outer circle - Teal: 160x160px, 14pt stroke inside */}
        <div className="absolute w-[160px] h-[160px] rounded-full border-[14px] border-[#0ABAB5] box-border" />
        {/* Middle circle - Purple/Magenta: 120x120px, 14pt stroke inside */}
        <div className="absolute w-[120px] h-[120px] rounded-full border-[14px] border-[#C029DE] box-border" />
        {/* Inner circle - Blue: 80x80px, 14pt stroke inside */}
        <div className="absolute w-[80px] h-[80px] rounded-full border-[14px] border-[#7036FF] box-border" />
      </div>

      {/* App name */}
      <h1 className="text-5xl font-black tracking-tight text-foreground">
        Push-it
      </h1>
      
      <p className="mt-3 text-muted-foreground text-lg font-medium">
        30k push-up challenge
      </p>
    </div>
  );
};

export default SplashScreen;
