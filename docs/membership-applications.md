# Family Ties applicant and founder approval flow

## Final agreed behaviour

- Google and email/password login/signup are preserved. Public signup stays enabled.
- Responsive public navigation exposes Apply, Log in and Go to app.
- `/entry` shows the existing-member / first-time-applicant choice. `/signup`
  without a selection redirects there. Approved signed-in members skip it.
- Signed-out approved members can use the direct Log in link; there is no attempt
  to identify a signed-out visitor. `/app` is the member-home alias.
- Existing members register through the current signup UI and wait for founder
  verification. Pending copy says up to six hours and offers contact/support.
  Six hours is a staff service commitment, never automatic approval.
- First-time applicants go to public `/apply`, submit their introduction without
  needing an account, then book https://calendly.com/office-familyties/30min.
- Calendly's official inline widget emits `calendly.event_scheduled`; the UI checks
  both origin and source iframe before showing thanks and explaining review after
  the meeting. This event NEVER grants access. Booking email delivery is managed by
  Calendly's event settings, not this app. New-tab bookings confirm in Calendly.
- Unapproved accounts see `/pending`; approved members retain existing app routes.
- `/admin/approvals` separates public applications and account verification requests.
  A founder confirms verification or the applicant meeting before approving.
  Approval activates an existing verified account. If a public applicant has no
  verified account, approval creates a private invitation for staff to share.
- Application answers are private. There is no automatic decision email or scheduled
  six-hour approval. Duplicate guest submissions do not overwrite original answers.

## Backend and compatibility

The existing app gates membership using `users.payment_status = 'paid'`. Founder
approval sets that protected flag, `interview_completed`, membership start and the
Foundation tier in an audited transaction. Here the old flag indicates access,
not proof of a payment. Existing approved/paid accounts are preserved.

New SQL adds private application storage, founder-only review functions, the
non-authoritative request-kind label, and restrictive RLS gates on member-only
tables. Choosing 'existing' never grants access. The former simulated-payment
edge function returns 410 so clients cannot use it to bypass approval.

## Deployment (not performed by this PR)

1. Apply the three `20261012` migrations in order to staging first.
2. Keep hosted Auth signup enabled. Do NOT apply the abandoned invitation-only
   setting from earlier discussion; current config has `enable_signup = true`.
3. Deploy `process_payment_v2` (disabled simulator) and `redeem_invitation` with
   the included function configuration. Redeeming an invite is available without
   an existing JWT, but validates the private invitation server-side.
4. Deploy frontend and verify with separate founder, pending and approved accounts.
   Confirm pending users cannot query member-only tables, self-approve or invoke
   approval functions. Verify Google/email signup, confirmation, classification,
   meeting confirmation, guest/account approval and invitation redemption.
5. Verify Calendly event confirmation email settings and real embed behaviour.

No production records, Auth settings, migrations or functions have been changed.
Public intake currently bounds fields and deduplicates email; add bot protection
and request throttling before broad promotion. Other pre-existing SECURITY_AUDIT.md
findings and security-definer RPCs need their own deployment security review.

## Verification

`npm ci --legacy-peer-deps` is needed for the pre-existing date-fns/day-picker peer
conflict. Run `npm test`, `npx tsc --noEmit -p tsconfig.app.json`, and `npm run build`.
Browser screenshot QA was blocked by the unavailable Chromium download. Database
RLS and real Calendly/Google integration checks require the connected staging setup.
