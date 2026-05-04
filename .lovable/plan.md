# Finish Invitations + Google OAuth + Onboarding (visible UI)

The backend, edge functions, OAuth provider config, and helper components are already built. This plan finishes the visible wiring so you (admin) can create invites and members can use Google + see the onboarding modal.

## 1. Admin Invitations Manager — `/admin/invitations`
Create `src/pages/admin/InvitationsAdmin.tsx` with:
- "New Invitation" form: full name, email, intended tier (Foundation default), `is_admin` toggle, expiry (default 30 days)
- On create: generate cryptographically random token (`crypto.randomUUID()` + base64), insert via supabase client (admin RLS already allows), then show **copy-to-clipboard link** `${origin}/invite/{token}`
- Tabs: Active / Used / Expired / Revoked (filter client-side)
- Each row: name, email, status pill, expiry (relative), Copy Link, Revoke (sets `revoked_at = now()`)
- Add `/admin/invitations` route in `App.tsx` (under existing admin routes)
- Add entry to `src/components/me/AdminSection.tsx` links array: `{ label: "Invitations", path: "/admin/invitations", icon: Mail }`

## 2. Public invite redemption — `/invite/:token`
Create `src/pages/InviteRedemption.tsx`:
- On mount: invoke `validate_invitation` edge function with token
- States: loading / invalid / used / expired / revoked / valid
- When valid: show locked email (read-only), full_name, password + confirm password fields, Sign Up button → invokes `redeem_invitation` with `{ token, password }` → on success calls `supabase.auth.signInWithPassword` → routes to `/home`
- Also offer `<GoogleSignInButton redirectTo="/home" />` — before click, store token in `sessionStorage.pending_invite_token` so `/auth/callback` redeems it
- Public route (outside `RouteGuard`'s auth requirement). Update `RouteGuard.tsx` to add `/invite` prefix and `/auth/callback` to PUBLIC_PATHS

## 3. Google buttons on Login + Signup
Edit `src/pages/Login.tsx` and `src/pages/Signup.tsx`:
- Below the existing form, add `<AuthDivider />` then `<GoogleSignInButton />`
- No other layout changes — keep existing email/password as primary

## 4. Register new routes in `App.tsx`
Public (outside RouteGuard or as PUBLIC_PATHS):
- `/auth/callback` → `AuthCallback`
- `/invite/:token` → `InviteRedemption`

Admin (inside RouteGuard, admin-checked):
- `/admin/invitations` → `InvitationsAdmin`

## 5. Onboarding modal on Home
Edit `src/pages/Home.tsx`:
- Add local state `onboardingOpen`, default to `appUser.payment_status === 'paid' && !appUser.onboarded_at`
- Render `<OnboardingModal open={onboardingOpen} onClose={...} onComplete={...} />`
- `onComplete`: update `users.onboarded_at = now()` for current user, invalidate `currentUser` query, close modal
- Add `onboarded_at` and `invited_via_token` to `AppUser` interface in `src/hooks/useCurrentUser.ts`

## 6. Rewatch onboarding on Account page
Edit `src/pages/Account.tsx`: add a "Rewatch onboarding" button (only visible to paid members) that opens `OnboardingModal` with `showCompleteButton={false}` — does not modify `onboarded_at`

## Smoke tests after build
1. `/me` shows new "Invitations" admin tile (admin only)
2. Admin creates invite → link is copyable
3. Open invite link in incognito → redemption form shows email locked
4. Submit password → redirected to `/home` as paid member, onboarding modal auto-opens
5. Complete onboarding → reload, modal does not reappear
6. Account → Rewatch onboarding works without re-marking complete
7. Revoked / expired / already-used tokens show proper non-form states
8. Login page shows "Continue with Google"; clicking redirects to Google then back to `/home` (existing paid user) or `/interview` (new user)
9. Sign in with Google using an email that doesn't match an active invite token in `sessionStorage` → email_mismatch handled (sign out + toast)
10. Admin can revoke an active invite; status moves to Revoked tab

## Technical notes
- Token generation: `crypto.randomUUID().replaceAll('-','') + crypto.randomUUID().replaceAll('-','')` → 64 hex chars, URL-safe
- `redeem_invitation` is idempotent: re-submitting after success returns `used` error which UI handles gracefully
- The `expire_stale_invitations_for_email` trigger auto-revokes older pending invites for the same email when a new one is created
