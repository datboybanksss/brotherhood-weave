import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getMyCurrentPartners, getCurrentWeekStartSAST, getWeekEndDate } from "@/api/peers";

export function useCurrentPeerPartner() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["currentPeerPartner", user?.id],
    queryFn: async () => {
      const partners = await getMyCurrentPartners(user!.id);
      const week = getCurrentWeekStartSAST();
      return { partners, weekEnd: getWeekEndDate(week) };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}
