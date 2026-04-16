import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";
import { encode } from "https://deno.land/std@0.208.0/encoding/hex.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

interface Founder {
  full_name: string;
  email: string;
  password: string;
  avatar_seed: string;
}

const founders: Founder[] = [
  { full_name: "Kgosi Banks", email: "kgosi@familyties.info", password: generatePassword(), avatar_seed: "Kgosi Banks" },
  { full_name: "Themba Gama", email: "themba@familyties.info", password: generatePassword(), avatar_seed: "Themba Gama" },
  { full_name: "Kgosietsile Matlala", email: "kgosietsile@familyties.info", password: generatePassword(), avatar_seed: "Kgosietsile Matlala" },
];

// Get Founding Member tier ID
const { data: tier } = await supabase.from("tiers").select("id").eq("name", "Founding Member").single();
if (!tier) { console.error("Founding Member tier not found!"); Deno.exit(1); }

for (const f of founders) {
  // Delete existing user with this email if any
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === f.email);
  if (existing) {
    console.log(`Deleting existing user: ${f.email}`);
    await supabase.auth.admin.deleteUser(existing.id);
  }

  // Create auth user
  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email: f.email,
    password: f.password,
    email_confirm: true,
    user_metadata: { full_name: f.full_name },
  });
  if (authErr) { console.error(`Failed to create ${f.email}:`, authErr); continue; }
  console.log(`Created auth user: ${f.email} (${authUser.user.id})`);

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
  if (updateErr) console.error(`Failed to update ${f.email}:`, updateErr);
  else console.log(`Updated users row for ${f.email}`);
}

console.log("\n========================================");
console.log("FOUNDER LOGIN CREDENTIALS");
console.log("========================================");
for (const f of founders) {
  console.log(`${f.full_name}`);
  console.log(`  Email: ${f.email}`);
  console.log(`  Password: ${f.password}`);
  console.log("");
}
console.log("========================================");
console.log("Save these now — they will not be shown again.");
console.log("Login at: /login");
console.log("========================================");
