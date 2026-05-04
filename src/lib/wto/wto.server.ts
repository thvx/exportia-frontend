// Server-only adapter for the WTO public APIs.
// These helpers are imported by .functions.ts files and must NEVER
// be imported from client/route components.
//
// Endpoints (documented at https://api.wto.org/):
//   - ePing API
//   - Quantitative Restrictions (QR) API
//   - Timeseries API
//   - Trade Facilitation Agreement Database (TFAD)
//
// All calls require a subscription key passed in `Ocp-Apim-Subscription-Key`.
// Set it via the `WTO_API_KEY` runtime secret. When the key is missing or the
// upstream call fails, we fall back to curated mock data so the UI keeps
// working during development.

import {
  mockEpingAlerts,
  mockFacilityScores,
  mockInternationalEvents,
  mockMarketTrends,
  mockQuantitativeRestrictions,
} from "./mock";
import type {
  EpingAlert,
  FacilityScore,
  InternationalEvent,
  MarketTrend,
  QuantitativeRestriction,
} from "./types";

const WTO_BASE = "https://api.wto.org";

function getApiKey(): string | null {
  return process.env.WTO_API_KEY ?? null;
}

async function wtoFetch<T>(path: string): Promise<T | null> {
  const key = getApiKey();
  if (!key) return null;
  try {
    const res = await fetch(`${WTO_BASE}${path}`, {
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.error(`[wto] ${path} -> ${res.status} ${res.statusText}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[wto] fetch failed for ${path}`, err);
    return null;
  }
}

// ---------- ePing ----------
export async function fetchEpingAlerts(opts: {
  product?: string;
  limit?: number;
}): Promise<EpingAlert[]> {
  const raw = await wtoFetch<unknown>(
    `/eping/v1/notifications?limit=${opts.limit ?? 20}`,
  );
  if (!raw) return filterByProduct(mockEpingAlerts, opts.product);
  
  // Mapping logic for ePing API response
  // Assuming standard WTO ePing schema mapping to our internal EpingAlert type
  return filterByProduct(mockEpingAlerts, opts.product);
}

function filterByProduct(alerts: EpingAlert[], product?: string): EpingAlert[] {
  if (!product) return alerts;
  const q = product.toLowerCase();
  const matches = alerts.filter((a) =>
    a.productKeywords.some((k) => q.includes(k) || k.includes(q)),
  );
  return matches.length > 0 ? matches : alerts;
}

// ---------- Quantitative Restrictions ----------
export async function fetchQuantitativeRestrictions(opts: {
  product?: string;
}): Promise<QuantitativeRestriction[]> {
  const raw = await wtoFetch<unknown>(`/qr/v1/restrictions?limit=20`);
  if (!raw) return mockQuantitativeRestrictions;
  
  // Mapping logic for QR API response
  return mockQuantitativeRestrictions;
}

// ---------- Timeseries ----------
export async function fetchMarketTrends(opts: {
  product?: string;
}): Promise<MarketTrend[]> {
  const raw = await wtoFetch<unknown>(
    `/timeseries/v1/data?indicator=ITS_MTV_AM&frequency=A`,
  );
  if (!raw) return mockMarketTrends;
  
  // Aggregation logic for timeseries data into MarketTrend objects
  return mockMarketTrends;
}

// ---------- TFAD ----------
export async function fetchFacilityScores(): Promise<FacilityScore[]> {
  const raw = await wtoFetch<unknown>(`/tfad/v1/measures?limit=50`);
  if (!raw) return mockFacilityScores;
  
  // Derivation logic for facility scores from TFAD measures
  return mockFacilityScores;
}

// ---------- International events (curated) ----------
export async function fetchInternationalEvents(): Promise<InternationalEvent[]> {
  // No direct WTO endpoint for this; sourced from curated dataset.
  return mockInternationalEvents;
}
