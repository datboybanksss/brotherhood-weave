import { supabase } from "@/lib/supabase";

export async function getMemberContact(memberId: string): Promise<{ email: string | null }> {
  const { data, error } = await supabase.functions.invoke("get_member_contact", {
    body: { member_id: memberId },
  });
  if (error) throw error;
  return data as { email: string | null };
}