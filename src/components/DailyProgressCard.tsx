import ProgressRing from "@/components/ProgressRing";
import ShareIcon from "@/components/ShareIcon";
import { Button } from "@/components/ui/button";

interface DailyProgressCardProps {
  currentCount: number;
  dailyTarget: number;
  progress: number;
  inputValue: string;
  isEditable: boolean;
  onInputChange: (value: string) => void;
  onShare: () => void;
}

const DailyProgressCard = ({
  currentCount,
  dailyTarget,
  progress,
  inputValue,
  isEditable,
  onInputChange,
  onShare,
}: DailyProgressCardProps) => {
  return (
    <div className="bg-card rounded-2xl p-6 mb-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start">
          <p className="text-sm text-muted-foreground font-medium mb-1">
            Today
          </p>
          {isEditable ? (
            <input
              type="number"
              inputMode="numeric"
              value={inputValue}
              onChange={e => onInputChange(e.target.value)}
              placeholder="0"
              className="text-5xl font-black text-foreground bg-transparent border-none outline-none w-32 focus:ring-0 placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          ) : (
            <p className="text-5xl font-black text-foreground">
              {currentCount}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            of {dailyTarget} target
          </p>
        </div>
        <ProgressRing 
          progress={progress} 
          size={120} 
          strokeWidth={12} 
          enableGame={true} 
          enableAnimation={false} 
          enableOuterGlow={true} 
        />
      </div>

      {!isEditable && (
        <p className="mt-6 text-center text-muted-foreground text-sm">
          Future dates cannot be edited
        </p>
      )}

      {/* Share Button */}
      <Button 
        variant="outline" 
        onClick={onShare} 
        className="w-full h-12 mt-6 bg-[#0ABAB5]/10 border-[#0ABAB5] text-[#0ABAB5] hover:bg-[#0ABAB5] hover:text-white active:bg-[#0ABAB5]/25 active:text-white"
      >
        <ShareIcon className="mr-2" size={16} />
        Share Progress
      </Button>
    </div>
  );
};

export default DailyProgressCard;
