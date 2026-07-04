import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Cpu, Bell, ScrollText, Settings, LogOut, Moon, Sun, Activity, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/devices", label: "Dispositivos", icon: Cpu },
  { to: "/alerts", label: "Alertas", icon: Bell },
  { to: "/logs", label: "Logs", icon: ScrollText },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => { await signOut(); navigate({ to: "/auth" }); };

  const Sidebar = (
    <aside className="flex h-full flex-col border-r border-sidebar-border bg-sidebar w-64">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent-foreground grid place-items-center">
          <Activity className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold tracking-tight">ESP32 Monitor</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((n) => {
          const active = pathname === n.to || pathname.startsWith(n.to + "/");
          return (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
              <n.icon className="h-4 w-4" />{n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent-foreground grid place-items-center text-primary-foreground text-xs font-semibold">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium">{user?.email}</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start">
          <LogOut className="mr-2 h-4 w-4" />Sair
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden lg:block">{Sidebar}</div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="bg-background/60 backdrop-blur-sm flex-1" onClick={() => setOpen(false)} />
          {Sidebar}
        </div>
      )}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-sm text-muted-foreground">
              {nav.find(n => pathname === n.to || pathname.startsWith(n.to + "/"))?.label ?? "Painel"}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggle}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
