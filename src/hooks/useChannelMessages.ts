import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { getMessageHistory, fetchMessageById, sendMessage, MessageRow } from "@/api/messages";
import { getReactionsForMessages, ReactionRow } from "@/api/reactions";

export interface OptimisticMessage extends MessageRow {
  status?: "sending" | "sent" | "failed";
}

export function useChannelMessages(channelId: string | undefined) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const pendingTempIds = useRef<Set<string>>(new Set());

  const loadInitial = useCallback(async () => {
    if (!channelId) return;
    setLoading(true);
    const rows = await getMessageHistory(channelId);
    setMessages(rows);
    setHasMore(rows.length === 50);
    const r = await getReactionsForMessages(rows.map((m) => m.id));
    setReactions(r);
    setLoading(false);
  }, [channelId]);

  const loadOlder = useCallback(async () => {
    if (!channelId || messages.length === 0) return;
    const oldest = messages[0].created_at;
    const older = await getMessageHistory(channelId, oldest);
    if (older.length < 50) setHasMore(false);
    setMessages((prev) => [...older, ...prev]);
    const r = await getReactionsForMessages(older.map((m) => m.id));
    setReactions((prev) => [...prev, ...r]);
  }, [channelId, messages]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!channelId) return;
    const ch = supabase.channel(`messages:${channelId}:${Math.random().toString(36).slice(2)}`);
    ch.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
      async (payload) => {
          const row = payload.new as MessageRow;
          if (row.client_temp_id && pendingTempIds.current.has(row.client_temp_id)) {
            pendingTempIds.current.delete(row.client_temp_id);
            return;
          }
          const full = await fetchMessageById(row.id);
          if (full) setMessages((prev) => (prev.some((m) => m.id === full.id) ? prev : [...prev, full]));
      }
    );
    ch.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
      async (payload) => {
          const row = payload.new as MessageRow;
          const full = await fetchMessageById(row.id);
          if (full) setMessages((prev) => prev.map((m) => (m.id === full.id ? full : m)));
      }
    );
    ch.on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, async () => {
      const ids = messages.map((m) => m.id);
      if (ids.length > 0) setReactions(await getReactionsForMessages(ids));
    });
    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  const send = useCallback(
    async (body: string) => {
      if (!channelId || !user) return;
      const tempId = crypto.randomUUID();
      pendingTempIds.current.add(tempId);
      const optimistic: OptimisticMessage = {
        id: `temp:${tempId}`,
        channel_id: channelId,
        sender_id: user.id,
        body,
        client_temp_id: tempId,
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
        deleted_by: null,
        status: "sending",
      };
      setMessages((prev) => [...prev, optimistic]);
      const { error, data } = await supabase
        .from("messages")
        .insert({ channel_id: channelId, body, client_temp_id: tempId, sender_id: user.id })
        .select("id, channel_id, sender_id, body, client_temp_id, created_at, edited_at, deleted_at, deleted_by, sender:users!sender_id(full_name, avatar_url)")
        .single();
      if (error || !data) {
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, status: "failed" } : m)));
        pendingTempIds.current.delete(tempId);
        return;
      }
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...(data as unknown as MessageRow), status: "sent" } : m)));
    },
    [channelId, user]
  );

  return { messages, reactions, loading, hasMore, loadOlder, send, reload: loadInitial };
}