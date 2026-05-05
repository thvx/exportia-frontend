import { Link, useLocation } from "@tanstack/react-router";
import { Bell, Globe, Home, LogIn, LogOut, MessageCircle, Package, UserRound } from "lucide-react";
import { useAuth } from "../lib/auth/AuthContext";

const tabs = [
  { to: "/", icon: Home, label: "Inicio", hidden: false },
  { to: "/productos", icon: Package, label: "ClasifIA", hidden: false },
  { to: "/mercados", icon: Globe, label: "Mercados", hidden: true },
  { to: "/alertas", icon: Bell, label: "Alertas", hidden: false },
  { to: "/asistente", icon: MessageCircle, label: "Chat", hidden: false },
];

export function SidebarNav() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-sidebar border-r border-sidebar-border px-3 py-6 flex-shrink-0">
      <div className="flex items-center px-3 mb-8">
        <img src="/Logo Exportia sin fondo.png" alt="ExportIA" className="h-10 w-auto" />
      </div>
      <nav className="flex flex-col gap-1">
        {tabs.filter(t => !t.hidden).map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-sidebar-border pt-4">
        {isAuthenticated && user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/60 px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <UserRound size={18} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-sidebar-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
            >
              <LogOut size={19} />
              Cerrar sesión
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
          >
            <LogIn size={19} />
            Ingresar
          </Link>
        )}
      </div>
    </aside>
  );
}
