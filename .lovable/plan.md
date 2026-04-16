

## Revised Plan: /account page, status tracker, and protected-columns trigger

Everything from the previous plan remains the same, with one critical refinement to the trigger design based on your verification request.

### Trigger design (refined)

The BEFORE UPDATE trigger on `users` that guards protected columns will include two bypass conditions:

1. **Admin bypass**: If `is_current_user_admin()` returns true, allow all column changes.
2. **SECURITY DEFINER bypass**: If `current_setting('role') != 'authenticated'`, skip the check. This ensures `process_payment` (which sets `payment_status`, `tier_id`, `membership_started_at`) and `evaluate_tier_upgrade` (which sets `tier_id`) continue working — both are SECURITY DEFINER functions that execute with elevated privileges, not as the `authenticated` role.

```sql
CREATE OR REPLACE FUNCTION protect_user_columns()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Skip for non-authenticated contexts (SECURITY DEFINER functions)
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'authenticated' THEN
    RETURN NEW;
  END IF;
  -- Skip for admins
  IF is_current_user_admin() THEN
    RETURN NEW;
  END IF;
  -- Block protected column changes for regular users
  IF NEW.tier_id IS DISTINCT FROM OLD.tier_id
    OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
    OR NEW.interview_completed IS DISTINCT FROM OLD.interview_completed
    OR NEW.is_admin IS DISTINCT FROM OLD.is_admin
    OR NEW.membership_started_at IS DISTINCT FROM OLD.membership_started_at
    OR NEW.rejected_at IS DISTINCT FROM OLD.rejected_at
  THEN
    RAISE EXCEPTION 'Cannot modify protected columns';
  END IF;
  RETURN NEW;
END;
$$;
```

This satisfies all three scenarios:
- **process_payment RPC**: runs as definer, JWT role claim absent → bypassed ✓
- **Admin approval** (client-side `update interview_completed`): admin check passes → bypassed ✓
- **Non-admin tries `SET is_admin = true`**: both checks fail → exception thrown ✓

### Smoke test additions

Added to step 7:
- **7h.** As a non-admin test user, open browser console and run: `supabase.from('users').update({ is_admin: true }).eq('id', '<own-id>')` → confirm error "Cannot modify protected columns".
- **7i.** As the same test user, complete payment via the stub button → confirm `process_payment` succeeds (proving the SECURITY DEFINER bypass works).

### Everything else unchanged

- Edge Function `delete_account`
- RouteGuard refactor with `ALWAYS_ALLOWED_AUTHENTICATED`
- /account page with all sub-components (ProfileHeader, StatusTracker, EditProfileForm, DangerZone, DeleteAccountDialog)
- Entry points: UserDropdownMenu on /interview and /payment, "Account settings" on Me tab
- /interview copy update with "View my status" link

### Files to create
- `supabase/functions/delete_account/index.ts`
- `src/pages/Account.tsx`
- `src/components/account/AccountProfileHeader.tsx`
- `src/components/account/StatusTracker.tsx`
- `src/components/account/StatusStep.tsx`
- `src/components/account/MembershipInfo.tsx`
- `src/components/account/EditProfileForm.tsx`
- `src/components/account/DangerZone.tsx`
- `src/components/account/DeleteAccountDialog.tsx`
- `src/api/account.ts`
- `src/components/UserDropdownMenu.tsx`

### Files to modify
- New migration for `protect_user_columns` trigger
- `src/components/RouteGuard.tsx`
- `src/App.tsx`
- `src/pages/Interview.tsx`
- `src/pages/Payment.tsx`
- `src/pages/Me.tsx`

