# Family Ties Migration Preflight

Last updated: May 9, 2026

## Goal

Move Family Ties from Lovable-owned infrastructure to accounts owned by Family Ties before production mobile launch.

The target migration is ownership transfer by recreation:

1. Create a Supabase project in the Family Ties Supabase organization.
2. Export Lovable Cloud database schemas and data.
3. Restore into the new Supabase project.
4. Mirror storage buckets.
5. Recreate OAuth providers, secrets, cron jobs, webhooks, and frontend env vars.
6. Cut over the web app and later mobile app builds.

## Current State Confirmed By Lovable

- Current Supabase project ref: `zsmkhndwoxhwasrlzeox`
- Current Supabase project is Lovable-owned and cannot be transferred.
- Full migration requires export, recreate, restore, and repoint.
- Active auth sessions and refresh tokens are not portable. Members will need to sign in again after cutover.
- Google OAuth credentials are Lovable-owned and must be recreated.
- Edge function source is in this repo under `supabase/functions`.
- Secrets are not exportable in plaintext and must be re-entered manually.

## Exportable

- Public Postgres schema and data.
- RLS policies, triggers, functions, RPCs, enums, extensions, and sequences.
- Supabase Auth schema, including `auth.users` and `auth.identities`.
- Email/password password hashes, subject to clean Supabase-to-Supabase restore.
- Google OAuth identities, because Google provider subject IDs should remain stable.
- Storage bucket metadata and policies.
- Storage files, via Supabase CLI, S3-compatible API, or a service-role mirror script.
- Edge function source from this repo.
- Migration history from `supabase/migrations`.

## Not Exportable

- Ownership of the existing Lovable-owned Supabase project.
- Active sessions and refresh tokens.
- Lovable-managed Google OAuth credentials.
- Edge function secret values.
- Lovable AI Gateway access and Lovable email gateway assumptions.

## Migration Commands From Lovable

Use the direct database URL from Lovable Cloud database connection settings.

```bash
pg_dump --schema=public --no-owner --no-privileges "$SUPABASE_DB_URL" > familyties_public.sql
pg_dump --schema=auth "$SUPABASE_DB_URL" > familyties_auth.sql
pg_dump --schema=storage "$SUPABASE_DB_URL" > familyties_storage.sql
pg_dump --schema=cron "$SUPABASE_DB_URL" > familyties_cron.sql
```

Before running these in production, test them against a staging Supabase project.

## Storage Buckets

Public buckets:

- `avatars`
- `lesson-worksheets`
- `playbook-attachments`
- `archive-covers`
- `profile-photos`
- `event-covers`
- `channel-attachments`

Private buckets:

- `fitness-videos`
- `archive-documents`

Migration rule: preserve exact storage paths wherever possible. Public URLs will change because the Supabase project ref changes.

## Edge Functions To Redeploy

- `delete_account`
- `send-transactional-email`
- `process-email-queue`
- `preview-transactional-email`
- `handle-email-unsubscribe`
- `handle-email-suppression`
- `process_payment_v2`
- `strava_initiate_oauth`
- `strava_callback`
- `strava_webhook`
- `strava_sync`
- `strava_register_webhook`
- `cleanup_fitness_videos`
- `assign_peer_partners`
- `validate_invitation`
- `redeem_invitation`
- `evaluate_tier_upgrade`
- `get_archive_document_url`
- `get_member_contact`
- `get_submissions_signed`

Deploy after linking the new Supabase project:

```bash
supabase functions deploy --project-ref <new-project-ref>
```

## Cutover Checklist

1. Freeze writes or announce a maintenance window.
2. Export `public`, `auth`, `storage`, and `cron` schemas.
3. Create a new Supabase project owned by Family Ties.
4. Restore database dumps into staging first.
5. Mirror storage buckets and preserve paths.
6. Recreate Google OAuth client.
7. Configure Supabase Auth providers.
8. Re-enter edge function secrets.
9. Deploy edge functions.
10. Recreate or update cron jobs using the new project ref and new secret values.
11. Update Strava callback and webhook URLs in the Strava developer console.
12. Update frontend env vars:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_PUBLISHABLE_KEY`
    - `VITE_SUPABASE_PROJECT_ID`
13. Replace Lovable-managed Google auth in the frontend with Supabase-owned auth.
14. Redeploy the web app from the Family Ties-owned hosting provider.
15. Run smoke tests.
16. Cut DNS/custom domain to production hosting.
17. Keep the Lovable project available read-only during rollback window.

## Required Smoke Tests

- Email/password sign in.
- Google sign in.
- New signup agreement checkbox.
- Account deletion.
- Profile edit and avatar upload.
- Profile photo gallery upload.
- Public member profile contact actions.
- Email visibility setting.
- Social links stay hidden unless verified.
- Community channels, direct messages, attachments, and voice notes.
- Fitness submission, video upload, video signed access, and retention cleanup.
- Strava connect, callback, webhook, and sync.
- Archive document signed access.
- Invitations, approvals, and payment processing.
- Peer assignment cron and midweek assignment trigger.
- Transactional email queue, unsubscribe, and suppression handling.

## Rollback Plan

If cutover fails:

1. Point frontend env/domain back to Lovable backend.
2. Disable writes on the failed new backend.
3. Keep exported dumps and storage mirror logs.
4. Identify failed component.
5. Re-run staging restore and smoke tests before retrying cutover.

## Open Risks

- Auth restore must be tested with real exported auth data before relying on password hash continuity.
- Public storage URLs may need URL rewriting if rows store full URLs instead of paths.
- Lovable email gateway functions must be replaced or confirmed unnecessary.
- Cron migrations include hardcoded old project refs and old bearer tokens.
- Native mobile OAuth needs its own redirect/deep link strategy.
