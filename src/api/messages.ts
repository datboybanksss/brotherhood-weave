import { supabase } from "@/lib/supabase";

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

const SELECT =
  "id, channel_id, sender_id, body, attachment_url, attachment_type, reply_to_id, client_temp_id, created_at, edited_at, deleted_at, deleted_by, " +
  "sender:users!sender_id(full_name, avatar_url), " +
  "reply_to:messages!reply_to_id(id, body, sender_id, deleted_at, sender:users!sender_id(full_name))";

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
  const insert: Record<string, unknown> = {
    channel_id: channelId,
    client_temp_id: clientTempId,
    sender_id: senderId,
  };
  if (body.trim()) insert.body = body.trim();
  if (options?.attachmentUrl) {
    insert.attachment_url = options.attachmentUrl;
    insert.attachment_type = options.attachmentType ?? "image";
  }
  if (options?.replyToId) insert.reply_to_id = options.replyToId;

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
