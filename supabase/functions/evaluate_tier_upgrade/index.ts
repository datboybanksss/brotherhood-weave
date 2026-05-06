import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // SECURITY FIX: Restrict to self or service_role
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return new Response(JSON.stringify({ error: 'Invalid token format' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const callerRole = claims?.role as string;
  const callerUserId = claims?.sub as string;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { user_id } = await req.json();
  if (!user_id) {
    return new Response(JSON.stringify({ error: "user_id required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // service_role can evaluate any user; authenticated users can only evaluate themselves
  if (callerRole !== 'service_role') {
    if (!callerUserId || callerUserId !== user_id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: can only evaluate your own tier' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  console.log("Evaluating tier upgrade for:", user_id);

  const { data, error } = await supabase.rpc("evaluate_tier_upgrade", {
    target_user_id: user_id,
  });

  if (error) {
    console.error("Tier upgrade error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("Tier upgrade result:", data);

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
