import { createContext, useContext, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { AvatarOption } from "@/data/avatars";
import AvatarSelector from "@/components/AvatarSelector";
import { toast } from "sonner";

interface AvatarSelectorContextType {
  openAvatarSelector: (defaultTab?: "card" | "avatar") => void;
}

const AvatarSelectorContext = createContext<AvatarSelectorContextType | null>(null);

export const useAvatarSelector = () => {
  const ctx = useContext(AvatarSelectorContext);
  if (!ctx) throw new Error("useAvatarSelector must be used within AvatarSelectorProvider");
  return ctx;
};

export const AvatarSelectorProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { avatarId, setAvatarId } = useUserAvatar();
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"card" | "avatar">("card");

  const openAvatarSelector = useCallback((tab: "card" | "avatar" = "card") => {
    setDefaultTab(tab);
    setIsOpen(true);
  }, []);

  const handleAvatarSelect = async (avatar: AvatarOption) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatar.id || null })
      .eq("id", user.id);
    if (error) {
      toast.error("Failed to save avatar");
      return;
    }
    setAvatarId(avatar.id || null);
    toast.success(avatar.id ? "Avatar updated!" : "Avatar removed!");
  };

  return (
    <AvatarSelectorContext.Provider value={{ openAvatarSelector }}>
      {children}
      <AvatarSelector
        open={isOpen}
        onOpenChange={setIsOpen}
        selectedAvatarId={avatarId}
        onSelect={handleAvatarSelect}
        defaultTab={defaultTab}
      />
    </AvatarSelectorContext.Provider>
  );
};
