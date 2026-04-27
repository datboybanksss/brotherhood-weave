// Shared helpers for Strava Edge Functions.
// Strava default activity names like "Morning Run" are noise — strip them.
export const STRAVA_DEFAULT_NAME_RE =
  /^(Morning|Afternoon|Evening|Lunch|Night)\s+(Run|Walk|Ride|Workout)$/i;

export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix seconds
}

export async function getValidStravaToken(supabase: any, userId: string): Promise<string> {
  const { data: conn, error } = await supabase
    .from('strava_connections').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw new Error(`db_error: ${error.message}`);
  if (!conn) throw new Error('not_connected');

  const expiresAtMs = new Date(conn.expires_at).getTime();
  if (expiresAtMs > Date.now() + 60_000) return conn.access_token;

  const res = await fetch('https://www.strava.com/api/v3/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: Deno.env.get('STRAVA_CLIENT_ID'),
      client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
      grant_type: 'refresh_token',
      refresh_token: conn.refresh_token,
    }),
  });
  if (!res.ok) throw new Error(`strava_refresh_failed: ${res.status} ${await res.text()}`);
  const tokens = await res.json() as StravaTokens;

  await supabase.from('strava_connections').update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(tokens.expires_at * 1000).toISOString(),
  }).eq('user_id', userId);

  return tokens.access_token;
}

export async function lookupUserIdByStravaAthleteId(
  supabase: any, stravaAthleteId: number,
): Promise<string | null> {
  const { data } = await supabase
    .from('strava_connections').select('user_id')
    .eq('strava_athlete_id', stravaAthleteId).maybeSingle();
  return data?.user_id ?? null;
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string; // 'Run', 'Walk', etc.
  distance: number; // meters
  moving_time: number; // seconds
  start_date_local: string; // ISO
}

export async function importStravaActivity(
  supabase: any, userId: string, activity: StravaActivity,
): Promise<{ imported: boolean; reason?: string }> {
  if (activity.type !== 'Run' && activity.type !== 'Walk') {
    return { imported: false, reason: `skipped_type_${activity.type}` };
  }
  const note = STRAVA_DEFAULT_NAME_RE.test(activity.name)
    ? null
    : (activity.name?.slice(0, 200) || null);

  const row = {
    user_id: userId,
    distance_km: Number((activity.distance / 1000).toFixed(2)),
    ran_at: activity.start_date_local.slice(0, 10),
    note,
    verified_via: 'strava',
    strava_activity_id: activity.id,
    activity_type: activity.type,
    duration_seconds: activity.moving_time ?? null,
  };

  const { error } = await supabase.from('workouts').upsert(row, {
    onConflict: 'strava_activity_id',
    ignoreDuplicates: true,
  });
  if (error) {
    if (error.code === '23505') return { imported: false, reason: 'duplicate' };
    throw new Error(`insert_failed: ${error.message}`);
  }
  return { imported: true };
}
