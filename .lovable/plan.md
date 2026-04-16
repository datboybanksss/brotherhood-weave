

## Plan: Add sign-out option to /interview page and fix navigation lock

**Problem**: User is logged in as a regular signup (kgosinoko11@gmail.com) and cannot navigate away from /interview because RouteGuard correctly blocks pre-interview users from other routes. But there is no sign-out button on the interview page, trapping the user.

**Changes**:

1. **`src/pages/Interview.tsx`** — Add a "Sign out" link/button (small, muted, bottom of the page) so users on the interview screen can sign out and switch accounts.

2. **No other changes needed** — The routing logic is correct. The founder accounts (kgosi@familyties.info, themba@familyties.info, kgosietsile@familyties.info) are fully functional paid accounts with admin access. Once you sign out and log in with one of those, you'll land on /home with full access.

**How to access your founder profile after this fix**:
1. Tap "Sign out" on the interview page
2. Go to /login
3. Log in with your founder credentials (provided in the previous message)

