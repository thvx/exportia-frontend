import { apiClient } from './client';
import type { ApiResponse } from '../../types/api';

export interface TradePartner {
  country: string;
  country_code: number;
  value_usd: number;
  share: number;
}

export interface TradeProduct {
  product: string;
  cmd_code: string;
  value_usd: number;
  share: number;
}

export interface ExportOpportunity {
  country: string;
  country_code: number;
  import_value: number;
  share: number;
}

export const comtradeApi = {
  getTopImporters(destCode: string, hsCode: string, limit = 5) {
    return apiClient.get<ApiResponse<TradePartner[]>>('/comtrade/top-importers', {
      destCode,
      hsCode,
      limit,
    } as Record<string, unknown>);
  },

  getTopImportedProducts(destCode: string, limit = 10) {
    return apiClient.get<ApiResponse<TradeProduct[]>>('/comtrade/top-products', {
      destCode,
      limit,
    } as Record<string, unknown>);
  },

  getExportDestinations(originCountry: string, hsCode: string, limit = 10) {
    return apiClient.get<ApiResponse<TradePartner[]>>('/comtrade/export-destinations', {
      originCountry,
      hsCode,
      limit,
    } as Record<string, unknown>);
  },

  getOpportunities(hsCode: string, limit = 15) {
    return apiClient.get<ApiResponse<ExportOpportunity[]>>('/comtrade/opportunities', {
      hsCode,
      limit,
    } as Record<string, unknown>);
  },
};
