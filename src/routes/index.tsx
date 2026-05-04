import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, LogIn, Package, Sparkles } from "lucide-react";
import { MarketCard } from "../components/MarketCard";
import { AlertCard } from "../components/AlertCard";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../lib/auth/AuthContext";
import { useProfileAlerts } from "../lib/api/hooks/useAlerts";
import { countryFlag } from "../lib/utils";
import type { BackendAlertSeverity, EpingAlert } from "../types/alerts";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "ExportIA — Tu negocio internacional simplificado" },
      { name: "description", content: "Toma decisiones de exportación inteligentes sin complicaciones técnicas." },
    ],
  }),
});

const severityType: Record<BackendAlertSeverity, "warning" | "danger" | "info"> = {
  low: "info", medium: "warning", high: "danger", critical: "danger",
};
const severityIcon: Record<BackendAlertSeverity, string> = {
  low: "📋", medium: "⚠️", high: "🚫", critical: "🚨",
};

function formatDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "short" }).format(d);
}

function plainText(value?: string): string {
  return (value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

type Signal = "green" | "yellow" | "red";

function countrySignal(
  countryName: string,
  alerts: EpingAlert[]
): { signal: Signal; label: string; subtitle: string } {
  const match = alerts.filter((a) => {
    const ac = a.country.toLowerCase();
    const cn = countryName.toLowerCase();
    return ac.includes(cn) || cn.includes(ac);
  });
  if (match.some((a) => a.severity === "critical" || a.severity === "high")) {
    return { signal: "red",    label: "Alerta activa",  subtitle: "Regulaciones de alto impacto" };
  }
  if (match.some((a) => a.severity === "medium")) {
    return { signal: "yellow", label: "Monitorear",     subtitle: "Notificaciones recientes WTO" };
  }
  if (match.length > 0) {
    return { signal: "yellow", label: "Novedad",        subtitle: "Alertas informativas activas" };
  }
  return   { signal: "green",  label: "Sin alertas",    subtitle: "Sin notificaciones activas" };
}

function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const alertsQuery = useProfileAlerts(user);

  const displayName   = user?.first_name || user?.name || "exportador";
  const destCountries = user?.destination_countries ?? [];

  // Filter to last year + user's destination countries
  const ONE_YEAR_AGO  = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const destNames     = new Set(destCountries.map((c) => c.country_name.toLowerCase()));
  const alerts = (alertsQuery.data?.data ?? []).filter((a) => {
    const d = a.startDate ? new Date(a.startDate as unknown as string) : null;
    if (d && d < ONE_YEAR_AGO) return false;
    if (destNames.size === 0) return true;
    const ac = (a.country ?? "").toLowerCase();
    return destNames.has(ac) || [...destNames].some((dn) => ac.includes(dn) || dn.includes(ac));
  });

  // Stats derived from real user data
  const redCount      = destCountries.filter((c) => countrySignal(c.country_name, alerts).signal === "red").length;
  const opportunities = Math.max(0, destCountries.length - redCount);
  const marketsCount  = destCountries.length;
  const alertsCount   = alerts.length;

  // Top 2 alerts sorted by severity for "Alertas recientes"
  const severityRank: Record<BackendAlertSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  const recentAlerts = [...alerts]
    .sort((a, b) => (severityRank[b.severity] ?? 0) - (severityRank[a.severity] ?? 0))
    .slice(0, 2);

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-2 mb-1 md:hidden">
          <span className="text-2xl">✨</span>
          <span className="text-sm font-bold text-primary">ExportIA</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="page-title">Hola, {displayName}</h1>
            <p className="page-subtitle">Resumen de tu negocio exportador</p>
          </div>
          {!isAuthenticated && !loading && (
            <Link
              to="/auth"
              className="hidden shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold text-foreground shadow-sm transition-colors hover:bg-muted sm:flex"
            >
              <LogIn size={16} />
              Ingresar
            </Link>
          )}
        </div>
      </div>

      {/* Hero banner → Productos */}
      <div className="px-4 pt-2">
        <Link
          to="/productos"
          className="block rounded-2xl p-5 text-primary-foreground shadow-lg transition-transform active:scale-[0.99]"
          style={{ background: "linear-gradient(135deg, oklch(0.5 0.2 295), oklch(0.6 0.22 320))" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} />
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">Inteligencia ExportIA</span>
          </div>
          <p className="text-lg font-extrabold leading-tight mb-1">
            Conoce tu producto, su valor global y dónde venderlo.
          </p>
          <p className="text-xs opacity-80">Partida arancelaria · Mercados · WTO Timeseries</p>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 py-3">
        <StatCard
          icon="🌎"
          value={isAuthenticated ? String(marketsCount) : "—"}
          label="Mercados"
        />
        <StatCard
          icon="✅"
          value={isAuthenticated ? String(opportunities) : "—"}
          label="Oportunidades"
        />
        <StatCard
          icon="⚠️"
          value={isAuthenticated ? String(alertsCount) : "—"}
          label="Alertas"
        />
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-4 md:px-4">
        {/* Tus mercados */}
        <div>
          <div className="section-title">Tus mercados</div>

          {!isAuthenticated && !loading && (
            <div className="content-card mx-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <LogIn size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-card-foreground">Inicia sesión</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Verás aquí tus mercados destino con señales de alerta en tiempo real.
                  </p>
                  <Link to="/auth" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary">
                    Ingresar <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {isAuthenticated && destCountries.length === 0 && (
            <div className="content-card mx-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Package size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-card-foreground">Sin mercados configurados</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Agrega países destino para ver señales de mercado aquí.
                  </p>
                  <Link to="/productos" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary">
                    Configurar <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {isAuthenticated && destCountries.slice(0, 4).map((c) => {
            const sig = countrySignal(c.country_name, alerts);
            return (
              <MarketCard
                key={c.country_code}
                flag={countryFlag(c.country_name)}
                country={c.country_name}
                signal={sig.signal}
                label={sig.label}
                subtitle={sig.subtitle}
              />
            );
          })}
        </div>

        {/* Alertas recientes */}
        <div>
          <div className="section-title">Alertas recientes</div>

          {!isAuthenticated && !loading && (
            <div className="content-card mx-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Bell size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-card-foreground">Alertas ePing</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Inicia sesión y configura tus productos para recibir alertas regulatorias.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isAuthenticated && !alertsQuery.isLoading && recentAlerts.length === 0 && (
            <div className="content-card mx-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Bell size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-card-foreground">Sin alertas recientes</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    No hay notificaciones ePing para tus productos en este momento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isAuthenticated && alertsQuery.isLoading && (
            <p className="px-4 text-xs text-muted-foreground">Cargando alertas…</p>
          )}

          {recentAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              icon={severityIcon[alert.severity]}
              type={severityType[alert.severity]}
              title={plainText(alert.product) || alert.reference || "Alerta regulatoria"}
              description={plainText(alert.description)}
              time={`${alert.country || "WTO"} · ${formatDate(alert.startDate as unknown as string)}`}
            />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 py-3">
        <Link to="/mercados" className="cta-button">
          Ver análisis de mercados <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
