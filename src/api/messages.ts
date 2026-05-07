import { supabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

export interface ReplyToPreview {
  id: string;
  body: string | null;
  sender_id: string;
  deleted_at: string | null;
  sender?: { full_name: string };
}

export interface MessageRow {
  id: string;
  channel_id: string;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  reply_to_id: string | null;
  reply_to: ReplyToPreview | null;
  client_temp_id: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  sender?: { full_name: string; avatar_url: string | null };
}

type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

const SELECT =
  "id, channel_id, sender_id, body, client_temp_id, created_at, edited_at, deleted_at, deleted_by, " +
  "sender:users!messages_sender_id_fkey(full_name, avatar_url)";

export async function getMessageHistory(channelId: string, before?: string, limit = 50): Promise<MessageRow[]> {
  let q = supabase.from("messages").select(SELECT).eq("channel_id", channelId).order("created_at", { ascending: false }).limit(limit);
  if (before) q = q.lt("created_at", before);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as unknown as MessageRow[]).reverse();
}

export async function fetchMessageById(id: string): Promise<MessageRow | null> {
  const { data, error } = await supabase.from("messages").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as MessageRow) ?? null;
}

export interface SendOptions {
  attachmentUrl?: string;
  attachmentType?: string;
  replyToId?: string;
}

export async function sendMessage(
  channelId: string,
  body: string,
  clientTempId: string,
  senderId: string,
  options?: SendOptions,
): Promise<MessageRow> {
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    throw new Error("Message body is required");
  }

  const insert: MessageInsert = {
    body: trimmedBody,
    channel_id: channelId,
    client_temp_id: clientTempId,
    sender_id: senderId,
  };
  if (options?.attachmentUrl || options?.replyToId) {
    console.warn("Attachments and replies are not supported by the current messages schema yet.");
  }

  const { data, error } = await supabase.from("messages").insert(insert).select(SELECT).single();
  if (error) throw error;
  return data as unknown as MessageRow;
}

export async function editMessage(id: string, body: string): Promise<void> {
  const { error } = await supabase.from("messages").update({ body }).eq("id", id);
  if (error) throw error;
}

export async function softDeleteMessage(id: string): Promise<void> {
  const { error } = await supabase.from("messages").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
