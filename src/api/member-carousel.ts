import { supabase } from "@/lib/supabase";

export interface CarouselMember {
  id: string;
  full_name: string;
  featured_url: string;
  department: string | null;
  created_at?: string | null;
}

export async function getMembersForCarousel(currentUserId: string): Promise<CarouselMember[]> {
  const [{ data: members, error: mErr }, { data: photos }] = await Promise.all([
    (supabase as any)
      .from("public_member_profiles")
      .select("id, full_name, avatar_url, created_at, user_departments(is_primary, departments(name))")
      .neq("id", currentUserId),
    (supabase as any)
      .from("profile_photos")
      .select("user_id, storage_path, display_order")
      .order("display_order", { ascending: true }),
  ]);
  if (mErr) throw mErr;

  // First photo per member (already ordered by display_order)
  const photoMap = new Map<string, string>();
  for (const p of (photos ?? []) as any[]) {
    if (!photoMap.has(p.user_id)) {
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(p.storage_path);
      photoMap.set(p.user_id, data.publicUrl);
    }
  }

  const result: CarouselMember[] = [];
  for (const m of (members ?? []) as any[]) {
    const featured_url = photoMap.get(m.id) ?? m.avatar_url;
    if (!featured_url) continue;
    const dept = (m.user_departments as any[])?.find((d: any) => d.is_primary)?.departments?.name ?? null;
    result.push({ id: m.id, full_name: m.full_name, featured_url, department: dept, created_at: m.created_at ?? null });
  }
  return result;
}
