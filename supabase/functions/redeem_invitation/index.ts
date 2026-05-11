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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const token = (body.token ?? "").trim();
  if (!token) return json({ error: "missing_token" }, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Look up invitation
  const { data: inv, error: invErr } = await admin
    .from("invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (invErr || !inv) return json({ error: "not_found" }, 404);
  if (inv.revoked_at) return json({ error: "revoked" }, 400);
  if (inv.used_at) return json({ error: "used" }, 400);
  if (new Date(inv.expires_at).getTime() <= Date.now()) return json({ error: "expired" }, 400);

  // Determine target user: existing session OR password create
  const authHeader = req.headers.get("Authorization");
  let userId: string | null = null;
  let userEmail: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user: sessionUser } } = await anonClient.auth.getUser(jwt);
    if (sessionUser) {
      userId = sessionUser.id;
      userEmail = sessionUser.email ?? null;
    }
  }

  if (!userId) {
    // Create new user with password
    const password = body.password;
    if (!password || password.length < 6) return json({ error: "weak_password" }, 400);

    // Check if auth user already exists with this email
    const { data: existing } = await admin.auth.admin.listUsers();
    const match = existing?.users?.find((u) => (u.email ?? "").toLowerCase() === inv.email.toLowerCase());
    if (match) {
      return json({ error: "user_exists" }, 409);
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: inv.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: inv.full_name, invited_via_token: token },
    });
    if (createErr || !created.user) return json({ error: createErr?.message ?? "create_failed" }, 500);
    userId = created.user.id;
    userEmail = created.user.email ?? inv.email;
  } else {
    // Email match check for OAuth/existing sessions
    if (userEmail && userEmail.toLowerCase() !== inv.email.toLowerCase()) {
      return json({ error: "email_mismatch", expected: inv.email }, 403);
    }
  }

  // Look up Foundation tier id
  const { data: tier } = await admin
    .from("tiers")
    .select("id")
    .eq("name", "Foundation")
    .maybeSingle();

  // Upgrade public.users row (handle_new_user trigger creates the row)
  // Wait briefly if needed
  let tries = 0;
  while (tries < 5) {
    const { data: u } = await admin.from("users").select("id").eq("id", userId).maybeSingle();
    if (u) break;
    await new Promise((r) => setTimeout(r, 200));
    tries++;
  }

  const { error: updErr } = await admin
    .from("users")
    .update({
      payment_status: "paid",
      interview_completed: true,
      membership_started_at: new Date().toISOString(),
      tier_id: tier?.id ?? null,
      is_admin: inv.is_admin,
      invited_via_token: token,
    })
    .eq("id", userId);
  if (updErr) return json({ error: updErr.message }, 500);

  // Mark invitation used
  await admin
    .from("invitations")
    .update({ used_at: new Date().toISOString(), used_by_user_id: userId })
    .eq("id", inv.id);

  // Audit log for admin grants
  if (inv.is_admin) {
    await admin.from('admin_audit_log').insert({
      actor_id: inv.created_by ?? null,
      target_id: userId,
      action: 'admin_granted_via_invitation',
      metadata: {
        invitation_id: inv.id,
      },
    });
  }

  return json({ success: true, user_id: userId });
});