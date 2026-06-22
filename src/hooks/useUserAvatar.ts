import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getAvatarById } from "@/data/avatars";

const STALE_MS = 5 * 60_000;

export const useUserAvatar = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const { data: avatarId = null, isLoading } = useQuery({
    queryKey: ["avatar", userId],
    enabled: !!userId,
    staleTime: STALE_MS,
    queryFn: async (): Promise<string | null> => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId!)
        .maybeSingle();
      return data?.avatar_url ?? null;
    },
  });

  const setAvatarId = useCallback(
    (next: string | null) => {
      if (!userId) return;
      queryClient.setQueryData(["avatar", userId], next);
    },
    [queryClient, userId]
  );

  const avatar = getAvatarById(avatarId);

  return { avatarId, avatar, isLoading: !!userId && isLoading, setAvatarId };
};
