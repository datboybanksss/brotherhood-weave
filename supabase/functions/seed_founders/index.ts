import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const founders = [
    { full_name: "Kgosi Banks", email: "kgosi@familyties.info", password: generatePassword(), avatar_seed: "Kgosi Banks" },
    { full_name: "Themba Gama", email: "themba@familyties.info", password: generatePassword(), avatar_seed: "Themba Gama" },
    { full_name: "Kgosietsile Matlala", email: "kgosietsile@familyties.info", password: generatePassword(), avatar_seed: "Kgosietsile Matlala" },
  ];

  // Get Founding Member tier ID
  const { data: tier } = await supabase.from("tiers").select("id").eq("name", "Founding Member").single();
  if (!tier) return new Response(JSON.stringify({ error: "Founding Member tier not found" }), { status: 500, headers: corsHeaders });

  const results = [];

  for (const f of founders) {
    // Delete existing user with this email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u: any) => u.email === f.email);
    if (existing) {
      await supabase.auth.admin.deleteUser(existing.id);
    }

    // Create auth user
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: f.email,
      password: f.password,
      email_confirm: true,
      user_metadata: { full_name: f.full_name },
    });
    if (authErr) { results.push({ name: f.full_name, error: authErr.message }); continue; }

    // Update public.users row
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.avatar_seed)}`;
    const { error: updateErr } = await supabase
      .from("users")
      .update({
        tier_id: tier.id,
        payment_status: "paid",
        membership_started_at: new Date().toISOString(),
        interview_completed: true,
        is_admin: true,
        avatar_url: avatarUrl,
      })
      .eq("id", authUser.user.id);

    results.push({
      name: f.full_name,
      email: f.email,
      password: f.password,
      success: !updateErr,
      error: updateErr?.message,
    });
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
