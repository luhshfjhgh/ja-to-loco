import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { validateVerificationCode, createVerificationCode } from "@/lib/verification";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/emailjs";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/verify")({
  validateSearch: z.object({ email: z.string().email() }),
  head: () => ({ meta: [{ title: "Verificar código — ESP32 Monitor" }] }),
  component: VerifyPage,
});

function VerifyPage() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const ok = await validateVerificationCode(email, code, "signup");
      if (!ok) { toast.error("Código inválido ou expirado"); return; }
      // Activate profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ is_active: true }).eq("id", user.id);
      } else {
        // If session expired between signup and verify, sign back in isn't possible without password. User must login again.
        toast.info("Código validado. Faça login para continuar.");
        navigate({ to: "/auth" });
        return;
      }
      sendWelcomeEmail(email, email.split("@")[0]).catch(() => {});
      toast.success("Conta ativada!");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally { setLoading(false); }
  };

  const resend = async () => {
    setResending(true);
    try {
      const c = await createVerificationCode(email, "signup");
      await sendVerificationEmail(email, email.split("@")[0], c);
      toast.success("Novo código enviado");
    } catch (e) {
      toast.error("Falha ao reenviar");
    } finally { setResending(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold">Verifique seu e-mail</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enviamos um código de 6 dígitos para <strong>{email}</strong>.
        </p>
        <div className="mt-8 flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button onClick={submit} disabled={loading || code.length !== 6} className="mt-6 w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Validar
        </Button>
        <button onClick={resend} disabled={resending} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
          {resending ? "Reenviando..." : "Reenviar código"}
        </button>
      </div>
    </div>
  );
}
