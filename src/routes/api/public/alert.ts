import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/alert")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const body = await request.json() as Record<string, unknown>;
          const device_id = String(body.device_id ?? "");
          const device_key = String(body.device_key ?? "");
          if (!device_id || !device_key) return Response.json({ error: "auth" }, { status: 400, headers: CORS });

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: device } = await supabaseAdmin.from("devices").select("device_key").eq("device_id", device_id).maybeSingle();
          if (!device || device.device_key !== device_key) return Response.json({ error: "unauthorized" }, { status: 401, headers: CORS });

          const type = String(body.type ?? "generic");
          const severity = ["info","warning","critical"].includes(String(body.severity)) ? String(body.severity) : "warning";
          const message = String(body.message ?? "");
          await supabaseAdmin.from("alerts").insert({ device_id, type, severity, message, metadata: (body.metadata as never) ?? null });
          return Response.json({ ok: true }, { headers: CORS });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "erro" }, { status: 500, headers: CORS });
        }
      },
    },
  },
});
