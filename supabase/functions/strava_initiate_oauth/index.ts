import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const nonce = crypto.randomUUID();
  await admin.from('strava_oauth_nonces').insert({ nonce, user_id: user.id });

  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/strava_callback`;
  const state = `${nonce}.${user.id}`;
  const params = new URLSearchParams({
    client_id: Deno.env.get('STRAVA_CLIENT_ID')!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'activity:read',
    approval_prompt: 'auto',
    state,
  });

  return new Response(
    JSON.stringify({ url: `https://www.strava.com/oauth/authorize?${params.toString()}` }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
