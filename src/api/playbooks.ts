import { supabase } from "@/lib/supabase";

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export async function ensureUniqueSlug(slug: string, excludeId?: string) {
  let candidate = slug;
  let suffix = 1;
  while (true) {
    const query = supabase.from("playbooks").select("id").eq("slug", candidate).limit(1);
    const { data } = excludeId ? await query.neq("id", excludeId) : await query;
    if (!data?.length) return candidate;
    suffix++;
    candidate = `${slug}-${suffix}`;
  }
}

type PlaybookCategory = "money" | "career" | "relationships" | "health" | "mindset" | "craft";

export async function getPlaybooks(category?: PlaybookCategory) {
  let query = supabase
    .from("playbooks")
    .select("*, author:author_id(id, full_name, avatar_url, tier_id, tiers(name, ring_color, display_order))")
    .order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getPlaybook(slug: string) {
  const { data, error } = await supabase
    .from("playbooks")
    .select("*, author:author_id(id, full_name, avatar_url, tier_id, tiers(name, ring_color, display_order))")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}
