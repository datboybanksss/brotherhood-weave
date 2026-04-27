import { useMyChannels } from "./useMyChannels";

export function useTotalUnreadCount(): number {
  const { data } = useMyChannels();
  if (!data) return 0;
  return data.reduce((sum, c) => sum + (c.unread_count || 0), 0);
}