import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/api/direct-messages";
import { useAuth } from "./useAuth";

export function useConversations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: getConversations,
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useTotalUnreadDMs() {
  const { data } = useConversations();
  return (data ?? []).reduce((sum, c) => sum + c.unread_count, 0);
}
