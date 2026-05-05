# Sprint Plan: Events System + Fitness Page Redesign

Combined sprint to introduce the universal `events` primitive and rebuild `/fitness` around personal stats, brotherhood activity, and upcoming events. Built in one pass to avoid a second redesign.

## Confirmations

1. **Calendar** — custom mobile grid (date-fns + divs, ~40 lines). No new library.
2. **Activity feed** — composed client-side from existing `workouts` + `submissions` tables. NO new `activity_log` table. Streak/leaderboard milestones derived virtually from current data.
3. **Archives extension** — adding `'event_recap'` to the `content_type` CHECK and a nullable `event_id` column is non-destructive. Existing rows keep their values; new constraint `content_type != 'event_recap' OR event_id IS NOT NULL` only affects new/changed rows.
4. **FAB** — fixed bottom-right with `bottom: calc(4rem + env(safe-area-inset-bottom) + 1rem)`, z-index above BottomTabNav (z-50), respects iOS safe area.
5. **RecentRunsFeed audit** — used only by `Fitness.tsx` (the soon-to-be-replaced runs card). NOT used by `CollectiveChallengeCard` (that one renders `CircularProgress` only). Safe to repurpose into the brotherhood feed.

---

## Task 1 — Data model (single migration)

**New table `events`** — id, title, description (markdown ≤5000), category (fitness|brotherhood_meeting|social|founder_call|workshop|other), format (in_person|remote|hybrid), location, starts_at, ends_at (≥starts_at), cover_url, is_published, created_by, created_at, updated_at. Indexes on starts_at, (category, starts_at), (is_published, starts_at). Trigger to bump updated_at.

RLS: SELECT for paid members where published OR admin; INSERT/UPDATE/DELETE admin-only.

**New table `event_rsvps`** — id, event_id (cascade), user_id (cascade), status (going_in_person|going_remote|not_going), responded_at. UNIQUE (event_id, user_id). Indexes on event_id and (user_id, event_id).

RLS: SELECT all paid members; INSERT/UPDATE only own; DELETE own or admin. BEFORE INSERT trigger forces `user_id := auth.uid()`.

**Alter `archives`** — add `event_id uuid` nullable references events(id) ON DELETE SET NULL. Drop and recreate content_type CHECK to include `'event_recap'`. Add CHECK `content_type != 'event_recap' OR event_id IS NOT NULL`.

**Storage bucket `event-covers`** — public, 5MB, image mimes. INSERT/DELETE admin-only via storage.objects policy.

**Helper SECURITY DEFINER functions**:
- `get_upcoming_events(category_filter text, limit_n int)` — published + future, optional category filter.
- `get_event_rsvp_summary(event_id uuid)` — counts per status.
- `get_my_rsvp(event_id uuid)` — caller's status or null.
- `get_user_monthly_stats_with_delta(_user_id, month_start)` — extends existing stats with month-over-month percentage.

---

## Task 2 — Admin event management

Files:
- `src/api/admin-events.ts` — list (upcoming/past), create, update, delete.
- `src/pages/admin/Events.tsx` — header + Tabs (Upcoming | Past) + new event button.
- `src/components/admin/EventsList.tsx`, `EventRow.tsx` — row with category/format badges, relative time, RSVP summary, Edit/Delete/View/Add Recap actions.
- `src/components/admin/EventForm.tsx` — RHF + zod, cover upload to event-covers, location placeholder shifts by format.
- Modify `src/pages/admin/ArchiveForm.tsx` — accept `?eventId=` and `?mode=event_recap` search params; lock content_type, prefill title from event, set domain by category.
- Modify `src/components/me/AdminLink.tsx` (or AdminSection) — add "Admin: Events" link.
- Register routes in `src/App.tsx`: `/admin/events`, `/admin/events/new`, `/admin/events/:id/edit`.

"Add Recap" links to `/admin/archives/new?mode=event_recap&eventId=:id`.

---

## Task 3 — Event detail page `/events/:id`

