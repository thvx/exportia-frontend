import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Globe, Loader2, Zap, Package, BarChart2, Shield } from "lucide-react";
import {
  Treemap,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
  ComposedChart, Bar, Line, CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { RamRequirementsModal } from "../components/RamRequirementsModal";
import { useAuth } from "../lib/auth/AuthContext";
import { useProductPotentialMarkets } from "../lib/api/hooks/useMarkets";
import {
  useTopImporters,
  useTopImportedProducts,
} from "../lib/api/hooks/useComtrade";
import { useFacilityScores } from "../lib/wto/hooks";
import { useRamRequirements } from "../lib/api/hooks/useRam";
import { countryFlag, formatUsd } from "../lib/utils";
import type { PotentialMarket } from "../types/markets";
import type { TradePartner, TradeProduct } from "../lib/api/comtradeApi";

export const Route = createFileRoute("/mercados")({
  component: MercadosPage,
  head: () => ({
    meta: [
      { title: "Mercados — ExportIA" },
      { name: "description", content: "Inteligencia de mercados para exportadores." },
    ],
  }),
});

// ── Palettes ──────────────────────────────────────────────────────────────
const INDIGO   = ["#312e81","#3730a3","#4338ca","#4f46e5","#6366f1","#818cf8","#a5b4fc","#c7d2fe"];
const EMERALD  = ["#064e3b","#065f46","#047857","#059669","#10b981","#34d399","#6ee7b7","#a7f3d0"];
const SUPPLIER = ["#4f46e5","#7c3aed","#db2777","#dc2626","#d97706","#059669","#0284c7","#64748b"];

const COMTRADE_YEAR = new Date().getFullYear() - 2;

// ── Utilities ─────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function axisUsd(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(0)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v}`;
}

type Signal = "green" | "yellow" | "red";
function marketSignal(m: PotentialMarket): { signal: Signal; label: string } {
  if (m.trend === "rising" && m.cagr >= 3) return { signal: "green",  label: "Alta oportunidad" };
  if (m.trend === "rising" && m.cagr >= 0) return { signal: "green",  label: "Oportunidad" };
  if (m.trend === "stable")                return { signal: "yellow", label: "Mercado estable" };
  return                                          { signal: "red",    label: "Tendencia negativa" };
}
const badgeCls: Record<Signal, string> = {
  green: "badge-green", yellow: "badge-yellow", red: "badge-red",
};

// ══════════════════════════════════════════════════════════════════════════
// Data-driven insight generators (pure functions, no AI)
// ══════════════════════════════════════════════════════════════════════════

function insightBloque2(
  radar: Array<{ dim: string; v: number }>,
  destName: string,
  destWto?: PotentialMarket
): string {
  if (!radar.length) return "";
  const overall  = Math.round(radar.reduce((s, d) => s + d.v, 0) / radar.length);
  const weakest  = radar.reduce((a, b) => (a.v < b.v ? a : b));
  const strongest = radar.reduce((a, b) => (a.v > b.v ? a : b));
  const qualLabel = overall >= 70 ? "muy atractivo" : overall >= 50 ? "moderadamente atractivo" : "desafiante";
  const parts: string[] = [
    `${destName} es un mercado ${qualLabel} (${overall}/100 en nuestra evaluación).`,
    `Su punto más fuerte es ${strongest.dim.toLowerCase()} (${strongest.v}/100).`,
  ];
  if (weakest.dim === "Acceso") {
    parts.push(
      `El principal obstáculo es el acceso (${weakest.v}/100): la competencia ya establecida ` +
      `domina gran parte del mercado — diferenciarse por precio, calidad o servicio postventa es clave.`
    );
  } else if (weakest.dim === "Facilidad") {
    parts.push(
      `La entrada requiere más trámites que otros mercados (Facilidad: ${weakest.v}/100). ` +
      `Asegúrate de tener toda la documentación antes de negociar.`
    );
  } else if (weakest.dim === "Crecimiento") {
    parts.push(
      `El crecimiento es lento (${weakest.v}/100). El volumen puede ser alto, pero el mercado ` +
      `está maduro — la cuota de mercado se gana quitándosela a competidores.`
    );
  } else if (weakest.dim === "Tamaño") {
    parts.push(
      `Es un mercado pequeño en volumen absoluto (Tamaño: ${weakest.v}/100), ideal como ` +
      `primer destino por su menor presión competitiva.`
    );
  }
  if (destWto?.trend === "rising" && destWto.cagr >= 3) {
    parts.push(`La demanda crece a +${destWto.cagr}% anual (WTO) — señal positiva para entrar ahora.`);
  }
  return parts.join(" ");
}

