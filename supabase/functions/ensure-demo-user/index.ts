import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const DEMO_EMAIL = "demo@weliao.app";
const DEMO_PASSWORD = "weliao2026";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, message: "method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return json({ ok: false, message: "backend not configured" }, 200);

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) return json({ ok: false, message: error.message }, 200);

    const existing = (data?.users || []).find(
      (user) => (user.email || "").toLowerCase() === DEMO_EMAIL,
    );

    if (existing) {
      await admin.auth.admin.updateUserById(existing.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
      });
      return json({ ok: true, created: false });
    }

    const created = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });

    if (created.error) return json({ ok: false, message: created.error.message }, 200);
    return json({ ok: true, created: true });
  } catch (err) {
    return json({ ok: false, message: err instanceof Error ? err.message : "unknown error" }, 200);
  }
});
