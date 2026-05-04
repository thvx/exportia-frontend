import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Tooltip, ResponsiveContainer, Treemap } from "recharts";
import {
  Check,
  DollarSign,
  Globe,
  Hash,
  Loader2,
  LockKeyhole,
  Minus,
  PackagePlus,
  Pencil,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ProfileSetupDialog } from "../components/ProfileSetupDialog";
import { useAuth } from "../lib/auth/AuthContext";
import { useProductPotentialMarkets, useUnitExportPrice } from "../lib/api/hooks/useMarkets";
import { useExportOpportunities } from "../lib/api/hooks/useComtrade";
import { countryFlag, formatUsd } from "../lib/utils";
import { productsApi } from "../lib/api/productsApi";
import type { ClassifyStatusResponse } from "../lib/api/productsApi";
import { alertsApi, type WtoMember } from "../lib/api/alertsApi";
import { authApi } from "../lib/api/authApi";
import type { ExportOpportunity } from "../lib/api/comtradeApi";

export const Route = createFileRoute("/productos")({
  component: ProductosPage,
  head: () => ({
    meta: [
      { title: "Productos — ExportIA" },
      {
        name: "description",
        content: "Conoce tu producto: partida arancelaria, valor de mercado global y dónde venderlo.",
      },
    ],
  }),
});

const trendIcon = {
  rising:    <TrendingUp   size={14} className="text-signal-green" />,
  stable:    <Minus        size={14} className="text-signal-yellow" />,
  declining: <TrendingDown size={14} className="text-signal-red" />,
};
const trendLabel = { rising: "Subiendo", stable: "Estable", declining: "Bajando" } as const;
const MARKET_TREE_COLORS = ["#312e81", "#3730a3", "#4338ca", "#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe"];
const COMTRADE_YEAR = new Date().getFullYear() - 2;

// ── Classify panel ──────────────────────────────────────────────────────────

type ClassifyStep = "form" | "polling" | "result";

function tryParse(val: unknown): unknown {
  if (typeof val !== "string") return val;
  try { return JSON.parse(val); } catch { return val; }
}

interface ParsedClassify {
  subpartidaNacional: string;
  aV: string;
  fundamentoClasificacion: string;
  capituloSeleccionado: string;
  subpartidaSeleccionada: string;
  fundamentoSubpartida: string;
  descripcionProducto: string;
  analisisMercancia: string;
}

function parseClassifyResult(result: Record<string, unknown>): ParsedClassify {
  const agentArr  = Array.isArray(tryParse(result.agent_response))  ? tryParse(result.agent_response) as Record<string,unknown>[]  : [];
  const pdfArr    = Array.isArray(tryParse(result.pdf_analysis))    ? tryParse(result.pdf_analysis)   as Record<string,unknown>[]  : [];
  const step2Arr  = Array.isArray(tryParse(result.step2_secciones)) ? tryParse(result.step2_secciones) as Record<string,unknown>[] : [];
  const step3Arr  = Array.isArray(tryParse(result.step3_capitulos)) ? tryParse(result.step3_capitulos) as Record<string,unknown>[] : [];

  const agent  = agentArr[0]  ?? {};
  const pdf    = pdfArr[0]    ?? {};
  const sec2   = step2Arr[0]  ?? {};
  const sec3   = step3Arr[0]  ?? {};

  const capsParsed = Array.isArray(tryParse(sec3.capitulos_seleccionados))
    ? (tryParse(sec3.capitulos_seleccionados) as unknown[])[0] : null;
  const subsParsed = Array.isArray(tryParse(sec3.subpartidas_seleccionadas))
    ? (tryParse(sec3.subpartidas_seleccionadas) as unknown[])[0] : null;

  return {
    subpartidaNacional:     String(agent.subpartida_nacional       ?? ""),
    aV:                     String(agent.a_v                       ?? ""),
    fundamentoClasificacion: String(agent.fundamento_clasificacion ?? ""),
    capituloSeleccionado:   String(capsParsed ?? sec3.capitulos_seleccionados ?? ""),
    subpartidaSeleccionada: String(subsParsed ?? sec3.subpartidas_seleccionadas ?? ""),
    fundamentoSubpartida:   String(sec3.fundamento_subpartida      ?? ""),
    descripcionProducto:    String(pdf.description                 ?? ""),
    analisisMercancia:      String(sec2.analisis_mercancia         ?? ""),
  };
}

