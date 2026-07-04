import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { toast } from "sonner";
import { Activity, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createVerificationCode } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/emailjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const searchSchema = z.object({ mode: z.enum(["login", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Entrar — ESP32 Monitor" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">(mode ?? "login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Check activation
      const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", data.user!.id).single();
      if (!profile?.is_active) {
        toast.warning("Conta ainda não ativada. Enviamos um novo código.");
        const code = await createVerificationCode(email, "signup");
        await sendVerificationEmail(email, email.split("@")[0], code).catch(() => toast.error("Falha ao enviar e-mail"));
        navigate({ to: "/verify", search: { email } });
        return;
      }
      toast.success("Bem-vindo!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar");
    } finally { setLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (password.length < 8) throw new Error("Senha deve ter ao menos 8 caracteres");
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name }, emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      const code = await createVerificationCode(email, "signup");
      await sendVerificationEmail(email, name || email.split("@")[0], code);
      toast.success("Código enviado para seu e-mail");
      navigate({ to: "/verify", search: { email } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 border-r border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary grid place-items-center"><Activity className="h-4 w-4 text-primary-foreground" /></div>
          <span className="font-semibold">ESP32 Monitor</span>
        </Link>
        <motion.blockquote initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="max-w-md">
          <p className="text-2xl font-medium leading-snug">"Telemetria industrial confiável, com a elegância que suas equipes merecem."</p>
          <footer className="mt-4 text-sm text-muted-foreground">— Plataforma ESP32 Monitor</footer>
        </motion.blockquote>
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} ESP32 Monitor</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <h1 className="text-2xl font-bold">{tab === "login" ? "Entrar" : "Criar conta"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "login" ? "Acesse seus dispositivos ESP32." : "Cadastre-se para monitorar seus dispositivos."}
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-lg bg-muted p-1 text-sm">
            {(["login", "signup"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-md py-2 font-medium transition ${tab === t ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
                {t === "login" ? "Entrar" : "Cadastrar"}
              </button>
            ))}
          </div>

          <form onSubmit={tab === "login" ? handleLogin : handleSignup} className="mt-6 space-y-4">
            {tab === "signup" && (
              <div><Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" placeholder="Seu nome" />
              </div>
            )}
            <div><Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" placeholder="voce@empresa.com" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {tab === "login" && <Link to="/forgot" className="text-xs text-primary hover:underline">Esqueceu?</Link>}
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="mt-1" placeholder="••••••••" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tab === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
