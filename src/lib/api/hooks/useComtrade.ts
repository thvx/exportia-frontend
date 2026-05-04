import { useQuery } from '@tanstack/react-query';
import { comtradeApi } from '../comtradeApi';

const STALE = 30 * 60 * 1000; // 30 min — Comtrade data is stable

export function useTopImporters(destCode?: string, hsCode?: string, limit = 5) {
  return useQuery({
    queryKey: ['comtrade', 'top-importers', destCode, hsCode, limit],
    queryFn: () => comtradeApi.getTopImporters(destCode!, hsCode!, limit),
    enabled: !!destCode && !!hsCode,
    staleTime: STALE,
  });
}

export function useTopImportedProducts(destCode?: string, limit = 10) {
  return useQuery({
    queryKey: ['comtrade', 'top-products', destCode, limit],
    queryFn: () => comtradeApi.getTopImportedProducts(destCode!, limit),
    enabled: !!destCode,
    staleTime: STALE,
  });
}

export function useExportDestinations(originCountry?: string, hsCode?: string, limit = 10) {
  return useQuery({
    queryKey: ['comtrade', 'export-destinations', originCountry, hsCode, limit],
    queryFn: () => comtradeApi.getExportDestinations(originCountry!, hsCode!, limit),
    enabled: !!originCountry && !!hsCode,
    staleTime: STALE,
  });
}

export function useExportOpportunities(hsCode?: string, limit = 15) {
  return useQuery({
    queryKey: ['comtrade', 'opportunities', hsCode, limit],
    queryFn: () => comtradeApi.getOpportunities(hsCode!, limit),
    enabled: !!hsCode,
    staleTime: STALE,
  });
}
