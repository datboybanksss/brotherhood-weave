# Verified Social Account Connections

Build OAuth-based ownership verification for member social links across LinkedIn, TikTok, YouTube/Google, and X. Public profiles render social icons only after verification, and only ever render the **provider-derived canonical URL** — never the user-submitted string.

## 1. Database (migration)

Add to `member_social_links` (idempotent `ADD COLUMN IF NOT EXISTS`):

- `submitted_url text` — backfilled from existing `url`; stores whatever the user typed. Never shown publicly.
- `verified_url text` — canonical URL built from provider data. The only field rendered publicly.
- `verification_status text not null default 'unverified'` — check constraint: `unverified | pending | verified | pending_manual_review | failed`
- `verification_method text` (`'oauth'` for now)
- `platform_user_id text`
- `platform_username text`
- `verified_at timestamptz`

(Keep existing `url` column as the editor's working value, but treat `submitted_url` as the source of truth for what the user entered.)

New table `social_oauth_states` (server-only, RLS deny-all to authenticated; service role writes):

- `state text primary key`, `user_id uuid`, `platform text`, `pkce_verifier text`, `created_at`, `expires_at` (10 min TTL)

Tighten RLS on `member_social_links`:

- Owner: full read/write on own rows (so they see Pending / Failed / Pending review in the editor).
- Other paid members: SELECT only rows where `verification_status = 'verified' AND verified_at IS NOT NULL AND verified_url IS NOT NULL`.

## 2. Verification rule (critical)

A row is publicly visible **only** when all of:

1. `verification_status = 'verified'`
2. `verified_at IS NOT NULL`
3. `verified_url IS NOT NULL` (always provider-derived)

In `social-oauth-callback`:

- Build `verified_url` from provider data using a per-platform canonical formatter (e.g. `https://www.linkedin.com/in/<vanityName>`, `https://www.tiktok.com/@<username>`, `https://www.youtube.com/@<handle>`, `https://x.com/<username>`).
- If the provider does **not** return enough data to construct a canonical public URL/handle (e.g. LinkedIn OIDC returns no vanity, YouTube returns no custom handle, TikTok returns only `open_id`):
  - Set `verification_status = 'pending_manual_review'`
  - Leave `verified_url = NULL`
  - Store whatever IDs we did get (`platform_user_id`, `platform_username` if any) for admin review.
  - Row stays hidden from public profiles.
- If the provider does return a canonical handle/URL:
  - Compare to user's `submitted_url` (normalized). If they match, mark `verified` with `verified_url` set to the canonical form.
  - If they don't match, **replace** — `verified_url` = canonical form (do not require user resubmit). Status = `verified`.
- Public profile component reads only `verified_url`. Never falls back to `submitted_url` / `url`.

## 3. Edge functions

### `social-oauth-start` (verify_jwt = true)
- Validates JWT, reads `?platform=` (linkedin | tiktok | youtube | x).
- Generates `state` (32-byte base64url) and PKCE `code_verifier`/`code_challenge` (S256) where required.
- Inserts row into `social_oauth_states` (service role).
- Builds provider authorize URL with least-privilege scopes:
  - LinkedIn: `openid profile`
  - TikTok: `user.info.basic` (PKCE)
  - Google/YouTube: `openid profile https://www.googleapis.com/auth/youtube.readonly`
  - X: `users.read tweet.read` (PKCE required, confidential client)
- Returns `{ url }`; frontend does `window.location.assign(url)`.

### `social-oauth-callback` (verify_jwt = false)
- Reads `code` + `state`. Looks up + deletes state row; rejects if missing/expired.
- Exchanges code for access token (with PKCE verifier where required).
- Fetches profile:
  - LinkedIn: `GET /v2/userinfo` → `sub`, `name`. (No vanity URL → `pending_manual_review`.)
  - TikTok: `GET /v2/user/info/?fields=open_id,union_id,display_name,profile_deep_link` → use `profile_deep_link` if present as `verified_url`, else `pending_manual_review`.
  - Google/YouTube: `GET /oauth2/v3/userinfo` then `youtube/v3/channels?mine=true&part=snippet` → use channel `customUrl` (`@handle`) if present; otherwise `pending_manual_review` (channel ID URL is not a "handle").
  - X: `GET /2/users/me?user.fields=username` → `https://x.com/<username>`.
- Upserts `member_social_links` row per the verification rule above.
- Discards access/refresh tokens (not stored).
- Redirects: success → `${SITE_URL}/account?social_verified=<platform>`; failure → `${SITE_URL}/account?social_error=<platform>&reason=<short>`; manual review → `${SITE_URL}/account?social_pending=<platform>`.

Provider callback URL (register exactly this in every provider console):
`https://zsmkhndwoxhwasrlzeox.supabase.co/functions/v1/social-oauth-callback`

## 4. Frontend

**`EditProfileForm.tsx`**
- Each selected platform row shows a status pill: Unverified (gray) / Pending (amber) / Verified (green check) / Pending review (amber, "We'll confirm shortly") / Failed (red).
- `Verify` button per supported provider (hidden once `verified`). Click → invoke `social-oauth-start`, redirect to returned URL, set local status to Pending.
- Editing the URL field after verification resets that row to `unverified` (and clears `verified_url`) on save.
- On `/account` mount, read `?social_verified` / `?social_error` / `?social_pending`, toast result, invalidate `memberSocialLinks` query, strip params from URL.

**Public profile (`MemberContactActions.tsx` / wherever socials render)**
- Filter strictly: `verification_status === 'verified' && verified_at && verified_url`.
- Render between "Member since…" and the Message button as a centered row of 40×40 circular icon buttons styled with `border-brand-royal/30 bg-brand-royal-tint/40 hover:bg-brand-royal-tint`, lucide icons (`Linkedin`, `Music2` for TikTok, `Youtube`, `Twitter` for X).
- `href` is always `verified_url`. Submitted URL is never linked publicly.

## 5. Secrets I need from you

I'll prompt with the secrets tool once you confirm. Sources:

| Secret | Where to get it |
|---|---|
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | linkedin.com/developers → create app → enable "Sign In with LinkedIn using OpenID Connect". |
| `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | developers.tiktok.com → Manage apps → Login Kit, request `user.info.basic`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | console.cloud.google.com → Credentials → OAuth 2.0 Web Client. Enable YouTube Data API v3. |
| `X_CLIENT_ID` / `X_CLIENT_SECRET` | developer.x.com → User authentication settings → OAuth 2.0, **Confidential client**, scopes `users.read tweet.read`. |
| `SITE_URL` | e.g. `https://familyt1es.lovable.app` (or your custom domain). |
| `SOCIAL_OAUTH_CALLBACK_URL` | `https://zsmkhndwoxhwasrlzeox.supabase.co/functions/v1/social-oauth-callback` — register this exact URL in every provider console. |

TikTok and X also require a published privacy policy / terms URL before going live.

## 6. Order of execution after approval

1. Run migration (new columns + state table + tightened RLS + check constraint).
2. You add the secrets above.
3. Deploy `social-oauth-start` and `social-oauth-callback`.
4. Update `EditProfileForm` + public profile UI to honor the verified-only rule.
5. End-to-end smoke test per provider.

## Non-goals

- Instagram (Meta Basic Display deprecated; Graph API requires business review).
- Token storage beyond the handshake — access/refresh tokens are discarded.
- Admin manual-review UI for `pending_manual_review` rows in this pass (data is captured; UI can come later).
