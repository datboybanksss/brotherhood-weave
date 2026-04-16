import { supabase } from "@/lib/supabase";

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // Append cache-buster so the browser picks up the new image
  return `${data.publicUrl}?t=${Date.now()}`;
}

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
