import { useMyChannels } from "./useMyChannels";
import { useTotalUnreadDMs } from "./useConversations";

export function useTotalUnreadCount(): number {
  const { data: channels } = useMyChannels();
  const dmUnread = useTotalUnreadDMs();
  const channelUnread = (channels ?? []).reduce((sum, c) => sum + (c.unread_count || 0), 0);
  return channelUnread + dmUnread;
}