import { supabase } from "@/lib/supabase";

export interface PartnerInfo {
  id: string;
  full_name: string;
  avatar_url: string | null;
  tier_id: string | null;
  bio: string | null;
  primary_department: string | null;
}

/** Returns the Monday (in SAST = UTC+2) of the current week as YYYY-MM-DD */
export function getCurrentWeekStartSAST(): string {
  const nowSast = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const day = nowSast.getUTCDay(); // 0=Sun..6=Sat
  const offset = day === 0 ? 6 : day - 1;
  const monday = new Date(nowSast);
  monday.setUTCDate(monday.getUTCDate() - offset);
  return monday.toISOString().slice(0, 10);
}

export function getWeekEndDate(weekStart: string): Date {
  const d = new Date(weekStart + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 6);
  return d;
}

export function getNextMondayDate(): Date {
  const nowSast = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const day = nowSast.getUTCDay();
  const diff = (1 - day + 7) % 7 || 7;
  const m = new Date(nowSast);
  m.setUTCDate(m.getUTCDate() + diff);
  return m;
}

export async function getMyCurrentPartners(myId: string): Promise<PartnerInfo[]> {
  const week = getCurrentWeekStartSAST();
  const { data: rows, error } = await supabase
    .from("peer_pairings")
    .select("member_a_id, member_b_id, member_c_id, is_trio")
    .eq("week_start", week)
    .or(`member_a_id.eq.${myId},member_b_id.eq.${myId},member_c_id.eq.${myId}`);
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const otherIds = new Set<string>();
  for (const r of rows) {
    [r.member_a_id, r.member_b_id, r.member_c_id].forEach((mid) => {
      if (mid && mid !== myId) otherIds.add(mid);
    });
  }
  if (otherIds.size === 0) return [];

  const ids = Array.from(otherIds);
  const { data: profiles, error: pErr } = await (supabase as any)
    .from("public_member_profiles")
    .select("id, full_name, avatar_url, tier_id, bio")
    .in("id", ids);
  if (pErr) throw pErr;

  const { data: depts } = await supabase
    .from("user_departments")
    .select("user_id, is_primary, departments(name)")
    .in("user_id", ids)
    .eq("is_primary", true);

  const deptMap = new Map<string, string>();
  for (const d of (depts ?? []) as any[]) {
    if (d.departments?.name) deptMap.set(d.user_id, d.departments.name);
  }

  return ((profiles ?? []) as any[]).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    avatar_url: p.avatar_url,
    tier_id: p.tier_id,
    bio: p.bio,
    primary_department: deptMap.get(p.id) ?? null,
  }));
}
