import { supabase } from "@/lib/supabase";
import type { ArchiveContentType, ArchiveDomain } from "@/lib/archive-domains";

export interface ArchiveCardItem {
  id: string;
  title: string;
  cover_url: string | null;
  content_type: ArchiveContentType;
  domain: ArchiveDomain | null;
  recorded_at: string;
}

export async function getRecentArchivesForHome(): Promise<ArchiveCardItem[]> {
  const { data, error } = await supabase
    .from("archives")
    .select("id, title, cover_url, content_type, domain, recorded_at")
    .eq("is_published", true)
    .order("recorded_at", { ascending: false })
    .limit(6);
  if (error) throw error;
  return (data ?? []) as ArchiveCardItem[];
}