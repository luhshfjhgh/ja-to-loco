import { createFileRoute } from "@tanstack/react-router";
import { useLogs } from "@/hooks/useTelemetry";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/logs")({
  head: () => ({ meta: [{ title: "Logs — ESP32 Monitor" }] }),
  component: LogsPage,
});

function LogsPage() {
  const logs = useLogs(undefined, 300);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">Registros em tempo real de todos os dispositivos.</p>
      </div>
      <div className="glass-card rounded-2xl p-4 font-mono text-xs max-h-[70vh] overflow-y-auto">
        {logs.length === 0 && <div className="p-8 text-center text-muted-foreground">Sem logs</div>}
        {logs.map(l => (
          <div key={l.id} className="flex gap-3 py-1 border-b border-border/30 last:border-0">
            <span className="text-muted-foreground w-40">{format(new Date(l.created_at), "dd/MM HH:mm:ss")}</span>
            <span className="w-28 truncate text-muted-foreground">{l.device_id}</span>
            <span className={`w-14 ${l.level === "error" ? "text-destructive" : l.level === "warn" ? "text-warning" : "text-foreground/70"}`}>[{l.level}]</span>
            <span className="flex-1">{l.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
