import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Cpu, Copy, Trash2 } from "lucide-react";
import { useDevices } from "@/hooks/useTelemetry";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/devices")({
  head: () => ({ meta: [{ title: "Dispositivos — ESP32 Monitor" }] }),
  component: DevicesPage,
});

function randomKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, "0")).join("");
}

function DevicesPage() {
  const { devices, refetch } = useDevices();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [location, setLocation] = useState("");

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = randomKey();
    const { error } = await supabase.from("devices").insert({
      user_id: user!.id, device_id: deviceId, device_key: key, name, location: location || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Dispositivo criado. Copie a chave!");
    setOpen(false); setName(""); setDeviceId(""); setLocation(""); refetch();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este dispositivo?")) return;
    await supabase.from("devices").delete().eq("id", id);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispositivos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus ESP32.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Novo dispositivo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar ESP32</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-4">
              <div><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} required className="mt-1" placeholder="Estufa 1" /></div>
              <div><Label>Device ID</Label><Input value={deviceId} onChange={e => setDeviceId(e.target.value)} required className="mt-1" placeholder="esp32-001" /></div>
              <div><Label>Local (opcional)</Label><Input value={location} onChange={e => setLocation(e.target.value)} className="mt-1" placeholder="Galpão A" /></div>
              <DialogFooter><Button type="submit">Criar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {devices.map(d => (
          <div key={d.id} className="glass-card rounded-2xl p-5 flex flex-col">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary grid place-items-center"><Cpu className="h-5 w-5" /></div>
                <div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.device_id}</div>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${d.online ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                {d.online ? "Online" : "Offline"}
              </span>
            </div>
            {d.location && <div className="mt-3 text-sm text-muted-foreground">{d.location}</div>}
            <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground mb-1">Device Key</div>
              <div className="flex items-center gap-2">
                <code className="text-xs flex-1 truncate">{d.device_key}</code>
                <button onClick={() => { navigator.clipboard.writeText(d.device_key); toast.success("Copiado"); }}
                  className="text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link to="/devices/$deviceId" params={{ deviceId: d.device_id }} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">Detalhes</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        {devices.length === 0 && (
          <div className="col-span-full glass-card rounded-2xl p-12 text-center">
            <Cpu className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">Nenhum dispositivo</h3>
            <p className="text-sm text-muted-foreground mt-1">Cadastre seu primeiro ESP32 para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
