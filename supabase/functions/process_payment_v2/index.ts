// Invitation approval is the member-access gate. Never activate an account through
// the former simulated-payment endpoint, including calls outside the UI.
Deno.serve((req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  return new Response(JSON.stringify({ error: "Membership activation requires an approved invitation." }), { status: 410, headers });
});
