# Family Ties App Store Readiness

Last updated: May 9, 2026

## Purpose

Track the business, privacy, safety, and platform requirements needed before Family Ties ships as a downloadable mobile app.

## Completed

- Public Privacy Policy: `/privacy`
- Public Terms of Service: `/terms`
- Public combined legal page: `/legal`
- Public account deletion page: `/account-deletion`
- Public privacy choices page: `/privacy-choices`
- Public support page: `/support`
- Public community guidelines page: `/community-guidelines`
- Signup requires agreement to Terms and Privacy Policy.
- Google signup is blocked until the agreement checkbox is selected.
- In-app delete account dialog exists in Account settings.
- Account settings links to privacy choices, account deletion information, and support.
- Public social icons are hidden unless verification status is `verified`.

## Before App Store Submission

### Apple

- Add Sign in with Apple if Google sign-in remains available in the iOS app.
- Confirm account deletion is available directly inside the app.
- Confirm app privacy details match actual data collection.
- Add support URL.
- Add privacy policy URL.
- Add terms URL if requested.
- Add report/block/moderation workflows for user-generated content.
- Decide whether paid access requires Apple In-App Purchase.
- Configure universal links if OAuth or public profile links open the app.

### Google Play

- Complete Data Safety form from actual data collection.
- Provide a public data deletion URL, likely `/account-deletion`.
- Confirm in-app account deletion or deletion request path.
- Provide support contact.
- Add moderation/reporting path for user-generated content.
- Configure Android App Links if OAuth or public profile links open the app.
- Decide whether Play Billing is required for any in-app digital membership purchase.

## User-Generated Content Readiness

Family Ties includes member-generated content:

- Channel messages.
- Direct messages.
- Reactions.
- Voice notes.
- Media attachments.
- Fitness videos.
- Profile photos.
- Social links.
- Event participation.

Needed before mobile review:

- Report content/member flow.
- Block or mute member flow, especially for direct messages.
- Admin moderation dashboard for reported items.
- Clear removal/suspension process.
- Community guidelines linked from signup, support, and account.

## Payment Readiness

Open decision: whether membership is sold inside the mobile app.

Risk:

- If digital membership, community access, or learning content is sold inside the iOS app, Apple may require In-App Purchase.
- If payment remains web-only, avoid in-app copy that directs users around App Store payment rules.

Recommended next step:

- Decide mobile payment strategy before native app submission.
- Document whether mobile app allows signup only, read-only member access, or paid upgrades.

## Authentication Readiness

Current issue:

- Google auth currently uses Lovable-managed OAuth through `@lovable.dev/cloud-auth-js`.

Before migration/mobile:

- Recreate Google OAuth client owned by Family Ties.
- Configure Google provider in the Family Ties-owned Supabase project.
- Add Sign in with Apple for iOS.
- Decide mobile OAuth callback/deep link strategy.
- Confirm members can re-login after backend migration.

## Legal URL Targets

Use these once the custom domain is live:

- Privacy Policy: `https://familyties.info/privacy`
- Terms: `https://familyties.info/terms`
- Account deletion: `https://familyties.info/account-deletion`
- Privacy choices: `https://familyties.info/privacy-choices`
- Support: `https://familyties.info/support`
- Community guidelines: `https://familyties.info/community-guidelines`

## Remaining Product Work

- Implement real social OAuth verification.
- Add report/block/mute functionality.
- Add admin report queue.
- Add Sign in with Apple.
- Add mobile deep links and universal/app links.
- Add production monitoring.
- Add owned cloud deployment.
- Add backup/restore process.
- Replace Lovable-managed auth/email dependencies.

## Review Notes

App review should be able to find:

- Account deletion from Account settings.
- Data deletion URL from store listing and support pages.
- Privacy Policy without signing in.
- Terms without signing in.
- Support contact without signing in.
- Community guidelines without signing in.
