import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { validateVerificationCode } from "@/lib/verification";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/reset")({
  validateSearch: z.object({ email: z.string().email() }),
  head: () => ({ meta: [{ title: "Nova senha — ESP32 Monitor" }] }),
  component: ResetPage,
});

function ResetPage() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState<"code" | "password">("code");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = async () => {
    setLoading(true);
    try {
      const ok = await validateVerificationCode(email, code, "password_reset");
      if (!ok) { toast.error("Código inválido"); return; }
      setStep("password");
    } finally { setLoading(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (password.length < 8) throw new Error("Mínimo 8 caracteres");
      // Since we don't use magic links, we call a server function to update via service role
      const res = await fetch("/api/public/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success("Senha alterada. Faça login.");
      navigate({ to: "/auth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-md">
        {step === "code" ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold">Informe o código</h1>
            <p className="mt-2 text-sm text-muted-foreground">Enviado para {email}</p>
            <div className="mt-8 flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>{[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={validate} disabled={code.length !== 6 || loading} className="mt-6 w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Validar
            </Button>
          </div>
        ) : (
          <form onSubmit={changePassword} className="space-y-4">
            <h1 className="text-2xl font-bold">Nova senha</h1>
            <div>
              <Label htmlFor="pwd">Senha</Label>
              <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required className="mt-1" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Alterar senha
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
