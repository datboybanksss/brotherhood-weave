import { supabase } from "@/lib/supabase";

export async function getAdminModules() {
  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .order("display_order");
  if (error) throw error;
  return data;
}

export async function getModuleById(id: string) {
  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

async function generateUniqueSlug(title: string, excludeId?: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  let slug = base;
  let counter = 1;
  while (true) {
    let query = supabase.from("modules").select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query;
    if (!data?.length) return slug;
    counter++;
    slug = `${base}-${counter}`;
  }
}

export async function createModule(values: {
  title: string;
  description: string;
  display_order: number;
  required_tier_id: string | null;
}) {
  const slug = await generateUniqueSlug(values.title);
  const { error } = await supabase.from("modules").insert({ ...values, slug });
  if (error) throw error;
}

export async function updateModule(
  id: string,
  values: {
    title?: string;
    description?: string;
    display_order?: number;
    required_tier_id?: string | null;
  }
) {
  let slug: string | undefined;
  if (values.title) slug = await generateUniqueSlug(values.title, id);
  const { error } = await supabase
    .from("modules")
    .update({ ...values, ...(slug ? { slug } : {}) })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteModule(id: string) {
  // Delete lessons first
  const { error: le } = await supabase.from("lessons").delete().eq("module_id", id);
  if (le) throw le;
  const { error } = await supabase.from("modules").delete().eq("id", id);
  if (error) throw error;
}

// Lessons
export async function getModuleLessons(moduleId: string) {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("display_order");
  if (error) throw error;
  return data;
}

export async function createLesson(values: {
  title: string;
  module_id: string;
  display_order: number;
  video_url?: string;
  body_markdown?: string;
  worksheet_pdf_url?: string;
  duration_seconds?: number;
  is_released?: boolean;
  release_date?: string | null;
}) {
  const { error } = await supabase.from("lessons").insert(values);
  if (error) throw error;
}

export async function updateLesson(
  id: string,
  values: {
    title?: string;
    display_order?: number;
    video_url?: string | null;
    body_markdown?: string | null;
    worksheet_pdf_url?: string | null;
    duration_seconds?: number | null;
    is_released?: boolean;
    release_date?: string | null;
  }
) {
  const { error } = await supabase.from("lessons").update(values).eq("id", id);
  if (error) throw error;
}

export async function deleteLesson(id: string) {
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) throw error;
}

export async function getLessonById(id: string) {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}
