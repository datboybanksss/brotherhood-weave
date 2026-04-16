import { supabase } from "@/lib/supabase";
import { generateSlug, ensureUniqueSlug } from "./playbooks";

export async function getAdminPlaybooks() {
  const { data, error } = await supabase
    .from("playbooks")
    .select("*, author:author_id(full_name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPlaybook(values: {
  title: string;
  slug?: string;
  summary: string;
  body_markdown: string;
  category: string;
  author_id: string;
  pdf_attachment_url?: string;
  is_published: boolean;
}) {
  const baseSlug = values.slug || generateSlug(values.title);
  const slug = await ensureUniqueSlug(baseSlug);
  const { error } = await supabase.from("playbooks").insert({ ...values, slug });
  if (error) throw error;
}

export async function updatePlaybook(id: string, values: Record<string, unknown>) {
  const { error } = await supabase.from("playbooks").update(values).eq("id", id);
  if (error) throw error;
}

export async function deletePlaybook(id: string) {
  const { error } = await supabase.from("playbooks").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadPlaybookPdf(file: File) {
  const path = `${crypto.randomUUID()}.pdf`;
  const { error } = await supabase.storage.from("playbook-attachments").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("playbook-attachments").getPublicUrl(path);
  return data.publicUrl;
}
