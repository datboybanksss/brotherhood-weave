import { supabase } from "@/lib/supabase";

export interface WorkoutInput {
  distance_km: number;
  ran_at: string; // YYYY-MM-DD
  note?: string | null;
}

export interface RecentWorkout {
  id: string;
  user_id: string;
  distance_km: number;
  ran_at: string;
  note: string | null;
  created_at: string;
  verified_via: "strava" | "manual" | null;
  strava_activity_id: number | null;
  activity_type: string | null;
  duration_seconds: number | null;
  users: { full_name: string } | null;
}

export async function logWorkout(input: WorkoutInput) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { error: new Error("Not signed in"), data: null };
  const { data, error } = await supabase
    .from("workouts")
    .insert({
      user_id: uid,
      distance_km: input.distance_km,
      ran_at: input.ran_at,
      note: input.note?.trim() ? input.note.trim() : null,
    })
    .select()
    .single();
  return { data, error };
}

export async function getRecentWorkouts(limit = 5): Promise<RecentWorkout[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("id, user_id, distance_km, ran_at, note, created_at, verified_via, strava_activity_id, activity_type, duration_seconds, users!user_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ ...r, distance_km: Number(r.distance_km) })) as RecentWorkout[];
}

export async function getCollectiveDistance(): Promise<number> {
  const { data, error } = await supabase.rpc("get_collective_distance");
  if (error) throw error;
  return Number(data ?? 0);
}

export interface LatestRun {
  id: string;
  distance_km: number;
  ran_at: string;
  note: string | null;
  verified_via: "strava" | "manual" | null;
  activity_type: string | null;
  created_at: string;
}

export async function getLatestRunForMember(userId: string): Promise<LatestRun | null> {
  const { data, error } = await supabase
    .from("workouts")
    .select("id, distance_km, ran_at, note, verified_via, activity_type, created_at")
    .eq("user_id", userId)
    .order("ran_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, distance_km: Number(data.distance_km) } as LatestRun;
}
