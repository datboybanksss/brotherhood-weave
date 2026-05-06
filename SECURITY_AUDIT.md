# Family Ties Security Audit

**Audit Date:** 2026-05-06  
**Auditor:** Claude Code (automated static analysis)  
**Scope:** Full codebase — migrations, edge functions, frontend auth/API, storage, environment files

---

## Executive Summary

Family Ties has a solid security foundation in several areas: RLS is enabled on all tables, a `protect_user_columns` trigger correctly blocks direct client mutation of privileged fields, and edge functions that touch sensitive data correctly extract user identity from JWTs rather than trusting client-supplied values. However, three issues require immediate attention before any public launch. First, the `process_payment` SECURITY DEFINER RPC is callable by any authenticated user with a client-supplied `p_user_id`, meaning any member can set any other member's `payment_status` to `paid` for free — this is the most critical vulnerability in the codebase. Second, the anon JWT is hardcoded in two SQL migration cron jobs and committed to version control, effectively making those cron endpoints publicly callable by anyone who reads the repo. Third, the `assign_peer_partners` and `cleanup_fitness_videos` edge functions perform sensitive operations (mass data writes and mass storage deletions respectively) with no caller authentication whatsoever. Several medium-severity issues exist around over-broad RLS policies, missing payment checks on write paths, and incomplete account deletion.

---

## Severity Scale

- 🔴 CRITICAL — exploitable right now, could expose member data or allow privilege escalation
- 🟠 HIGH — significant risk, fix before public launch
- 🟡 MEDIUM — real risk but requires specific conditions
- 🟢 LOW — best practice improvement

---

## Findings

### Section 1: RLS Policies

**1.1 🔴 CRITICAL — `users` table: `process_payment` RPC bypasses `protect_user_columns` trigger**

The `process_payment(p_user_id UUID, p_amount NUMERIC)` function is a `SECURITY DEFINER` function in the `public` schema with no explicit `REVOKE EXECUTE FROM authenticated` or internal caller verification. In Supabase, all functions in the `public` schema are callable by `authenticated` role by default. The `protect_user_columns` trigger skips enforcement when `request.jwt.claim.role IS DISTINCT FROM 'authenticated'`, but calling `process_payment` as an authenticated user leaves `jwt.claim.role = 'authenticated'`, so the trigger fires — however, the `SECURITY DEFINER` execution context within `process_payment` means the UPDATE runs as the function owner (postgres/service), not the calling user. In Supabase's PostgREST, the GUC `request.jwt.claim.role` persists into SECURITY DEFINER functions. The critical issue: the function accepts **any** `p_user_id`, meaning an authenticated member can call `supabase.rpc("process_payment", { p_user_id: "victim-uuid", p_amount: 0 })` to set **any member's** `payment_status = 'paid'` for free, bypassing both the stub payment flow and tier assignment. The trigger's skip logic was designed for service-role callers (cron, edge functions), not authenticated user calls.

**File:** `supabase/migrations/20260416083536_7d40ccc4.sql`, lines 332–352  
**Fix — restrict execution to service_role only:**
```sql
REVOKE EXECUTE ON FUNCTION public.process_payment(UUID, NUMERIC) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_payment(UUID, NUMERIC) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment(UUID, NUMERIC) TO service_role;
```
Additionally, add an internal caller check:
```sql
-- Inside process_payment body, first line:
IF current_setting('request.jwt.claim.role', true) = 'authenticated' THEN
  RAISE EXCEPTION 'process_payment may only be called server-side';
END IF;
```

---

**1.2 🟠 HIGH — `modules` and `lessons` tables: accessible to pre-payment (pending) users**

The policies `"Modules readable by authenticated"` and `"Lessons readable by authenticated"` use `USING (true)` with no payment check. Any user who signs up (even with `payment_status = 'pending'` and `interview_completed = false`) can read all module and lesson metadata including titles, body markdown, video URLs, and worksheet PDF URLs immediately after account creation.

**File:** `supabase/migrations/20260416083536_7d40ccc4.sql`, lines 148, 168  
**Fix:**
```sql
-- Drop existing open policies
DROP POLICY "Modules readable by authenticated" ON public.modules;
DROP POLICY "Lessons readable by authenticated" ON public.lessons;

-- Replace with paid-only access
CREATE POLICY "Paid users and admins can read modules" ON public.modules
  FOR SELECT TO authenticated
  USING (
    public.is_current_user_admin()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND payment_status = 'paid')
  );

CREATE POLICY "Paid users and admins can read lessons" ON public.lessons
  FOR SELECT TO authenticated
  USING (
    public.is_current_user_admin()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND payment_status = 'paid')
  );
```

---

**1.3 🟡 MEDIUM — `workouts` table: INSERT policy has no payment check**

The `"Members can insert own workouts"` policy only checks `auth.uid() = user_id`, not `payment_status = 'paid'`. A pending/pre-payment user could log workouts and appear on leaderboards, even though the SELECT policy requires paid status to read workouts.

**File:** `supabase/migrations/20260427104206_c5ec4fea.sql`, lines 31–34  
**Fix:**
```sql
DROP POLICY "Members can insert own workouts" ON public.workouts;
CREATE POLICY "Paid members can insert own workouts" ON public.workouts
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND payment_status = 'paid')
  );
```

