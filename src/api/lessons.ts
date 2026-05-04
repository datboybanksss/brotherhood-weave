import { supabase } from "@/lib/supabase";

type LessonReleaseFields = { is_released: boolean; release_date: string | null };

export function isLessonReleased(lesson: LessonReleaseFields): boolean {
  if (lesson.is_released) return true;
  if (lesson.release_date && new Date(lesson.release_date).getTime() <= Date.now()) return true;
  return false;
}

export function getLessonReleaseStatus(
  lesson: LessonReleaseFields
): "live" | "scheduled" | "locked" {
  if (lesson.is_released) return "live";
  if (lesson.release_date) {
    return new Date(lesson.release_date).getTime() <= Date.now() ? "live" : "scheduled";
  }
  return "locked";
}

export async function getLessonsByModule(moduleId: string) {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("display_order");
  if (error) throw error;
  return data;
}

export async function getUserLessonProgress(userId: string, lessonIds: string[]) {
  const { data, error } = await supabase
    .from("user_lesson_progress")
    .select("*")
    .eq("user_id", userId)
    .in("lesson_id", lessonIds);
  if (error) throw error;
  return data;
}

export async function markLessonComplete(userId: string, lessonId: string) {
  const { data, error } = await supabase
    .from("user_lesson_progress")
    .upsert(
      { user_id: userId, lesson_id: lessonId, completed_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}
