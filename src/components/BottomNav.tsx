import { Link, useLocation } from "@tanstack/react-router";
import { Home, Globe, Bell, Package, MessageCircle, UserRound } from "lucide-react";

const tabs = [
  { to: "/", icon: Home, label: "Inicio", hidden: false },
  { to: "/productos", icon: Package, label: "ClasifIA", hidden: false },
  { to: "/mercados", icon: Globe, label: "Mercados", hidden: true },
  { to: "/alertas", icon: Bell, label: "Alertas", hidden: false },
  { to: "/asistente", icon: MessageCircle, label: "Chat", hidden: false },
  { to: "/auth", icon: UserRound, label: "Cuenta", hidden: false },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-nav-bg border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {tabs.filter(t => !t.hidden).map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${active ? "text-nav-active" : "text-nav-inactive"}`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[0.625rem] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
