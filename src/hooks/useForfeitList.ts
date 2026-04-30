import { useQuery } from "@tanstack/react-query";
import { getWeeklyForfeitList } from "@/api/fitness";

export function useForfeitList(weekStart: string, enabled: boolean) {
  return useQuery({
    queryKey: ["forfeitList", weekStart],
    queryFn: () => getWeeklyForfeitList(weekStart),
    staleTime: 5 * 60_000,
    enabled,
  });
}
