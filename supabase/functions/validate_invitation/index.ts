import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return json({ status: "invalid", reason: "bad_request" }, 400);
  }
  const token = (body.token ?? "").trim();
  if (!token) return json({ status: "invalid", reason: "missing_token" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: inv, error } = await admin
    .from("invitations")
    .select("id, email, full_name, intended_tier, expires_at, used_at, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (error) return json({ status: "invalid", reason: "lookup_failed" }, 500);
  if (!inv) return json({ status: "invalid", reason: "not_found" });
  if (inv.revoked_at) return json({ status: "revoked" });
  if (inv.used_at) return json({ status: "used" });
  if (new Date(inv.expires_at).getTime() <= Date.now()) return json({ status: "expired" });

  return json({
    status: "valid",
    invitation: {
      email: inv.email,
      full_name: inv.full_name,
      intended_tier: inv.intended_tier,
      expires_at: inv.expires_at,
    },
  });
});