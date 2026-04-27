# Home Sprint: Departments Shortcut + Collective 100km Challenge

## Confirmations
1. **CircularProgress** — raw SVG, two `<circle>` + `stroke-dasharray` math. No chart library.
2. **`get_collective_distance()`** — `STABLE SECURITY DEFINER` returning `numeric`. Called as `supabase.rpc('get_collective_distance')`. Numerics arrive as strings via PostgREST → wrap with `Number(...)`.
3. **Realtime dedup** — no optimistic insert for workouts. INSERT runs, realtime echo invalidates the queries. No double-render risk.
4. **RLS join confirmed** — the existing `Paid users can read other paid users` policy on `users` already lets the `getRecentWorkouts` join return `full_name`. No policy widening needed. The `<Avatar userId>` component fetches its own user+tier row internally, so the recent-runs join only needs `full_name` for display; ring color is handled by Avatar.
5. **Threshold uses `>=`** — `percentComplete >= 100` triggers the green/done state. Verified in the smoke tests below.

---

## Files to Create / Modify

### Task 1 — Migration
- `supabase/migrations/<ts>_workouts.sql`
  - `CREATE TABLE public.workouts` with columns + CHECK constraints (`distance_km > 0 AND <= 200`, note length `<= 200`, `ran_at <= current_date`, `ran_at >= '2026-01-01'`).
  - Indexes: `(ran_at DESC)`, `(user_id, ran_at DESC)`.
  - RLS enabled. Policies:
    - SELECT: `is_current_user_admin() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND payment_status = 'paid')`
    - INSERT: `auth.uid() = user_id`
    - No UPDATE / DELETE policies (locked out).
  - BEFORE INSERT trigger `enforce_workout_user_id()` → `NEW.user_id := auth.uid()` when present.
  - `ALTER PUBLICATION supabase_realtime ADD TABLE public.workouts;`
  - `ALTER TABLE public.workouts REPLICA IDENTITY FULL;`
  - `CREATE FUNCTION public.get_collective_distance()` + `GRANT EXECUTE TO authenticated`.

### Task 2 — Departments Shortcut Card
- `src/api/home-departments.ts` — `getMyDepartmentsWithChannelSlug(userId)` joining `user_departments → departments` and mapping `department_id → channels.slug` where `channel_type='department'`.
- `src/hooks/useMyDepartmentChannels.ts` — `useQuery`, 60s staleTime.
- `src/components/home/DepartmentsCard.tsx` — Card with Users icon. Empty state: helper text + link to `/me`. Otherwise vertical pills (name + Star if primary) routing to `/communities/{slug}`. ≤50 lines.

### Task 3 — Collective Challenge
- `src/lib/fitness-constants.ts` — `GOAL_KM = 100`, `DEADLINE = new Date('2026-06-16')`.
- `src/api/workouts.ts`
  - `logWorkout({ distance_km, ran_at, note })` — INSERT with `user_id: auth.uid()` (satisfies RLS WITH CHECK; trigger re-asserts). Returns `{ error }`.
  - `getRecentWorkouts(limit = 5)` — SELECT `id, user_id, distance_km, ran_at, note, created_at, users!user_id(full_name)` ordered `created_at DESC`.
  - `getCollectiveDistance()` — `supabase.rpc('get_collective_distance')`, returns `Number(data ?? 0)`.
- `src/components/home/CircularProgress.tsx` — SVG. Props `{ value, max, label?, sublabel? }`. Track `#9CA3AF`, arc `#1512D3`. When `value >= max`: arc `#10B981`, center "100 / 100 km — done." with Trophy icon. ≤50 lines.
- `src/components/home/LogRunDialog.tsx` — shadcn Dialog + react-hook-form + zod (`distance_km: z.number().positive().max(200)`, `ran_at: z.date()`, `note: z.string().max(200).optional()`). Distance number input with `km` suffix, shadcn date picker (disable future + `<2026-01-01`), optional note with live counter. On submit: call `logWorkout`; on `error`, sonner error toast + keep dialog open + retain form values; on success, invalidate `['collectiveDistance']` + `['recentWorkouts']`, success toast with new total, close. ≤50 lines (split helper if needed).
- `src/components/home/RecentRunsFeed.tsx` — Rows: `<Avatar userId={r.user_id} size="sm" />` + first-name from joined `full_name` + bold `{distance_km} km` + `formatDistanceToNow(created_at, { addSuffix: true })`; italic muted note line if present. Empty: "No runs logged yet — be the first." ≤50 lines.
- `src/components/home/CollectiveChallengeCard.tsx` — Header "Brotherhood Challenge — 100km by June 16", CircularProgress, days-remaining text (hidden if past), full-width "Log a run" button, RecentRunsFeed. ≤50 lines.
- `src/hooks/useCollectiveProgress.ts` — `useQuery(['collectiveDistance'])` + Realtime subscription on `workouts` INSERT → `queryClient.invalidateQueries`. Returns `{ totalKm, percentComplete, daysRemaining }`. Channel topic uses random suffix (StrictMode-safe, same fix as `useChannelMessages`).
- `src/hooks/useRecentRuns.ts` — `useQuery(['recentWorkouts'])` + Realtime INSERT subscription → invalidate.