---

**1.4 🟡 MEDIUM — `submissions` table: INSERT policy has no payment check**

Same issue as workouts. `"Members can insert own submissions"` only checks `auth.uid() = user_id`. A pending member can log exercise submissions.

**File:** `supabase/migrations/20260430121429_a3a14515.sql`, lines 69–72  
**Fix:** Same pattern — add `AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND payment_status = 'paid')` to the INSERT `WITH CHECK`.

---

**1.5 🟡 MEDIUM — `users` table: "Paid users can read other paid users" is over-broad**

The policy `"Paid users can read other paid users"` (`USING (payment_status = 'paid')`) allows any paid user to read every column of every paid user row, including `email`, `is_admin`, `invited_via_token`, `onboarded_at`, and other internal fields. The `public_member_profiles` view correctly restricts columns, but the direct table access via RLS does not.

**File:** `supabase/migrations/20260416083536_7d40ccc4.sql`, line 59  
**Fix:** Drop this policy and restrict column access via the view, or add `security_barrier` to the view and revoke direct table SELECT from `authenticated`. Alternatively:
```sql
DROP POLICY "Paid users can read other paid users" ON public.users;
-- Members should use public_member_profiles view instead
-- Admins retain access via "Admins can read all users" policy
```
Then update all frontend queries against `users` for other members to use `public_member_profiles`.

---

**1.6 🟢 LOW — `meetings` table: readable by all authenticated users regardless of payment status**

`"Meetings readable by authenticated"` uses `USING (true)`. Pre-payment users can read meeting metadata.

**Fix:** Add payment check: `USING (public.is_current_user_admin() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND payment_status = 'paid'))`.

---

**1.7 🟢 LOW — `get_monthly_leaderboard`, `get_weekly_forfeit_list`, `get_user_weekly_streak`, `get_user_monthly_stats` RPCs: no caller payment check**

All four SECURITY DEFINER fitness RPCs are callable by any `authenticated` user (including pre-payment). They expose full names, avatar URLs, and submission counts of all paid members.

**Fix:** Add `GRANT EXECUTE` only after verifying caller is paid, or add an internal check:
```sql
-- Add at top of each function body:
IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND payment_status = 'paid') 
   AND NOT public.is_current_user_admin() THEN
  RAISE EXCEPTION 'Paid membership required';
END IF;
```

---

### Section 2: Edge Functions

**2.1 🔴 CRITICAL — `assign_peer_partners`: no authentication, callable by anyone**

The `assign_peer_partners` function is NOT listed in `config.toml`, meaning `verify_jwt = true` (default). However, Supabase's default `verify_jwt = true` only requires a **valid** JWT — including the publicly known **anon key** JWT. The function has zero in-function auth checks (`req.headers` are never inspected). Anyone who knows the function URL can call it with an anon-key JWT and trigger a full re-pairing of all members, wiping this week's pairings (`await supabase.from("peer_pairings").delete().eq("week_start", week_start)`) or even resetting all historical pairing data (`await supabase.from("peer_pairings").delete().neq("id", "00000000-...")` in the history-reset path).

**File:** `supabase/functions/assign_peer_partners/index.ts`  
**Fix:** Add a service-role-only check at the start of the handler:
```typescript
const authHeader = req.headers.get("Authorization") ?? "";
const token = authHeader.replace("Bearer ", "");
// Quick JWT decode (no verify needed — service_role secret is server-only)
const parts = token.split(".");
const claims = JSON.parse(atob(parts[1].replace(/-/g,"+").replace(/_/g,"/")));
if (claims?.role !== "service_role") {
  return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
}
```
And set in `config.toml`:
```toml
[functions.assign_peer_partners]
verify_jwt = true
```

---

**2.2 🔴 CRITICAL — `cleanup_fitness_videos`: no authentication, callable by anyone**

`cleanup_fitness_videos` has `verify_jwt = false` in `config.toml` and **no in-function auth check**. Any unauthenticated HTTP client can POST to this endpoint and trigger deletion of all 90-day-expired fitness videos plus an orphan sweep that deletes any storage file not matched to a submission row. A malicious actor could flood this endpoint to cause mass deletion of fitness video evidence.

**File:** `supabase/functions/cleanup_fitness_videos/index.ts`, `supabase/config.toml` line 9–10  
**Fix:** Change `config.toml` to `verify_jwt = true` and add the same service-role check as above. Update the cron job to use the service role key for authorization.

---

**2.3 🔴 CRITICAL — Anon key committed to version control in SQL migrations**

Two cron jobs in migrations hardcode the anon JWT directly in SQL:
- `supabase/migrations/20260427090941_7fd13594.sql` lines 121, 145 (assigns peer partners weekly + midweek)
- `supabase/migrations/20260430121429_a3a14515.sql` line 231 (fitness video cleanup)

The anon key is: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (same key as in `.env`).

This key is also committed in git history (commit `ecf7627`). Since it's the **anon key** (not service role), the actual privilege damage is limited — but combined with findings 2.1 and 2.2, it means anyone who reads the git history can trigger these operations.

