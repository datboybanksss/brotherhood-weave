import { supabase } from "@/lib/supabase";

export async function updateProfile(userId: string, data: { full_name: string; avatar_url: string | null }) {
  const { error } = await supabase
    .from("users")
    .update({ full_name: data.full_name, avatar_url: data.avatar_url || null })
    .eq("id", userId);
  if (error) throw error;
}

export async function deleteAccount() {
  const { data, error } = await supabase.functions.invoke("delete_account");
  if (error) throw error;
  return data;
}
