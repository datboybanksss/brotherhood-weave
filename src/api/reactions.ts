import { supabase } from "@/lib/supabase";

export interface ReactionRow {
  message_id: string;
  user_id: string;
  emoji: string;
}

export async function getReactionsForMessages(messageIds: string[]): Promise<ReactionRow[]> {
  if (messageIds.length === 0) return [];
  const { data, error } = await supabase
    .from("message_reactions")
    .select("message_id, user_id, emoji")
    .in("message_id", messageIds);
  if (error) throw error;
  return (data ?? []) as ReactionRow[];
}

export async function toggleReaction(messageId: string, userId: string, emoji: string): Promise<void> {
  const { data: existing } = await supabase
    .from("message_reactions")
    .select("emoji")
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("message_reactions")
      .insert({ message_id: messageId, user_id: userId, emoji });
    if (error) throw error;
  }
}