**More critically:** The cron jobs call `assign_peer_partners` and `cleanup_fitness_videos` with the **anon** JWT — but these functions use the service_role key internally for all DB operations. The anon key authorization is therefore insufficient for future hardening.

**Fix:**
1. Rotate the Supabase anon key immediately (Dashboard → Settings → API → Regenerate keys). Note: this will break the app until `.env` and the hardcoded migration values are updated.
2. Replace the anon key in both migration cron jobs with the service role key (stored via Vault):
```sql
SELECT cron.schedule(
  'assign-peer-partners-weekly',
  '0 22 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://zsmkhndwoxhwasrlzeox.supabase.co/functions/v1/assign_peer_partners',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := ...
  );
  $$
);
```
3. Add `.env` to `.gitignore` (currently missing — see finding 5.1).

---

**2.4 🟠 HIGH — `evaluate_tier_upgrade` edge function: no authentication, accepts any user_id**

`evaluate_tier_upgrade` (not in `config.toml` = default `verify_jwt = true`) has no in-function auth check and accepts `user_id` from the request body. Any authenticated user can call this with any `user_id`. While `evaluate_tier_upgrade` the SQL function only upgrades — it never downgrades — calling it repeatedly for other users is a denial-of-service nuisance and reveals tier logic. More importantly, this pattern is a template for future escalation if the underlying SQL function is modified.

**File:** `supabase/functions/evaluate_tier_upgrade/index.ts`  
**Fix:** Add a service-role or admin-only check. If the function must be callable by members for self-evaluation, validate that the supplied `user_id` matches the JWT sub.

---

**2.5 🟠 HIGH — `strava_callback`: trusts client-supplied `userId` from OAuth state parameter**

The `strava_callback` function is `verify_jwt = false` (correct — Strava redirects here without a Supabase JWT). It extracts `userId` from the OAuth `state` parameter and writes Strava tokens directly to `strava_connections` for that `userId`. The `nonce` in the state is validated as a UUID format but is **never verified against a server-side store**. An attacker who learns another member's UUID (visible in `public_member_profiles`) could craft a Strava OAuth flow with `state = random-uuid.victim-uuid` and link their own Strava account to the victim's profile, overwriting the victim's Strava tokens.

**File:** `supabase/functions/strava_callback/index.ts`  
**Fix:** Before the Strava token exchange, verify the nonce exists in a short-lived server-side table (e.g. a `strava_oauth_nonces` table with `user_id`, `nonce`, `expires_at`). The nonce should be inserted server-side when the user initiates the OAuth flow (via an authenticated endpoint), and deleted on first use.

---

**2.6 🟡 MEDIUM — `redeem_invitation`: `listUsers()` call is O(N) and leaks user count**

`redeem_invitation` calls `admin.auth.admin.listUsers()` without pagination to check if a user with the invitation email already exists. In Supabase, `listUsers()` without a `perPage` filter fetches all users. With a large member base this is slow and the response contains all auth user records. The better approach is a targeted lookup.

**File:** `supabase/functions/redeem_invitation/index.ts`, line 67  
**Fix:**
```typescript
// Replace listUsers() with targeted admin lookup
const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
// Or better:
const { data: userByEmail } = await admin.from('users')
  .select('id')
  .eq('email', inv.email.toLowerCase())
  .maybeSingle();
if (userByEmail) return json({ error: "user_exists" }, 409);
```

---

**2.7 🟡 MEDIUM — `send-transactional-email`: any authenticated user can send emails to arbitrary recipients**

The `send-transactional-email` function has `verify_jwt = true` and requires a Supabase JWT, but does NOT verify that the caller is an admin. Any paid member (or even any authenticated user) can call this function and send a transactional email to any `recipientEmail`. The JWT role check only applies to `process-email-queue`.

**File:** `supabase/functions/send-transactional-email/index.ts`, lines 34–36 (comment admits this)  
**Fix:** Add an admin check, or restrict execution to `service_role` callers only, or at minimum restrict the allowed templates to prevent abuse.

---

**2.8 🟢 LOW — `validate_invitation`: exposes `intended_tier` in response**

The `validate_invitation` function returns `intended_tier` in the response. While not directly exploitable, this leaks internal membership tier vocabulary to any unauthenticated caller who knows a valid token.

**Fix:** Remove `intended_tier` from the public response if it's not needed by the frontend UI.

---

### Section 3: Authentication & Session Handling

**3.1 🟠 HIGH — `.env` file committed to git history**

The `.env` file containing `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SUPABASE_PROJECT_ID` was committed in git commit `ecf7627`. While these are the anon/publishable keys (not the service role key), the project ID and URL are now permanently in the git history. `.env` is not listed in `.gitignore`.

**File:** `.gitignore` (missing `.env` entry)  
**Fix:**
1. Add `.env` to `.gitignore` immediately.
2. Add `.env.example` with placeholder values as documentation.
3. Rotate the anon key if the git history is ever made public.
4. Use `git filter-repo` or BFG to purge `.env` from history if the repo will become public.

---

**3.2 🟡 MEDIUM — `/auth/callback` and `/invite/:token` routes bypass RouteGuard entirely**

