import { supabase } from "@/lib/supabase";

export interface DMReplyPreview {
  id: string;
  body: string | null;
  sender_id: string;
  deleted_at: string | null;
  sender: { full_name: string } | null;
}

export interface DirectMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  reply_to_id: string | null;
  reply_to: DMReplyPreview | null;
  client_temp_id: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  sender: { full_name: string; avatar_url: string | null } | null;
}

export interface ConversationSummary {
  id: string;
  other_user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    last_seen_at: string | null;
    ring_color: string | null;
  };
  last_message: {
    body: string | null;
    attachment_url: string | null;
    created_at: string;
    sender_id: string;
  } | null;
  unread_count: number;
}

export interface OtherUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  last_seen_at: string | null;
  ring_color: string | null;
}

const DM_SELECT = `
  id, conversation_id, sender_id, body, attachment_url, attachment_type,
  reply_to_id, client_temp_id, created_at, edited_at, deleted_at, deleted_by,
  sender:users!sender_id(full_name, avatar_url),
  reply_to:direct_messages!reply_to_id(id, body, sender_id, deleted_at, sender:users!sender_id(full_name))
` as const;

export async function getOrCreateConversation(otherUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc("get_or_create_conversation", { other_user_id: otherUserId });
  if (error) throw error;
  return data as string;
}

export async function getConversations(): Promise<ConversationSummary[]> {
  const { data, error } = await supabase.rpc("get_my_conversations");
  if (error) throw error;
  return ((data as any[]) ?? []).map((row) => ({
    id: row.conversation_id,
    other_user: {
      id: row.other_user_id,
      full_name: row.other_full_name,
      avatar_url: row.other_avatar_url,
      last_seen_at: row.other_last_seen_at,
      ring_color: row.other_ring_color,
    },
    last_message: row.last_message_created_at
      ? {
          body: row.last_message_body,
          attachment_url: row.last_message_attachment_url,
          created_at: row.last_message_created_at,
          sender_id: row.last_message_sender_id,
        }
      : null,
    unread_count: Number(row.unread_count ?? 0),
  }));
}

export async function getConversationOtherUser(conversationId: string): Promise<OtherUser | null> {
  const { data, error } = await supabase.rpc("get_conversation_other_user", { conv_id: conversationId });
  if (error) return null;
  const rows = data as OtherUser[] | null;
  return rows?.[0] ?? null;
}

export async function getDirectMessages(conversationId: string, before?: string): Promise<DirectMessageRow[]> {
  let q = supabase
    .from("direct_messages")
    .select(DM_SELECT)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (before) q = q.lt("created_at", before);
  const { data, error } = await q;
  if (error) throw error;
  return ((data as unknown as DirectMessageRow[]) ?? []).reverse();
}

export async function fetchDirectMessageById(id: string): Promise<DirectMessageRow | null> {
  const { data, error } = await supabase
    .from("direct_messages")
    .select(DM_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data as unknown as DirectMessageRow | null;
}

export async function sendDirectMessage(
  conversationId: string,
  body: string,
  clientTempId: string,
  senderId: string,
  opts: { attachmentUrl?: string; attachmentType?: string; replyToId?: string } = {}
): Promise<DirectMessageRow> {
  const payload: Record<string, unknown> = {
    conversation_id: conversationId,
    sender_id: senderId,
    client_temp_id: clientTempId,
  };
  const trimmed = body.trim();
  if (trimmed) payload.body = trimmed;
  if (opts.attachmentUrl) {
    payload.attachment_url = opts.attachmentUrl;
    payload.attachment_type = opts.attachmentType ?? "image";
  }
  if (opts.replyToId) payload.reply_to_id = opts.replyToId;

  const { data, error } = await supabase
    .from("direct_messages")
    .insert(payload)
    .select(DM_SELECT)
    .single();
  if (error) throw error;
  return data as unknown as DirectMessageRow;
}

export async function editDirectMessage(id: string, body: string): Promise<void> {
  const { error } = await supabase
    .from("direct_messages")
    .update({ body: body.trim(), edited_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function softDeleteDirectMessage(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("direct_messages")
    .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id ?? null })
    .eq("id", id);
  if (error) throw error;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);
}
