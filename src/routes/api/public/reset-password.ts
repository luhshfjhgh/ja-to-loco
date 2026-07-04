import { createFileRoute } from "@tanstack/react-router";

/**
 * Reset password endpoint.
 * Validates a verification code (purpose=password_reset) and updates the
 * user's password using the admin client. This preserves the "no Supabase
 * emails" contract — recovery is done entirely via EmailJS + our own codes.
 */
export const Route = createFileRoute("/api/public/reset-password")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { email, code, password } = await request.json() as { email?: string; code?: string; password?: string };
          if (!email || !code || !password) return Response.json({ error: "campos obrigatórios" }, { status: 400 });
          if (password.length < 8) return Response.json({ error: "senha muito curta" }, { status: 400 });

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Validate code
          const { data: rows } = await supabaseAdmin.from("verification_codes").select("*")
            .eq("email", email.toLowerCase()).eq("code", code).eq("purpose", "password_reset").eq("used", false)
            .order("created_at", { ascending: false }).limit(1);
          const row = rows?.[0];
          if (!row) return Response.json({ error: "código inválido" }, { status: 400 });
          if (new Date(row.expires_at) < new Date()) return Response.json({ error: "código expirado" }, { status: 400 });

          // Find user by email
          const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
          if (listErr) return Response.json({ error: listErr.message }, { status: 500 });
          const user = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
          if (!user) return Response.json({ error: "usuário não encontrado" }, { status: 404 });

          const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
          if (updErr) return Response.json({ error: updErr.message }, { status: 500 });

          await supabaseAdmin.from("verification_codes").update({ used: true }).eq("id", row.id);

          return Response.json({ ok: true });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "erro" }, { status: 500 });
        }
      },
    },
  },
});
