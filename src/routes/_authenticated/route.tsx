import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
    const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", data.session.user.id).single();
    if (!profile?.is_active) throw redirect({ to: "/verify", search: { email: data.session.user.email! } });
    return { userId: data.session.user.id };
  },
  component: () => <AppShell><Outlet /></AppShell>,
});
