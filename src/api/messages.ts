import { supabase } from "@/lib/supabase";

export interface MessageRow {
  id: string;
  channel_id: string;
  sender_id: string;
  body: string;
  client_temp_id: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  sender?: { full_name: string; avatar_url: string | null };
}

const SELECT = "id, channel_id, sender_id, body, client_temp_id, created_at, edited_at, deleted_at, deleted_by, sender:users!sender_id(full_name, avatar_url)";

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

export async function sendMessage(channelId: string, body: string, clientTempId: string, senderId: string): Promise<MessageRow> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ channel_id: channelId, body, client_temp_id: clientTempId, sender_id: senderId })
    .select(SELECT)
    .single();
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