import { supabase } from "@/lib/supabase";
import type { ExerciseKey } from "@/lib/exercises";

export interface LeaderboardRow {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  tier_id: string | null;
  total_reps: number;
  submission_count: number;
  video_count: number;
  score: number;
}

export async function getMonthlyLeaderboard(monthStart: string): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc("get_monthly_leaderboard", { month_start: monthStart });
  if (error) throw error;
  return (data ?? []).map((r: LeaderboardRow) => ({
    ...r,
    total_reps: Number(r.total_reps),
    submission_count: Number(r.submission_count),
    video_count: Number(r.video_count),
    score: Number(r.score),
  })) as LeaderboardRow[];
}

export interface ForfeitRow {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  tier_id: string | null;
  last_submission_at: string | null;
}

export async function getWeeklyForfeitList(weekStart: string): Promise<ForfeitRow[]> {
  const { data, error } = await supabase.rpc("get_weekly_forfeit_list", { week_start: weekStart });
  if (error) throw error;
  return (data ?? []) as ForfeitRow[];
}

export async function getUserStreak(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc("get_user_weekly_streak", { _user_id: userId });
  if (error) throw error;
  return Number(data ?? 0);
}

export interface MonthlyStats {
  total_reps: number;
  submission_count: number;
  video_count: number;
  rank: number;
}

export interface MonthlyActivityDay {
  date: string;
  reps: number;
  submission_count: number;
  run_km: number;
  tier: 0 | 1 | 2 | 3;
}

export async function getUserMonthlyStats(userId: string, monthStart: string): Promise<MonthlyStats> {
  const { data, error } = await supabase.rpc("get_user_monthly_stats", {
    _user_id: userId, month_start: monthStart,
  });
  if (error) throw error;
  const row = (data ?? [])[0] ?? { total_reps: 0, submission_count: 0, video_count: 0, rank: 0 };
  return {
    total_reps: Number(row.total_reps ?? 0),
    submission_count: Number(row.submission_count ?? 0),
    video_count: Number(row.video_count ?? 0),
    rank: Number(row.rank ?? 0),
  };
}

export interface SignedSubmission {
  id: string;
  user_id: string;
  exercise: ExerciseKey;
  reps: number;
  note: string | null;
  submitted_at: string;
  video_visibility: "public" | "private";
  video_url: string | null; // signed URL or null
  video_locked: boolean;
}

export async function getMemberSubmissionsSigned(userId: string, limit = 50): Promise<SignedSubmission[]> {
  const { data, error } = await supabase.functions.invoke("get_submissions_signed", {
    body: { user_id: userId, limit },
  });
  if (error) throw error;
  return (data?.submissions ?? []) as SignedSubmission[];
}

export async function getMyMonthlyActivity(monthStartISO: string): Promise<MonthlyActivityDay[]> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return [];

  const start = new Date(`${monthStartISO}T00:00:00.000Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  const daysInMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  const byDate = new Map<string, Omit<MonthlyActivityDay, "tier">>();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    byDate.set(date, { date, reps: 0, submission_count: 0, run_km: 0 });
  }

  const [submissions, workouts] = await Promise.all([
    supabase
      .from("submissions")
      .select("reps, submitted_at")
      .eq("user_id", uid)
      .gte("submitted_at", start.toISOString())
      .lt("submitted_at", end.toISOString()),
    supabase
      .from("workouts")
      .select("distance_km, ran_at")
      .eq("user_id", uid)
      .gte("ran_at", monthStartISO)
      .lt("ran_at", end.toISOString().slice(0, 10)),
  ]);

  if (submissions.error) throw submissions.error;
  if (workouts.error) throw workouts.error;

  for (const row of submissions.data ?? []) {
    const date = sastDateKey(new Date(row.submitted_at));
    const day = byDate.get(date);
    if (!day) continue;
    day.reps += Number(row.reps ?? 0);
    day.submission_count += 1;
  }

  for (const row of workouts.data ?? []) {
    const date = row.ran_at;
    const day = byDate.get(date);
    if (!day) continue;
    day.run_km += Number(row.distance_km ?? 0);
  }

  return Array.from(byDate.values()).map((day) => {
    const hitBenchmark = day.reps >= 50;
    const hitRun = day.run_km >= 3;
    const extraWorkout = day.submission_count >= 2;
    const tier: MonthlyActivityDay["tier"] = hitBenchmark && hitRun && extraWorkout
      ? 3
      : hitBenchmark && hitRun
        ? 2
        : hitBenchmark
          ? 1
          : 0;
    return { ...day, tier };
  });
}

/**
 * Compute Monday of the current SAST week as ISO date (YYYY-MM-DD).
 * SAST = UTC+2, no DST. We shift Date.now() by +2h then compute startOfWeek.
 * IMPORTANT at year boundaries the SAST date can drift one day from UTC —
 * always anchor to SAST before computing the week.
 */
export function currentSastMondayISO(now = new Date()): string {
  const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;
  const sast = new Date(now.getTime() + SAST_OFFSET_MS);
  const dow = sast.getUTCDay(); // 0=Sun..6=Sat (working in shifted UTC)
  const daysSinceMon = (dow + 6) % 7; // Mon→0, Tue→1, ..., Sun→6
  const mon = new Date(Date.UTC(sast.getUTCFullYear(), sast.getUTCMonth(), sast.getUTCDate() - daysSinceMon));
  const y = mon.getUTCFullYear();
  const m = String(mon.getUTCMonth() + 1).padStart(2, "0");
  const d = String(mon.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function currentSastDayOfWeek(now = new Date()): number {
  const sast = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return sast.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
}

export function sastDateKey(date = new Date()): string {
  return new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function currentMonthStartISO(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}
