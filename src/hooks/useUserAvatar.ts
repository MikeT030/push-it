import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getAvatarById, AvatarOption } from "@/data/avatars";

export const useUserAvatar = () => {
  const { user } = useAuth();
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchAvatar = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.avatar_url) {
        setAvatarId(data.avatar_url);
      }
      setIsLoading(false);
    };

    fetchAvatar();
  }, [user]);

  const avatar = getAvatarById(avatarId);

  return { avatarId, avatar, isLoading, setAvatarId };
};
