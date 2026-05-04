import { supabase } from "@/lib/supabase";
import type { ArchiveContentType, ArchiveDomain } from "@/lib/archive-domains";

export interface ArchiveInput {
  title: string;
  description: string | null;
  content_type: ArchiveContentType;
  domain: ArchiveDomain | null;
  curator_note: string | null;
  read_time_minutes: number | null;
  recorded_at: string; // ISO
  is_published: boolean;
  cover_url: string | null;
  video_url: string | null;
  document_url: string | null;
  document_filename: string | null;
  body_markdown: string | null;
}

export async function getAdminArchives() {
  const { data, error } = await supabase
    .from("archives")
    .select("*")
    .order("recorded_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createArchive(values: ArchiveInput & { created_by: string }) {
  const { error } = await supabase.from("archives").insert(values);
  if (error) throw error;
}

export async function updateArchive(id: string, values: Partial<ArchiveInput>) {
  const { error } = await supabase.from("archives").update(values).eq("id", id);
  if (error) throw error;
}

export async function deleteArchive(id: string) {
  const { error } = await supabase.from("archives").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadArchiveCover(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("archive-covers").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("archive-covers").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadArchiveDocument(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("archive-documents")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path; // private bucket — store path, not URL
}