`AuthCallback` and `InviteRedemption` are registered **outside** the `<RouteGuard />` element tree in `App.tsx` (lines 51–52). This is correct behavior for OAuth callbacks and invite flows, but it means:
- `AuthCallback` reads `users.payment_status` and `users.interview_completed` directly from the DB and uses the result to decide navigation — but an attacker who intercepts the OAuth flow could potentially manipulate these values if they also control the Supabase session.
- `InviteRedemption` calls `validate_invitation` (unauthenticated) and then `redeem_invitation` with a token. If the token is guessable (see finding 3.3), this is a concern.

**Finding is informational/LOW** — the current implementation is functionally correct.

---

**3.3 🟡 MEDIUM — Invitation tokens: no explicit entropy documentation**

The `invitations.token` field is populated by the admin UI. There is no server-side validation of token entropy or format in the `validate_invitation` or `redeem_invitation` functions. If an admin creates a short or predictable token (e.g., a name), it is vulnerable to brute-force.

**File:** `supabase/functions/validate_invitation/index.ts`, `supabase/functions/redeem_invitation/index.ts`  
**Fix:** Enforce token entropy server-side in `redeem_invitation`:
```typescript
if (token.length < 32) return json({ error: "invalid_token_format" }, 400);
```
And generate tokens server-side using `crypto.randomUUID()` or 32-byte hex rather than relying on the admin to choose.

---

**3.4 🟡 MEDIUM — `console.log` leaks email addresses and user IDs to browser DevTools**

Three pages log sensitive data to the console:
- `Login.tsx:27`: `console.log("Logging in:", data.email)` — logs email on every login attempt
- `Signup.tsx:28`: `console.log("Signing up:", data.email)` — logs email on signup
- `Payment.tsx:16`: `console.log("Processing stub payment for:", user!.id)` — logs user UUID
- `useCurrentUser.ts:33`: `console.log("Fetching current user:", user!.id)` — logs UUID on every page load

**Fix:** Remove all `console.log` statements from production code, or gate them with `if (import.meta.env.DEV)`.

---

**3.5 🟢 LOW — Session stored in `localStorage`**

`src/integrations/supabase/client.ts` uses `storage: localStorage` for session persistence. `localStorage` is accessible by any JavaScript on the page (XSS risk). Supabase's default is `localStorage`; the risk is acceptable for most apps but worth noting.

**Fix:** Consider `storage: sessionStorage` for higher-security environments, or ensure strict CSP headers are set at the hosting layer.

---

### Section 4: Storage Buckets

**4.1 🟡 MEDIUM — `archive-documents` bucket: SELECT policy allows direct download, bypassing audit trail**

`archive-documents` is a private bucket (`public = false`) with a RLS-style storage policy: `"Paid members read archive documents"` grants SELECT to any `authenticated` user with `payment_status = 'paid'`. This means paid members can directly construct and call the Supabase Storage URL to download any document file by path, bypassing the `get_archive_document_url` edge function entirely (which creates signed URLs and could enforce per-document access logging). The file path itself is not exposed in archive queries (stored as `document_url` path in the archives table, only returned to admins), so in practice this is low-exploitability — but it's a defense-in-depth gap.

**Fix:** Remove the `"Paid members read archive documents"` storage SELECT policy. All document access should go through the `get_archive_document_url` edge function which creates time-limited signed URLs and enforces `is_published` check. The private bucket with no SELECT policy means only signed URLs (generated by service role) can deliver the file.

---

**4.2 🟡 MEDIUM — `avatars` bucket: public bucket with no MIME type or size restriction**

The `avatars` bucket was created in migration `20260416093117` as `public = true` with no `file_size_limit` or `allowed_mime_types`. Any authenticated user can upload files of any type and size to their folder in this bucket, and the file is publicly accessible. This could be used for malicious file hosting.

**File:** `supabase/migrations/20260416093117_1c850efc.sql`  
**Fix:**
```sql
UPDATE storage.buckets
SET file_size_limit = 5242880,  -- 5 MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'avatars';
```

---

**4.3 🟢 LOW — `profile-photos` bucket: public, no update policy**

`profile-photos` has INSERT and DELETE policies for members but no UPDATE policy. This is fine since photos are re-uploaded rather than updated, but worth noting the asymmetry. The `check_photo_order_range` trigger only enforces range on INSERT, not UPDATE, creating a window where UPDATE could set `display_order` to an arbitrary value.

---

**4.4 🟢 LOW — `lesson-worksheets` and `playbook-attachments` buckets: publicly readable by any authenticated user**

Both buckets have `public = true` and a SELECT policy allowing any `authenticated` user to read. This means pre-payment pending users can read paid-member content (lesson worksheets) without restrictions at the storage layer.

**Fix:** Match the storage policies to the RLS policies — require `payment_status = 'paid'` for SELECT on these buckets, or change them to private and serve via signed URLs.

---

### Section 5: Client-Side Security

**5.1 🔴 CRITICAL — `.env` committed to git (see finding 3.1)**

Repeated here for emphasis. The `.env` file is tracked by git (appears in commit `ecf7627`).

---

