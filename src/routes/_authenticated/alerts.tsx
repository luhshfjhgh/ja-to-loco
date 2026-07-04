import { createFileRoute } from "@tanstack/react-router";
import { useAlerts } from "@/hooks/useTelemetry";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({ meta: [{ title: "Alertas — ESP32 Monitor" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const { alerts, refetch } = useAlerts(200);

  const ack = async (id: number) => {
    await supabase.from("alerts").update({ acknowledged: true }).eq("id", id);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alertas</h1>
        <p className="text-sm text-muted-foreground mt-1">Eventos e notificações dos dispositivos.</p>
      </div>

      <div className="glass-card rounded-2xl divide-y divide-border">
        {alerts.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">Sem alertas</div>}
        {alerts.map(a => (
          <div key={a.id} className={`p-4 flex items-center gap-4 ${a.acknowledged ? "opacity-50" : ""}`}>
            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${a.severity === "critical" ? "bg-destructive" : a.severity === "warning" ? "bg-warning" : "bg-primary"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">{a.type}</span>
                <span className="text-xs text-muted-foreground">· {a.device_id}</span>
              </div>
              <div className="text-sm mt-0.5">{a.message}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(a.created_at), { locale: ptBR, addSuffix: true })}</div>
            </div>
            {!a.acknowledged && (
              <Button size="sm" variant="ghost" onClick={() => ack(a.id)}><Check className="h-4 w-4" /></Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
