import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Bell, Boxes, ChevronDown, ChevronUp, FileText, LockKeyhole, Package, ShieldAlert } from "lucide-react";
import { AlertCard } from "../components/AlertCard";
import { AlertDetailModal, type DetailItem } from "../components/AlertDetailModal";
import { useAuth } from "../lib/auth/AuthContext";
import { useProductAlerts, useProductQuotas } from "../lib/api/hooks/useAlerts";
import { toQuotaProductCode } from "../lib/api/hooks/useAlerts";
import type { BackendAlertSeverity, EpingAlert, QRRegulation } from "../types/alerts";

export const Route = createFileRoute("/alertas")({
  component: AlertasPage,
  head: () => ({
    meta: [
      { title: "Alertas — Exporta Fácil" },
      { name: "description", content: "Regulaciones, cambios y cuotas que afectan tus exportaciones." },
    ],
  }),
});

const PREVIEW_COUNT = 5;

const severityOrder: Record<BackendAlertSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const severityType: Record<BackendAlertSeverity, "warning" | "danger" | "info"> = {
  low: "info", medium: "warning", high: "danger", critical: "danger",
};
const severityIcon: Record<BackendAlertSeverity, string> = {
  low: "📋", medium: "⚠️", high: "🚫", critical: "🚨",
};

