import { supabase } from "@/lib/supabase";
import type { ExerciseKey } from "@/lib/exercises";

const BUCKET = "fitness-videos";

export interface SubmissionInput {
  id: string; // generated client-side
  exercise: ExerciseKey;
  reps: number;
  note?: string | null;
  has_video: boolean;
  video_retention?: "90_days" | "forever";
  video_visibility?: "public" | "private";
}

export async function logSubmission(input: SubmissionInput) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { error: new Error("Not signed in"), data: null };
  const { data, error } = await supabase
    .from("submissions")
    .insert({
      id: input.id,
      user_id: uid,
      exercise: input.exercise,
      reps: input.reps,
      note: input.note?.trim() ? input.note.trim() : null,
      video_url: null,
      video_retention: input.has_video ? (input.video_retention ?? "90_days") : "90_days",
      video_visibility: input.has_video ? (input.video_visibility ?? "public") : "public",
    })
    .select()
    .single();
  return { data, error };
}

export async function uploadSubmissionVideo(file: File, userId: string, submissionId: string) {
  const ext = file.type === "video/quicktime" ? "mov" : "mp4";
  const path = `${userId}/${submissionId}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type, upsert: true,
  });
  if (error) return { error, path: null };
  return { error: null, path };
}

export async function attachVideoToSubmission(submissionId: string, path: string) {
  return supabase.from("submissions").update({ video_url: path }).eq("id", submissionId);
}

/**
 * Row-first deletion. If storage delete fails, the row is already gone — the
 * orphaned file gets cleaned up on the next cleanup_fitness_videos cron run.
 */
export async function deleteSubmission(id: string, videoPath: string | null) {
  const { error } = await supabase.from("submissions").delete().eq("id", id);
  if (error) return { error };
  if (videoPath) {
    const { error: stErr } = await supabase.storage.from(BUCKET).remove([videoPath]);
    if (stErr) console.warn("Storage delete failed (will be swept):", stErr.message);
  }
  return { error: null };
}

export interface MyRecentSubmission {
  id: string;
  exercise: ExerciseKey;
  reps: number;
  note: string | null;
  submitted_at: string;
  video_url: string | null;
}

export async function getMyRecentSubmissions(limit = 5): Promise<MyRecentSubmission[]> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from("submissions")
    .select("id, exercise, reps, note, submitted_at, video_url")
    .eq("user_id", uid)
    .order("submitted_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as MyRecentSubmission[];
}

export async function getMyWeeklySubmissionCount(weekStartISO: string): Promise<number> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return 0;
  const start = new Date(weekStartISO);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { count, error } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid)
    .gte("submitted_at", start.toISOString())
    .lt("submitted_at", end.toISOString());
  if (error) throw error;
  return count ?? 0;
}