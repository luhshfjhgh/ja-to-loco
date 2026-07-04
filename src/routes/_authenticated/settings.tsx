import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { isEmailjsConfigured } from "@/lib/emailjs";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Configurações — ESP32 Monitor" }] }),
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const ingestUrl = typeof window !== "undefined" ? `${window.location.origin}/api/public/ingest` : "/api/public/ingest";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Preferências e integração com dispositivos.</p>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold">Perfil</h3>
        <div className="text-sm"><span className="text-muted-foreground">E-mail:</span> {user?.email}</div>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Tema</h3>
            <p className="text-sm text-muted-foreground">{theme === "dark" ? "Escuro" : "Claro"}</p>
          </div>
          <Button variant="outline" onClick={toggle}>
            {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            Alternar
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-3">
        <h3 className="font-semibold">Ingestão ESP32</h3>
        <p className="text-sm text-muted-foreground">Configure seu ESP32 para enviar telemetria via HTTPS POST para o endpoint abaixo:</p>
        <code className="block rounded-lg bg-muted p-3 text-xs break-all">{ingestUrl}</code>
        <p className="text-xs text-muted-foreground">
          Payload JSON deve conter <code>device_id</code>, <code>device_key</code> e os campos de telemetria.
          Veja o firmware de exemplo em <code>firmware/esp32_lovable_client.ino</code>.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-3">
        <h3 className="font-semibold">Status EmailJS</h3>
        <ul className="text-sm space-y-1">
          <li>Template único (verificação, reset, boas-vindas, alerta): {isEmailjsConfigured() ? "✅ configurado" : "⚠️ não configurado"}</li>
        </ul>
        <p className="text-xs text-muted-foreground">Configure as variáveis <code>VITE_EMAILJS_PUBLIC_KEY</code>, <code>VITE_EMAILJS_SERVICE_ID</code> e <code>VITE_EMAILJS_TEMPLATE_ID</code> no arquivo <code>.env</code>.</p>
      </div>
    </div>
  );
}
