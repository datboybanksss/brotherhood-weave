import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
  const userId = claims.claims.sub;

  const body = await req.json().catch(() => null);
  const archiveId = body?.archive_id;
  if (typeof archiveId !== "string" || archiveId.length < 8) {
    return json({ error: "archive_id required" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE);

  const { data: user, error: uErr } = await admin
    .from("users").select("payment_status").eq("id", userId).maybeSingle();
  if (uErr || !user || user.payment_status !== "paid") {
    return json({ error: "Forbidden" }, 403);
  }

  const { data: archive, error: aErr } = await admin
    .from("archives")
    .select("document_url, is_published, content_type")
    .eq("id", archiveId)
    .maybeSingle();
  if (aErr || !archive || !archive.is_published || archive.content_type !== "document" || !archive.document_url) {
    return json({ error: "Not found" }, 404);
  }

  const { data: signed, error: sErr } = await admin.storage
    .from("archive-documents")
    .createSignedUrl(archive.document_url, 3600);
  if (sErr || !signed) return json({ error: "Could not sign" }, 500);

  return json({ url: signed.signedUrl }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}