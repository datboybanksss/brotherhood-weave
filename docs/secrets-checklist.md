# Family Ties Secrets Checklist

Last updated: May 9, 2026

## Rule

Do not commit secret values to the repo. Store values only in Supabase project secrets, hosting provider env vars, mobile build env vars, and the relevant provider dashboards.

## Supabase

Needed from the new Family Ties-owned Supabase project:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Direct database URL for one-time migration only.

## App URLs

- `PUBLIC_SITE_URL`
- Production web domain, planned as `https://familyties.info`
- Future iOS universal link domain.
- Future Android App Link domain.

## Google

Needed after leaving Lovable-managed OAuth:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Provider configuration:

- Supabase redirect URL: `https://<new-project-ref>.supabase.co/auth/v1/callback`
- Web origin: `https://familyties.info`
- Local dev origin if needed: `http://localhost:8083`

## Apple

Needed before iOS release if Google sign-in remains available:

- Apple Developer Team ID.
- Services ID or App ID configuration.
- Sign in with Apple key ID.
- Sign in with Apple private key.
- Apple callback/deep link configuration.

## Strava

Needed:

- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_VERIFY_TOKEN`

Update in Strava dashboard:

- OAuth callback: `https://<new-project-ref>.supabase.co/functions/v1/strava_callback`
- Webhook callback: `https://<new-project-ref>.supabase.co/functions/v1/strava_webhook`

## Cron

Needed:

- `CRON_SECRET`

Use the new value when recreating cron jobs for:

- `assign-peer-partners-weekly`
- `assign-peer-partners-midweek`
- `fitness-video-retention`

## Transactional Email

Current risk:

- Email functions use Lovable email packages and `LOVABLE_API_KEY`.
- `notify.familyties.info` is referenced as the sender domain.

Current names found:

- `LOVABLE_API_KEY`
- `LOVABLE_SEND_URL`

Migration decision:

- Replace Lovable email gateway with a Family Ties-owned provider, likely Resend.

Potential future secrets:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `EMAIL_WEBHOOK_SECRET`

## Social Verification

Future OAuth verification secrets:

- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `X_CLIENT_ID`
- `X_CLIENT_SECRET`
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `SOCIAL_OAUTH_CALLBACK_URL`

Callback:

- `https://<new-project-ref>.supabase.co/functions/v1/social-oauth-callback`

## Payments

Current function:

- `process_payment_v2`

Before production:

- Confirm current payment provider.
- Confirm whether mobile payments require Apple In-App Purchase or Google Play Billing.
- Document provider secrets here after choosing the final approach.

## Rotation Plan

Rotate immediately after migration:

- Supabase service role key if any old environment may still have access.
- `CRON_SECRET`
- Strava webhook token if callbacks change.
- Email provider webhook secret.
- Any OAuth client secrets created during testing.
