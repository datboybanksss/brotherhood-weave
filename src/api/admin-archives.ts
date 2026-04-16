import { supabase } from "@/lib/supabase";

export async function getAdminArchives() {
  const { data, error } = await supabase
    .from("archives")
    .select("*")
    .order("recorded_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createArchive(values: {
  title: string;
  description: string;
  recording_url: string;
  recorded_at: string;
  is_published: boolean;
  created_by: string;
}) {
  const { error } = await supabase.from("archives").insert(values);
  if (error) throw error;
}

export async function updateArchive(id: string, values: {
  title?: string;
  description?: string;
  recording_url?: string;
  recorded_at?: string;
  is_published?: boolean;
}) {
  const { error } = await supabase.from("archives").update(values).eq("id", id);
  if (error) throw error;
}

export async function deleteArchive(id: string) {
  const { error } = await supabase.from("archives").delete().eq("id", id);
  if (error) throw error;
}
