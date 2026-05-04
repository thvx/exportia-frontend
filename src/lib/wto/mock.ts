// Mock data used as a fallback when the WTO APIs are unreachable
// or while the integration is being developed. The shape mirrors
// exactly what the server functions return.

import type {
  EpingAlert,
  QuantitativeRestriction,
  MarketTrend,
  FacilityScore,
  InternationalEvent,
} from "./types";

export const mockEpingAlerts: EpingAlert[] = [
  {
    id: "eping-1",
    country: "EE.UU.",
    countryFlag: "🇺🇸",
    title: "Nuevo requisito sanitario en EE.UU.",
    description:
      "Se requiere certificado fitosanitario adicional para café y productos orgánicos.",
    measureType: "SPS",
    severity: "warning",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    productKeywords: ["café", "orgánico"],
  },
  {
    id: "eping-2",
    country: "Japón",
    countryFlag: "🇯🇵",
    title: "Actualización de normas técnicas en Japón",
    description:
      "Nuevos estándares de etiquetado para alimentos importados vigentes desde abril.",
    measureType: "TBT",
    severity: "info",
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    productKeywords: ["alimentos"],
  },
  {
    id: "eping-3",
    country: "México",
    countryFlag: "🇲🇽",
    title: "Cambio arancelario en México",
    description:
      "Incremento temporal de aranceles para productos electrónicos importados.",
    measureType: "TBT",
    severity: "warning",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    productKeywords: ["electrónica"],
  },
];

export const mockQuantitativeRestrictions: QuantitativeRestriction[] = [
  {
    id: "qr-1",
    country: "India",
    countryFlag: "🇮🇳",
    productCategory: "Textiles",
    restrictionType: "quota",
    description:
      "Cuota reducida para textiles. Afecta exportadores de ropa y accesorios.",
    legalBasis: "WTO Agreement on Safeguards, Art. 5",
    signal: "red",
  },
  {
    id: "qr-2",
    country: "Chile",
    countryFlag: "🇨🇱",
    productCategory: "Alimentos procesados",
    restrictionType: "license",
    description: "Importación limitada bajo régimen de licencia previa.",
    legalBasis: "WTO Import Licensing Agreement",
    signal: "red",
  },
];

export const mockMarketTrends: MarketTrend[] = [
  {
    country: "Canadá",
    countryFlag: "🇨🇦",
    signal: "green",
    trend: "up",
    label: "Alta demanda",
    subtitle: "📈 Creciendo — Buen mercado para entrar",
    opportunityScore: 87,
  },
  {
    country: "México",
    countryFlag: "🇲🇽",
    signal: "yellow",
    trend: "stable",
    label: "Estable",
    subtitle: "➡️ Demanda sin cambios significativos",
    opportunityScore: 58,
  },
  {
    country: "Japón",
    countryFlag: "🇯🇵",
    signal: "red",
    trend: "down",
    label: "Bajando",
    subtitle: "📉 Demanda disminuyendo",
    opportunityScore: 32,
  },
  {
    country: "Alemania",
    countryFlag: "🇩🇪",
    signal: "green",
    trend: "up",
    label: "Alta demanda",
    subtitle: "📈 Sector orgánico en crecimiento",
    opportunityScore: 81,
  },
  {
    country: "Brasil",
    countryFlag: "🇧🇷",
    signal: "yellow",
    trend: "stable",
    label: "Estable",
    subtitle: "➡️ Mercado maduro y competido",
    opportunityScore: 54,
  },
];

export const mockFacilityScores: FacilityScore[] = [
  { country: "Canadá", countryFlag: "🇨🇦", signal: "green", label: "Fácil", documentsCount: 3, estimatedDays: "5 días", complexity: "Baja" },
  { country: "México", countryFlag: "🇲🇽", signal: "green", label: "Fácil", documentsCount: 4, estimatedDays: "7 días", complexity: "Baja" },
  { country: "EE.UU.", countryFlag: "🇺🇸", signal: "yellow", label: "Medio", documentsCount: 6, estimatedDays: "12 días", complexity: "Media" },
  { country: "Japón", countryFlag: "🇯🇵", signal: "red", label: "Difícil", documentsCount: 10, estimatedDays: "25 días", complexity: "Alta" },
  { country: "India", countryFlag: "🇮🇳", signal: "red", label: "Difícil", documentsCount: 12, estimatedDays: "30 días", complexity: "Alta" },
];

export const mockInternationalEvents: InternationalEvent[] = [
  {
    id: "evt-1",
    icon: "🌐",
    title: "Cumbre G20 en Sudáfrica",
    description:
      "Se discuten nuevos acuerdos comerciales multilaterales que podrían reducir aranceles para productos agrícolas.",
    date: "Abr 2026",
    impact: "positive",
  },
  {
    id: "evt-2",
    icon: "⛽",
    title: "Crisis logística en el Mar Rojo",
    description:
      "Disrupciones en rutas marítimas incrementan costos de envío a Europa y Asia en un 35%.",
    date: "Mar 2026",
    impact: "negative",
  },
  {
    id: "evt-3",
    icon: "🤝",
    title: "Nuevo TLC Perú-Reino Unido",
    description:
      "Entrada en vigor del tratado de libre comercio. Aranceles reducidos para textiles y alimentos.",
    date: "Abr 2026",
    impact: "positive",
  },
  {
    id: "evt-4",
    icon: "📉",
    title: "Desaceleración económica en China",
    description:
      "Reducción de importaciones chinas afecta a exportadores de materias primas en Latinoamérica.",
    date: "Mar 2026",
    impact: "negative",
  },
];