function insightBloque3(
  importers: TradePartner[], destName: string, hsLabel: string
): string {
  if (!importers.length) return "";
  const top      = importers[0];
  const top3     = Math.round(importers.slice(0, 3).reduce((s, t) => s + t.share, 0));
  const remaining = Math.max(0, Math.round(100 - importers.reduce((s, t) => s + t.share, 0)));
  const parts: string[] = [
    `En ${destName}, ${top.country} lidera las importaciones de ${hsLabel} con el ${top.share}% del mercado.`,
  ];
  if (top3 >= 80) {
    parts.push(
      `Mercado altamente concentrado: los 3 principales proveedores controlan el ${top3}%. ` +
      `Para competir, la diferenciación es imprescindible — precio, certificaciones o condiciones de pago.`
    );
  } else if (top3 >= 55) {
    parts.push(
      `Los 3 principales acaparan el ${top3}%, pero hay un ${100 - top3}% de mercado accesible ` +
      `para nuevos proveedores bien posicionados.`
    );
  } else {
    parts.push(
      `El mercado está abierto: los 3 principales solo concentran el ${top3}%. ` +
      `Condiciones favorables para un nuevo exportador.`
    );
  }
  if (remaining > 12) {
    parts.push(
      `Hay un ${remaining}% del mercado no cubierto por los actores principales — ventana de oportunidad real.`
    );
  }
  return parts.join(" ");
}

function insightBloque5(
  data: Array<{ name: string; value: number; cagr: number; trend: string }>
): string {
  if (!data.length) return "";
  const byValue  = [...data].sort((a, b) => b.value - a.value)[0];
  const byGrowth = [...data].filter(d => d.cagr > 0).sort((a, b) => b.cagr - a.cagr)[0];
  const declining = data.filter(d => d.trend === "declining");
  const parts: string[] = [
    `${byValue.name} es el mayor importador con ${formatUsd(byValue.value)} (barra más alta).`,
  ];
  if (byGrowth && byGrowth.name !== byValue.name) {
    parts.push(
      `${byGrowth.name} lidera en crecimiento (+${byGrowth.cagr}% CAGR, línea verde) ` +
      `aunque su volumen actual es menor — puede ser más accesible para un primer exportador.`
    );
  } else if (byGrowth) {
    parts.push(`Además lidera en crecimiento con CAGR +${byGrowth.cagr}%.`);
  }
  if (declining.length > 0) {
    const names = declining.slice(0, 2).map(d => d.name).join(" y ");
    parts.push(
      `${names} ${declining.length > 1 ? "muestran" : "muestra"} tendencia negativa (barras rojas) — ` +
      `evalúa si el volumen actual justifica el esfuerzo.`
    );
  }
  return parts.join(" ");
}

function insightBloque6(
  products: TradeProduct[], destName: string, hsLabel: string
): string {
  if (!products.length) return "";
  const top  = products[0];
  const top3 = Math.round(products.slice(0, 3).reduce((s, p) => s + p.share, 0));
  return (
    `${destName} importa principalmente ${top.product.toLowerCase()} ` +
    `(${top.share}% de su canasta total de importaciones). ` +
    `Las 3 categorías dominantes representan el ${top3}% de lo que compra externamente. ` +
    `Si ${hsLabel} encaja en alguna de estas categorías, el volumen de compradores potenciales ya está validado.`
  );
}

// ══════════════════════════════════════════════════════════════════════════
// UI components
// ══════════════════════════════════════════════════════════════════════════

function Skel({ h = 200 }: { h?: number }) {
  return <div className="w-full rounded-lg bg-muted animate-pulse" style={{ height: h }} />;
}

function ShareBar({ pct, color = "#6366f1" }: { pct: number; color?: string }) {
  return (
    <div className="w-full rounded-full overflow-hidden bg-muted" style={{ height: 4 }}>
      <div className="h-full rounded-full" style={{ width: `${clamp(pct, 0, 100)}%`, background: color }} />
    </div>
  );
}

