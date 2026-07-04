import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/50 backdrop-blur-md sticky top-0 z-40 bg-background/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent-foreground grid place-items-center">
              <Activity className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">ESP32 Monitor</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Entrar</Link>
            <Link to="/auth" search={{ mode: "signup" }} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              Começar
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pt-24 pb-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            Plataforma industrial de IoT
          </span>
          <h1 className="mt-6 text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Monitore seus <span className="gradient-text">ESP32</span><br />
            em tempo real.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            Telemetria, alertas, energia, geradores e logs — tudo em um dashboard profissional inspirado nas melhores plataformas cloud do mundo.
          </p>
          <div className="mt-8 flex gap-3">
            <Link to="/auth" search={{ mode: "signup" }} className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Criar conta
            </Link>
            <Link to="/auth" className="rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary">
              Entrar
            </Link>
          </div>
        </motion.div>

        <div className="mt-24 grid gap-6 md:grid-cols-3">
          {[
            { icon: Zap, title: "Tempo real", desc: "Realtime via WebSocket. Telemetria a cada segundo." },
            { icon: ShieldCheck, title: "Seguro por design", desc: "Autenticação por código, RLS e chaves de dispositivo." },
            { icon: BarChart3, title: "Insights visuais", desc: "Gráficos, alertas e histórico completo." },
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 * i }}
              className="glass-card rounded-2xl p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
