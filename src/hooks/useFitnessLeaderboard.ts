import { useQuery } from "@tanstack/react-query";
import { getMonthlyLeaderboard } from "@/api/fitness";

export function useFitnessLeaderboard(monthStart: string) {
  return useQuery({
    queryKey: ["fitnessLeaderboard", monthStart],
    queryFn: () => getMonthlyLeaderboard(monthStart),
    staleTime: 60_000,
  });
}
