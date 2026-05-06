import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Pair = { a: string; b: string };
type PairingRow = {
  week_start: string;
  member_a_id: string;
  member_b_id: string;
  member_c_id: string | null;
  is_trio: boolean;
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromWeek(weekStart: string): number {
  return parseInt(weekStart.replace(/-/g, ""), 10);
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sortPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function sortTrio(a: string, b: string, c: string): [string, string, string] {
  const s = [a, b, c].sort();
  return [s[0], s[1], s[2]];
}

/** Greedy + backtracking perfect matching. Returns null if impossible. */
function findMatching(
  pool: string[],
  history: Map<string, Set<string>>,
  rng: () => number
): Pair[] | null {
  const order = shuffle(pool, rng);
  const matched = new Set<string>();
  const result: Pair[] = [];

  function backtrack(idx: number): boolean {
    while (idx < order.length && matched.has(order[idx])) idx++;
    if (idx >= order.length) return matched.size === pool.length;
    const x = order[idx];
    const xHist = history.get(x) ?? new Set();
    const candidates = order.slice(idx + 1).filter((y) => !matched.has(y) && !xHist.has(y));
    const shuffled = shuffle(candidates, rng);
    for (const y of shuffled) {
      matched.add(x);
      matched.add(y);
      result.push({ a: x, b: y });
      if (backtrack(idx + 1)) return true;
      result.pop();
      matched.delete(x);
      matched.delete(y);
    }
    return false;
  }

  return backtrack(0) ? result : null;
}

function buildHistory(rows: PairingRow[]): Map<string, Set<string>> {
  const h = new Map<string, Set<string>>();
  const add = (x: string, y: string) => {
    if (!h.has(x)) h.set(x, new Set());
    h.get(x)!.add(y);
  };
  for (const r of rows) {
    const ms = [r.member_a_id, r.member_b_id, r.member_c_id].filter(Boolean) as string[];
    for (const x of ms) for (const y of ms) if (x !== y) add(x, y);
  }
  return h;
}

function nextMonday(d: Date): Date {
  const n = new Date(d);
  const day = n.getUTCDay(); // 0=Sun..6=Sat
  const diff = (1 - day + 7) % 7 || 7;
  n.setUTCDate(n.getUTCDate() + diff);
  return n;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // SECURITY FIX: Require CRON_SECRET — this function is cron-only, not user-callable
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const body = await req.json();
  const { week_start, mode } = body ?? {};
  if (!week_start || !["full", "midweek"].includes(mode)) {
    return new Response(JSON.stringify({ error: "week_start and mode required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("assign_peer_partners", { week_start, mode });

  // Eligible pool: paid + non-rejected, sorted by created_at ASC
  const { data: usersRaw, error: uErr } = await supabase
    .from("users")
    .select("id, created_at, is_admin, payment_status, rejected_at")
    .eq("payment_status", "paid")
    .is("rejected_at", null)
    .order("created_at", { ascending: true });
  if (uErr) {
    console.error(uErr);
    return new Response(JSON.stringify({ error: uErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const allEligible = (usersRaw ?? []) as Array<{ id: string; created_at: string; is_admin: boolean }>;

  if (mode === "midweek") {
    // Find members already paired this week
    const { data: existing } = await supabase
      .from("peer_pairings")
      .select("member_a_id, member_b_id, member_c_id")
      .eq("week_start", week_start);
    const paired = new Set<string>();
    for (const r of existing ?? []) {
      if (r.member_a_id) paired.add(r.member_a_id);
      if (r.member_b_id) paired.add(r.member_b_id);
      if (r.member_c_id) paired.add(r.member_c_id);
    }
    const unpaired = allEligible.filter((u) => !paired.has(u.id));
    if (unpaired.length < 2) {
      return new Response(
        JSON.stringify({ pairings_created: 0, members_paired: 0, trio_member_ids: null, history_reset: false, reason: "not enough unpaired members" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { data: histRows } = await supabase
      .from("peer_pairings")
      .select("member_a_id, member_b_id, member_c_id, is_trio, week_start");
    const history = buildHistory((histRows ?? []) as PairingRow[]);
    const rng = mulberry32(seedFromWeek(week_start) ^ Date.now());
    // Greedy pairwise: take pairs of even length, last one waits if odd
    const evenPool = unpaired.length % 2 === 0 ? unpaired : unpaired.slice(0, -1);
    const matching = findMatching(evenPool.map((u) => u.id), history, rng);
    if (!matching) {
      return new Response(JSON.stringify({ pairings_created: 0, members_paired: 0, trio_member_ids: null, history_reset: false, reason: "no valid midweek matching" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const inserts = matching.map((p) => {
      const [a, b] = sortPair(p.a, p.b);
      return { week_start, member_a_id: a, member_b_id: b, member_c_id: null, is_trio: false };
    });
    const { error: insErr } = await supabase.from("peer_pairings").insert(inserts);
    if (insErr) {
      console.error(insErr);
      return new Response(JSON.stringify({ error: insErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(
      JSON.stringify({ pairings_created: inserts.length, members_paired: inserts.length * 2, trio_member_ids: null, history_reset: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // FULL mode
  if (allEligible.length < 2) {
    return new Response(JSON.stringify({ pairings_created: 0, members_paired: 0, trio_member_ids: null, history_reset: false, reason: "pool too small" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Wipe any prior rows for this week_start (re-runnable)
  await supabase.from("peer_pairings").delete().eq("week_start", week_start);

  const { data: histRows } = await supabase
    .from("peer_pairings")
    .select("member_a_id, member_b_id, member_c_id, is_trio, week_start");
  let history = buildHistory((histRows ?? []) as PairingRow[]);
  let historyReset = false;

  const isOdd = allEligible.length % 2 === 1;
  let matching: Pair[] | null = null;
  let leftover: string | null = null;

  const tryMatch = (poolIds: string[]): Pair[] | null => {
    const rng = mulberry32(seedFromWeek(week_start));
    return findMatching(poolIds, history, rng);
  };

  if (!isOdd) {
    matching = tryMatch(allEligible.map((u) => u.id));
  } else {
    // Try removing newest first, then iterate older
    for (let i = allEligible.length - 1; i >= 0; i--) {
      const cand = allEligible[i].id;
      const subset = allEligible.filter((_, idx) => idx !== i).map((u) => u.id);
      const m = tryMatch(subset);
      if (m) {
        matching = m;
        leftover = cand;
        break;
      }
    }
  }

  // History reset fallback
  if (!matching) {
    console.log("No matching found — resetting history");
    await supabase.from("peer_pairings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    history = new Map();
    historyReset = true;
    if (!isOdd) {
      matching = tryMatch(allEligible.map((u) => u.id));
    } else {
      for (let i = allEligible.length - 1; i >= 0; i--) {
        const cand = allEligible[i].id;
        const subset = allEligible.filter((_, idx) => idx !== i).map((u) => u.id);
        const m = tryMatch(subset);
        if (m) {
          matching = m;
          leftover = cand;
          break;
        }
      }
    }
  }

  if (!matching) {
    return new Response(JSON.stringify({ error: "Unable to produce a matching even after history reset" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Trio formation on odd weeks
  let trioMemberIds: string[] | null = null;
  const inserts: PairingRow[] = [];

  if (leftover) {
    // Identify rotating founder
    const founders = allEligible.filter((u) => u.is_admin);
    const epoch = new Date("2026-01-05T00:00:00Z").getTime();
    const wsTime = new Date(week_start + "T00:00:00Z").getTime();
    const weeksSince = Math.floor((wsTime - epoch) / (7 * 86400_000));
    let trioPairIdx = -1;
    if (founders.length > 0) {
      // Try founders in rotation order until we find one in the matching
      for (let off = 0; off < founders.length; off++) {
        const founderIdx = ((weeksSince + off) % founders.length + founders.length) % founders.length;
        const founderId = founders[founderIdx].id;
        trioPairIdx = matching.findIndex((p) => p.a === founderId || p.b === founderId);
        if (trioPairIdx >= 0) break;
      }
    }
    if (trioPairIdx >= 0) {
      const pair = matching[trioPairIdx];
      const [a, b, c] = sortTrio(pair.a, pair.b, leftover);
      inserts.push({ week_start, member_a_id: a, member_b_id: b, member_c_id: c, is_trio: true });
      trioMemberIds = [a, b, c];
      // Remaining pairs
      matching.forEach((p, i) => {
        if (i === trioPairIdx) return;
        const [pa, pb] = sortPair(p.a, p.b);
        inserts.push({ week_start, member_a_id: pa, member_b_id: pb, member_c_id: null, is_trio: false });
      });
    } else {
      // No paid founder — leftover waits, insert just the pairs
      console.warn("No paid founder for trio; leftover member waits");
      matching.forEach((p) => {
        const [pa, pb] = sortPair(p.a, p.b);
        inserts.push({ week_start, member_a_id: pa, member_b_id: pb, member_c_id: null, is_trio: false });
      });
    }
  } else {
    matching.forEach((p) => {
      const [pa, pb] = sortPair(p.a, p.b);
      inserts.push({ week_start, member_a_id: pa, member_b_id: pb, member_c_id: null, is_trio: false });
    });
  }

  const { error: insErr } = await supabase.from("peer_pairings").insert(inserts);
  if (insErr) {
    console.error(insErr);
    return new Response(JSON.stringify({ error: insErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const membersPaired = inserts.reduce((acc, r) => acc + (r.is_trio ? 3 : 2), 0);
  return new Response(
    JSON.stringify({ pairings_created: inserts.length, members_paired: membersPaired, trio_member_ids: trioMemberIds, history_reset: historyReset }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});