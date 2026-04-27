import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { getMyChannels } from "@/api/channels";

export function useMyChannels() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["myChannels", user?.id],
    queryFn: () => getMyChannels(user!.id),
    enabled: !!user?.id,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase.channel(`my-channels:${user.id}:${Math.random().toString(36).slice(2)}`);
    ch.on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
      qc.invalidateQueries({ queryKey: ["myChannels", user.id] });
    });
    ch.on("postgres_changes", { event: "UPDATE", schema: "public", table: "channel_members", filter: `user_id=eq.${user.id}` }, () => {
      qc.invalidateQueries({ queryKey: ["myChannels", user.id] });
    });
    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, qc]);

  return query;
}