import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/image-compression";

export interface ProfilePhoto {
  id: string;
  user_id: string;
  storage_path: string;
  display_order: number;
  url: string;
}

const BUCKET = "profile-photos";

function publicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function getProfilePhotos(userId: string): Promise<ProfilePhoto[]> {
  const { data, error } = await (supabase as any)
    .from("profile_photos")
    .select("*")
    .eq("user_id", userId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p: any) => ({ ...p, url: publicUrl(p.storage_path) }));
}

export async function addProfilePhoto(userId: string, file: File): Promise<void> {
  const compressed = await compressImage(file);
  const { count } = await (supabase as any)
    .from("profile_photos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const order = count ?? 0;
  if (order >= 5) throw new Error("Maximum 5 photos");
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    contentType: "image/jpeg", upsert: false,
  });
  if (upErr) throw upErr;
  const { error: insErr } = await (supabase as any)
    .from("profile_photos")
    .insert({ user_id: userId, storage_path: path, display_order: order });
  if (insErr) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw insErr;
  }
}

export async function deleteProfilePhoto(photo: ProfilePhoto, remaining: ProfilePhoto[]): Promise<void> {
  const { error: delErr } = await (supabase as any)
    .from("profile_photos").delete().eq("id", photo.id);
  if (delErr) throw delErr;
  await supabase.storage.from(BUCKET).remove([photo.storage_path]);
  // Recompute order via reorder RPC for remaining (already sorted, minus deleted)
  const ordered = remaining.filter((p) => p.id !== photo.id).map((p) => p.id);
  if (ordered.length > 0) {
    const { error } = await (supabase as any).rpc("reorder_profile_photos", { _photo_ids: ordered });
    if (error) throw error;
  }
}

export async function reorderProfilePhotos(orderedIds: string[]): Promise<void> {
  const { error } = await (supabase as any).rpc("reorder_profile_photos", { _photo_ids: orderedIds });
  if (error) throw error;
}