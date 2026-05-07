import { supabase } from "@/lib/supabase";

export interface CarouselMember {
  id: string;
  full_name: string;
  featured_url: string | null;
  department: string | null;
  created_at?: string | null;
}

export async function getMembersForCarousel(currentUserId: string): Promise<CarouselMember[]> {
  const [{ data: members, error: mErr }, { data: photos }, { data: deptRows }] = await Promise.all([
    (supabase as any)
      .from("public_member_profiles")
      .select("id, full_name, avatar_url, created_at")
      .neq("id", currentUserId),
    (supabase as any)
      .from("profile_photos")
      .select("user_id, storage_path, display_order")
      .order("display_order", { ascending: true }),
    (supabase as any)
      .from("user_departments")
      .select("user_id, is_primary, departments(name)"),
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

  const deptMap = new Map<string, string>();
  for (const d of (deptRows ?? []) as any[]) {
    if (d.is_primary && d.departments?.name) deptMap.set(d.user_id, d.departments.name);
  }

  const result: CarouselMember[] = [];
  for (const m of (members ?? []) as any[]) {
    const featured_url = photoMap.get(m.id) ?? m.avatar_url ?? null;
    const dept = deptMap.get(m.id) ?? null;
    result.push({ id: m.id, full_name: m.full_name, featured_url, department: dept, created_at: m.created_at ?? null });
  }
  return result;
}
