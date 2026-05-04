## Goal
When an admin creates an invitation, automatically email the invitee a branded message with their personal `/invite/{token}` link. Each invitation row also gets a "Resend email" button.

## 1. Email infrastructure (one-time setup)
- Configure a sender domain via the email setup dialog (you'll add 2 NS records at your domain registrar — takes ~5 min, then DNS verifies in the background).
- Set up Lovable's email queue/infrastructure (queues, suppression, send log, cron).
- Scaffold transactional email Edge Functions (`send-transactional-email`, `handle-email-unsubscribe`, `handle-email-suppression`) and a registry for templates.
- Create the unsubscribe page at `/unsubscribe` so the auto-appended unsubscribe footer works.

## 2. Invitation email template
- New React Email template `invitation.tsx` in `_shared/transactional-email-templates/`:
  - Subject: "You've been invited to Family Ties"
  - Greeting using invitee's full name
  - Short brotherhood intro paragraph (matches the app's brand voice)
  - Big CTA button → `https://<app>/invite/{token}`
  - Plain-text fallback link
  - Mentions expiry date
  - Brand styling pulled from `src/index.css` (Family Ties palette, white body bg as required)
- Register it in `registry.ts` as `invitation`.

## 3. Auto-send on create (admin invitations page)
In `src/pages/admin/InvitationsAdmin.tsx`, after the `invitations` row is inserted:
- Call `supabase.functions.invoke('send-transactional-email', { body: { templateName: 'invitation', recipientEmail: inv.email, idempotencyKey: \`invite-${inv.id}\`, templateData: { fullName, inviteUrl, expiresAt } } })`
- Toast shows "Invitation created and email sent to {email}" (link still copied to clipboard as backup)
- If the email send fails, toast warns "Created, but email failed — use Resend"

## 4. Resend button on each row
- Add a Resend (mail) icon button next to Copy/Revoke on Active-tab rows.
- Calls the same edge function with idempotencyKey `invite-{id}-resend-{timestamp}` so it actually re-sends.
- Toast confirms delivery.

## 5. Track send status (optional polish)
- Surface the latest `email_send_log` status per invitation in the row (e.g. small "Sent ✓" / "Failed" label) by querying by `idempotencyKey` prefix.

## Smoke tests
1. Domain shows verified in Cloud → Emails (or "verifying" — emails will start sending once DNS resolves).
2. Create invite for a real address you control → arrives within ~30s, branded, button works, lands on `/invite/:token`.
3. Click Resend → second email arrives.
4. Revoke an invite → status moves; email cannot be re-sent (button hidden).
5. Unsubscribe link in footer goes to `/unsubscribe?token=...` and works.

## Notes
- No SMS in this sprint (you chose Email only). Easy to add later as a separate channel — would need Twilio connector + a `phone` column.
- Until DNS verifies, invites are still created and links are copyable, but emails will queue and only send once the domain is active.
- Suppression is automatic: if an invitee unsubscribes or the address bounces, future sends to that address are blocked.