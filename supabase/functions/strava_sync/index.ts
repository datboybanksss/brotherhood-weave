// Manual fallback: pull recent activities since the connection was made.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors';
import { getValidStravaToken, importStravaActivity } from '../_shared/strava.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(auth.replace('Bearer ', ''));
  if (claimsErr || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userId = claimsData.claims.sub;

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: conn } = await admin.from('strava_connections').select('connected_at').eq('user_id', userId).maybeSingle();
  if (!conn) {
    return new Response(JSON.stringify({ error: 'not_connected' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const token = await getValidStravaToken(admin, userId);
  const after = Math.floor(new Date(conn.connected_at).getTime() / 1000);
  const actRes = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?per_page=30&after=${after}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!actRes.ok) {
    return new Response(JSON.stringify({ error: 'strava_fetch_failed', status: actRes.status }), {
      status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const activities = await actRes.json() as any[];

  let imported = 0, skipped = 0;
  for (const a of activities) {
    const r = await importStravaActivity(admin, userId, a);
    if (r.imported) imported++; else skipped++;
  }

  await admin.from('strava_connections').update({
    last_synced_at: new Date().toISOString(),
  }).eq('user_id', userId);

  return new Response(JSON.stringify({ imported, skipped, total: activities.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
