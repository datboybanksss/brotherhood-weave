import { supabase } from "@/lib/supabase";
import type { EventCategory, EventFormat } from "@/lib/event-meta";
import type { EventRow } from "./events";

export interface EventInput {
  title: string;
  description: string | null;
  category: EventCategory;
  format: EventFormat;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  cover_url: string | null;
  is_published: boolean;
}

export async function listAdminEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase.from("events").select("*").order("starts_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

export async function createEvent(input: EventInput & { created_by: string }) {
  const { data, error } = await supabase.from("events").insert(input).select().single();
  if (error) throw error;
  return data as EventRow;
}

export async function updateEvent(id: string, input: Partial<EventInput>) {
  const { error } = await supabase.from("events").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadEventCover(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("event-covers").upload(path, file, { upsert: false });
  if (error) throw error;
  return supabase.storage.from("event-covers").getPublicUrl(path).data.publicUrl;
}

export async function getRecapForEvent(eventId: string) {
  const { data, error } = await supabase.from("archives").select("id").eq("event_id", eventId).eq("content_type", "event_recap").maybeSingle();
  if (error) throw error;
  return data;
}
