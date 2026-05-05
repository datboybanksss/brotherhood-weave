import { supabase } from "@/lib/supabase";
import type { EventRow } from "./events";

export async function getUpcomingEvents(limit = 20): Promise<EventRow[]> {
  const { data, error } = await supabase.rpc("get_upcoming_events", { category_filter: null, limit_n: limit });
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

export async function getUpcomingFitnessEvents(limit = 3): Promise<EventRow[]> {
  const { data, error } = await supabase.rpc("get_upcoming_events", { category_filter: "fitness", limit_n: limit });
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

export async function getEventsForMonth(monthStart: Date): Promise<EventRow[]> {
  const start = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1).toISOString();
  const end = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1).toISOString();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_published", true)
    .gte("starts_at", start)
    .lt("starts_at", end)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventRow[];
}
