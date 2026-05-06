# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start Vite dev server
npm run build        # production build
npm run lint         # ESLint
npm test             # run Vitest once
npm run test:watch   # Vitest in watch mode
```

Tests live in `src/**/*.{test,spec}.{ts,tsx}` and use jsdom + Testing Library. To run a single test file: `npx vitest run src/path/to/file.test.ts`.

## Architecture

**Stack**: React 18 + TypeScript + Vite, Tailwind CSS, shadcn/ui (Radix UI), TanStack Query v5, React Router v6, Supabase.

### Layered data flow

```
src/api/*.ts          — pure async functions calling Supabase directly
src/hooks/use*.ts     — TanStack Query wrappers around api functions
src/components/**     — consume hooks; no direct Supabase calls
src/pages/**          — thin route-level components composed from components/
```

### Auth & routing

`RouteGuard` (`src/components/RouteGuard.tsx`) enforces a linear onboarding funnel:

1. Unauthenticated → `/login`
2. Authenticated, interview not done → `/interview`
3. Interview done, payment pending → `/payment`
4. Paid → full app access via `PaidLayout`
5. `is_admin === true` → `/admin/*` routes

`PaidLayout` wraps all paid routes in a `max-w-md mx-auto` container with a fixed `BottomTabNav` (Library / Communities / Home / Fitness / Me).

### Supabase integration

- **Client**: `src/integrations/supabase/client.ts` — auto-generated, do not edit directly. Imported everywhere via the re-export at `src/lib/supabase.ts`.
- **Types**: `src/integrations/supabase/types.ts` — auto-generated from the database schema. The `Database` type drives all Supabase query typing.
- **Edge Functions**: `supabase/functions/` — server-side logic for video cleanup, peer pairing (`assign_peer_partners`), Strava sync, email queue, invitation redemption, etc.
- **Migrations**: `supabase/migrations/` — append-only SQL files.

### Key domain models

- **Users**: have `payment_status` (`pending`/`paid`), `interview_completed`, `is_admin`, `tier_id`, `rejected_at`.
- **Tiers**: membership levels with `ring_color` and `display_order`; evaluated server-side by the `evaluate_tier_upgrade` edge function.
- **Communities (channels/messages)**: channel types are `general`, `announcements`, `department`. Unread counts via the `get_unread_count` RPC.
- **Fitness**: workout `submissions` with exercise/reps/video, weekly forfeit list, monthly leaderboard — all via custom RPCs. All week boundaries are anchored to **SAST (UTC+2)** — see `currentSastMondayISO()` in `src/api/fitness.ts`.
- **Library**: `modules` → `lessons` (ordered), `archives` (video/PDF/article content), `playbooks`.
- **Peer pairings**: monthly `peer_pairings` rows assigning accountability partners.

### Environment variables

Required in `.env`:
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```
