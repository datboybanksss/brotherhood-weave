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

export async function updateProfile(userId: string, data: {
  full_name: string;
  avatar_url: string | null;
  bio?: string | null;
  title?: string | null;
  current_city?: string | null;
  email_visible?: boolean;
}) {
  const payload: Record<string, unknown> = {
    full_name: data.full_name,
    avatar_url: data.avatar_url || null,
  };
  if (data.bio !== undefined) payload.bio = data.bio || null;
  if (data.title !== undefined) payload.title = data.title || null;
  if (data.current_city !== undefined) payload.current_city = data.current_city || null;
  if (data.email_visible !== undefined) payload.email_visible = data.email_visible;
  const { error } = await supabase.from("users").update(payload).eq("id", userId);
  if (error) throw error;
}

export async function deleteAccount() {
  const { data, error } = await supabase.functions.invoke("delete_account");
  if (error) throw error;
  return data;
}

export async function deleteAvatar(userId: string) {
  // Best-effort remove any stored avatar files for the user
  const { data: list } = await supabase.storage.from("avatars").list(userId);
  if (list && list.length > 0) {
    const paths = list.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from("avatars").remove(paths);
  }
  const { error } = await supabase
    .from("users")
    .update({ avatar_url: null })
    .eq("id", userId);
  if (error) throw error;
}
