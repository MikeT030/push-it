import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import smallCircleIcon from "@/assets/small-circle-icon.svg";
import { Button } from "@/components/ui/button";
import PastChallengesContent from "@/components/PastChallengesContent";

const PastChallengesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-6 safe-top pt-12 pb-12">
      <div className="w-full max-w-sm animate-fade-in mt-10 -translate-y-3">
        <div className="mb-2 -ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10 border border-foreground text-foreground hover:bg-foreground hover:text-background"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

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