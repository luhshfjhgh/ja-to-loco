import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import { ChevronLeft, Thermometer, Droplets, Zap, Fuel, Wifi, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTelemetryHistory, useLogs, type Device } from "@/hooks/useTelemetry";
import { format } from "date-fns";
import { useTheme } from "@/hooks/useTheme";

export const Route = createFileRoute("/_authenticated/devices/$deviceId")({
  head: () => ({ meta: [{ title: "Dispositivo — ESP32 Monitor" }] }),
  component: DeviceDetail,
});

function DeviceDetail() {
  const { deviceId } = Route.useParams();
  const [device, setDevice] = useState<Device | null>(null);
  const history = useTelemetryHistory(deviceId, 60);
  const logs = useLogs(deviceId, 30);
  const { theme } = useTheme();

  useEffect(() => {
    supabase.from("devices").select("*").eq("device_id", deviceId).single().then(({ data }) => setDevice(data));
  }, [deviceId]);

  const last = history[history.length - 1];
  const gridColor = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const textColor = theme === "dark" ? "#a1a1aa" : "#71717a";

  const chart = (label: string, key: "temperature" | "humidity", color: string) => ({
    labels: history.map(h => format(new Date(h.created_at), "HH:mm:ss")),
    datasets: [{
      label, data: history.map(h => Number(h[key] ?? 0)),
      borderColor: color, backgroundColor: color + "20", tension: 0.35, fill: true, pointRadius: 0, borderWidth: 2,
    }],
  });

  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: textColor, maxTicksLimit: 6 } },
      y: { grid: { color: gridColor }, ticks: { color: textColor } },
    },
  };

  return (
    <div className="space-y-6">
      <Link to="/devices" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4 mr-1" />Voltar
      </Link>

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{device?.name ?? deviceId}</h1>
          <p className="text-sm text-muted-foreground mt-1">{deviceId} {device?.location && `· ${device.location}`}</p>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full ${device?.online ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
          {device?.online ? "Online" : "Offline"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Thermometer} label="Temperatura" value={last?.temperature != null ? `${last.temperature}°C` : "—"} color="text-orange-500" />
        <MetricCard icon={Droplets} label="Umidade" value={last?.humidity != null ? `${last.humidity}%` : "—"} color="text-blue-500" />
        <MetricCard icon={Zap} label="Energia" value={last?.energy == null ? "—" : last.energy ? "Ligada" : "Desligada"} color={last?.energy ? "text-success" : "text-destructive"} />
        <MetricCard icon={Fuel} label="Gerador" value={last?.generator == null ? "—" : last.generator ? "Ligado" : "Desligado"} color={last?.generator ? "text-warning" : "text-muted-foreground"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Temperatura</h3>
          <div className="h-56"><Line data={chart("°C", "temperature", "#f97316")} options={opts} /></div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Umidade</h3>
          <div className="h-56"><Line data={chart("%", "humidity", "#3b82f6")} options={opts} /></div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Rede & Sistema</h3>
          <dl className="space-y-2 text-sm">
            <Row label="IP" value={last?.ip ?? "—"} />
            <Row label="MAC" value={last?.mac ?? "—"} />
            <Row label="Wi-Fi" value={last?.wifi ? `${last.wifi}${last.rssi ? ` (${last.rssi} dBm)` : ""}` : "—"} />
            <Row label="Uptime" value={last?.uptime ? `${Math.floor(Number(last.uptime) / 3600)}h` : "—"} />
            <Row label="Status" value={last?.status ?? "—"} />
            <Row label="Última atualização" value={last ? format(new Date(last.created_at), "dd/MM HH:mm:ss") : "—"} />
          </dl>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-4">LEDs & Botões</h3>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-2">LEDs</div>
              <div className="flex gap-2 flex-wrap">
                {last?.leds && Object.entries(last.leds as Record<string, unknown>).map(([k, v]) => (
                  <span key={k} className={`text-xs px-2 py-1 rounded-md ${v ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    {k}: {String(v)}
                  </span>
                ))}
                {!last?.leds && <span className="text-sm text-muted-foreground">—</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">Botões</div>
              <div className="flex gap-2 flex-wrap">
                {last?.buttons && Object.entries(last.buttons as Record<string, unknown>).map(([k, v]) => (
                  <span key={k} className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                    {k}: {String(v)}
                  </span>
                ))}
                {!last?.buttons && <span className="text-sm text-muted-foreground">—</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Logs recentes</h3>
        <div className="space-y-1 max-h-72 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? <div className="text-muted-foreground">Sem logs</div>
            : logs.map(l => (
              <div key={l.id} className="flex gap-3 py-1 border-b border-border/40 last:border-0">
                <span className="text-muted-foreground">{format(new Date(l.created_at), "HH:mm:ss")}</span>
                <span className={l.level === "error" ? "text-destructive" : l.level === "warn" ? "text-warning" : "text-foreground/80"}>[{l.level}]</span>
                <span className="flex-1">{l.message}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-border/40 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono text-xs">{value}</dd>
    </div>
  );
}