function InsightBox({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="mt-3 rounded-lg border-l-[3px] border-primary/40 bg-primary/5 px-3 py-2.5">
      <p className="text-xs text-card-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function SectionHeader({ icon, title, sub }: {
  icon: React.ReactNode; title: string; sub?: string;
}) {
  return (
    <div className="flex items-start gap-2 mb-3">
      <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
      <div>
        <p className="text-sm font-bold text-card-foreground">{title}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Treemap tile ──────────────────────────────────────────────────────────
interface TileProps {
  x?: number; y?: number; width?: number; height?: number;
  name?: string; share?: number; rank?: number; palette?: string[];
}
function TreemapTile({ x=0, y=0, width=0, height=0, name="", share=0, rank=0, palette=INDIGO }: TileProps) {
  if (width < 4 || height < 4) return null;
  const fill  = palette[Math.min(rank, palette.length - 1)] ?? palette[palette.length - 1];
  const light = rank >= palette.length - 3;
  const fg    = light ? "#1e1b4b" : "#fff";
  const maxCh = Math.max(3, Math.floor(width / 7));
  const label = name.length > maxCh ? name.slice(0, maxCh - 1) + "…" : name;
  return (
    <g>
      <rect x={x+1} y={y+1} width={Math.max(0,width-2)} height={Math.max(0,height-2)} fill={fill} rx={3} />
      {width > 44 && height > 22 && (
        <text x={x+6} y={y+16} fill={fg} fontSize={11} fontWeight={600} style={{ pointerEvents: "none" }}>{label}</text>
      )}
      {width > 44 && height > 34 && (
        <text x={x+6} y={y+28} fill={fg} fontSize={10} opacity={0.8} style={{ pointerEvents: "none" }}>{share}%</text>
      )}
    </g>
  );
}

// ── Tooltips ──────────────────────────────────────────────────────────────
function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-bold">{countryFlag(d.name)} {d.name}</p>
      <p className="text-muted-foreground">Cuota: <span className="font-semibold text-primary">{d.value}%</span></p>
    </div>
  );
}
function DualAxisTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name === "value" ? "Importado: " : "CAGR: "}
          <span className="font-semibold">
            {p.name === "value" ? formatUsd(p.value) : `${p.value > 0 ? "+" : ""}${p.value}%`}
          </span>
        </p>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Page
