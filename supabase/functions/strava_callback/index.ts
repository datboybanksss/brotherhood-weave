// Public endpoint (no JWT) — Strava redirects here after the user authorizes.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const FRONTEND_URL = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://brotherhood-weave.lovable.app';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function redirect(params: Record<string, string>) {
  const url = new URL('/account', FRONTEND_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

Deno.serve(async (req) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);

  if (url.searchParams.get('error')) return redirect({ strava: 'denied' });

  const code = url.searchParams.get('code');
  const scope = url.searchParams.get('scope') ?? '';
  const state = url.searchParams.get('state') ?? '';

  if (!code) return redirect({ strava: 'error', reason: 'no_code' });
  if (!scope.split(',').includes('activity:read')) {
    return redirect({ strava: 'error', reason: 'insufficient_scope' });
  }

  // Split state on '.' (NOT '-', since UUIDs contain hyphens).
  const dotIdx = state.indexOf('.');
  const nonce = dotIdx === -1 ? '' : state.slice(0, dotIdx);
  const userId = dotIdx === -1 ? '' : state.slice(dotIdx + 1);
  if (!UUID_RE.test(nonce) || !UUID_RE.test(userId)) {
    return redirect({ strava: 'error', reason: 'bad_state' });
  }

  const tokenRes = await fetch('https://www.strava.com/api/v3/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: Deno.env.get('STRAVA_CLIENT_ID'),
      client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
      code,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) {
    return redirect({ strava: 'error', reason: 'token_exchange_failed' });
  }
  const tok = await tokenRes.json();
  const athleteId = tok?.athlete?.id;
  if (!athleteId || !tok.access_token) {
    return redirect({ strava: 'error', reason: 'malformed_token_response' });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { error: upsertErr } = await supabase.from('strava_connections').upsert({
    user_id: userId,
    strava_athlete_id: athleteId,
    access_token: tok.access_token,
    refresh_token: tok.refresh_token,
    expires_at: new Date(tok.expires_at * 1000).toISOString(),
    scope: 'activity:read',
    connected_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  if (upsertErr) {
    console.error('[strava_callback] upsert error', upsertErr);
    return redirect({ strava: 'error', reason: 'db_write_failed' });
  }

  return redirect({ strava: 'connected', nonce });
});
