import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getMembersForCarousel, type CarouselMember } from "@/api/member-carousel";

export function useMemberCarousel() {
  const { user } = useAuth();
  return useQuery<CarouselMember[]>({
    queryKey: ["memberCarousel", user?.id],
    queryFn: async () => {
      const members = await getMembersForCarousel(user!.id);
      // newest joiners first
      return [...members].sort((a, b) => {
        const ta = a.created_at ? Date.parse(a.created_at) : 0;
        const tb = b.created_at ? Date.parse(b.created_at) : 0;
        return tb - ta;
      });
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
