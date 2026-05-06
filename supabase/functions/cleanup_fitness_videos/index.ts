// Daily cleanup: (A) null video_url + delete files for 90-day-expired submissions,
// (B) sweep orphan files in fitness-videos with no matching submissions row.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors';

const BUCKET = 'fitness-videos';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // SECURITY FIX: Require CRON_SECRET — this function is cron-only, not user-callable
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ---------- Pass A: 90-day retention ----------
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: expired } = await admin
    .from('submissions')
    .select('id, video_url')
    .not('video_url', 'is', null)
    .eq('video_retention', '90_days')
    .lt('submitted_at', cutoff);

  let expired_nulled = 0;
  for (const row of expired ?? []) {
    if (!row.video_url) continue;
    await admin.storage.from(BUCKET).remove([row.video_url]);
    const { error } = await admin
      .from('submissions')
      .update({ video_url: null })
      .eq('id', row.id);
    if (!error) expired_nulled++;
  }

  // ---------- Pass B: orphan sweep ----------
  // List user folders, then files in each folder.
  let orphans_swept = 0;
  const { data: folders } = await admin.storage.from(BUCKET).list('', { limit: 1000 });
  for (const folder of folders ?? []) {
    if (!folder.name) continue;
    const { data: files } = await admin.storage.from(BUCKET).list(folder.name, { limit: 1000 });
    for (const f of files ?? []) {
      const path = `${folder.name}/${f.name}`;
      // Parse submission UUID from filename "{uuid}.mp4"
      const submissionId = f.name.split('.')[0];
      if (!/^[0-9a-f-]{36}$/i.test(submissionId)) continue;
      const { data: match } = await admin
        .from('submissions')
        .select('id')
        .eq('id', submissionId)
        .eq('video_url', path)
        .maybeSingle();
      if (!match) {
        await admin.storage.from(BUCKET).remove([path]);
        orphans_swept++;
      }
    }
  }

  return new Response(
    JSON.stringify({ expired_nulled, orphans_swept }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});