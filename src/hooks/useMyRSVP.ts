import { useQuery } from "@tanstack/react-query";
import { getMyRsvp } from "@/api/events";
import { useAuth } from "@/hooks/useAuth";

export function useMyRSVP(eventId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["myRsvp", eventId, user?.id],
    queryFn: () => getMyRsvp(eventId!),
    enabled: !!eventId && !!user?.id,
    staleTime: 15_000,
  });
}
