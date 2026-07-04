import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Thermometer, Droplets, Zap, Fuel, Cpu, AlertCircle, Wifi } from "lucide-react";
import { useDevices, useLatestTelemetry, useAlerts } from "@/hooks/useTelemetry";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ESP32 Monitor" }] }),
  component: Dashboard,
});

function StatCard({ icon: Icon, label, value, hint, color = "text-primary" }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </motion.div>
  );
}

function Dashboard() {
  const { devices, loading } = useDevices();
  const ids = devices.map(d => d.device_id);
  const latest = useLatestTelemetry(ids);
  const { alerts } = useAlerts(5);

  const online = devices.filter(d => d.online).length;
  const anyTemp = Object.values(latest);
  const avgTemp = anyTemp.length ? (anyTemp.reduce((s, t) => s + (Number(t.temperature) || 0), 0) / anyTemp.length).toFixed(1) : "—";
  const avgHum = anyTemp.length ? (anyTemp.reduce((s, t) => s + (Number(t.humidity) || 0), 0) / anyTemp.length).toFixed(1) : "—";
  const energyOn = anyTemp.filter(t => t.energy).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visão geral</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitoramento em tempo real de todos os seus dispositivos ESP32.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Cpu} label="Dispositivos" value={devices.length} hint={`${online} online`} />
        <StatCard icon={Thermometer} label="Temp. média" value={`${avgTemp}°C`} color="text-orange-500" />
        <StatCard icon={Droplets} label="Umidade média" value={`${avgHum}%`} color="text-blue-500" />
        <StatCard icon={Zap} label="Energia ativa" value={`${energyOn}/${anyTemp.length}`} color="text-success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Dispositivos</h2>
            <Link to="/devices" className="text-xs text-primary hover:underline">Ver todos</Link>
          </div>
          {loading ? <div className="text-sm text-muted-foreground">Carregando...</div>
            : devices.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Nenhum dispositivo. <Link to="/devices" className="text-primary hover:underline">Cadastrar</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {devices.slice(0, 6).map(d => {
                  const t = latest[d.device_id];
                  return (
                    <Link key={d.id} to="/devices/$deviceId" params={{ deviceId: d.device_id }}
                      className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3 hover:bg-secondary/60 transition">
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${d.online ? "bg-success" : "bg-muted-foreground/40"}`} />
                        <div>
                          <div className="font-medium text-sm">{d.name}</div>
                          <div className="text-xs text-muted-foreground">{d.device_id} {d.location && `· ${d.location}`}</div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {t ? (
                          <>
                            <div>{t.temperature ?? "—"}°C · {t.humidity ?? "—"}%</div>
                            <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(t.created_at), { locale: ptBR, addSuffix: true })}</div>
                          </>
                        ) : <span className="text-xs text-muted-foreground">Sem telemetria</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><AlertCircle className="h-4 w-4" />Alertas recentes</h2>
            <Link to="/alerts" className="text-xs text-primary hover:underline">Ver todos</Link>
          </div>
          {alerts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Sem alertas</div>
          ) : (
            <div className="space-y-2">
              {alerts.map(a => (
                <div key={a.id} className="rounded-xl border border-border/60 p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${a.severity === "critical" ? "bg-destructive" : a.severity === "warning" ? "bg-warning" : "bg-primary"}`} />
                    <span className="uppercase tracking-wide font-medium">{a.type}</span>
                  </div>
                  <div className="mt-1 text-sm">{a.message}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{a.device_id} · {formatDistanceToNow(new Date(a.created_at), { locale: ptBR, addSuffix: true })}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