Files:
- `src/pages/EventDetail.tsx` — composes hero, header, RSVP, body, attendees, post-event sections.
- `src/components/events/EventHero.tsx` — 16:9 cover or category-color placeholder + badges.
- `src/components/events/EventRSVPButtons.tsx` — renders 2 or 3 buttons by format; tap selected again clears.
- `src/components/events/EventAttendeesSection.tsx` — uses existing `AvatarStack`, links to `/member/:id`.
- `src/components/events/EventActivitySection.tsx` — fitness category & past: queries `workouts` + `submissions` on event date, max 20 + View all.
- `src/components/events/EventRecapSection.tsx` — looks up archive by event_id; renders inline + link to `/library/archive/:id`.
- `src/api/events.ts` — getEventById, getMyRSVP, setRSVP, clearRSVP, getEventActivity, getEventRecap, getEventRsvpSummary, getEventAttendees.
- `src/hooks/useEvent.ts`, `useMyRSVP.ts`, `useEventAttendees.ts`.
- Add `<Route path="/events/:id" element={<EventDetail />} />` inside `<PaidLayout>` in `src/App.tsx`.

---

## Task 4 — Communities Events layer

Files:
- Modify `src/pages/Communities.tsx` — wrap in shadcn Tabs (`?layer=channels|events`), default channels.
- `src/components/communities/EventsLayer.tsx` — Upcoming + Calendar sections.
- `src/components/communities/UpcomingEventsList.tsx`, `UpcomingEventRow.tsx` — top 5 + expandable.
- `src/components/communities/EventsCalendar.tsx` — custom mobile month grid using date-fns; prev/next/today; dot per event color-coded by category.
- `src/components/communities/CalendarDay.tsx` — single cell.
- `src/components/communities/DayEventsSheet.tsx` — shadcn Sheet listing events for the tapped day.
- `src/api/community-events.ts` — getUpcomingEvents, getEventsForMonth.
- `src/hooks/useUpcomingEvents.ts`, `useEventsForMonth.ts`.

---

## Task 5 — Fitness page full rewrite

Files:
- Rewrite `src/pages/Fitness.tsx` — vertical stack: PersonalStatsHero → BrotherhoodActivityFeed → CompactLeaderboard → UpcomingFitnessEvents → ForfeitWatchlist (Wed–Sat only) → PoweredByStrava. FAB rendered as sibling.
- `src/components/fitness/PersonalStatsHero.tsx` — avatar, three stat tiles (reps, submissions, weekly streak), MoM delta line.
- `src/components/fitness/BrotherhoodActivityFeed.tsx` — merged feed row component.
- `src/components/fitness/ActivityFeedRow.tsx` — single row UI.
- `src/components/fitness/CompactLeaderboard.tsx` — top 5 + sticky-highlight current user if outside.
- `src/components/fitness/UpcomingFitnessEvents.tsx` — next 3 fitness events with RSVP indicator.
- `src/components/fitness/LogActivityFAB.tsx` — fixed bottom-right, above BottomTabNav, safe-area aware, opens existing `LogActivityDialog`.
- `src/components/fitness/PoweredByStrava.tsx` — official logo + link to strava.com (target=_blank, rel=noopener).
- `src/hooks/useBrotherhoodFeed.ts` — fetch last 50 workouts + 50 submissions, merge, sort, slice 30, with "load more".
- `public/strava-logo.svg` — official Strava orange "Powered by Strava" logomark.
- Modify `src/components/fitness/ForfeitWatchlist.tsx` to early-return null Sun–Tue SAST (gating moved from Fitness page so any future caller is also gated).

Components removed from Fitness page: existing "Log activity" hero card, full leaderboard card, "Latest runs" card. Kept components: `LogActivityDialog`, `MyRecentSubmissions`, `MonthlyLeaderboard` (data hook reused), `ForfeitWatchlist`.

---

## Task 6 — Smoke tests

Verify all 13 flows from the prompt (create event, RSVP remote/hybrid, Communities Events layer + calendar, Fitness upcoming events, personal stats, brotherhood feed, sticky FAB, forfeit gating, Powered by Strava, recap creation, past activity, RLS attacks).

---

## Constraints honored

- All new components ≤50 lines.
- No try/catch.
- No edits to `src/components/ui/`.
- RSVP user_id forced server-side via trigger.
- Forfeit watchlist hidden Sun–Tue (SAST).
- Custom calendar (no library).
- Activity feed merges existing tables only.
- FAB respects `env(safe-area-inset-bottom)` and sits above BottomTabNav (z-50+).
- Events display in user local TZ; SAST only used for forfeit gating.