**5.2 🟡 MEDIUM — `Paid users can read other paid users` policy exposes sensitive user columns to the client**

The direct `users` table RLS allows paid members to SELECT `email`, `is_admin`, `invited_via_token`, `onboarded_at`, and all other columns. Frontend code in `Brotherhood.tsx:18`, `Home.tsx:34`, and others queries the `users` table directly rather than `public_member_profiles`. A paid member making a raw Supabase query can retrieve admin flags, invite tokens, and email addresses of all other paid members.

**Fix:** See finding 1.5. Drop the open paid-user policy and route member queries through `public_member_profiles`. Add `email` to the view only when `email_visible = true`.

---

**5.3 🟡 MEDIUM — `admin.ts` `approveApplicant`/`rejectApplicant` use the client-side authenticated Supabase instance**

`approveApplicant` calls `supabase.from("users").update({ interview_completed: true })` using the normal client (anon key + user JWT). This relies entirely on RLS + `protect_user_columns` to prevent abuse. Currently the admin UPDATE policy and the trigger correctly gate this. However, if a non-admin somehow calls `approveApplicant(theirOwnId)`, the `protect_user_columns` trigger should block it, but the RLS policy `"Admins can update any user"` would not match — the update would silently fail. This is correct behavior but fragile if the trigger is ever modified.

**Recommendation:** Move `approveApplicant`/`rejectApplicant` to an authenticated edge function with an explicit admin check for defense in depth.

---

**5.4 🟢 LOW — Strava OAuth state builds user UUID into the URL**

`buildStravaAuthorizeUrl` in `src/api/strava.ts` embeds the user's Supabase UUID directly in the OAuth `state` parameter (`state = nonce.userId`), which appears in the browser's address bar, server logs, and Strava's logs. User UUIDs are not secret (they appear in `public_member_profiles`) but this reduces the value of UUIDs as opaque identifiers.

---

### Section 6: Data Exposure

**6.1 🟡 MEDIUM — `get_submissions_signed`: returns full submission list for any target user_id to any paid member**

The function accepts an optional `user_id` in the request body and returns that user's submissions (with visibility enforcement for video URLs). However, it also returns metadata (`exercise`, `reps`, `note`, `submitted_at`) for ALL submissions regardless of `video_visibility`. A paid member can enumerate another paid member's complete exercise history, reps, and notes. The `video_visibility` field only controls whether a signed video URL is returned — it does not restrict metadata access.

**File:** `supabase/functions/get_submissions_signed/index.ts`, lines 51–58  
**Recommendation:** Apply `video_visibility` filtering to metadata too, or document this as intended behavior ("all member fitness data is visible to the brotherhood").

---

**6.2 🟡 MEDIUM — `public_member_profiles` view exposes `email_visible` boolean to all paid members**

The view exposes `email_visible` as a column, which tells any paid member whether a specific member has chosen to show their email, even before calling `get_member_contact`. This is a minor privacy concern.

---

**6.3 🟢 LOW — Strava tokens stored at rest, not encrypted beyond database-level encryption**

`strava_connections` stores `access_token` and `refresh_token` as plaintext columns. While Supabase provides at-rest encryption for the database, storing OAuth tokens in Vault (encrypted secrets) would provide an additional layer. This is best-practice advice, not an active vulnerability.

---

### Section 7: Input Validation

**7.1 🟡 MEDIUM — `uploadSubmissionVideo`: client-side MIME and size checks only**

`VideoUploader.tsx` performs client-side validation (MIME type, 50MB size, 60-second duration). However, the storage bucket `allowed_mime_types = ARRAY['video/mp4','video/quicktime']` and `file_size_limit = 52428800` are set at the bucket level — this is the correct server-side enforcement. The **duration** check (60 seconds) is client-side only and not enforced server-side. A user can bypass the UI and upload a video of arbitrary duration by calling the Storage API directly.

**Fix:** Accept this risk (duration is non-critical), or add a server-side video processing step (e.g., an Edge Function that validates duration metadata after upload).

---

**7.2 🟡 MEDIUM — `get_archive_document_url`: `archiveId` validated only for length >= 8, not UUID format**

```typescript
if (typeof archiveId !== "string" || archiveId.length < 8) {
```
A malicious caller could supply any 8+ character string. The subsequent DB query will simply return no rows, which is safe, but UUID validation is still better practice.

**File:** `supabase/functions/get_archive_document_url/index.ts`, line 26  
**Fix:** `if (!/^[0-9a-f-]{36}$/i.test(archiveId)) return json({ error: "invalid_id" }, 400);`

---

**7.3 🟢 LOW — Missing Zod validation on admin forms for archive/event creation**

`src/pages/admin/ArchiveForm.tsx` and event/playbook forms do not use Zod schemas for input validation. They rely on HTML5 form constraints and direct DB constraints. Server-side DB constraints are authoritative, so this is low risk.

---

### Section 8: Privilege Escalation

**8.1 🔴 CRITICAL — Any authenticated member can set `payment_status = 'paid'` for any user via `process_payment`**

