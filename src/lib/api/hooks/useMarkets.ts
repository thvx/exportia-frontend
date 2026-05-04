import { useQuery } from '@tanstack/react-query';
import { marketsApi, type MarketsParams } from '../marketsApi';
import { productsApi } from '../productsApi';

const MARKETS_KEY = 'markets';

export function useMarkets(params?: MarketsParams) {
  return useQuery({
    queryKey: [MARKETS_KEY, params],
    queryFn: () => marketsApi.getAll(params),
  });
}

export function useMarket(id: string) {
  return useQuery({
    queryKey: [MARKETS_KEY, id],
    queryFn: () => marketsApi.getById(id),
    enabled: !!id,
  });
}

export function useMarketInsights(productQuery: string) {
  return useQuery({
    queryKey: [MARKETS_KEY, 'insights', productQuery],
    queryFn: () => marketsApi.getInsights(productQuery),
    enabled: !!productQuery,
  });
}

export function useProductPotentialMarkets(sitc3?: string, limit = 8) {
  return useQuery({
    queryKey: [MARKETS_KEY, 'potential', sitc3, limit],
    queryFn: () => marketsApi.getPotentialMarkets({ product: sitc3!, limit }),
    enabled: !!sitc3,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductTradeStats(sitc3?: string) {
  return useQuery({
    queryKey: [MARKETS_KEY, 'trade-stats', sitc3],
    queryFn: () => marketsApi.getTradeStats({ product: sitc3! }),
    enabled: !!sitc3,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUnitExportPrice(hsCode?: string, destinationCountry?: string) {
  return useQuery({
    queryKey: ['unit-export-price', hsCode, destinationCountry],
    queryFn: () => productsApi.getUnitPrice(hsCode!, destinationCountry!),
    enabled: !!hsCode && !!destinationCountry,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}
