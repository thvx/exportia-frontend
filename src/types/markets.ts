export interface Market {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region: string;
  description?: string;
  tradeVolume?: number;
  growthRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketInsight {
  market: Market;
  insights: string[];
  opportunities: string[];
  risks: string[];
  tradeData?: Record<string, unknown>;
}

export interface PotentialMarket {
  reporter: string;
  reporter_code: string;
  import_value: number;
  growth_rate: number;
  trend: "rising" | "stable" | "declining";
  cagr: number;
}

export interface TradeStats {
  total_import_value_usd: number;
  avg_market_value_usd: number;
  min_market_value_usd: number;
  max_market_value_usd: number;
  trend: "rising" | "stable" | "declining";
  growth_rate: number;
  markets_count: number;
}