function renderMarkdown(text: string): React.ReactNode {
  return (
    <>
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="leading-5">
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
          </p>
        );
      })}
    </>
  );
}

interface MarketTileProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  share?: number;
  rank?: number;
}

function MarketTreemapTile({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  name = "",
  share = 0,
  rank = 0,
}: MarketTileProps) {
  if (width < 4 || height < 4) return null;
  const fill = MARKET_TREE_COLORS[Math.min(rank, MARKET_TREE_COLORS.length - 1)] ?? MARKET_TREE_COLORS[0];
  const isLight = rank >= MARKET_TREE_COLORS.length - 3;
  const textColor = isLight ? "#1e1b4b" : "#fff";
  const maxChars = Math.max(3, Math.floor(width / 7));
  const label = name.length > maxChars ? `${name.slice(0, maxChars - 1)}...` : name;

  return (
    <g>
      <rect x={x + 1} y={y + 1} width={Math.max(0, width - 2)} height={Math.max(0, height - 2)} fill={fill} rx={3} />
      {width > 44 && height > 22 && (
        <text x={x + 6} y={y + 16} fill={textColor} fontSize={11} fontWeight={700} style={{ pointerEvents: "none" }}>
          {label}
        </text>
      )}
      {width > 44 && height > 34 && (
        <text x={x + 6} y={y + 29} fill={textColor} fontSize={10} opacity={0.82} style={{ pointerEvents: "none" }}>
          {share}%
        </text>
      )}
    </g>
  );
}

function MarketTreemapTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload?: { name: string; size: number; share: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-bold text-card-foreground">{countryFlag(data.name)} {data.name}</p>
      <p className="text-muted-foreground">
        Importa: <span className="font-semibold text-primary">{formatUsd(data.size)}</span>
      </p>
      <p className="text-muted-foreground">
        Cuota global: <span className="font-semibold">{data.share}%</span>
      </p>
    </div>
  );
}

function MarketIntelligenceChart({
  opportunities,
  isLoading,
  hsCode,
}: {
  opportunities: ExportOpportunity[];
  isLoading: boolean;
  hsCode?: string;
}) {
  const chartData = opportunities.map((market, index) => ({
    name: market.country,
    size: market.import_value,
    share: market.share,
    rank: index,
  }));

  return (
    <div className="content-card mx-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Globe size={18} />
        </div>
        <div>
          <p className="text-sm font-bold uppercase text-card-foreground">¿Dónde lo puedo vender? — Inteligencia de mercados</p>
          <p className="text-xs text-muted-foreground">Mapa de participación por país importador</p>
        </div>
      </div>

      {isLoading && <p className="py-2 text-xs text-muted-foreground">Consultando UN Comtrade...</p>}

      {!isLoading && chartData.length === 0 && (
        <p className="py-2 text-xs text-muted-foreground">Sin datos de inteligencia de mercados disponibles.</p>
      )}

      {!isLoading && chartData.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <Treemap
              data={chartData}
              dataKey="size"
              stroke="transparent"
              isAnimationActive={false}
              content={<MarketTreemapTile />}
            >
              <Tooltip content={<MarketTreemapTooltip />} />
            </Treemap>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {chartData.slice(0, 5).map((market, index) => (
              <span key={market.name} className="flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-sm" style={{ background: MARKET_TREE_COLORS[index] }} />
                {countryFlag(market.name)} {market.name} · {market.share}%
              </span>
            ))}
          </div>
        </>
      )}

      <p className="mt-3 text-[0.6rem] text-muted-foreground">
        Fuente: UN Comtrade · {COMTRADE_YEAR}{hsCode ? ` · HS ${hsCode}` : ""}
      </p>
    </div>
  );
}

