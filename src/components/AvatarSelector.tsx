import { useState } from "react";
import { Check } from "lucide-react";
import { avatarOptions, AvatarOption } from "@/data/avatars";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AvatarSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAvatarId: string | null;
  onSelect: (avatar: AvatarOption) => void;
}

const AvatarSelector = ({
  open,
  onOpenChange,
  selectedAvatarId,
  onSelect,
}: AvatarSelectorProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Choose your avatar</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-3 overflow-y-auto max-h-[50vh] p-1">
          {/* No avatar option */}
          <button
            onClick={() => {
              onSelect({ id: "", name: "None", src: "" });
              onOpenChange(false);
            }}
            className={cn(
              "relative aspect-square rounded-xl overflow-hidden transition-all duration-200",
              "hover:scale-105 hover:ring-2 hover:ring-primary/50",
              "focus:outline-none focus:ring-2 focus:ring-primary",
              "bg-white/10 flex items-center justify-center",
              (!selectedAvatarId || selectedAvatarId === "") && "ring-2 ring-primary"
            )}
          >
            <span className="text-muted-foreground text-xs font-medium">None</span>
            {(!selectedAvatarId || selectedAvatarId === "") && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            )}
          </button>
          {avatarOptions.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => {
                onSelect(avatar);
                onOpenChange(false);
              }}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden transition-all duration-200",
                "hover:scale-105 hover:ring-2 hover:ring-primary/50",
                "focus:outline-none focus:ring-2 focus:ring-primary",
                selectedAvatarId === avatar.id && "ring-2 ring-primary"
              )}
            >
              <img
                src={avatar.src}
                alt={avatar.name}
                className="w-full h-full object-cover bg-white/10"
              />
              {selectedAvatarId === avatar.id && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarSelector;
