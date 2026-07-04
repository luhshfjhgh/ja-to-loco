import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Device = Database["public"]["Tables"]["devices"]["Row"];
export type Telemetry = Database["public"]["Tables"]["telemetry"]["Row"];
export type Alert = Database["public"]["Tables"]["alerts"]["Row"];
export type Log = Database["public"]["Tables"]["logs"]["Row"];

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const refetch = async () => {
    const { data } = await supabase.from("devices").select("*").order("created_at", { ascending: false });
    setDevices(data ?? []);
    setLoading(false);
  };
  useEffect(() => {
    refetch();
    const ch = supabase.channel("devices-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "devices" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  return { devices, loading, refetch };
}

export function useLatestTelemetry(deviceIds: string[]) {
  const [latest, setLatest] = useState<Record<string, Telemetry>>({});
  useEffect(() => {
    if (deviceIds.length === 0) return;
    const load = async () => {
      const map: Record<string, Telemetry> = {};
      for (const id of deviceIds) {
        const { data } = await supabase.from("telemetry").select("*").eq("device_id", id).order("created_at", { ascending: false }).limit(1);
        if (data?.[0]) map[id] = data[0];
      }
      setLatest(map);
    };
    load();
    const ch = supabase.channel("telemetry-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "telemetry" }, (payload) => {
        const t = payload.new as Telemetry;
        if (deviceIds.includes(t.device_id)) setLatest((p) => ({ ...p, [t.device_id]: t }));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [deviceIds.join(",")]);
  return latest;
}

export function useTelemetryHistory(deviceId: string, limit = 60) {
  const [rows, setRows] = useState<Telemetry[]>([]);
  useEffect(() => {
    if (!deviceId) return;
    const load = async () => {
      const { data } = await supabase.from("telemetry").select("*").eq("device_id", deviceId).order("created_at", { ascending: false }).limit(limit);
      setRows((data ?? []).reverse());
    };
    load();
    const ch = supabase.channel(`telemetry-${deviceId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "telemetry", filter: `device_id=eq.${deviceId}` },
        (payload) => setRows((prev) => [...prev.slice(-(limit - 1)), payload.new as Telemetry]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [deviceId, limit]);
  return rows;
}

export function useAlerts(limit = 50) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const refetch = async () => {
    const { data } = await supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(limit);
    setAlerts(data ?? []);
  };
  useEffect(() => {
    refetch();
    const ch = supabase.channel("alerts-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  return { alerts, refetch };
}

export function useLogs(deviceId?: string, limit = 100) {
  const [logs, setLogs] = useState<Log[]>([]);
  useEffect(() => {
    const load = async () => {
      let q = supabase.from("logs").select("*").order("created_at", { ascending: false }).limit(limit);
      if (deviceId) q = q.eq("device_id", deviceId);
      const { data } = await q;
      setLogs(data ?? []);
    };
    load();
    const ch = supabase.channel("logs-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "logs" }, (payload) => {
        const l = payload.new as Log;
        if (!deviceId || l.device_id === deviceId) setLogs((prev) => [l, ...prev].slice(0, limit));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [deviceId, limit]);
  return logs;
}
