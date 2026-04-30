import { useQuery } from "@tanstack/react-query";
import { getUserMonthlyStats, getUserStreak } from "@/api/fitness";
import { useAuth } from "@/hooks/useAuth";

export function useMyMonthlyStats(monthStart: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["myMonthlyStats", user?.id, monthStart],
    queryFn: async () => {
      const [stats, streak] = await Promise.all([
        getUserMonthlyStats(user!.id, monthStart),
        getUserStreak(user!.id),
      ]);
      return { ...stats, streak };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}

export function useMemberMonthlyStats(userId: string | undefined, monthStart: string) {
  return useQuery({
    queryKey: ["memberMonthlyStats", userId, monthStart],
    queryFn: async () => {
      const [stats, streak] = await Promise.all([
        getUserMonthlyStats(userId!, monthStart),
        getUserStreak(userId!),
      ]);
      return { ...stats, streak };
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
}
