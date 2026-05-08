import { useEffect, useRef, useState, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { getMessageHistory, fetchMessageById, sendMessage, MessageRow } from "@/api/messages";
import { getReactionsForMessages, ReactionRow } from "@/api/reactions";

export interface OptimisticMessage extends MessageRow {
  status?: "sending" | "sent" | "failed";
}

export interface SendPayload {
  body?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  replyToId?: string;
  replyToPreview?: MessageRow;
}

export function useChannelMessages(channelId: string | undefined) {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const pendingTempIds = useRef<Set<string>>(new Set());
  const rtChannel = useRef<RealtimeChannel | null>(null);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const loadInitial = useCallback(async () => {
    if (!channelId) {
      setMessages([]);
      setReactions([]);
      setHasMore(true);
      setLoading(false);
      return;
    }
    if (authLoading) return;
    if (!user?.id) {
      setMessages([]);
      setReactions([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const rows = await getMessageHistory(channelId);
      setMessages(rows);
      setHasMore(rows.length === 50);
      const r = await getReactionsForMessages(rows.map((m) => m.id));
      setReactions(r);
    } catch (error) {
      console.error("Failed to load channel messages", error);
      toast.error("Could not load messages right now.");
      setMessages([]);
      setReactions([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [authLoading, channelId, user?.id]);

  const loadOlder = useCallback(async () => {
    if (!channelId || messages.length === 0) return;
    try {
      const oldest = messages[0].created_at;
      const older = await getMessageHistory(channelId, oldest);
      if (older.length < 50) setHasMore(false);
      setMessages((prev) => [...older, ...prev]);
      const r = await getReactionsForMessages(older.map((m) => m.id));
      setReactions((prev) => [...prev, ...r]);
    } catch (error) {
      console.error("Failed to load older messages", error);
      toast.error("Could not load older messages.");
    }
  }, [channelId, messages]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!channelId || authLoading || !user?.id) return;
    const ch = supabase.channel(`messages:${channelId}:${Math.random().toString(36).slice(2)}`);
    rtChannel.current = ch;

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

    ch.on("broadcast", { event: "typing" }, ({ payload }) => {
      const { userId, name } = payload as { userId: string; name: string };
      if (userId === user?.id) return;
      const existing = typingTimers.current.get(userId);
      if (existing) clearTimeout(existing);
      setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
      const timer = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((n) => n !== name));
        typingTimers.current.delete(userId);
      }, 3000);
      typingTimers.current.set(userId, timer);
    });

    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
      rtChannel.current = null;
      typingTimers.current.forEach((t) => clearTimeout(t));
      typingTimers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, channelId, user?.id]);

  const broadcastTyping = useCallback(
    (name: string) => {
      if (!user || !rtChannel.current) return;
      rtChannel.current.send({ type: "broadcast", event: "typing", payload: { userId: user.id, name } });
    },
    [user]
  );

  const send = useCallback(
    async (payload: SendPayload) => {
      if (!channelId || !user) return;
      const { body = "", attachmentUrl, attachmentType, replyToId, replyToPreview } = payload;
      if (!body.trim() && !attachmentUrl) return;

      const tempId = crypto.randomUUID();
      pendingTempIds.current.add(tempId);

      const optimistic: OptimisticMessage = {
        id: `temp:${tempId}`,
        channel_id: channelId,
        sender_id: user.id,
        body: body.trim() || null,
        attachment_url: attachmentUrl ?? null,
        attachment_type: attachmentType ?? null,
        reply_to_id: replyToId ?? null,
        reply_to: replyToPreview
          ? { id: replyToPreview.id, body: replyToPreview.body, sender_id: replyToPreview.sender_id, deleted_at: replyToPreview.deleted_at, sender: replyToPreview.sender }
          : null,
        client_temp_id: tempId,
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
        deleted_by: null,
        status: "sending",
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const sent = await sendMessage(channelId, body, tempId, user.id, { attachmentUrl, attachmentType, replyToId });
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...sent, status: "sent" } : m)));
      } catch {
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, status: "failed" } : m)));
        pendingTempIds.current.delete(tempId);
        toast.error("Failed to send message. Tap to retry.");
      }
    },
    [channelId, user]
  );

  return { messages, reactions, loading, hasMore, loadOlder, send, reload: loadInitial, typingUsers, broadcastTyping };
}
