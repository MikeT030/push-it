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
          <div className="flex items-start justify-between mb-6 mt-5">
            <img src={smallCircleIcon} alt="" className="w-14 h-14 mt-1" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOpen(false)}
              className="w-10 h-10 rounded-full border-border"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <header className="text-center mb-8 flex flex-col items-center">
            <SheetTitle className="text-3xl font-black text-foreground">Past Challenges</SheetTitle>
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