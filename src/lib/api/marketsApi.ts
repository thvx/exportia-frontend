import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../../types/api';
import type { Market, MarketInsight, PotentialMarket, TradeStats } from '../../types/markets';

export interface MarketsParams extends PaginationParams {
  region?: string;
  country?: string;
  search?: string;
}

export interface PotentialMarketsParams {
  product: string;
  periods?: string;
  limit?: number;
}

export interface TradeStatsParams {
  product: string;
  periods?: string;
}

export const marketsApi = {
  getAll(params?: MarketsParams) {
    return apiClient.get<PaginatedResponse<Market>>('/markets', params as Record<string, unknown>);
  },
  getById(id: string) {
    return apiClient.get<ApiResponse<Market>>(`/markets/${id}`);
  },
  getInsights(productQuery: string) {
    return apiClient.get<ApiResponse<MarketInsight>>('/markets/insights', { productQuery });
  },
  getPotentialMarkets(params: PotentialMarketsParams) {
    return apiClient.get<ApiResponse<PotentialMarket[]>>('/markets/potential', params as unknown as Record<string, unknown>);
  },
  getTradeStats(params: TradeStatsParams) {
    return apiClient.get<ApiResponse<TradeStats>>('/markets/trade-stats', params as unknown as Record<string, unknown>);
  },
};
