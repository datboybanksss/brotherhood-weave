# Family Ties membership application flow

## Audit and integration

The audited base is `79134a9` in `datboybanksss/brotherhood-weave`.
This is a React/Vite member application, with public login/signup and a guarded
interview → approval → payment → member-home funnel. The root redirects to the
member home/login rather than a public marketing page.

Existing signups collect only name, email and password. `/interview` embeds
Calendly and records a self-reported booking timestamp. `/admin/approvals`
already approves and rejects users, but previously had no written answers.
`interview_completed` means approved for the payment step in the existing model.

This change adds:
- Public `/apply` with the existing cream, serif and royal-blue design language.
- Three form steps: about you, intentions/commitment, and review.
- Private immutable applications keyed to authenticated accounts.
- A saved-application confirmation and interview handoff.
- Approved, declined and active-member states at `/apply`.
- Search and application reading in the existing founder approvals panel.
- Login/sign-up entry points and a guard requiring application submission before interview.
- Email confirmation messaging when signup does not return an active session.

Existing approved/paid members and founder routes retain their existing access.
Legacy applicants remain reviewable even without written answers, and are shown
an explicit missing-application message. They can complete the new form at `/apply`.
Answers are retained while navigating form steps, but are not autosaved across
page reloads. No automatic applicant emails are sent by this change.

## Database deployment (required before enabling the frontend)

Apply `supabase/migrations/20261012000001_membership_applications.sql` to the
connected Supabase project. It adds one table with RLS; applicants can insert one
application and read only their own, and administrators can read applications.
Anonymous access, client updates/deletes and client-provided submission timestamps
are not permitted. Regenerate Supabase types afterward; the API currently extends
the generated schema locally without editing generated files.

Before production rollout, verify on staging with two applicant accounts and an
administrator: own submission/read works; cross-applicant read returns no rows;
anonymous reads fail; repeated submission fails; approval and rejection update
the applicant's status. The migration has not been applied to production in this PR.

## Existing activation blocker

`src/pages/Payment.tsx` renders “Simulate Payment Success”. The edge function
`process_payment_v2` invokes `process_payment` using service-role credentials
without a payment-provider verification in that function. This is not a verified
paid checkout. Do not treat application approval as payment or a paid membership.
Replace/disable the simulation and implement verified activation before public
paid onboarding. This PR does not change prices, charge applicants, send decisions
by email or activate existing applicants.

## Validation

Use `npm ci --legacy-peer-deps` (the existing react-day-picker/date-fns peer conflict
requires legacy peer resolution), then `npm run build`, `npm test`, and
`npx tsc --noEmit -p tsconfig.app.json`. The npm lockfile is brought into sync with
the already-declared framer-motion dependency and the testing-library DOM peer.

Tests cover required-field validation, mandatory review before submission, and
preserving answers when saving fails. A live database end-to-end test is still
required after the migration. Browser screenshot validation was unavailable in
this environment because the Chromium download returned a truncated archive.
