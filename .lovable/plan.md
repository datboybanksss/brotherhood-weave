
# Fitness Submissions Sprint (revised)

## Communication confirmations

**1. Storage bucket policies — user-folder-scoped uploads**
Private `fitness-videos` bucket (`public=false`, 50MB, `video/mp4`+`video/quicktime`). Policies on `storage.objects`:
- INSERT/UPDATE: `bucket_id='fitness-videos' AND (storage.foldername(name))[1] = auth.uid()::text`
- DELETE: same, OR `is_current_user_admin()`
- No SELECT policy → direct fetch returns 403. All client video access is via signed URLs from `get_submissions_signed`.

**2. Visibility logic in `get_submissions_signed`**
JWT-validated. For each row:
- `public` → 1h signed URL
- `private` AND viewer is owner OR admin → signed URL
- otherwise → `video_url=null, video_locked=true`
- no video → `video_url=null, video_locked=false`

**3. Leaderboard zero-submission rule**
**Excluded.** `get_monthly_leaderboard` returns only `submission_count > 0`. Forfeit list already surfaces non-participants.

---

## Amendments applied

### Amendment 1 — Atomic deletion safety
`deleteSubmission` order is reversed and tolerant:
1. `DELETE FROM submissions WHERE id = X` (RLS-protected, atomic). If this fails, surface the error and stop — nothing is lost.
2. **Then** best-effort `storage.from('fitness-videos').remove([path])`. If this fails, `console.warn` and swallow the error — the row is already gone, so the user's UI is consistent.

`cleanup_fitness_videos` is extended to also **sweep orphaned files**:
- Pass A (existing): null `video_url` for rows where `submitted_at < now() - 90d AND video_retention='90_days'`, and delete those storage files.
- Pass B (new): list every file in the `fitness-videos` bucket; for each path `{user_id}/{submission_id}.{ext}`, parse the `submission_id` and check `EXISTS(SELECT 1 FROM submissions WHERE id = submission_id AND video_url = path)`. If no matching row, delete the file. Returns `{ expired_nulled: N, orphans_swept: M }`.

### Amendment 2 — Forfeit week anchor (Monday SAST)
Explicit week semantics: **Monday 00:00 SAST → Sunday 23:59 SAST.** The Wednesday gate means the list goes live at **Wednesday 00:00 SAST** of the same week as the upcoming Saturday call.

