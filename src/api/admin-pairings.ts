import { supabase } from "@/lib/supabase";

export interface PairingMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface AdminPairing {
  id: string;
  week_start: string;
  is_trio: boolean;
  members: PairingMember[];
}

export async function getPairingsForWeek(weekStart: string): Promise<AdminPairing[]> {
  const { data: rows, error } = await supabase
    .from("peer_pairings")
    .select("id, week_start, is_trio, member_a_id, member_b_id, member_c_id")
    .eq("week_start", weekStart)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const ids = new Set<string>();
  rows.forEach((r) => {
    [r.member_a_id, r.member_b_id, r.member_c_id].forEach((m) => m && ids.add(m));
  });

  const { data: profiles } = await (supabase as any)
    .from("public_member_profiles")
    .select("id, full_name, avatar_url")
    .in("id", Array.from(ids));
  const pmap = new Map<string, PairingMember>();
  for (const p of (profiles ?? []) as any[]) pmap.set(p.id, p);

  return rows.map((r) => ({
    id: r.id,
    week_start: r.week_start,
    is_trio: r.is_trio,
    members: [r.member_a_id, r.member_b_id, r.member_c_id]
      .filter(Boolean)
      .map((mid) => pmap.get(mid as string) ?? { id: mid as string, full_name: "Unknown", avatar_url: null }),
  }));
}

export async function triggerAssignFullMode(weekStart: string) {
  const { data, error } = await supabase.functions.invoke("assign_peer_partners", {
    body: { week_start: weekStart, mode: "full" },
  });
  if (error) throw error;
  return data;
}