function extractHsCode(result: Record<string, unknown>): string {
  if (typeof result.agent_response === "string") {
    try {
      const arr = JSON.parse(result.agent_response);
      if (Array.isArray(arr) && arr[0]?.subpartida_nacional)
        return String(arr[0].subpartida_nacional);
    } catch { /* ignore */ }
  }
  for (const key of ["hs_code", "code", "partida", "partida_arancelaria", "tariff_code", "hsCode", "subpartida_nacional"]) {
    const val = result[key];
    if (typeof val === "string" && val.length > 0) return val.replace(/\D/g, "");
    if (typeof val === "number") return String(val);
  }
  for (const val of Object.values(result)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const nested = extractHsCode(val as Record<string, unknown>);
      if (nested) return nested;
    }
  }
  return "";
}

function extractName(result: Record<string, unknown>): string {
  if (typeof result.pdf_analysis === "string") {
    try {
      const arr = JSON.parse(result.pdf_analysis);
      if (Array.isArray(arr) && arr[0]?.description) return String(arr[0].description);
    } catch { /* ignore */ }
  }
  for (const key of ["description", "descripcion", "name", "nombre", "producto", "product"]) {
    const val = result[key];
    if (typeof val === "string" && val.length > 0) return val;
  }
  return "";
}

function ClassifyPanel({
  product,
  onSaved,
  onCancel,
}: {
  product: { id: string; name: string; hs_code: string; classification_data?: { fields?: Record<string, string>; result?: Record<string, unknown>; savedAt?: string } | null };
  onSaved: () => void;
  onCancel: () => void;
}) {
  const savedFields = product.classification_data?.fields ?? {};
  const savedResult = product.classification_data?.result ?? null;

  const [step, setStep] = useState<ClassifyStep>(savedResult ? "result" : "form");
  const [fields, setFields] = useState({
    descripcion:           savedFields.descripcion            ?? "",
    usos:                  savedFields.usos                   ?? "",
    presentacion:          savedFields.presentacion           ?? "",
    materiales:            savedFields.materiales             ?? "",
    informacion_adicional: savedFields.informacion_adicional  ?? "",
    origen:                savedFields.origen                 ?? "",
    estado_fisico:         savedFields.estado_fisico          ?? "",
    grado_procesamiento:   savedFields.grado_procesamiento    ?? "",
  });
  const [pollData, setPollData]         = useState<ClassifyStatusResponse | null>(null);
  const [confirmedHs, setConfirmedHs]   = useState(() => savedResult ? extractHsCode(savedResult) : "");
  const [confirmedName, setConfirmedName] = useState(() => savedResult ? (extractName(savedResult) || product.name) : "");
  const [currentResult, setCurrentResult] = useState<Record<string, unknown> | null>(savedResult);
  const [saving, setSaving]             = useState(false);
  const pollRef                         = useRef<ReturnType<typeof setInterval> | null>(null);

  function field(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  useEffect(() => () => stopPolling(), []);

  async function submit() {
    if (!fields.descripcion.trim()) { toast.warning("La descripción es obligatoria."); return; }

    const nonEmptyFields = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v.trim() !== "")
    ) as Record<string, string>;

    // Persist form fields to the product immediately
    productsApi.updateClassificationData(product.id, { fields: nonEmptyFields, savedAt: new Date().toISOString() })
      .catch(() => { /* non-blocking */ });

    try {
      const res = await productsApi.classify(nonEmptyFields as unknown as Parameters<typeof productsApi.classify>[0]);
      setStep("polling");
      startPolling(res.data.task_id, nonEmptyFields);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar la solicitud.");
    }
  }

  function startPolling(id: string, sentFields: Record<string, string>) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await productsApi.getClassifyStatus(id);
        const data = res.data;
        setPollData(data);
        if (data.status === "completed") {
          stopPolling();
          const hs   = data.result ? extractHsCode(data.result) : "";
          const name = data.result ? (extractName(data.result) || product.name) : product.name;
          setConfirmedHs(hs);
          setConfirmedName(name);
          const incomingResult = data.result ?? {};
          setCurrentResult(incomingResult);
          // Persist result to the product
          productsApi.updateClassificationData(product.id, {
            fields: sentFields,
            result: incomingResult,
            savedAt: new Date().toISOString(),
          }).catch(() => { /* non-blocking */ });
          setStep("result");
        } else if (data.status === "failed" || data.status === "error") {
          stopPolling();
          toast.error("La clasificación falló. Intenta nuevamente.");
          setStep("form");
        }
      } catch {
        // keep polling on transient errors
      }
    }, 3000);
  }

  function reClassify() {
    setConfirmedHs("");
    setConfirmedName("");
    setCurrentResult(null);
    setPollData(null);
    setStep("form");
  }

  async function save() {
    if (!confirmedHs.trim()) { toast.warning("Ingresa el código HS para guardar."); return; }
    setSaving(true);
    const classificationData = {
      fields: Object.fromEntries(Object.entries(fields).filter(([, v]) => v.trim() !== "")) as Record<string, string>,
      result: currentResult ?? undefined,
      savedAt: product.classification_data?.savedAt,
    };
    try {
      await productsApi.delete(product.id);
      await productsApi.create({
        name: confirmedName || product.name,
        hs_code: confirmedHs.replace(/\D/g, ""),
        category: "AI",
        description: `Clasificado por IA desde "${product.name}"`,
        classification_data: classificationData,
      });
      toast.success("Partida arancelaria actualizada");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground";

  return (
    <div className="mt-3 content-card border border-primary/30">
      <p className="text-xs font-bold text-card-foreground mb-3">Clasificar partida arancelaria con IA</p>

      {/* ── FORM ── */}
      {step === "form" && (
        <div className="space-y-2.5">
          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Descripción <span className="text-signal-red">*</span>
            </label>
            <input
              type="text"
              value={fields.descripcion}
              onChange={field("descripcion")}
              placeholder="Ej: Aceite de oliva virgen extra obtenido mediante procesos mecánicos"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground mb-1">Usos</label>
            <input
              type="text"
              value={fields.usos}
              onChange={field("usos")}
              placeholder="Ej: Consumo humano, uso culinario para aderezar y cocinar"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground mb-1">Presentación</label>
            <input
              type="text"
              value={fields.presentacion}
              onChange={field("presentacion")}
              placeholder="Ej: Botella de vidrio de 750 ml con tapa de rosca metálica"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground mb-1">Materiales / Ingredientes</label>
            <input
              type="text"
              value={fields.materiales}
              onChange={field("materiales")}
              placeholder="Ej: 100% aceite de oliva virgen extra, sin aditivos"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground mb-1">Origen</label>
            <input
              type="text"
              value={fields.origen}
              onChange={field("origen")}
              placeholder="Ej: España"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground mb-1">Estado físico</label>
            <input
              type="text"
              value={fields.estado_fisico}
              onChange={field("estado_fisico")}
              placeholder="Ej: Líquido"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground mb-1">Grado de procesamiento</label>
            <input
              type="text"
              value={fields.grado_procesamiento}
              onChange={field("grado_procesamiento")}
              placeholder="Ej: Producto procesado"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground mb-1">Información adicional</label>
            <input
              type="text"
              value={fields.informacion_adicional}
              onChange={field("informacion_adicional")}
              placeholder="Ej: Acidez máxima 0.8%, color amarillo dorado"
              className={inputClass}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => void submit()}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground"
            >
              <Sparkles size={12} />
              Clasificar con IA
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex h-8 items-center rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── POLLING ── */}
      {step === "polling" && (
        <div className="py-4 flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-primary" />
          <p className="text-sm font-semibold text-card-foreground">Clasificando con IA…</p>
          {pollData && (
            <div className="w-full rounded-lg bg-secondary px-3 py-2 text-center">
              {pollData.progress_message && (
                <p className="text-xs text-secondary-foreground">{pollData.progress_message}</p>
              )}
              {pollData.total_steps && pollData.current_step !== undefined && (
                <p className="text-[0.65rem] text-muted-foreground mt-0.5">
                  Paso {pollData.current_step} de {pollData.total_steps}
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => { stopPolling(); setStep("form"); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* ── RESULT ── */}
      {step === "result" && (() => {
        const parsed = currentResult ? parseClassifyResult(currentResult) : null;
        return (
          <div className="space-y-3">

            {/* ── Subpartida header ── */}
            <div className="rounded-lg bg-signal-green-bg/30 border border-signal-green/30 px-3 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">Subpartida arancelaria</p>
                {product.classification_data?.savedAt && (
                  <p className="text-[0.6rem] text-muted-foreground">
                    {new Date(product.classification_data.savedAt).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-primary font-mono">
                {parsed?.subpartidaNacional || confirmedHs || "—"}
              </p>
              {parsed?.capituloSeleccionado && (
                <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                  Capítulo {parsed.capituloSeleccionado}
                  {parsed.subpartidaSeleccionada && ` · Subpartida ${parsed.subpartidaSeleccionada}`}
                  {parsed.aV && ` · A/V ${parsed.aV}%`}
                </p>
              )}
              {parsed?.descripcionProducto && (
                <p className="text-xs font-semibold text-card-foreground mt-1.5 leading-4">
                  {parsed.descripcionProducto}
                </p>
              )}
            </div>

            {/* ── Fundamento de clasificación ── */}
            {parsed?.fundamentoClasificacion && (
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Fundamento de clasificación
                </p>
                <p className="text-xs leading-5 text-card-foreground">
                  {parsed.fundamentoClasificacion}
                </p>
              </div>
            )}

            {/* ── Fundamento de subpartida ── */}
            {parsed?.fundamentoSubpartida && (
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Fundamento de subpartida
                </p>
                <p className="text-xs leading-5 text-card-foreground">
                  {parsed.fundamentoSubpartida}
                </p>
              </div>
            )}

            {/* ── Análisis de mercancía ── */}
            {parsed?.analisisMercancia && (
              <div className="rounded-lg bg-secondary px-3 py-2.5">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Análisis de mercancía
                </p>
                <div className="text-xs text-secondary-foreground space-y-1">
                  {renderMarkdown(parsed.analisisMercancia)}
                </div>
              </div>
            )}

            {/* ── Editar y guardar ── */}
            <div className="rounded-lg border border-border bg-background px-3 py-2.5 space-y-2">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">Confirmar y guardar</p>
              <div>
                <label className="block text-[0.65rem] text-muted-foreground mb-1">Código HS</label>
                <input
                  type="text"
                  value={confirmedHs}
                  onChange={(e) => setConfirmedHs(e.target.value)}
                  placeholder="Ej: 0901.21.10.00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[0.65rem] text-muted-foreground mb-1">Nombre del producto</label>
                <input
                  type="text"
                  value={confirmedName}
                  onChange={(e) => setConfirmedName(e.target.value)}
                  placeholder="Nombre del producto"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || !confirmedHs.trim()}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-60"
              >
                {saving && <Loader2 size={12} className="animate-spin" />}
                Guardar
              </button>
              <button
                type="button"
                onClick={reClassify}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <Sparkles size={11} />
                Re-clasificar
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex h-8 items-center rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancelar
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Country manager ─────────────────────────────────────────────────────────

function CountryManagerSection({
  destCountries,
  onRefresh,
}: {
  destCountries: { country_code: string; country_name: string }[];
  onRefresh: () => void;
}) {
  const [open, setOpen]           = useState(false);
  const [search, setSearch]       = useState("");
  const [members, setMembers]     = useState<WtoMember[]>([]);
  const [removing, setRemoving]   = useState<string | null>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || members.length > 0) return;
    alertsApi.getQuotaMembers()
      .then((res) => setMembers(res.data ?? []))
      .catch(() => toast.error("No se pudo cargar el catálogo de países."));
  }, [open, members.length]);

  const suggestions = search.trim().length >= 2
    ? members
        .filter((m) => m.text.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 8)
    : [];

  const existingCodes = new Set(destCountries.map((c) => c.country_code));

  async function addCountry(member: WtoMember) {
    if (existingCodes.has(member.value)) {
      toast.info(`${member.text} ya está en tu lista.`);
      return;
    }
    try {
      await authApi.addDestinationCountry({ country_code: member.value, country_name: member.text });
      toast.success(`${member.text} agregado`);
      onRefresh();
      setSearch("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo agregar el país.");
    }
  }

  async function removeCountry(code: string, name: string) {
    setRemoving(code);
    try {
      await authApi.removeDestinationCountry(code);
      toast.success(`${name} eliminado`);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="mt-3 content-card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-card-foreground">Países destino</p>
        <button
          type="button"
          onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 50); }}
          className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-bold text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus size={11} />
          Agregar país
        </button>
      </div>

      {/* Current countries */}
      {destCountries.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {destCountries.map((c) => (
            <span
              key={c.country_code}
              className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground"
            >
              {countryFlag(c.country_name)} {c.country_name}
              <button
                type="button"
                onClick={() => void removeCountry(c.country_code, c.country_name)}
                disabled={removing === c.country_code}
                className="ml-0.5 text-muted-foreground hover:text-destructive disabled:opacity-50"
                aria-label={`Eliminar ${c.country_name}`}
              >
                {removing === c.country_code ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Sin países destino configurados.</p>
      )}

      {/* Add country search panel */}
      {open && (
        <div className="mt-3 rounded-lg border border-border bg-background p-3">
          <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
            Buscar y agregar país
          </p>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Escribe el nombre del país..."
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {suggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              {suggestions.map((m) => {
                const already = existingCodes.has(m.value);
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => !already && void addCountry(m)}
                    disabled={already}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${
                      already
                        ? "cursor-default opacity-50"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span>{countryFlag(m.text)}</span>
                    <span className="flex-1 font-semibold text-card-foreground">{m.text}</span>
                    {already
                      ? <Check size={12} className="text-signal-green" />
                      : <Plus size={12} className="text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
          )}
          {search.trim().length >= 2 && suggestions.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">Sin resultados para "{search}".</p>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Country Price Card ──────────────────────────────────────────────────────

function CountryPriceCard({
  hsCode,
  country,
}: {
  hsCode: string;
  country: { country_code: string; country_name: string };
}) {
  const { data, isLoading, isError } = useUnitExportPrice(hsCode, country.country_name);
  const price = data?.data;

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-lg">{countryFlag(country.country_name)}</span>
        <span className="text-sm font-bold text-card-foreground">{country.country_name}</span>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[0.6rem] font-bold text-primary">
          <Sparkles size={9} />
          IA
        </span>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-1">
          <Loader2 size={13} className="animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Consultando modelo…</span>
        </div>
      )}

      {isError && (
        <p className="text-xs text-signal-red">No se pudo obtener la estimación.</p>
      )}

      {price && (
        <>
          <div className="flex items-baseline gap-1.5 mb-2">
            <DollarSign size={14} className="text-primary shrink-0 mb-0.5" />
            <p className="text-2xl font-extrabold tracking-tight text-primary">
              {formatUsd(price.priceAvg)}
            </p>
            <span className="text-xs text-muted-foreground font-medium">
              / {price.unit}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <div className="rounded-lg bg-signal-red-bg/40 px-2.5 py-1.5">
              <p className="text-[0.6rem] font-bold uppercase text-muted-foreground">Mínimo</p>
              <p className="text-sm font-extrabold text-signal-red">{formatUsd(price.priceMin)}</p>
            </div>
            <div className="rounded-lg bg-signal-green-bg/40 px-2.5 py-1.5">
              <p className="text-[0.6rem] font-bold uppercase text-muted-foreground">Máximo</p>
              <p className="text-sm font-extrabold text-signal-green">{formatUsd(price.priceMax)}</p>
            </div>
          </div>
          <p className="text-[0.65rem] text-muted-foreground leading-4">{price.explanation}</p>
        </>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

function ProductosPage() {
  const { user, isAuthenticated, loading, refreshToken } = useAuth();
  const [selectedIdx, setSelectedIdx]   = useState(0);
  const [setupOpen, setSetupOpen]       = useState(false);
  const [editingHsId, setEditingHsId]   = useState<string | null>(null);

  const products       = user?.products ?? [];
  const destCountries  = user?.destination_countries ?? [];
  const effectiveIdx   = Math.min(selectedIdx, Math.max(0, products.length - 1));
  const selectedProduct = products[effectiveIdx];

  // Pass the first 4 digits of the HS code so the backend can select product-specific data
  const productParam = selectedProduct ? selectedProduct.hs_code.replace(/\D/g, "").slice(0, 4) : undefined;

  const potentialMarketsQuery = useProductPotentialMarkets(productParam, 8);
  const opportunitiesQuery = useExportOpportunities(
    selectedProduct?.hs_code.replace(/\D/g, ""),
    15
  );

  const markets     = potentialMarketsQuery.data?.data ?? [];
  const opportunities = opportunitiesQuery.data?.data ?? [];
  const dataLoading = potentialMarketsQuery.isLoading;
  const opportunitiesLoading = opportunitiesQuery.isLoading;

  const isEditingCurrentProduct = selectedProduct && editingHsId === selectedProduct.id;

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="page-header">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-primary">
            Inteligencia ExportIA
          </span>
        </div>
        <h1 className="page-title">Conoce tu producto</h1>
        <p className="page-subtitle">Partida arancelaria, valor de mercado global y dónde venderlo</p>
      </div>

      {/* Not authenticated */}
      {!isAuthenticated && !loading && (
        <div className="content-card mx-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <LockKeyhole size={19} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-card-foreground">Inicia sesión para continuar</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Crea tu perfil con productos y países para acceder al análisis personalizado.
              </p>
              <div className="mt-3">
                <Link to="/auth" className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
                  Ingresar
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {(isAuthenticated || loading) && (
        <>
          {/* ── Producto a Analizar ─────────────────────────────── */}
          <div className="section-title">Producto a analizar</div>
          <div className="mx-4">
            {products.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {products.map((product, idx) => (
                  <button
                    key={product.hs_code || product.id || String(idx)}
                    type="button"
                    onClick={() => { setSelectedIdx(idx); setEditingHsId(null); }}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      idx === effectiveIdx
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {product.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSetupOpen(true)}
                  className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <PackagePlus size={12} />
                  Agregar
                </button>
              </div>
            ) : (
              <div className="content-card">
                <p className="text-sm font-bold text-card-foreground">Sin productos configurados</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Agrega tus productos exportables para ver análisis de mercado.
                </p>
                <button
                  type="button"
                  onClick={() => setSetupOpen(true)}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
                >
                  <PackagePlus size={14} />
                  Agregar producto
                </button>
              </div>
            )}

            {/* Partida arancelaria + edit */}
            {selectedProduct && !isEditingCurrentProduct && (
              <div className="mt-3 content-card">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Hash size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                      Partida arancelaria (Código HS)
                    </p>
                    <p className="text-xl font-extrabold tracking-tight text-card-foreground">
                      {selectedProduct.hs_code}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-card-foreground">
                      {selectedProduct.name}
                    </p>
                    {selectedProduct.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {selectedProduct.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingHsId(selectedProduct.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Editar partida arancelaria"
                    title="Editar partida arancelaria"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
                <div className="mt-3 rounded-lg bg-secondary p-2.5">
                  <p className="text-[0.7rem] text-secondary-foreground">
                    💡 Este código identifica tu producto en aduanas a nivel mundial. Lo necesitas para todos tus trámites de exportación.
                  </p>
                </div>
              </div>
            )}

            {/* HS classify panel */}
            {selectedProduct && isEditingCurrentProduct && (
              <ClassifyPanel
                product={selectedProduct}
                onSaved={() => { setEditingHsId(null); void refreshToken(); }}
                onCancel={() => setEditingHsId(null)}
              />
            )}

            {/* Country manager */}
            {selectedProduct && !isEditingCurrentProduct && (
              <CountryManagerSection
                destCountries={destCountries}
                onRefresh={() => void refreshToken()}
              />
            )}
          </div>

          {selectedProduct && !isEditingCurrentProduct && (
            <>
              {/* ── 2. ¿A cuánto lo están vendiendo? ─────────────── */}
              <div className="section-title mt-4">2. ¿A cuánto lo están vendiendo?</div>
              {destCountries.length > 0 ? (
                <div className="mx-4 space-y-2">
                  {destCountries.map((c) => (
                    <CountryPriceCard
                      key={c.country_code}
                      hsCode={selectedProduct.hs_code.replace(/\D/g, "")}
                      country={c}
                    />
                  ))}
                </div>
              ) : (
                <div className="content-card mx-4">
                  <p className="text-xs text-muted-foreground">
                    Agrega países destino en la sección anterior para ver la estimación de precios por mercado.
                  </p>
                </div>
              )}

              {/* ── 3. ¿Dónde lo puedo vender? ───────────────────── */}
              <div className="section-title mt-4">
                3. ¿Dónde lo puedo vender? — Inteligencia de mercados
              </div>
              <MarketIntelligenceChart
                opportunities={opportunities}
                isLoading={opportunitiesLoading}
                hsCode={selectedProduct.hs_code.replace(/\D/g, "")}
              />
              <div className="content-card mx-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Globe size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-card-foreground">Top países importadores</p>
                    <p className="text-xs text-muted-foreground">Ranking por participación de mercado global</p>
                  </div>
                </div>

                {dataLoading && <p className="py-2 text-xs text-muted-foreground">Consultando WTO Timeseries…</p>}

                {!dataLoading && markets.length === 0 && (
                  <p className="py-2 text-xs text-muted-foreground">Sin datos de mercados disponibles.</p>
                )}

                {!dataLoading && markets.length > 0 && (
                  <>
                    <div className="space-y-2">
                      {markets.map((m, i) => (
                        <div
                          key={m.reporter_code}
                          className="flex items-center gap-3 rounded-lg border border-border bg-background p-2.5"
                        >
                          <span className="w-5 text-[0.7rem] font-extrabold text-muted-foreground">#{i + 1}</span>
                          <span className="text-xl">{countryFlag(m.reporter)}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-card-foreground">{m.reporter}</p>
                            <p className="text-[0.7rem] text-muted-foreground">{formatUsd(m.import_value)} importado</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-extrabold text-primary">
                              CAGR {m.cagr > 0 ? "+" : ""}{m.cagr}%
                            </p>
                            <div className="flex items-center justify-end gap-1 text-[0.65rem] text-muted-foreground">
                              {trendIcon[m.trend]} {trendLabel[m.trend]}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {markets[0] && (
                      <div
                        className="mt-3 rounded-lg p-3"
                        style={{ background: "linear-gradient(135deg, oklch(0.95 0.04 295), oklch(0.93 0.06 320))" }}
                      >
                        <p className="text-xs font-bold text-primary">🎯 Recomendación ExportIA</p>
                        <p className="mt-1 text-[0.7rem] leading-relaxed text-card-foreground">
                          <span className="font-bold">{markets[0].reporter}</span> lidera el crecimiento con un CAGR de {markets[0].cagr > 0 ? "+" : ""}{markets[0].cagr}% y tendencia {trendLabel[markets[0].trend].toLowerCase()}. Es tu mejor punto de partida.
                        </p>
                        <p className="mt-1 text-[0.65rem] text-muted-foreground">Fuente: WTO Timeseries · HS {productParam} · Datos anuales.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}

      <ProfileSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onCompleted={refreshToken}
        title="Agregar productos y mercados"
      />
    </div>
  );
}
