import { useEffect, useRef, useState, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import {
  getDirectMessages,
  fetchDirectMessageById,
  sendDirectMessage,
  markConversationRead,
  DirectMessageRow,
} from "@/api/direct-messages";

export interface OptimisticDM extends DirectMessageRow {
  status?: "sending" | "sent" | "failed";
}

export interface DMPayload {
  body?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  replyToId?: string;
  replyToPreview?: DirectMessageRow;
}

export function useDirectMessages(conversationId: string | undefined) {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<OptimisticDM[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const pendingTempIds = useRef<Set<string>>(new Set());
  const rtChannel = useRef<RealtimeChannel | null>(null);

  const loadInitial = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setHasMore(true);
      setLoading(false);
      return;
    }
    if (authLoading) return;
    if (!user?.id) {
      setMessages([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const rows = await getDirectMessages(conversationId);
      setMessages(rows);
      setHasMore(rows.length === 50);
      markConversationRead(conversationId).catch(() => {});
    } catch (error) {
      console.error("Failed to load direct messages", error);
      toast.error("Could not load messages right now.");
      setMessages([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [authLoading, conversationId, user?.id]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || messages.length === 0) return;
    const oldest = messages[0].created_at;
    const older = await getDirectMessages(conversationId, oldest);
    if (older.length < 50) setHasMore(false);
    setMessages((prev) => [...older, ...prev]);
  }, [conversationId, messages]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  useEffect(() => {
    if (!conversationId || authLoading || !user?.id) return;
    const ch = supabase.channel(`dm:${conversationId}:${Math.random().toString(36).slice(2)}`);
    rtChannel.current = ch;

    ch.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "direct_messages", filter: `conversation_id=eq.${conversationId}` },
      async (payload) => {
        const row = payload.new as DirectMessageRow;
        if (row.client_temp_id && pendingTempIds.current.has(row.client_temp_id)) {
          pendingTempIds.current.delete(row.client_temp_id);
          return;
        }
        const full = await fetchDirectMessageById(row.id);
        if (full) {
          setMessages((prev) => prev.some((m) => m.id === full.id) ? prev : [...prev, full]);
          markConversationRead(conversationId).catch(() => {});
        }
      }
    );

    ch.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "direct_messages", filter: `conversation_id=eq.${conversationId}` },
      async (payload) => {
        const row = payload.new as DirectMessageRow;
        const full = await fetchDirectMessageById(row.id);
        if (full) setMessages((prev) => prev.map((m) => m.id === full.id ? full : m));
      }
    );

    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
      rtChannel.current = null;
    };
  }, [authLoading, conversationId, user?.id]);

  const markRead = useCallback(() => {
    if (conversationId) markConversationRead(conversationId).catch(() => {});
  }, [conversationId]);

  const send = useCallback(async (payload: DMPayload) => {
    if (!conversationId || !user) return;
    const { body = "", attachmentUrl, attachmentType, replyToId, replyToPreview } = payload;
    if (!body.trim() && !attachmentUrl) return;

    const tempId = crypto.randomUUID();
    pendingTempIds.current.add(tempId);

    const optimistic: OptimisticDM = {
      id: `temp:${tempId}`,
      conversation_id: conversationId,
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
      sender: null,
      status: "sending",
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const sent = await sendDirectMessage(conversationId, body, tempId, user.id, { attachmentUrl, attachmentType, replyToId });
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? { ...sent, status: "sent" } : m));
    } catch {
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? { ...m, status: "failed" } : m));
      pendingTempIds.current.delete(tempId);
      toast.error("Failed to send message.");
    }
  }, [conversationId, user]);

  return { messages, loading, hasMore, loadOlder, send, markRead };
}
