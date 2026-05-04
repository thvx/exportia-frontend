// Shared types for the WTO data layer.
// These shapes are returned by our server functions — they're already
// "translated" from the raw WTO API responses into the simple format
// the UI uses (signals, plain language, etc.)

export type Signal = "green" | "yellow" | "red";
export type Trend = "up" | "stable" | "down";
export type AlertSeverity = "info" | "warning" | "danger";

/** ePing API — Notificaciones SPS / TBT */
export interface EpingAlert {
  id: string;
  country: string;
  countryFlag: string;
  title: string;
  description: string;
  measureType: "SPS" | "TBT";
  severity: AlertSeverity;
  publishedAt: string; // ISO date
  productKeywords: string[];
}

/** Quantitative Restrictions API */
export interface QuantitativeRestriction {
  id: string;
  country: string;
  countryFlag: string;
  productCategory: string;
  restrictionType: "quota" | "ban" | "license";
  description: string;
  legalBasis: string;
  signal: Signal;
}

/** Timeseries API — Tendencias de demanda por país */
export interface MarketTrend {
  country: string;
  countryFlag: string;
  signal: Signal;
  trend: Trend;
  label: string;
  subtitle: string;
  // 0..100 — score derivado de la serie de importaciones
  opportunityScore: number;
}

/** Trade Facilitation Agreement Database (TFAD) */
export interface FacilityScore {
  country: string;
  countryFlag: string;
  signal: Signal;
  label: "Fácil" | "Medio" | "Difícil";
  documentsCount: number;
  estimatedDays: string;
  complexity: "Baja" | "Media" | "Alta";
}

/** Acontecimientos internacionales relevantes (curados/derivados) */
export interface InternationalEvent {
  id: string;
  icon: string;
  title: string;
  description: string;
  date: string;
  impact: "positive" | "negative";
}
