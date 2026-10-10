import { useState } from "react";
import { X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import smallCircleIcon from "@/assets/small-circle-icon.svg";
import PastChallengesContent from "@/components/PastChallengesContent";

interface PastChallengesPanelProps {
  trigger?: React.ReactNode;
}

const PastChallengesPanel = ({ trigger }: PastChallengesPanelProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="w-full h-12 border-primary bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground">
            Past Challenges
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side="bottom"
        hideCloseButton
        className="h-[100dvh] w-full max-w-none rounded-none border-none p-0 overflow-y-auto bg-background"
      >
        <div className="safe-top px-6 pt-6 pb-12 max-w-sm mx-auto">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border border-[#3B404F] hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <header className="text-center mb-8 mt-5 flex flex-col items-center">
          <img src={smallCircleIcon} alt="" className="w-20 h-20 mb-4" />
          <SheetTitle className="text-2xl font-black text-foreground">Past Challenges</SheetTitle>
          <SheetDescription className="mt-2 text-sm">
            Every goal you reach gets archived here.
          </SheetDescription>
        </header>

          <PastChallengesContent />

          <p className="text-center text-muted-foreground/50 text-xs mt-8">
            Your story, one goal at a time.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PastChallengesPanel;