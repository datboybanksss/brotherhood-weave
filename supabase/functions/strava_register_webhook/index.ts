// Admin-only one-time setup: register the webhook subscription with Strava.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors';

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
  const { data: u } = await admin.from('users').select('is_admin').eq('id', userId).single();
  if (!u?.is_admin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/strava_webhook`;
  const form = new URLSearchParams({
    client_id: Deno.env.get('STRAVA_CLIENT_ID') ?? '',
    client_secret: Deno.env.get('STRAVA_CLIENT_SECRET') ?? '',
    callback_url: callbackUrl,
    verify_token: Deno.env.get('STRAVA_VERIFY_TOKEN') ?? '',
  });

  const res = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const text = await res.text();

  if (res.ok) {
    const json = JSON.parse(text);
    return new Response(JSON.stringify({ status: 'created', subscription_id: json.id, callback_url: callbackUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // "already exists" → graceful no-op
  if (text.toLowerCase().includes('already exists')) {
    return new Response(JSON.stringify({ status: 'already_registered', callback_url: callbackUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ status: 'error', strava_status: res.status, body: text }), {
    status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
