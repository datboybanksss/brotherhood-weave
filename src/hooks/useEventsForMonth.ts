import { useQuery } from "@tanstack/react-query";
import { getEventsForMonth } from "@/api/community-events";

export function useEventsForMonth(monthStart: Date) {
  const key = `${monthStart.getFullYear()}-${monthStart.getMonth()}`;
  return useQuery({ queryKey: ["eventsForMonth", key], queryFn: () => getEventsForMonth(monthStart), staleTime: 60_000 });
}
