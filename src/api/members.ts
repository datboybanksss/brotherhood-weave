import { supabase } from "@/lib/supabase";

export interface PublicMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  tier_id: string | null;
  membership_started_at: string | null;
  bio: string | null;
  created_at: string;
  title: string | null;
  current_city: string | null;
  email_visible: boolean;
}

export async function getPublicMemberById(id: string): Promise<PublicMember | null> {
  const { data, error } = await (supabase as any)
    .from("public_member_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as PublicMember | null;
}

export async function getMemberDepartments(userId: string) {
  const { data, error } = await supabase
    .from("user_departments")
    .select("is_primary, departments(id, name, slug)")
    .eq("user_id", userId);
  if (error) throw error;
  return data as unknown as Array<{ is_primary: boolean; departments: { id: string; name: string; slug: string } | null }>;
}
