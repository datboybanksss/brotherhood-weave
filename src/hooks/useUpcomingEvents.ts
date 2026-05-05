import { useQuery } from "@tanstack/react-query";
import { getUpcomingEvents, getUpcomingFitnessEvents } from "@/api/community-events";

export function useUpcomingEvents(limit = 20) {
  return useQuery({ queryKey: ["upcomingEvents", limit], queryFn: () => getUpcomingEvents(limit), staleTime: 60_000 });
}
export function useUpcomingFitnessEvents(limit = 3) {
  return useQuery({ queryKey: ["upcomingFitnessEvents", limit], queryFn: () => getUpcomingFitnessEvents(limit), staleTime: 60_000 });
}
