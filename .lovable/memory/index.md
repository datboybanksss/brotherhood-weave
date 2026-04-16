# Project Memory

## Core
Family Ties Member App — private brotherhood for young SA men. Mobile-first, max-w-md centered.
Supabase backend with RLS. Three access states: pre-interview → pre-payment → paid member.
Tier system: Foundation (#9CA3AF), Independent Thinker (#7B9FFF), Founding Member (#1512D3).
Avatar component with tier ring MUST wrap every user avatar. Never render bare avatars.
No PayFast, Fireflies, Daily.co, admin panel, DMs, or video rooms yet.
RouteGuard uses ALWAYS_ALLOWED_AUTHENTICATED array for routes available to all auth'd users.
protect_user_columns trigger blocks non-admins from changing tier_id, payment_status, interview_completed, is_admin, membership_started_at, rejected_at.

## Memories
- [Schema overview](mem://features/schema) — All 10 tables, enums, RLS policies, triggers
- [Tier engine](mem://features/tier-engine) — 4-condition auto-promotion from Foundation to Independent Thinker
- [Access states](mem://features/access-states) — Three-state routing: interview → payment → full app
- [Account page](mem://features/account) — /account route, status tracker, edit profile, delete account edge function