function formatDate(value?: string): string {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function plainText(value?: string): string {
  return (value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function localizedText(value?: string | { es?: string; en?: string; fr?: string }): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return plainText(value);
  return plainText(value.es || value.en || value.fr);
}

function getRegulationCountry(regulation: QRRegulation): string {
  return regulation.reporter_member?.name?.es || regulation.reporter_member?.name?.en || "Mercado sin identificar";
}

function groupAlertsByCountry(alerts: EpingAlert[]): Map<string, EpingAlert[]> {
  const map = new Map<string, EpingAlert[]>();
  for (const alert of alerts) {
    const key = alert.country || "Mercado no especificado";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(alert);
  }
  for (const list of map.values()) {
    list.sort((a, b) => {
      const sd = (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0);
      if (sd !== 0) return sd;
      return (b.startDate ? new Date(b.startDate).getTime() : 0) - (a.startDate ? new Date(a.startDate).getTime() : 0);
    });
  }
  return map;
}

function groupRegulationsByCountry(regs: QRRegulation[]): Map<string, QRRegulation[]> {
  const map = new Map<string, QRRegulation[]>();
  for (const reg of regs) {
    const key = getRegulationCountry(reg);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(reg);
  }
  return map;
}

function orderedKeys(map: Map<string, unknown[]>, priority: Set<string>): string[] {
  return [
    ...Array.from(map.keys()).filter((k) => priority.has(k)),
    ...Array.from(map.keys()).filter((k) => !priority.has(k)),
  ];
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="content-card">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon size={19} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-card-foreground">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}

function RegulationCard({
  regulation,
  onClick,
}: {
  regulation: QRRegulation;
  onClick: () => void;
}) {
  const measure = localizedText(regulation.measures?.find((item) => item.description)?.description);
  const notified = regulation.notified_in?.[0]?.symbol || regulation.notified_in?.[0]?.document_symbol;

  return (
    <div
      className="content-card border-l-4 border-l-signal-red cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-signal-red-bg text-signal-red">
          <ShieldAlert size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-card-foreground">{getRegulationCountry(regulation)}</p>
            <span className="badge-red">Cuota / restricción</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-card-foreground line-clamp-2">
            {plainText(regulation.general_description)}
          </p>
          {measure && <p className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-2">{measure}</p>}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.68rem] font-semibold text-muted-foreground">
            <span>Vigente desde {formatDate(regulation.in_force_from)}</span>
            {regulation.termination_dt && <span>Termina {formatDate(regulation.termination_dt)}</span>}
            {notified && <span>{notified}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CountryAlertSection({
  country,
  alerts,
  onAlertClick,
}: {
  country: string;
  alerts: EpingAlert[];
  onAlertClick: (a: EpingAlert) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? alerts : alerts.slice(0, PREVIEW_COUNT);
  const extra = alerts.length - PREVIEW_COUNT;

  return (
    <div>
      <div className="px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
        {country}
      </div>
      {shown.map((alert) => (
        <AlertCard
          key={alert.id}
          icon={severityIcon[alert.severity]}
          type={severityType[alert.severity]}
          title={plainText(alert.product) || alert.reference || "Alerta regulatoria"}
          description={plainText(alert.description)}
          time={`${alert.reference || "Sin referencia"} · ${formatDate(alert.startDate as unknown as string)}`}
          onClick={() => onAlertClick(alert)}
        />
      ))}
      {extra > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mx-4 mb-3 flex items-center gap-1 text-xs font-semibold text-primary"
        >
          {expanded ? <><ChevronUp size={12} /> Ver menos</> : <><ChevronDown size={12} /> Ver {extra} más</>}
        </button>
      )}
    </div>
  );
}

function CountryRegulationSection({
  country,
  regulations,
  onRegulationClick,
}: {
  country: string;
  regulations: QRRegulation[];
  onRegulationClick: (r: QRRegulation) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? regulations : regulations.slice(0, PREVIEW_COUNT);
  const extra = regulations.length - PREVIEW_COUNT;

  return (
    <div>
      <div className="px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
        {country}
      </div>
      {shown.map((reg) => (
        <RegulationCard key={reg.id} regulation={reg} onClick={() => onRegulationClick(reg)} />
      ))}
      {extra > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mx-4 mb-3 flex items-center gap-1 text-xs font-semibold text-primary"
        >
          {expanded ? <><ChevronUp size={12} /> Ver menos</> : <><ChevronDown size={12} /> Ver {extra} más</>}
        </button>
      )}
    </div>
  );
}

function AlertasPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedProductIdx, setSelectedProductIdx] = useState(0);
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);

  const products       = user?.products ?? [];
  const destCountries  = user?.destination_countries ?? [];
  const hasProfileScope = products.length > 0 || destCountries.length > 0;

  const effectiveIdx   = Math.min(selectedProductIdx, Math.max(0, products.length - 1));
  const selectedProduct = products[effectiveIdx];

  const hsCode      = selectedProduct?.hs_code || selectedProduct?.name;
  const productCode = hsCode ? toQuotaProductCode(hsCode) : undefined;

  const alertsQuery = useProductAlerts(hsCode);
  const quotasQuery = useProductQuotas(productCode);

  const destNames = new Set(destCountries.map((c) => c.country_name.toLowerCase()));

  // Filter to destination countries when the user has them configured
  const rawAlerts = alertsQuery.data?.data ?? [];
  const alerts = destNames.size > 0
    ? rawAlerts.filter((a) => {
        const ac = (a.country ?? "").toLowerCase();
        return destNames.has(ac) || [...destNames].some((dn) => ac.includes(dn) || dn.includes(ac));
      })
    : rawAlerts;

  const regulations = quotasQuery.data?.data ?? [];
  const isLoading   = loading || alertsQuery.isLoading || quotasQuery.isLoading;
  const hasError    = alertsQuery.isError || quotasQuery.isError;

  const destNamesDisplay   = new Set(destCountries.map((c) => c.country_name));
  const alertsByCountry    = groupAlertsByCountry(alerts);
  const regulationsByCountry = groupRegulationsByCountry(regulations);
  const alertCountries     = orderedKeys(alertsByCountry    as Map<string, unknown[]>, destNamesDisplay);
  const regCountries       = orderedKeys(regulationsByCountry as Map<string, unknown[]>, destNamesDisplay);

  return (
    <div className="app-shell">
      <div className="page-header">
        <h1 className="page-title">Alertas y cuotas</h1>
        <p className="page-subtitle">Regulaciones relevantes para tu perfil exportador</p>
      </div>

      {!isAuthenticated && !loading && (
        <EmptyState
          icon={LockKeyhole}
          title="Inicia sesión para ver datos de tu perfil"
          description="Las alertas y cuotas se filtran con tus productos y países destino."
          action={
            <Link to="/auth" className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
              Ingresar
            </Link>
          }
        />
      )}

      {isAuthenticated && !hasProfileScope && (
        <EmptyState
          icon={Package}
          title="Tu perfil aún no tiene productos o mercados"
          description="Agrega productos y países destino para consultar alertas ePing y cuotas QR."
          action={
            <Link to="/productos" className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
              Configurar productos
            </Link>
          }
        />
      )}

      {isAuthenticated && hasProfileScope && (
        <>
          {/* Product selector */}
          {products.length > 1 && (
            <div className="mx-4 mb-3 flex gap-2 overflow-x-auto pb-1">
              {products.map((product, idx) => (
                <button
                  key={product.hs_code || product.id || String(idx)}
                  type="button"
                  onClick={() => setSelectedProductIdx(idx)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    idx === effectiveIdx
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {product.name}
                </button>
              ))}
            </div>
          )}

          {/* Scope pill */}
          <div className="mx-4 mb-2 grid gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Boxes size={15} className="text-primary" />
              <span className="truncate">
                {selectedProduct ? `${selectedProduct.name} (${selectedProduct.hs_code})` : "Todos tus productos"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-primary" />
              <span className="truncate">
                {destCountries.length > 0 ? destCountries.map((c) => c.country_name).join(", ") : "Todos los mercados"}
              </span>
            </div>
          </div>

          {hasError && (
            <EmptyState
              icon={AlertTriangle}
              title="No se pudieron cargar todos los datos"
              description="Alguna consulta de alertas o cuotas no respondió correctamente."
            />
          )}

          <div className="md:grid md:grid-cols-2 md:gap-4 md:px-4">
            <div>
              <div className="section-title">Alertas ePing</div>
              {isLoading && <p className="px-4 text-xs text-muted-foreground">Cargando alertas...</p>}
              {!isLoading && alerts.length === 0 && (
                <EmptyState icon={Bell} title="Sin alertas para este producto" description="No hay notificaciones ePing recientes." />
              )}
              {!isLoading && alertCountries.map((country) => (
                <CountryAlertSection
                  key={country}
                  country={country}
                  alerts={alertsByCountry.get(country)!}
                  onAlertClick={(a) => setDetailItem({ kind: "alert", data: a })}
                />
              ))}
            </div>

            <div>
              <div className="section-title">Cuotas y restricciones QR</div>
              {isLoading && <p className="px-4 text-xs text-muted-foreground">Cargando cuotas...</p>}
              {!isLoading && regulations.length === 0 && (
                <EmptyState icon={ShieldAlert} title="Sin cuotas vigentes para este alcance" description="No encontramos regulaciones QR vigentes." />
              )}
              {!isLoading && regCountries.map((country) => (
                <CountryRegulationSection
                  key={country}
                  country={country}
                  regulations={regulationsByCountry.get(country)!}
                  onRegulationClick={(r) => setDetailItem({ kind: "regulation", data: r })}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <AlertDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
    </div>
  );
}
