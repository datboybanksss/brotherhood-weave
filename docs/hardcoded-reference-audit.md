# Hardcoded Reference Audit

Last updated: May 9, 2026

Search used:

```bash
rg -n "zsmkhndwoxhwasrlzeox|lovable|familyt1es\\.lovable\\.app|brotherhood-weave\\.lovable\\.app|supabase\\.co|SUPABASE|LOVABLE|Lovable" . -g '!node_modules' -g '!dist' -g '!package-lock.json'
```

## Must Change Before Cloud Migration

### Supabase project ref

- `supabase/config.toml`
  - `project_id = "zsmkhndwoxhwasrlzeox"`
  - Replace with the new Family Ties-owned Supabase project ref after linking the CLI.

### Cron and pg_net function URLs

- `supabase/cron_jobs_setup.sql`
- `supabase/migrations/20260427090941_7fd13594-f7cb-4e0d-a79f-eeead06a2b56.sql`
- `supabase/migrations/20260430121429_a3a14515-502c-4f45-91e5-5fa1282c1638.sql`

These contain old function URLs:

- `https://zsmkhndwoxhwasrlzeox.supabase.co/functions/v1/assign_peer_partners`
- `https://zsmkhndwoxhwasrlzeox.supabase.co/functions/v1/cleanup_fitness_videos`

They must be regenerated with:

- New Supabase project ref.
- New `CRON_SECRET`.
- No old anon token embedded in SQL.

### Strava callback frontend fallback

- `supabase/functions/strava_callback/index.ts`
  - Fallback URL: `https://brotherhood-weave.lovable.app`
  - Set `PUBLIC_SITE_URL=https://familyties.info` in the new project.
  - Consider removing the Lovable fallback after migration.

### Lovable-managed auth

- `src/components/auth/GoogleSignInButton.tsx`
- `src/integrations/lovable/index.ts`
- `package.json`
- `bun.lock`

Current Google sign-in uses `@lovable.dev/cloud-auth-js`. Replace with Supabase-owned Google OAuth before or during migration.

### Lovable email gateway

- `supabase/functions/process-email-queue/index.ts`
- `supabase/functions/preview-transactional-email/index.ts`
- `supabase/functions/handle-email-suppression/index.ts`
- `supabase/functions/send-transactional-email/index.ts`

Current risks:

- Uses `@lovable.dev/email-js`.
- Uses `@lovable.dev/webhooks-js`.
- Requires `LOVABLE_API_KEY`.
- Comments state the sender subdomain is delegated to Lovable nameservers.

Decision needed:

- Replace with a Family Ties-owned transactional email provider, likely Resend.

## Should Change Before Public Production

### HTML metadata

- `index.html`
  - Title is `Lovable App`.
  - Author is `Lovable`.
  - OG/Twitter metadata use Lovable preview image/title.

Change to Family Ties production metadata before launch.

### README

- `README.md`
  - Still says "Welcome to your Lovable project".

Replace with Family Ties developer setup and deployment instructions.

### Placeholder page

- `src/pages/Index.tsx`
  - Contains Lovable placeholder copy/assets.

Confirm whether this route is unused. Remove or replace if it can be reached.

## Expected References That Can Stay For Now

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` environment variable names in edge functions.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SUPABASE_PROJECT_ID` env names in frontend.
- Supabase package/client imports.

## Follow-Up Commands

After creating the new Supabase project, re-run:

```bash
rg -n "zsmkhndwoxhwasrlzeox|lovable|brotherhood-weave\\.lovable\\.app|familyt1es\\.lovable\\.app|LOVABLE|Lovable" . -g '!node_modules' -g '!dist' -g '!package-lock.json'
```

Before app-store submission, also re-run:

```bash
rg -n "Lovable App|lovable\\.app|@Lovable|placeholder" index.html src README.md docs -g '!node_modules' -g '!dist'
```
