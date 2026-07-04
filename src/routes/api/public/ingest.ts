import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/ingest")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        try {
          const body = await request.json() as Record<string, unknown>;
          const device_id = String(body.device_id ?? "");
          const device_key = String(body.device_key ?? "");
          if (!device_id || !device_key) {
            return Response.json({ error: "device_id e device_key obrigatórios" }, { status: 400, headers: CORS_HEADERS });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: device, error: devErr } = await supabaseAdmin
            .from("devices").select("id, user_id, device_key")
            .eq("device_id", device_id).maybeSingle();
          if (devErr || !device || device.device_key !== device_key) {
            return Response.json({ error: "Credenciais inválidas" }, { status: 401, headers: CORS_HEADERS });
          }

          const toNum = (v: unknown) => (v == null || v === "" ? null : Number(v));
          const toBool = (v: unknown) => (v == null ? null : Boolean(v));

          const { error: insErr } = await supabaseAdmin.from("telemetry").insert({
            device_id,
            temperature: toNum(body.temperature),
            humidity: toNum(body.humidity),
            status: body.status ? String(body.status) : null,
            energy: toBool(body.energy),
            generator: toBool(body.generator),
            leds: (body.leds as never) ?? null,
            buttons: (body.buttons as never) ?? null,
            uptime: body.uptime != null ? Number(body.uptime) : null,
            ip: body.ip ? String(body.ip) : null,
            mac: body.mac ? String(body.mac) : null,
            wifi: body.wifi ? String(body.wifi) : null,
            rssi: body.rssi != null ? Number(body.rssi) : null,
            raw: body as never,
          });
          if (insErr) return Response.json({ error: insErr.message }, { status: 500, headers: CORS_HEADERS });

          await supabaseAdmin.from("devices").update({ online: true, last_seen: new Date().toISOString() }).eq("id", device.id);

          return Response.json({ ok: true }, { headers: CORS_HEADERS });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "erro" }, { status: 500, headers: CORS_HEADERS });
        }
      },
    },
  },
});