Implementation in `ForfeitWatchlist.tsx`:
```ts
// SAST = UTC+2, no DST. We compute "now in SAST" by shifting,
// then take startOfWeek with weekStartsOn=1 (Monday).
// IMPORTANT: at year boundaries the SAST date can be one day ahead of UTC.
// Always anchor to SAST before computing the week.
import { startOfWeek, formatISO, getDay } from "date-fns";
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;
const nowSast = new Date(Date.now() + SAST_OFFSET_MS);
const mondayOfWeek = startOfWeek(nowSast, { weekStartsOn: 1 });
const weekStartISO = formatISO(mondayOfWeek, { representation: "date" }); // YYYY-MM-DD
const sastDow = getDay(nowSast); // 0=Sun, 1=Mon, ..., 6=Sat
const liveYet = sastDow === 0 || sastDow >= 3; // Wed/Thu/Fri/Sat/Sun
```
`weekStartISO` is passed to `get_weekly_forfeit_list(week_start date)`. The SQL function uses `submitted_at >= week_start AND submitted_at < week_start + interval '7 days'` (anchored at Monday 00:00 SAST converted to UTC by the planner via `timestamptz` semantics — we pass a `date`, Postgres interprets in session TZ; we'll set `SET LOCAL TIME ZONE 'Africa/Johannesburg'` inside the function to make this unambiguous).

A header comment in both `ForfeitWatchlist.tsx` and the SQL function documents the convention so timezone bugs are easier to debug at year-end.

### Amendment 3 — Soft-fail video upload in `LogActivityDialog`
Reordered submit flow:
1. Generate `submissionId = crypto.randomUUID()` client-side.
2. INSERT the submission row with `id = submissionId, video_url = NULL` (and the chosen `video_retention`/`video_visibility` if a video was selected — these are stored even before upload so the retention sweep treats the eventual file correctly).
3. If a video was selected, upload to `fitness-videos/{user_id}/{submissionId}.{ext}`.
4. On upload success: `UPDATE submissions SET video_url = path WHERE id = submissionId`. Toast success.
5. On upload failure: keep the row, toast `"Submission logged, but video upload failed."` with a **Retry** action that re-runs the upload + UPDATE against the existing row. Retry state is held in component state; if the user dismisses, the row stands as a no-video submission (still counts toward reps + leaderboard).
6. If step 2 (the row INSERT) itself fails, no upload is attempted and the user gets `"Couldn't log submission: {message}"`.

This guarantees: **the user's rep count is never lost to a flaky video upload.**

---

## Files to create/modify

### Migration — `supabase/migrations/<ts>_fitness_submissions.sql`
- `submissions` table + CHECKs + 3 indexes
- BEFORE INSERT trigger `enforce_submissions_user_id` (forces `user_id := auth.uid()` when JWT present)
- RLS: SELECT (paid OR admin), INSERT (own), DELETE (own OR admin), no UPDATE policy for users — but we need owner UPDATE for the soft-fail retry. Add UPDATE policy: `auth.uid() = user_id` with `WITH CHECK` restricted to mutating only `video_url` (enforced via a BEFORE UPDATE trigger that rejects changes to any other column).
- Storage bucket `fitness-videos` (private, 50MB, mp4/mov)
- Storage policies (folder-scoped INSERT/UPDATE/DELETE; admin DELETE; no SELECT)
- SQL functions:
  - `get_monthly_leaderboard(month_start date)` — excludes zero-submission users; tie-break `score DESC, submission_count DESC, full_name ASC`
  - `get_weekly_forfeit_list(week_start date)` — uses `Africa/Johannesburg` session TZ; sorts by `last_submission_at ASC NULLS FIRST`
  - `get_user_weekly_streak(_user_id uuid)` — backward iteration in SAST
  - `get_user_monthly_stats(_user_id uuid, month_start date)` — returns reps/submissions/videos/rank in one row
- pg_cron schedule for `cleanup_fitness_videos` daily at 01:00 UTC

### Edge functions
- `supabase/functions/cleanup_fitness_videos/index.ts` — service role; Pass A (90d retention) + Pass B (orphan sweep)
- `supabase/functions/get_submissions_signed/index.ts` — JWT-validated; visibility-aware signed URL minting

### API + hooks
- `src/api/submissions.ts` — `logSubmission` (returns id), `attachVideoToSubmission(id, path)`, `deleteSubmission(id, path?)` (row-first then best-effort storage), `uploadVideo(file, userId, submissionId)`, `getMyRecentSubmissions`
- `src/api/fitness.ts` — `getMonthlyLeaderboard`, `getWeeklyForfeitList`, `getUserStreak`, `getUserMonthlyStats`, `getMemberSubmissionsSigned`
- `src/hooks/useFitnessLeaderboard.ts`, `useForfeitList.ts`, `useMyMonthlyStats.ts`, `useMemberSubmissions.ts`

### UI — Fitness page
- `src/pages/Fitness.tsx`
- `src/components/fitness/LogActivityDialog.tsx` (≤50 lines; orchestrates the row-first/upload-second/retry flow)
- `src/components/fitness/ExerciseSelect.tsx`
- `src/components/fitness/VideoUploader.tsx` (≤50 lines; validates duration ≤60s, size ≤50MB, MIME)
- `src/components/fitness/MyRecentSubmissions.tsx`
- `src/components/fitness/MonthlyLeaderboard.tsx`
- `src/components/fitness/LeaderboardRow.tsx`
- `src/components/fitness/ForfeitWatchlist.tsx` (Monday-SAST + Wednesday-gate logic, with explanatory comment)
- `src/components/fitness/ForfeitRow.tsx`
- `src/lib/exercises.ts` — enum, labels, icons, `isTimeBased(exercise)`

### Entry points
- `src/components/home/FitnessHubCard.tsx` — placed below `CollectiveChallengeCard` in `Home.tsx`
- `src/components/me/FitnessLink.tsx` — placed above "Account settings" in `Me.tsx`
- `App.tsx` — add `<Route path="/fitness" element={<Fitness />} />` inside the `<PaidLayout>` block

### Public profile
- `src/components/member/FitnessSection.tsx` — wires stats + activity log; rendered in `MemberProfile.tsx` below `LatestRunCard`
- `src/components/member/FitnessStats.tsx`
- `src/components/member/FitnessActivityRow.tsx`
- `src/components/member/VideoPlayer.tsx` — inline `<video controls>`

---

## Build order

1. Migration (table, RLS incl. constrained owner UPDATE, trigger, bucket+policies, SQL functions, cron)
2. `cleanup_fitness_videos` (Pass A + Pass B)
3. `get_submissions_signed`
4. `src/lib/exercises.ts`, `src/api/submissions.ts`, `src/api/fitness.ts`
5. Hooks
6. `LogActivityDialog` + `VideoUploader` + `ExerciseSelect` (with retry-on-failed-upload)
7. `Fitness.tsx` + leaderboard/forfeit/recent components
8. `App.tsx` route + `FitnessHubCard` + `FitnessLink`
9. `FitnessSection` on `MemberProfile.tsx`
10. Smoke tests (incl. amendment-specific cases below)

## Extra smoke tests for amendments

- **A1a:** Delete a submission with a video → row gone immediately; storage file deleted shortly after; no UI flicker.
- **A1b:** Simulate storage delete failure (e.g., wrong path) → row still gone; warning in console; next cron run sweeps the orphan.
- **A1c:** Manually upload a file to `fitness-videos/{uid}/{random-uuid}.mp4` with no matching row → after `cleanup_fitness_videos` invocation, file is removed.
- **A2a:** On Tuesday SAST, forfeit card shows "goes live Wednesday."
- **A2b:** On Wednesday 00:01 SAST (UTC Tuesday 22:01), forfeit list is live and uses the Monday of the *current* SAST week.
- **A2c:** Year-boundary case (Dec 31 SAST 23:30 = Dec 31 UTC 21:30) — `weekStartISO` resolves to the Monday of the SAST week, not the UTC week.
- **A3a:** Network-disable Storage mid-submit → submission row appears in the feed; toast offers Retry; tapping Retry re-uploads + UPDATEs `video_url`.
- **A3b:** Dismiss the retry → row remains as a no-video submission; rep count and leaderboard reflect it.
- **A3c:** RLS check: try to UPDATE another user's submission's `video_url` → rejected by policy.
- **A3d:** RLS check: try to UPDATE own submission's `reps` → rejected by the BEFORE UPDATE trigger.
