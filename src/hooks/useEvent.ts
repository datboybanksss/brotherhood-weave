import { useQuery } from "@tanstack/react-query";
import { getEventById, getEventRsvpSummary, getEventAttendees, getEventRecap } from "@/api/events";

export function useEvent(id: string | undefined) {
  return useQuery({ queryKey: ["event", id], queryFn: () => getEventById(id!), enabled: !!id, staleTime: 30_000 });
}
export function useEventRsvpSummary(id: string | undefined) {
  return useQuery({ queryKey: ["eventRsvpSummary", id], queryFn: () => getEventRsvpSummary(id!), enabled: !!id, staleTime: 15_000 });
}
export function useEventAttendees(id: string | undefined) {
  return useQuery({ queryKey: ["eventAttendees", id], queryFn: () => getEventAttendees(id!), enabled: !!id, staleTime: 15_000 });
}
export function useEventRecap(id: string | undefined) {
  return useQuery({ queryKey: ["eventRecap", id], queryFn: () => getEventRecap(id!), enabled: !!id, staleTime: 60_000 });
}
