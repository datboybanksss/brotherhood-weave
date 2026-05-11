// Visibility-aware submissions reader: returns rows + signed URLs only when allowed.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const BUCKET = 'fitness-videos';
const SIGN_TTL = 60 * 60; // 1h

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const jwt = auth.replace('Bearer ', '');
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data: { user }, error: userErr } = await userClient.auth.getUser(jwt);
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const viewerId = user.id;

  const body = await req.json().catch(() => ({}));
  const targetUserId: string | undefined = body.user_id;
  const limit: number = Math.min(Math.max(Number(body.limit ?? 50), 1), 200);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Confirm viewer is a paid member or admin (we still trust RLS, but cheap check)
  const { data: viewer } = await admin
    .from('users')
    .select('payment_status, is_admin')
    .eq('id', viewerId)
    .maybeSingle();
  if (!viewer || (viewer.payment_status !== 'paid' && !viewer.is_admin)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let q = admin
    .from('submissions')
    .select('id, user_id, exercise, reps, video_url, video_retention, video_visibility, note, submitted_at')
    .order('submitted_at', { ascending: false })
    .limit(limit);
  if (targetUserId) q = q.eq('user_id', targetUserId);
  const { data: rows, error } = await q;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const result = [];
  for (const r of rows ?? []) {
    const isOwner = r.user_id === viewerId;
    const canSee = r.video_url && (r.video_visibility === 'public' || isOwner || viewer.is_admin);
    let signed: string | null = null;
    if (canSee && r.video_url) {
      const { data: sig } = await admin.storage.from(BUCKET).createSignedUrl(r.video_url, SIGN_TTL);
      signed = sig?.signedUrl ?? null;
    }
    result.push({
      id: r.id,
      user_id: r.user_id,
      exercise: r.exercise,
      reps: r.reps,
      note: r.note,
      submitted_at: r.submitted_at,
      video_visibility: r.video_visibility,
      video_url: signed,
      video_locked: !!r.video_url && !canSee,
    });
  }

  return new Response(JSON.stringify({ submissions: result }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});