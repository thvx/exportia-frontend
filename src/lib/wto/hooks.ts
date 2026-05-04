// React Query hooks — the only thing UI components should use to
// access WTO data.

import { useQuery } from "@tanstack/react-query";
import {
  getEpingAlerts,
  getFacilityScores,
  getInternationalEvents,
  getMarketTrends,
  getQuantitativeRestrictions,
} from "./wto.functions";

const FIVE_MIN = 5 * 60 * 1000;

export function useEpingAlerts(product?: string) {
  return useQuery({
    queryKey: ["wto", "eping", product ?? null],
    queryFn: () => getEpingAlerts({ data: { product } }),
    staleTime: FIVE_MIN,
  });
}

export function useQuantitativeRestrictions(product?: string) {
  return useQuery({
    queryKey: ["wto", "qr", product ?? null],
    queryFn: () => getQuantitativeRestrictions({ data: { product } }),
    staleTime: FIVE_MIN,
  });
}

export function useMarketTrends(product?: string) {
  return useQuery({
    queryKey: ["wto", "timeseries", product ?? null],
    queryFn: () => getMarketTrends({ data: { product } }),
    staleTime: FIVE_MIN,
  });
}

export function useFacilityScores() {
  return useQuery({
    queryKey: ["wto", "tfad"],
    queryFn: () => getFacilityScores(),
    staleTime: FIVE_MIN,
  });
}

export function useInternationalEvents() {
  return useQuery({
    queryKey: ["wto", "events"],
    queryFn: () => getInternationalEvents(),
    staleTime: FIVE_MIN,
  });
}
