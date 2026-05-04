import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const memberId = body?.member_id;
  if (!memberId || typeof memberId !== "string") {
    return new Response(JSON.stringify({ error: "member_id required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Caller must be paid
  const { data: caller } = await supabase
    .from("users").select("payment_status").eq("id", user.id).maybeSingle();
  if (caller?.payment_status !== "paid") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Look up target with service role
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: target } = await admin
    .from("users")
    .select("email, email_visible, payment_status, rejected_at")
    .eq("id", memberId)
    .maybeSingle();

  const visible = !!target && target.payment_status === "paid" && !target.rejected_at && target.email_visible === true;
  return new Response(JSON.stringify({ email: visible ? target!.email : null }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});