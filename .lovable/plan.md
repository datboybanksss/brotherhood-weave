# Sprint plan: invites + onboarding modal + Google sign-in

## 1) Files to create or modify, grouped by task

### Task 1 — Schema + access model
Create / modify:
- `supabase/migrations/<new_timestamp>_invitations_onboarding_google.sql`
- `src/hooks/useCurrentUser.ts` (extend user shape for `onboarded_at`, `invited_via_token`)
- `src/integrations/supabase/types.ts` (auto-generated after migration; not edited manually)

Migration will:
- create `public.invitations`
- add admin-only RLS on `invitations`
- add `users.onboarded_at`
- add `users.invited_via_token`
- add indexes and active-invite uniqueness
- include the requested Google setup note with the exact callback URL

### Task 2 — Invitation edge functions
Create:
- `supabase/functions/validate_invitation/index.ts`
- `supabase/functions/redeem_invitation/index.ts`

These will:
- validate token state for the public invite page
- redeem via password flow or existing Google-authenticated user flow
- enforce exact email match server-side
- upgrade invited users into the paid/member state
- handle repeat submits idempotently

### Task 3 — Admin invitation management
Create:
- `src/pages/admin/Invitations.tsx`
- `src/components/admin/InvitationsList.tsx`
- `src/components/admin/InvitationRow.tsx`
- `src/components/admin/InvitationForm.tsx`
- `src/api/admin-invitations.ts`
- `src/hooks/useAdminInvitations.ts`

Modify:
- `src/components/me/AdminSection.tsx`
- `src/App.tsx`

This adds `/admin/invitations`, the create/copy/revoke flow, and the new admin entry point.

### Task 4 — Public invite redemption UI
Create:
- `src/pages/InviteRedeem.tsx`
- `src/components/invite/InviteRedemptionForm.tsx`
- `src/components/invite/InviteStatusMessage.tsx`
- `src/api/invitations.ts`

Modify:
- `src/App.tsx`
- `src/components/RouteGuard.tsx`

This adds the public `/invite/:token` route outside the gated member flow.

### Task 5 — Google sign-in
Create:
- `src/pages/AuthCallback.tsx`
- `src/components/auth/GoogleSignInButton.tsx`
- `src/components/auth/AuthDivider.tsx`

Modify:
- `src/pages/Login.tsx`
- `src/pages/Signup.tsx`
- `src/pages/InviteRedeem.tsx`
- `src/App.tsx`
- `src/components/RouteGuard.tsx`

This adds Google as a secondary auth method on login, signup, and invite redemption.

### Task 6 — Onboarding modal + rewatch
Create:
- `src/lib/onboarding-constants.ts`
- `src/components/onboarding/OnboardingModal.tsx`
- `src/api/onboarding.ts`

Modify:
- `src/pages/Home.tsx`
- `src/pages/Account.tsx`

This adds first-paid-login onboarding plus the rewatch entry on the account page.

## 2) Google + invite flow: exact handling for the “auth user already exists” case

Yes — the matched-email Google invite flow can be implemented safely without creating a duplicate user.

Planned behavior:
- On `/invite/:token`, tapping “Sign up with Google instead” stores `pending_invite_token` in `sessionStorage` and starts Google OAuth.
- `/auth/callback` checks for that pending token after the Google session is established.
- If the Google account email matches `invitation.email` exactly, the app calls `redeem_invitation` **with the existing signed-in user**.
- In that branch, `redeem_invitation` will:
  - validate the bearer token with `getClaims()`
  - use the authenticated user as the target user
  - **skip** `auth.admin.createUser`
  - update the existing `users` row to `payment_status='paid'`, `interview_completed=true`, set `tier_id`, `is_admin`, `membership_started_at`, and `invited_via_token`
  - mark the invitation as used by that user
- If the token was already redeemed by that same user during a double-submit/retry window, the function returns success instead of failing. That is the idempotent path.
- If the Google email does **not** match the invitation email, the callback signs the user out, clears the pending token, and sends them back to `/invite/:token?error=email_mismatch`.

For the password flow, `redeem_invitation` still creates the auth user itself with `auth.admin.createUser`, then upgrades the resulting member record.

## 3) SAST date display confirmation

Yes — invitation expiry display will stay consistent with the rest of the app.

Plan:
- store `expires_at` as a server-side `timestamptz`
- render active invite expiry using the same relative-date pattern already used elsewhere (`formatDistanceToNow(..., { addSuffix: true })`)
- render created dates with the same date-fns conventions already used in admin/member screens
- avoid custom client-side timezone math for invites

Why this is safe:
- the app already uses normal date-fns display formatting for most user-facing timestamps
- the SAST-specific timezone logic in the app today is mainly for fitness week boundaries, not generic admin timestamps
- relative expiry labels like “in 27 days” will remain correct for South Africa because the stored timestamp is authoritative and there is no DST complication here

## 4) Implementation approach

### Schema and security
- Build `invitations` with admin-only RLS.
- Keep token redemption off direct table access; the public invite flow goes only through backend functions.
- Preserve the existing three-state gate; invited members bypass it by having their user row upgraded to paid + interview complete during redemption.

### Routing updates
- Add public routes for:
  - `/invite/:token`
  - `/auth/callback`
- Keep them outside the auth-required member wrapper.
- Update `RouteGuard` public paths accordingly so OAuth and invite pages are reachable pre-login.
- Keep `/home` as the first paid destination.

### Admin invitations UI
- Reuse the existing mobile-first admin page pattern.
- Add tabs for active vs used/expired/revoked.
- New invite dialog validates name, email, tier, admin flag, and expiry window.
- Copy full invite link immediately after creation.
- Revoke uses confirmation dialog.

### Invite redemption UX
- `InviteRedeem` loads token state on mount.
- Valid tokens show the locked email, password/confirm fields, and the Google alternative.
- Used / expired / revoked / missing tokens show dedicated non-form states.
- Email mismatch and token-state failures surface through clear toasts/messages.

### Google auth UX
- Add a reusable Google button and divider above the current email/password forms.
- Keep email/password as-is beneath the divider.
- `AuthCallback` decides among:
  - paid existing member → `/home`
  - normal new or pending user → `/interview`
  - invite-in-progress Google user → redeem invite, then `/home`

### Onboarding modal
- Add a reusable `OnboardingModal` based on shadcn Dialog.
- Auto-open on `/home` only when `payment_status === 'paid'` and `onboarded_at` is null.
- Completion updates `onboarded_at`, invalidates current-user data, and prevents re-show.
- Add an account-page “App tour” section that reopens the same modal in rewatch mode without updating onboarding state.

## 5) Smoke-test checklist to run after implementation
- Admin create/copy/revoke invite
- Password redeem success
- Email mismatch rejection
- Reused invite state
- Expired invite state
- Revoked invite state
- Google signup without invite → `/interview`
- Google sign-in existing paid member → `/home`
- Invite + Google success with matching email
- Invite + Google mismatch → sign out + redirect back
- First paid login auto-opens onboarding modal
- Completing onboarding sets `onboarded_at`
- Account-page rewatch opens modal without changing onboarding state

## 6) Important note before implementation
I’m currently in read-only plan mode, so I can’t produce the requested `<lov-code>` implementation block yet. Once you approve this plan, I’ll switch to build mode and implement the full sprint in one pass.