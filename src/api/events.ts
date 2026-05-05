import { supabase } from "@/lib/supabase";
import type { EventCategory, EventFormat, RsvpStatus } from "@/lib/event-meta";

export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  format: EventFormat;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  cover_url: string | null;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export async function getEventById(id: string): Promise<EventRow | null> {
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as EventRow | null;
}

export interface RsvpSummary { going_in_person: number; going_remote: number; not_going: number; total_rsvps: number; }

export async function getEventRsvpSummary(eventId: string): Promise<RsvpSummary> {
  const { data, error } = await supabase.rpc("get_event_rsvp_summary", { _event_id: eventId });
  if (error) throw error;
  const row = (data ?? [])[0];
  return {
    going_in_person: Number(row?.going_in_person ?? 0),
    going_remote: Number(row?.going_remote ?? 0),
    not_going: Number(row?.not_going ?? 0),
    total_rsvps: Number(row?.total_rsvps ?? 0),
  };
}

export async function getMyRsvp(eventId: string): Promise<RsvpStatus | null> {
  const { data, error } = await supabase.rpc("get_my_rsvp", { _event_id: eventId });
  if (error) throw error;
  return (data as RsvpStatus | null) ?? null;
}

export async function setRsvp(eventId: string, status: RsvpStatus) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not signed in");
  const { error } = await supabase
    .from("event_rsvps")
    .upsert({ event_id: eventId, user_id: uid, status, responded_at: new Date().toISOString() }, { onConflict: "event_id,user_id" });
  if (error) throw error;
}

export async function clearRsvp(eventId: string) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not signed in");
  const { error } = await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", uid);
  if (error) throw error;
}

export async function getEventAttendees(eventId: string) {
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("user_id, status")
    .eq("event_id", eventId)
    .in("status", ["going_in_person", "going_remote"]);
  if (error) throw error;
  return (data ?? []) as { user_id: string; status: RsvpStatus }[];
}

export async function getEventActivity(eventId: string, dateISO: string) {
  const start = new Date(dateISO); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const [w, s] = await Promise.all([
    supabase.from("workouts").select("id, user_id, distance_km, verified_via, activity_type, created_at, users!user_id(full_name)")
      .gte("created_at", start.toISOString()).lt("created_at", end.toISOString()).order("created_at", { ascending: false }).limit(20),
    supabase.from("submissions").select("id, user_id, exercise, reps, submitted_at, users!user_id(full_name)")
      .gte("submitted_at", start.toISOString()).lt("submitted_at", end.toISOString()).order("submitted_at", { ascending: false }).limit(20),
  ]);
  if (w.error) throw w.error;
  if (s.error) throw s.error;
  return { workouts: w.data ?? [], submissions: s.data ?? [] };
}

export async function getEventRecap(eventId: string) {
  const { data, error } = await supabase
    .from("archives")
    .select("id, title, body_markdown, cover_url, created_by, recorded_at, users:created_by(full_name)")
    .eq("event_id", eventId)
    .eq("content_type", "event_recap")
    .maybeSingle();
  if (error) throw error;
  return data;
}