// ══════════════════════════════════════════════════════════════════════════
function MercadosPage() {
  const { user } = useAuth();
  const [selectedIdx,     setSelectedIdx]     = useState(0);
  const [selectedDestIdx, setSelectedDestIdx] = useState(0);

  const products      = user?.products ?? [];
  const destCountries = user?.destination_countries ?? [];

  const effectiveIdx     = Math.min(selectedIdx,     Math.max(0, products.length - 1));
  const effectiveDestIdx = Math.min(selectedDestIdx, Math.max(0, destCountries.length - 1));
  const selectedProduct  = products[effectiveIdx];
  const selectedDest     = destCountries[effectiveDestIdx];

  const rawHsCode = selectedProduct?.hs_code ?? "0901110000";
  const hs4       = rawHsCode.replace(/\D/g, "").slice(0, 4);
  const hsLabel   = selectedProduct ? `HS ${hs4} · ${selectedProduct.name}` : `HS ${hs4}`;
  const destCode  = selectedDest?.country_code;

  // ── Queries ────────────────────────────────────────────────────────────
  const { data: marketsData,  isLoading: marketsLoading  } = useProductPotentialMarkets(hs4, 12);
  const { data: facilityData, isLoading: facilityLoading } = useFacilityScores();
  const { data: importersRes, isLoading: importersLoading} = useTopImporters(destCode, rawHsCode, 7);
  const { data: productsRes,  isLoading: productsLoading } = useTopImportedProducts(destCode, 10);
  const { data: ramRes,       isLoading: ramLoading       } = useRamRequirements(
    selectedProduct ? rawHsCode : undefined,
    selectedDest?.country_name
  );

  const allMarkets:    PotentialMarket[]   = marketsData?.data   ?? [];
  const facilityScores                     = facilityData?.scores ?? [];
  const topImporters:  TradePartner[]      = importersRes?.data   ?? [];
  const topProducts:   TradeProduct[]      = productsRes?.data    ?? [];

  const radarData = useMemo(() => {
    if (!selectedDest) return [];
    const lower = selectedDest.country_name.toLowerCase();
    const wto   = allMarkets.find(m => { const r = m.reporter.toLowerCase(); return r.includes(lower) || lower.includes(r); });
    const fac   = facilityScores.find(f => { const c = f.country.toLowerCase(); return c.includes(lower) || lower.includes(c); });
    const maxV  = Math.max(...allMarkets.map(m => m.import_value), 1);
    const top3  = topImporters.slice(0, 3).reduce((s, t) => s + t.share, 0);
    return [
      { dim: "Tamaño",      v: wto ? Math.round(Math.log1p(wto.import_value) / Math.log1p(maxV) * 100) : 20,    fullMark: 100 },
      { dim: "Crecimiento", v: wto ? Math.round(clamp(50 + wto.cagr * 5, 0, 100)) : 50,                         fullMark: 100 },
      { dim: "Facilidad",   v: fac ? (fac.signal === "green" ? 82 : fac.signal === "yellow" ? 55 : 28) : 50,    fullMark: 100 },
      { dim: "Acceso",      v: topImporters.length > 0 ? Math.round(clamp(100 - top3, 0, 100)) : 50,            fullMark: 100 },
    ];
  }, [selectedDest, allMarkets, facilityScores, topImporters]);

  const dualAxisData = useMemo(() =>
    [...allMarkets]
      .sort((a, b) => b.import_value - a.import_value)
      .slice(0, 8)
      .map(m => ({
        name:  m.reporter.length > 9 ? m.reporter.slice(0, 8) + "…" : m.reporter,
        value: m.import_value, cagr: m.cagr, trend: m.trend,
      })),
  [allMarkets]);

  const productsTreemap = topProducts.map((p, i) => ({
    name: p.product.length > 30 ? p.product.slice(0, 29) + "…" : p.product,
    full: p.product, size: p.value_usd, share: p.share, rank: i,
  }));

  const destFacility = useMemo(() => {
    if (!selectedDest) return undefined;
    const lower = selectedDest.country_name.toLowerCase();
    return facilityScores.find(f => { const c = f.country.toLowerCase(); return c.includes(lower) || lower.includes(c); });
  }, [selectedDest, facilityScores]);

  const destWto = useMemo(() => {
    if (!selectedDest) return undefined;
    const lower = selectedDest.country_name.toLowerCase();
    return allMarkets.find(m => { const r = m.reporter.toLowerCase(); return r.includes(lower) || lower.includes(r); });
  }, [selectedDest, allMarkets]);

  const destSig      = destWto ? marketSignal(destWto) : undefined;
  const top1Dominant = topImporters.length > 0 && topImporters[0].share >= 50;
  const isDestLoading = importersLoading || productsLoading || facilityLoading || marketsLoading;

  // ── Pre-computed insight strings ──────────────────────────────────────
  const insight2 = useMemo(() => insightBloque2(radarData, selectedDest?.country_name ?? "", destWto),
    [radarData, selectedDest, destWto]);
  const insight3 = useMemo(() => insightBloque3(topImporters, selectedDest?.country_name ?? "", hsLabel),
    [topImporters, selectedDest, hsLabel]);
  const insight5 = useMemo(() => insightBloque5(dualAxisData), [dualAxisData]);
  const insight6 = useMemo(() => insightBloque6(topProducts, selectedDest?.country_name ?? "", hsLabel),
    [topProducts, selectedDest, hsLabel]);

  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="app-shell">
      <div className="page-header">
        <h1 className="page-title">🌎 Mercados</h1>
        <p className="page-subtitle">Inteligencia de mercados para exportadores</p>
      </div>

      {/* Product tabs */}
      <div className="mx-4 mb-3">
        {products.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {products.map((p, idx) => (
              <button key={p.id ?? p.hs_code} type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  idx === effectiveIdx
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}>
                {p.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Sin productos configurados.{" "}
            <Link to="/productos" className="font-semibold text-primary">Agregar →</Link>
          </p>
        )}
      </div>

      {/* ══ BLOQUE 2 — Mis Mercados Objetivo ═════════════════════════════ */}
      <div className="content-card">
        <SectionHeader
          icon={<BarChart2 size={14} />}
          title="Mis Mercados Objetivo"
          sub="Evaluación multi-dimensional por país destino"
        />

        {destCountries.length === 0 ? (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Globe size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-card-foreground">Sin países destino configurados</p>
              <p className="mt-1 text-xs text-muted-foreground">Agrega países destino en tu perfil para ver la evaluación.</p>
              <Link to="/productos" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary">
                Configurar países <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {destCountries.map((c, idx) => (
                <button key={c.country_code} type="button"
                  onClick={() => setSelectedDestIdx(idx)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    idx === effectiveDestIdx
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}>
                  {countryFlag(c.country_name)} {c.country_name}
                </button>
              ))}
            </div>

            {selectedDest && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{countryFlag(selectedDest.country_name)}</span>
                  <div className="flex-1">
                    <p className="font-bold text-card-foreground">{selectedDest.country_name}</p>
                    {destWto ? (
                      <p className="text-xs text-muted-foreground">
                        {formatUsd(destWto.import_value)} importado de {hsLabel} · CAGR {destWto.cagr > 0 ? "+" : ""}{destWto.cagr}%
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Sin datos WTO para este producto</p>
                    )}
                  </div>
                  {destSig && <span className={badgeCls[destSig.signal]}>{destSig.label}</span>}
                </div>

                <div className="md:grid md:grid-cols-2 md:gap-4">
                  {/* Radar */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Evaluación del mercado (0–100)</p>
                    {isDestLoading ? <Skel h={180} /> : radarData.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={180}>
                          <RadarChart data={radarData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                            <PolarGrid stroke="var(--border, #e5e7eb)" />
                            <PolarAngleAxis dataKey="dim"
                              tick={{ fontSize: 11, fill: "var(--muted-foreground, #888)" }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar dataKey="v" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25}
                              strokeWidth={2} dot={{ r: 3, fill: "#6366f1" }} />
                            <Tooltip formatter={(v: number) => [`${v}/100`, "Puntuación"]}
                              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }} />
                          </RadarChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
                          {radarData.map(d => (
                            <div key={d.dim} className="flex items-center justify-between">
                              <span className="text-[0.65rem] text-muted-foreground">{d.dim}</span>
                              <span className="text-[0.65rem] font-semibold text-primary">{d.v}/100</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : <p className="text-xs text-muted-foreground">Sin datos.</p>}
                  </div>

                  {/* Facility + WTO */}
                  <div className="mt-4 md:mt-0 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Facilidad de entrada</p>
                      {facilityLoading ? <Skel h={80} /> : destFacility ? (
                        <div className="rounded-lg border border-border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-card-foreground">{destFacility.label}</span>
                            <span className={badgeCls[destFacility.signal as Signal]}>
                              {destFacility.signal === "green" ? "Fácil" : destFacility.signal === "yellow" ? "Moderado" : "Complejo"}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            {[
                              { l: "Documentos", v: destFacility.documentsCount },
                              { l: "Tiempo",     v: destFacility.estimatedDays  },
                              { l: "Complejidad", v: destFacility.complexity    },
                            ].map(({ l, v }) => (
                              <div key={l}>
                                <p className="text-[0.65rem] text-muted-foreground">{l}</p>
                                <p className="text-xs font-bold text-card-foreground">{v}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : <p className="text-xs text-muted-foreground">Sin datos de facilidad.</p>}
                    </div>

                    {destWto && (
                      <div className="rounded-lg border border-border p-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Tendencia WTO</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {[
                            { l: "Tendencia", v: destWto.trend === "rising" ? "↑ Subiendo" : destWto.trend === "declining" ? "↓ Bajando" : "→ Estable",
                              cls: destWto.trend === "rising" ? "text-signal-green" : destWto.trend === "declining" ? "text-signal-red" : "text-amber-500" },
                            { l: "CAGR", v: `${destWto.cagr > 0 ? "+" : ""}${destWto.cagr}%`,
                              cls: destWto.cagr >= 0 ? "text-signal-green" : "text-signal-red" },
                            { l: "Últ. año", v: `${destWto.growth_rate > 0 ? "+" : ""}${destWto.growth_rate}%`,
                              cls: destWto.growth_rate >= 0 ? "text-signal-green" : "text-signal-red" },
                          ].map(({ l, v, cls }) => (
                            <div key={l}>
                              <p className="text-[0.65rem] text-muted-foreground">{l}</p>
                              <p className={`text-xs font-bold ${cls}`}>{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <InsightBox text={insight2} />

                {/* ── Requisitos de Entrada al Mercado (RAM Promperú) ── */}
                <div className="mt-4 rounded-lg border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-xs font-semibold text-card-foreground">Requisitos de Entrada al Mercado</p>
                      <p className="text-[0.65rem] text-muted-foreground mt-0.5">
                        Normativas, certificaciones y documentos exigidos por {selectedDest.country_name} para importar este producto.
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[0.6rem] font-bold text-primary">
                      RAM Promperú
                    </span>
                  </div>
                  {ramLoading ? (
                    <div className="flex items-center gap-2 py-1">
                      <Loader2 size={13} className="animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Consultando RAM Promperú…</span>
                    </div>
                  ) : ramRes?.data?.hasData ? (
                    <RamRequirementsModal
                      data={ramRes.data}
                      countryName={selectedDest.country_name}
                      openKey={selectedIdx}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Sin datos de requisitos disponibles en RAM Promperú para este producto y país.
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}
        <p className="text-[0.6rem] text-muted-foreground mt-3">
          Dimensiones del radar — Tamaño y Crecimiento: WTO · Facilidad: WTO TFAD · Acceso: 100 − cuota top‑3 proveedores (Comtrade)
        </p>
      </div>

      {/* ══ BLOQUE 3 — Competencia ════════════════════════════════════════ */}
      {selectedDest && (
        <div className="content-card">
          <SectionHeader
            icon={<Shield size={14} />}
            title={`Competencia en ${selectedDest.country_name}`}
            sub={`Quién ya exporta ${hsLabel} a este mercado`}
          />

          {importersLoading ? <Skel h={200} /> : topImporters.length > 0 ? (
            <>
              {top1Dominant && (
                <div className="mb-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    ⚠️ Mercado concentrado: {topImporters[0].country} controla el {topImporters[0].share}% — estrategia de diferenciación recomendada.
                  </p>
                </div>
              )}

              {/* Stacked bar */}
              <div className="flex h-8 w-full rounded-lg overflow-hidden gap-px mb-3">
                {topImporters.map((s, i) => (
                  <div key={i} className="h-full flex items-center justify-center overflow-hidden"
                    style={{ width: `${s.share}%`, background: SUPPLIER[i % SUPPLIER.length] }}
                    title={`${s.country}: ${s.share}%`}>
                    {s.share > 9 && (
                      <span className="text-[0.5rem] text-white font-bold px-0.5 truncate">
                        {s.country.split(" ")[0]}
                      </span>
                    )}
                  </div>
                ))}
                <div className="flex-1 h-full bg-muted flex items-center justify-center min-w-0">
                  <span className="text-[0.5rem] text-muted-foreground px-1 truncate">Otros</span>
                </div>
              </div>

              {/* List */}
              <div className="space-y-2 mb-4">
                {topImporters.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[0.65rem] text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <span className="text-xs text-card-foreground w-28 truncate shrink-0">
                      {countryFlag(s.country)} {s.country}
                    </span>
                    <div className="flex-1"><ShareBar pct={s.share} color={SUPPLIER[i % SUPPLIER.length]} /></div>
                    <span className="text-xs font-semibold shrink-0 w-10 text-right"
                      style={{ color: SUPPLIER[i % SUPPLIER.length] }}>{s.share}%</span>
                    <span className="text-[0.65rem] text-muted-foreground shrink-0 w-16 text-right">
                      {formatUsd(s.value_usd)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Donut */}
              <div className="flex items-center gap-4">
                <div className="shrink-0" style={{ width: 140, height: 140 }}>
                  <PieChart width={140} height={140}>
                    <Pie data={topImporters.map(s => ({ name: s.country, value: s.share }))}
                      dataKey="value" cx={70} cy={70}
                      innerRadius={38} outerRadius={60} paddingAngle={2} isAnimationActive={false}>
                      {topImporters.map((_, i) => <Cell key={i} fill={SUPPLIER[i % SUPPLIER.length]} />)}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </div>
                <div className="flex-1 space-y-1.5">
                  <p className="text-xs font-semibold text-card-foreground">Cuota de mercado</p>
                  {topImporters.slice(0, 4).map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: SUPPLIER[i] }} />
                      <span className="text-[0.65rem] text-card-foreground truncate flex-1">{s.country}</span>
                      <span className="text-[0.65rem] font-bold" style={{ color: SUPPLIER[i] }}>{s.share}%</span>
                    </div>
                  ))}
                  {topImporters.length > 4 && (
                    <p className="text-[0.6rem] text-muted-foreground">+{topImporters.length - 4} más</p>
                  )}
                </div>
              </div>

              <InsightBox text={insight3} />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Sin datos de competencia disponibles.</p>
          )}
          <p className="text-[0.6rem] text-muted-foreground mt-3">Fuente: UN Comtrade · {COMTRADE_YEAR}</p>
        </div>
      )}

      {/* ══ BLOQUE 5 — Mercados Dinámicos ════════════════════════════════ */}
      {(marketsLoading || dualAxisData.length > 0) && (
        <div className="content-card">
          <SectionHeader
            icon={<Zap size={14} />}
            title="Mercados Dinámicos"
            sub={`Tamaño vs. crecimiento — ${hsLabel}`}
          />

          {marketsLoading ? <Skel h={220} /> : dualAxisData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={dualAxisData} margin={{ top: 4, right: 32, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #f0f0f0)" vertical={false} />
                  <XAxis dataKey="name"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground, #888)" }}
                    axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tickFormatter={axisUsd}
                    tick={{ fontSize: 9, fill: "var(--muted-foreground, #888)" }}
                    axisLine={false} tickLine={false} width={42} />
                  <YAxis yAxisId="right" orientation="right" unit="%"
                    tick={{ fontSize: 9, fill: "#10b981" }}
                    axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<DualAxisTooltip />} />
                  <Bar yAxisId="left" dataKey="value" name="value"
                    radius={[4,4,0,0]} isAnimationActive={false}>
                    {dualAxisData.map((d, i) => (
                      <Cell key={i}
                        fill={d.trend === "rising" ? "#6366f1" : d.trend === "declining" ? "#f87171" : "#94a3b8"} />
                    ))}
                  </Bar>
                  <Line yAxisId="right" dataKey="cagr" name="cagr" type="monotone"
                    stroke="#10b981" strokeWidth={2}
                    dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="mt-2 flex items-center gap-4 text-[0.65rem] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-indigo-500" /> Valor importado (eje izq.)
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-1 rounded-full bg-emerald-500" /> CAGR % (eje der.)
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-rose-400" /> Tendencia negativa
                </span>
              </div>
              <InsightBox text={insight5} />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Sin datos de tendencias.</p>
          )}
          <p className="text-[0.6rem] text-muted-foreground mt-2">Fuente: WTO Timeseries · Barras: valor importado · Línea: CAGR</p>
        </div>
      )}

      {/* ══ BLOQUE 6 — Productos más demandados ══════════════════════════ */}
      {selectedDest && (
        <div className="content-card">
          <SectionHeader
            icon={<Package size={14} />}
            title={`Productos más demandados — ${selectedDest.country_name}`}
            sub="Top categorías HS importadas · Oportunidades de diversificación"
          />

          {productsLoading ? <Skel h={240} /> : productsTreemap.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <Treemap data={productsTreemap} dataKey="size" stroke="transparent"
                  isAnimationActive={false} content={<TreemapTile palette={EMERALD} />}>
                  <Tooltip content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md max-w-[200px]">
                        <p className="font-bold text-card-foreground mb-0.5 leading-snug">{d.full}</p>
                        <p className="text-muted-foreground">Valor: <span className="font-semibold text-primary">{formatUsd(d.size)}</span></p>
                        <p className="text-muted-foreground">Cuota: <span className="font-semibold">{d.share}%</span></p>
                      </div>
                    );
                  }} />
                </Treemap>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {productsTreemap.slice(0, 5).map((d, i) => (
                  <span key={i} className="flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                    <span className="inline-block w-2 h-2 rounded-sm" style={{ background: EMERALD[i] }} />
                    {d.name} · {d.share}%
                  </span>
                ))}
              </div>
              <InsightBox text={insight6} />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Sin datos disponibles.</p>
          )}
          <p className="text-[0.6rem] text-muted-foreground mt-3">Fuente: UN Comtrade · {COMTRADE_YEAR}</p>
        </div>
      )}
    </div>
  );
}