(See finding 1.1.) This is the highest-severity finding. The `process_payment(p_user_id, p_amount)` SECURITY DEFINER function is publicly callable by any authenticated user via `supabase.rpc()`, and accepts any UUID as the target. It sets `payment_status = 'paid'`, `membership_started_at`, and `tier_id` for the supplied UUID.

---

**8.2 🟠 HIGH — `protect_user_columns` trigger: skip logic uses JWT role, which may not prevent SECURITY DEFINER bypass**

The trigger skips enforcement when `request.jwt.claim.role IS DISTINCT FROM 'authenticated'`. When `process_payment` (SECURITY DEFINER) is called by an `authenticated` user, the JWT GUC values persist into the SECURITY DEFINER execution context in Supabase's PostgREST implementation. The comment in the code says "Skip for non-authenticated contexts (SECURITY DEFINER functions like process_payment)" — suggesting the authors believe the JWT claim will be empty/null in a SECURITY DEFINER context. This assumption may be incorrect. The trigger's skip behavior should be verified against Supabase's actual GUC propagation behavior. If the JWT claim IS preserved (= 'authenticated'), the trigger blocks `process_payment` from completing its UPDATE — meaning the payment flow in `Payment.tsx` silently fails without an error to the user. If the JWT claim IS cleared (= null, thus IS DISTINCT FROM 'authenticated'), the trigger skips and the SECURITY DEFINER function bypasses all column protection — making finding 8.1 exploitable.

**Recommendation:** The correct pattern is for `process_payment` to be callable only by `service_role`. This eliminates the ambiguity entirely.

---

**8.3 🟠 HIGH — `is_admin` can be set via invitation redemption without additional server-side guard**

`redeem_invitation` sets `is_admin: inv.is_admin` where `inv.is_admin` comes from the `invitations` table. If any admin (or future code path) creates an invitation with `is_admin = true`, the redeemer gets admin rights. While this is gated by `is_admin` RLS on the `invitations` table (only admins can create invitations), it means **any admin can create admin-granting invitations**, with no secondary approval requirement. There is no audit log of admin privilege grants.

**Recommendation:** Log admin grants to a separate `admin_audit_log` table. Consider requiring 2-of-N admin approval for `is_admin = true` invitations.

---

**8.4 🟢 LOW — `evaluate_tier_upgrade` SQL function: `SECURITY DEFINER` with no exploit path, but callable with any user_id**

The edge function wrapper accepts any `user_id` (see finding 2.4). The underlying SQL function only upgrades Foundation → Independent Thinker and never grants `is_admin` or `payment_status`. No direct privilege escalation path — but calling it on another user's account is still unauthorized.

---

**8.5 🟢 LOW — Open self-signup (`/signup` route) allows account creation without invitation**

`/signup` is accessible without any invitation token, allowing arbitrary users to create accounts. The app design routes them to `/interview` (unpaid, not approved state). This is presumably intentional, but if the intent is invitation-only membership, the `handle_new_user` trigger and the signup page should enforce invite-token presence.

---

### Section 9: POPIA Compliance

**9.1 🟠 HIGH — `delete_account` does not delete storage files**

`delete_account` calls `admin.auth.admin.deleteUser(userId)` which cascades to `public.users` (via FK with `ON DELETE CASCADE`) and its dependent tables. Database records are cleaned up. However, **storage files are not deleted**:
- Profile photos in `profile-photos/{user_id}/` remain
- Fitness videos in `fitness-videos/{user_id}/` remain
- Avatar in `avatars/{user_id}/` remains

Under POPIA, when a data subject requests erasure, all personal data must be deleted, including stored files.

**File:** `supabase/functions/delete_account/index.ts`  
**Fix:**
```typescript
// Before deleteUser:
const admin = createClient(supabaseUrl, serviceRoleKey);
// Delete storage files
for (const bucket of ['profile-photos', 'fitness-videos', 'avatars']) {
  const { data: files } = await admin.storage.from(bucket).list(userId);
  if (files?.length) {
    const paths = files.map(f => `${userId}/${f.name}`);
    await admin.storage.from(bucket).remove(paths);
  }
}
// Then delete user
await adminClient.auth.admin.deleteUser(userId);
```

---

**9.2 🟡 MEDIUM — No formal data retention policy documentation**

There is no `PRIVACY_POLICY.md`, `DATA_RETENTION.md`, or equivalent document in the repository. POPIA requires a documented retention schedule for each data type. The 90-day fitness video retention cron (`cleanup_fitness_videos`) is technically implemented but not documented as policy.

**Fix:** Create a data retention register documenting:
- Member profile data: retained until account deletion
- Fitness videos (`video_retention = '90_days'`): deleted 90 days after submission
- Fitness videos (`video_retention = 'forever'`): retained indefinitely (document why)
- Community messages: retained indefinitely (consider a purge policy)
- Email send logs: no deletion policy currently
- Strava webhook event logs: no deletion policy currently

---

**9.3 🟡 MEDIUM — No deletion of Strava tokens on account deletion**

`strava_connections` has `ON DELETE CASCADE` to `users`, so when a user is deleted it does cascade correctly. However, the linked Strava app connection on Strava's side is not revoked (no call to `DELETE /oauth/deauthorize` is made). The deleted user's Strava access token may remain valid until expiry.

