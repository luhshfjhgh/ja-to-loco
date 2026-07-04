import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createVerificationCode } from "@/lib/verification";
import { sendResetEmail } from "@/lib/emailjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot")({
  head: () => ({ meta: [{ title: "Esqueci minha senha — ESP32 Monitor" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const code = await createVerificationCode(email, "password_reset");
      await sendResetEmail(email, email.split("@")[0], code);
      toast.success("Código enviado");
      navigate({ to: "/reset", search: { email } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <form onSubmit={submit} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Redefinir senha</h1>
        <p className="text-sm text-muted-foreground">Informe seu e-mail para receber um código de verificação.</p>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar código
        </Button>
        <Link to="/auth" className="block text-center text-sm text-muted-foreground hover:text-foreground">Voltar</Link>
      </form>
    </div>
  );
}
