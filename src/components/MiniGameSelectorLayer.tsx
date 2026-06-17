import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface MiniGameSelectorLayerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBrickBreaker: () => void;
  onSelectSpaceShooter: () => void;
}

const MiniGameSelectorLayer = ({
  isOpen,
  onClose,
  onSelectBrickBreaker,
  onSelectSpaceShooter,
}: MiniGameSelectorLayerProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] min-h-[100dvh] w-screen backdrop-blur-xl bg-[#0F1922]/40 flex flex-col" onClick={onClose}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-[max(16px,env(safe-area-inset-top,0px))] right-4 z-[10000] p-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        aria-label="Close"
      >
        <X size={20} />
      </button>
      <div className="flex-1 min-h-[100dvh] flex flex-col items-center justify-center px-6 py-20" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl text-foreground font-semibold text-center mb-10">Choose a Game</h2>
        <div className="w-full max-w-sm flex gap-4">
          <button
            onClick={onSelectBrickBreaker}
            className="flex-1 p-6 rounded-2xl border border-white bg-transparent hover:bg-white/5 transition-all text-left"
          >
            <p className="font-semibold text-foreground text-lg">🧱 Brick Breaker</p>
            <p className="text-sm text-muted-foreground mt-1">Classic brick-breaking action</p>
          </button>
          <button
            onClick={onSelectSpaceShooter}
            className="flex-1 p-6 rounded-2xl border border-white bg-transparent hover:bg-white/5 transition-all text-left"
          >
            <p className="font-semibold text-foreground text-lg">🚀 Space Shooter</p>
            <p className="text-sm text-muted-foreground mt-1">Blast falling objects in space</p>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MiniGameSelectorLayer;