import { supabase } from "@/lib/supabase";

export async function getArchives() {
  const { data, error } = await supabase
    .from("archives")
    .select("*")
    .order("recorded_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getArchive(id: string) {
  const { data, error } = await supabase
    .from("archives")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}
