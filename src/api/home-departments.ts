import { supabase } from "@/lib/supabase";

export interface MyDepartmentChannel {
  department_id: string;
  name: string;
  is_primary: boolean;
  channel_slug: string | null;
}

export async function getMyDepartmentsWithChannelSlug(userId: string): Promise<MyDepartmentChannel[]> {
  const { data: ud, error } = await supabase
    .from("user_departments")
    .select("department_id, is_primary, departments(name, slug)")
    .eq("user_id", userId);
  if (error) throw error;
  if (!ud || ud.length === 0) return [];

  const deptIds = ud.map((r: any) => r.department_id);
  const { data: chans } = await supabase
    .from("channels")
    .select("slug, department_id")
    .eq("channel_type", "department")
    .in("department_id", deptIds);
  const slugByDept = new Map<string, string>((chans ?? []).map((c: any) => [c.department_id, c.slug]));

  return ud
    .map((r: any) => ({
      department_id: r.department_id,
      name: r.departments?.name ?? "",
      is_primary: r.is_primary,
      channel_slug: slugByDept.get(r.department_id) ?? null,
    }))
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.name.localeCompare(b.name));
}
