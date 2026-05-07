import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getMembersForCarousel, type CarouselMember } from "@/api/member-carousel";

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed | 0;
  for (let i = a.length - 1; i > 0; i--) {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    const j = ((s ^ (s >>> 14)) >>> 0) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useMemberCarousel() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  return useQuery<CarouselMember[]>({
    queryKey: ["memberCarousel", user?.id, today],
    queryFn: async () => {
      const members = await getMembersForCarousel(user!.id);
      const seed = parseInt(today.replace(/-/g, ""), 10);
      return seededShuffle(members, seed).slice(0, 14);
    },
    enabled: !!user?.id,
    staleTime: 60 * 60 * 1000,
  });
}
