import { supabase } from "@/lib/supabase";

export interface ChannelListItem {
  id: string;
  slug: string;
  name: string;
  channel_type: "general" | "announcements" | "department";
  description: string | null;
  is_admin_post_only: boolean;
  display_order: number;
  is_muted: boolean;
  last_read_at: string;
  last_message: { body: string; sender_name: string; created_at: string; deleted_at: string | null } | null;
  unread_count: number;
}

export async function getMyChannels(userId: string): Promise<ChannelListItem[]> {
  const { data: memberships, error } = await supabase
    .from("channel_members")
    .select("last_read_at, is_muted, channels(id, slug, name, channel_type, description, is_admin_post_only, display_order)")
    .eq("user_id", userId);
  if (error) throw error;

  const items = (memberships ?? []).map((m: any) => ({
    ...m.channels,
    last_read_at: m.last_read_at,
    is_muted: m.is_muted,
  })) as Array<Omit<ChannelListItem, "last_message" | "unread_count">>;

  const enriched = await Promise.all(
    items.map(async (c) => {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("body, created_at, deleted_at, users:sender_id(full_name)")
        .eq("channel_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: unread } = await supabase.rpc("get_unread_count", {
        _channel_id: c.id,
        _user_id: userId,
      });
      const senderName = (lastMsg as any)?.users?.full_name?.split(" ")[0] ?? "";
      return {
        ...c,
        last_message: lastMsg
          ? {
              body: (lastMsg as any).body,
              sender_name: senderName,
              created_at: (lastMsg as any).created_at,
              deleted_at: (lastMsg as any).deleted_at,
            }
          : null,
        unread_count: (unread as number) ?? 0,
      } as ChannelListItem;
    })
  );

  enriched.sort((a, b) => {
    const ta = a.last_message?.created_at ?? "";
    const tb = b.last_message?.created_at ?? "";
    if (ta && tb) return tb.localeCompare(ta);
    if (ta) return -1;
    if (tb) return 1;
    return a.display_order - b.display_order;
  });
  return enriched;
}

export async function getChannelBySlug(slug: string) {
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}

export async function getChannelMemberCount(channelId: string): Promise<number> {
  const { count, error } = await supabase
    .from("channel_members")
    .select("user_id", { count: "exact", head: true })
    .eq("channel_id", channelId);
  if (error) throw error;
  return count ?? 0;
}