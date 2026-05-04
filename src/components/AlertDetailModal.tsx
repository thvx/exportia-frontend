import { X, ShieldAlert, Bell, Calendar, FileText, Globe, Hash } from "lucide-react";
import type { EpingAlert, QRRegulation } from "../types/alerts";

export type DetailItem =
  | { kind: "alert"; data: EpingAlert }
  | { kind: "regulation"; data: QRRegulation };

interface Props {
  item: DetailItem | null;
  onClose: () => void;
}

function formatDate(value?: string | Date): string {
  if (!value) return "—";
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

function plainText(value?: string): string {
  return (value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function localizedText(value?: string | { es?: string; en?: string; fr?: string }): string {
  if (!value) return "—";
  if (typeof value === "string") return plainText(value);
  return plainText(value.es || value.en || value.fr || "");
}

const severityLabel: Record<string, string> = {
  low: "Baja", medium: "Media", high: "Alta", critical: "Crítica",
};
const severityBadge: Record<string, string> = {
  low: "bg-secondary text-secondary-foreground",
  medium: "bg-signal-yellow-bg text-signal-yellow",
  high: "bg-signal-red-bg text-signal-red",
  critical: "bg-signal-red text-white",
};

function Field({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <div>
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-card-foreground">{value}</p>
    </div>
  );
}

function AlertDetail({ alert }: { alert: EpingAlert }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Bell size={18} className="text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-card-foreground leading-tight">
            {plainText(alert.product) || alert.reference || "Alerta regulatoria"}
          </p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${severityBadge[alert.severity] ?? "bg-muted"}`}>
            {severityLabel[alert.severity] ?? alert.severity}
          </span>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-background p-3">
        <Field label="País notificante" value={alert.country || "—"} />
        <Field label="Descripción" value={plainText(alert.description)} />
        <Field label="Referencia" value={alert.reference} />
        <Field label="Fecha de inicio" value={formatDate(alert.startDate)} />
        {alert.endDate && <Field label="Fecha límite de comentarios" value={formatDate(alert.endDate)} />}
        <Field label="Fuente" value={alert.apiSource} />
      </div>

      <div className="rounded-lg bg-secondary p-3">
        <p className="text-[0.7rem] text-secondary-foreground">
          💡 Esta notificación fue publicada en el sistema ePing de la OMC. Consulta el documento completo con la referencia indicada en el portal de la OMC.
        </p>
      </div>
    </div>
  );
}

function RegulationDetail({ regulation }: { regulation: QRRegulation }) {
  const country = regulation.reporter_member?.name?.es || regulation.reporter_member?.name?.en || "—";
  const measure = regulation.measures?.find((m) => m.description)?.description;
  const notified = regulation.notified_in?.[0]?.symbol || regulation.notified_in?.[0]?.document_symbol;
  const products = (regulation.affected_products ?? [])
    .slice(0, 4)
    .map((p) => `${p.code} — ${plainText(p.description)}`)
    .join("\n");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-signal-red-bg">
          <ShieldAlert size={18} className="text-signal-red" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-card-foreground leading-tight">{country}</p>
          <span className="badge-red mt-1 inline-block">Cuota / restricción</span>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-background p-3">
        <Field label="Descripción general" value={plainText(regulation.general_description)} />
        {measure && <Field label="Medida aplicada" value={localizedText(measure)} />}
        <Field label="Vigente desde" value={formatDate(regulation.in_force_from)} />
        {regulation.termination_dt && <Field label="Fecha de terminación" value={formatDate(regulation.termination_dt)} />}
        {notified && <Field label="Notificado como" value={notified} />}
        {products && <Field label="Productos afectados" value={products} />}
      </div>

      <div className="rounded-lg bg-secondary p-3">
        <p className="text-[0.7rem] text-secondary-foreground">
          💡 Esta restricción cuantitativa está registrada en el sistema QR de la OMC. Consulta el texto legal completo para conocer los requisitos aplicables.
        </p>
      </div>
    </div>
  );
}

export function AlertDetailModal({ item, onClose }: Props) {
  if (!item) return null;

  const title = item.kind === "alert" ? "Detalle de alerta ePing" : "Detalle de restricción QR";
  const Icon  = item.kind === "alert" ? Bell : ShieldAlert;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-foreground/35 px-0 pb-0 pt-12 sm:items-center sm:px-4 sm:pb-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-card shadow-xl sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-4">
          <div className="flex items-center gap-2">
            <Icon size={18} className="text-primary" />
            <h2 className="text-sm font-extrabold text-card-foreground">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {item.kind === "alert"      && <AlertDetail      alert={item.data} />}
          {item.kind === "regulation" && <RegulationDetail regulation={item.data} />}
        </div>
      </div>
    </div>
  );
}
