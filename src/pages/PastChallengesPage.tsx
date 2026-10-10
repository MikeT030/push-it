import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import smallCircleIcon from "@/assets/small-circle-icon.svg";
import PastChallengesContent from "@/components/PastChallengesContent";

const PastChallengesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center px-6 safe-top pt-12 pb-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute right-6 z-20 w-10 h-10 rounded-full flex items-center justify-center border border-[#3B404F] hover:bg-white/5 transition-colors"
        style={{ top: "calc(env(safe-area-inset-top, 20px) + 20px)" }}
        aria-label="Close"
      >
        <X className="w-5 h-5 text-foreground" />
      </button>

      <div className="w-full max-w-sm animate-fade-in mt-10 -translate-y-3">


        <header className="text-center mb-8 flex flex-col items-center">
          <img src={smallCircleIcon} alt="" className="w-20 h-20 mb-4" />
          <h1 className="font-black text-foreground text-2xl">Past Challenges</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Every goal you reach gets archived here.
          </p>
        </header>

        <PastChallengesContent />

        <p className="text-center text-muted-foreground/50 text-xs mt-8">
          Your story, one goal at a time.
        </p>
      </div>
    </div>
  );
};

export default PastChallengesPage;