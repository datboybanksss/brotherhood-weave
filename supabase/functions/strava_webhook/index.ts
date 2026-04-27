// Public endpoint. GET = subscription handshake. POST = activity events.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  getValidStravaToken, lookupUserIdByStravaAthleteId, importStravaActivity,
} from '../_shared/strava.ts';

const VERIFY_TOKEN = Deno.env.get('STRAVA_VERIFY_TOKEN');

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
      return new Response(JSON.stringify({ 'hub.challenge': challenge }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const body = await req.json().catch(() => null);
  if (!body) return new Response('ok', { status: 200 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Always audit first.
  const { data: eventRow } = await supabase.from('strava_webhook_events').insert({
    aspect_type: body.aspect_type ?? 'unknown',
    object_type: body.object_type ?? 'unknown',
    object_id: body.object_id ?? 0,
    owner_id: body.owner_id ?? 0,
    subscription_id: body.subscription_id ?? null,
    event_time: body.event_time ?? null,
    raw_body: body,
  }).select('id').single();

  const markProcessed = async (errMsg?: string) => {
    if (!eventRow?.id) return;
    await supabase.from('strava_webhook_events').update({
      processed_at: new Date().toISOString(),
      error_message: errMsg ?? null,
    }).eq('id', eventRow.id);
  };

  // Process create/activity events. Update + delete = ignored / TODO.
  if (body.aspect_type === 'create' && body.object_type === 'activity') {
    const userId = await lookupUserIdByStravaAthleteId(supabase, body.owner_id);
    if (!userId) {
      await markProcessed('no_connection');
      return new Response('ok', { status: 200 });
    }

    const result = await (async () => {
      const token = await getValidStravaToken(supabase, userId);
      const actRes = await fetch(`https://www.strava.com/api/v3/activities/${body.object_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!actRes.ok) throw new Error(`strava_fetch_failed: ${actRes.status}`);
      const activity = await actRes.json();
      const imp = await importStravaActivity(supabase, userId, activity);
      if (imp.imported) {
        const { data: u } = await supabase.from('users').select('full_name').eq('id', userId).single();
        const first = (u?.full_name ?? 'A member').split(' ')[0];
        console.info(`[STRAVA IMPORT] ${first} ran ${(activity.distance/1000).toFixed(2)} km from Strava activity ${activity.id}`);
      }
      return imp;
    })().catch((e) => ({ imported: false, reason: String(e?.message ?? e) }));

    await markProcessed(result.imported ? undefined : (result.reason ?? 'unknown'));
    return new Response('ok', { status: 200 });
  }

  // delete: TODO — workouts has no DELETE policy; leave orphaned for MVP.
  await markProcessed(body.aspect_type === 'delete' ? 'todo_delete_unsupported' : undefined);
  return new Response('ok', { status: 200 });
});