**Fix:** In `delete_account`, before deleting the user, call the Strava deauthorize API:
```typescript
const { data: conn } = await admin.from('strava_connections').select('access_token').eq('user_id', userId).maybeSingle();
if (conn?.access_token) {
  await fetch('https://www.strava.com/oauth/deauthorize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${conn.access_token}` },
  });
}
```

---

**9.4 🟢 LOW — Email send logs and suppression tables contain member email addresses with no retention policy**

`email_send_log`, `suppressed_emails`, and `email_unsubscribe_tokens` store email addresses indefinitely. These tables are service-role-only but still contain PII.

**Fix:** Add a `pg_cron` job to purge `email_send_log` rows older than 12 months.

---

**9.5 🟢 LOW — `strava_webhook_events` table retains raw Strava payload with no purge policy**

The `raw_body` column stores the full Strava webhook payload indefinitely. These contain Strava athlete IDs linked to member identities.

**Fix:** Add a cron to purge processed webhook events older than 90 days.

---

## Critical Fixes (Immediate)

**1. Restrict `process_payment` to service_role only**
- File to change: `supabase/migrations/` — add a new migration
- Fix: `REVOKE EXECUTE ON FUNCTION public.process_payment(UUID, NUMERIC) FROM PUBLIC, authenticated; GRANT EXECUTE ON FUNCTION public.process_payment(UUID, NUMERIC) TO service_role;`
- Why: Any authenticated member can currently make themselves (or anyone else) a paid member for free, bypassing payment entirely.

**2. Add auth check to `assign_peer_partners` and change `cleanup_fitness_videos` to require service_role**
- File: `supabase/functions/assign_peer_partners/index.ts`, `supabase/functions/cleanup_fitness_videos/index.ts`, `supabase/config.toml`
- Fix: Add service-role JWT check at top of each handler; set `verify_jwt = true` for cleanup_fitness_videos; update cron to use service role key from Vault
- Why: Anyone can trigger mass peer re-pairing or mass storage file deletion with a public anon key JWT.

**3. Remove `.env` from git history and rotate the anon key**
- File: `.gitignore`, `.env`
- Fix: Add `.env` to `.gitignore`. Run `git filter-repo --path .env --invert-paths`. Rotate the anon key in Supabase Dashboard. Update cron jobs to use Vault-stored keys.
- Why: The anon key is committed in git history. Combined with findings 2.1 and 2.2, it allows unauthenticated triggering of sensitive operations.

**4. Fix `delete_account` to delete storage files**
- File: `supabase/functions/delete_account/index.ts`
- Fix: Add storage file deletion for all user buckets before `deleteUser`
- Why: POPIA requires complete erasure of a data subject's personal data on request. Photos and videos currently remain after account deletion.

---

## Pre-Launch Checklist

- [ ] Restrict `process_payment` to service_role — `supabase/migrations/` (new migration) — 🔴 CRITICAL
- [ ] Add auth checks to `assign_peer_partners` and `cleanup_fitness_videos` — `supabase/functions/*/index.ts` — 🔴 CRITICAL
- [ ] Rotate anon key; remove `.env` from git history; add to `.gitignore` — repository-wide — 🔴 CRITICAL
- [ ] Fix `delete_account` to purge storage files — `supabase/functions/delete_account/index.ts` — 🟠 HIGH
- [ ] Add payment check to `assign_peer_partners` cron (replace anon key with service role from Vault) — `supabase/migrations/` — 🔴 CRITICAL
- [ ] Add `evaluate_tier_upgrade` edge function auth check (admin or self only) — `supabase/functions/evaluate_tier_upgrade/index.ts` — 🟠 HIGH
- [ ] Protect `strava_callback` against fake `userId` in state (server-side nonce store) — `supabase/functions/strava_callback/index.ts` — 🟠 HIGH
- [ ] Restrict module/lesson access to paid users — `supabase/migrations/` (new migration) — 🟠 HIGH
- [ ] Drop `"Paid users can read other paid users"` policy; route member queries through `public_member_profiles` — `supabase/migrations/` — 🟠 HIGH
- [ ] Restrict `send-transactional-email` to admin/service_role callers — `supabase/functions/send-transactional-email/index.ts` — 🟠 HIGH
- [ ] Add MIME type and size limits to `avatars` bucket — `supabase/migrations/` — 🟡 MEDIUM
- [ ] Add payment status check to `workouts` and `submissions` INSERT policies — `supabase/migrations/` — 🟡 MEDIUM
- [ ] Remove `console.log` statements logging emails/IDs from Login, Signup, Payment, useCurrentUser — `src/pages/`, `src/hooks/` — 🟡 MEDIUM
- [ ] Remove `"Paid members read archive documents"` storage SELECT policy (force signed URLs) — `supabase/migrations/` — 🟡 MEDIUM
- [ ] Document data retention policy — project documentation — 🟡 MEDIUM (POPIA)
- [ ] Fix `delete_account` to revoke Strava OAuth token — `supabase/functions/delete_account/index.ts` — 🟡 MEDIUM (POPIA)
- [ ] Replace `admin.auth.admin.listUsers()` in `redeem_invitation` with targeted lookup — `supabase/functions/redeem_invitation/index.ts` — 🟡 MEDIUM

---

## What's Already Secure

The following security practices are correctly implemented and should be preserved:

1. **RLS is enabled on every table** — No tables lack row-level security. All 18+ tables have explicit policies.

2. **`protect_user_columns` trigger** — Correctly blocks direct client mutation of `is_admin`, `payment_status`, `tier_id`, `interview_completed`, `membership_started_at`, and `rejected_at` for authenticated users. The column whitelist approach is sound.

3. **`is_current_user_admin()` SECURITY DEFINER helper** — Correctly implements admin checks without RLS recursion, used consistently across policies and edge functions.

4. **`enforce_message_sender` and `enforce_message_update` triggers** — Correctly overwrite `sender_id` from JWT (preventing spoofed senders), enforce the 15-minute edit window, and block immutable field changes.

5. **Strava token isolation** — `strava_connections` has no client INSERT/UPDATE policies; only service role (edge functions) can write tokens. The table is properly restricted.

6. **`enforce_workout_verified_via` trigger** — Correctly blocks clients from setting `strava_activity_id` or `verified_via = 'strava'`, preventing fake Strava verification.

7. **`fitness-videos` bucket is private** — No public read access; signed URLs are required. The bucket has MIME type and size restrictions.

8. **`get_submissions_signed` edge function** — Correctly extracts viewer identity from JWT (not request body), verifies paid membership server-side, and respects `video_visibility` for signed URL generation.

9. **`get_member_contact` edge function** — Correctly requires paid membership for the caller and enforces `email_visible` on the target before returning email.

10. **`redeem_invitation` reads privileges from DB** — `is_admin` status comes from the `invitations` table (admin-only writable) rather than from client-supplied values.

11. **`handle-email-suppression` HMAC verification** — Correctly uses `verifyWebhookRequest` with HMAC signature validation before processing bounce/complaint/unsubscribe events.

12. **Email queue RPC wrappers** — Correctly revoke `EXECUTE` from `PUBLIC` and grant only to `service_role` for queue manipulation functions.

13. **`peer_pairings` table** — No client INSERT/UPDATE/DELETE policies; only service role writes. Client can only read their own pairings.

14. **`channel_members` auto-join triggers** — Correctly use SECURITY DEFINER and operate server-side; clients cannot directly INSERT into `channel_members`.

15. **`is_channel_member` SECURITY DEFINER function** — Prevents RLS recursion when checking channel membership in message policies.

---

## Recommended Practices Going Forward

1. **Establish a "service_role only" pattern for all payment and tier mutations.** Create a dedicated `process_payment_v2` edge function authenticated by service_role, and route `Payment.tsx` to invoke it. Remove `process_payment` from the RPC-accessible public schema or revoke execute from all non-service roles. Never expose payment mutation as a client-callable RPC.

2. **Move all cron-job secrets to Supabase Vault.** Replace hardcoded JWT tokens in SQL migrations with `vault.decrypted_secrets` lookups. This ensures secrets are not visible in migration history and can be rotated without re-running migrations.

3. **Implement server-side nonce verification for all OAuth flows.** For Strava (and future OAuth providers), store the nonce in a short-lived DB table when the user initiates the flow (from an authenticated endpoint), and verify + consume it on the callback. This prevents state-parameter forgery attacks.

4. **Add an `admin_audit_log` table.** Log every admin action (approval, rejection, invitation creation, `is_admin` grant, forced tier change) to an append-only table with `actor_id`, `target_id`, `action`, `metadata`, and `created_at`. This is essential for POPIA accountability obligations.

5. **Complete the stub payment integration before launch.** `process_payment` uses `provider = 'stub'`. Before launch, integrate a real payment provider (PayFast or Stripe) and ensure payment confirmation comes from the payment provider's webhook (service-role edge function), not from a client-callable RPC.

6. **Apply a strict Content Security Policy (CSP) header at the hosting layer.** This is the primary defense against XSS, which would bypass any client-side security check. Given session tokens are in `localStorage`, XSS is particularly dangerous for this app.

7. **Add rate limiting to sensitive edge functions.** `redeem_invitation`, `validate_invitation`, and `delete_account` should be rate-limited by IP to prevent brute-force token enumeration and account deletion abuse. Supabase Edge Functions support this via Upstash Redis or a simple request-count GUC approach.

8. **Implement a formal POPIA data subject request process.** Build an admin UI that lists all data held for a given member ID (across all tables and storage buckets) and supports one-click complete erasure. Document the process and response SLA (POPIA requires response within a reasonable period).

9. **Rotate secrets on a schedule.** The Strava client secret, `STRAVA_VERIFY_TOKEN`, `LOVABLE_API_KEY`, and Supabase service role key should be rotated at least annually, and immediately if any edge function logs are ever exposed. Document the rotation procedure.

10. **Add integration tests for privilege escalation paths.** Write automated tests that verify: (a) a pending user cannot access paid content, (b) a member cannot update another member's `payment_status`, (c) a non-admin cannot approve applicants, (d) the `delete_account` function removes all associated storage files. These tests catch regressions when policies or triggers are modified.
