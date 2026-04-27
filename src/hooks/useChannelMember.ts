import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export function useChannelMember(channelId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const lastMarkRef = useRef<number>(0);

  const query = useQuery({
    queryKey: ["channelMember", channelId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("channel_members")
        .select("last_read_at, is_muted")
        .eq("channel_id", channelId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!channelId && !!user?.id,
  });

  const muteMutation = useMutation({
    mutationFn: async (muted: boolean) => {
      const { error } = await supabase
        .from("channel_members")
        .update({ is_muted: muted })
        .eq("channel_id", channelId!)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["channelMember", channelId, user?.id] });
      qc.invalidateQueries({ queryKey: ["myChannels", user?.id] });
    },
  });

  const markRead = async () => {
    const now = Date.now();
    if (now - lastMarkRef.current < 5000) return;
    lastMarkRef.current = now;
    if (!channelId || !user?.id) return;
    await supabase
      .from("channel_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("channel_id", channelId)
      .eq("user_id", user.id);
    qc.invalidateQueries({ queryKey: ["myChannels", user.id] });
  };

  useEffect(() => {
    if (channelId && user?.id) markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, user?.id]);

  return { membership: query.data, toggleMute: muteMutation.mutate, markRead };
}