### Task 4 — Home composition
- `src/pages/Home.tsx` — Order: WelcomeHeader, PeerPartnerCard, **DepartmentsCard**, **CollectiveChallengeCard**, TierProgressMini.

---

## Technical Notes
- **PostgREST numeric**: `numeric` returns as string; client uses `Number(...)`.
- **Realtime channel naming**: `supabase.channel(\`workouts:\${Math.random().toString(36).slice(2)}\`)` to dodge React StrictMode double-mount.
- **RLS join**: confirmed — existing `Paid users can read other paid users` is sufficient for the `users!user_id(full_name)` embed.
- **Trigger**: `enforce_workout_user_id()` mirrors `enforce_message_sender()`.
- **No try/catch**: errors come back via supabase return shapes; LogRunDialog reads `{ error }` from `logWorkout`.
- **types.ts**: regenerated automatically post-migration; no manual edit.

---

## Build Order
1. Migration (workouts + RLS + trigger + Realtime + RPC).
2. `src/api/workouts.ts` + `src/api/home-departments.ts` + `src/lib/fitness-constants.ts`.
3. `CircularProgress` (visually verify 0 / 50 / 100).
4. `useCollectiveProgress` + `useRecentRuns`.
5. `RecentRunsFeed`, `LogRunDialog`, `CollectiveChallengeCard`.
6. `useMyDepartmentChannels` + `DepartmentsCard`.
7. Update `Home.tsx`.
8. Smoke tests.

---

## Smoke Tests (delivered after build)
a. **Empty state** — 0 workouts: progress shows "0 / 100 km", arc empty, feed shows "No runs logged yet — be the first."
b. **Logging a run** — log 5.0 km today with note "test run". Circle → 5.0 / 100, feed shows row, success toast.
c. **Real-time across two clients** — User A logs 3.5 km; User B's circle and feed update within ~1s, no refresh.
d. **Departments shortcut** — 2-dept member sees both with primary starred; tap routes to `/communities/{slug}`. 0-dept member sees empty state with "Go to Me tab" link.
e. **RLS attack tests** — non-paid SELECT returns empty/error; spoofed `user_id` INSERT gets overwritten by trigger to `auth.uid()`; UPDATE rejected; DELETE rejected.
f. **Validation** — `-5` blocked; `250` blocked; future date disabled; >200-char note blocked with red counter.
g. **Aggregate correctness** — log 1.5 + 2.0 + 2.5 → total reads exactly 6.0, percent = 6%.
h. **Days remaining** — text matches actual `differenceInCalendarDays(DEADLINE, today)`.
i. **100km milestone** — SQL-insert one 100km workout. Circle goes green, "100 / 100 km — done." with Trophy. A subsequent run still increments total (e.g. 102.5) but visual stays full green.
j. **Failure path retains form state** — from browser console, call `supabase.from('workouts').insert({ ran_at: '2025-12-01', distance_km: 5 })` directly to violate the `ran_at >= '2026-01-01'` CHECK constraint. Then in the UI, fill out LogRunDialog with distance 5.0, today's date, note "won't submit", and use the same trick (open devtools and force-submit a `ran_at` < 2026-01-01 by manipulating the form value before submit, OR temporarily edit the dialog's submit handler to pass a bad date). Confirm: error toast appears, dialog stays open, all form fields retain their values.
k. **Exact 100km transition** — SQL-insert one workout of 99.5 km. Open Home as a paid member, confirm circle reads "99.5 / 100 km" with the blue arc (NOT green yet). Then via the UI log a 1.0 km run. Confirm: circle flips to green and shows "100 / 100 km — done." with Trophy at total = 100.5. Confirms threshold uses `>=`, fires exactly at 100, and does not regress when the total exceeds 100.
