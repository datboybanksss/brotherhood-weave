import { supabase } from "@/lib/supabase";
import { STRAVA_CLIENT_ID, STRAVA_SCOPE } from "@/lib/strava-constants";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

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

export function buildStravaAuthorizeUrl(userId: string, nonce: string): string {
  const redirectUri = `${SUPABASE_URL}/functions/v1/strava_callback`;
  const state = `${nonce}.${userId}`;
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: STRAVA_SCOPE,
    approval_prompt: "auto",
    state,
  });
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}
