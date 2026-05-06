import { supabase } from "@/lib/supabase";

export interface StravaConnection {
  user_id: string;
  strava_athlete_id: number;
  expires_at: string;
  scope: string;
  connected_at: string;
  last_synced_at: string | null;
}

export async function getMyStravaConnection(): Promise<StravaConnection | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data } = await supabase
    .from("strava_connections")
    .select("user_id, strava_athlete_id, expires_at, scope, connected_at, last_synced_at")
    .eq("user_id", uid)
    .maybeSingle();
  return (data as StravaConnection | null) ?? null;
}

export async function disconnectStrava() {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { error: new Error("Not signed in") };
  const { error } = await supabase.from("strava_connections").delete().eq("user_id", uid);
  return { error };
}

export async function triggerStravaSync() {
  return supabase.functions.invoke("strava_sync");
}

export async function registerStravaWebhook() {
  return supabase.functions.invoke("strava_register_webhook");
}

export async function getStravaAuthorizeUrl(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('strava_initiate_oauth');
  if (error) throw error;
  return data.url;
}
