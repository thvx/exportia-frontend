import { z } from 'zod';

export const MarketSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string(),
  region: z.string(),
  description: z.string().optional(),
  tradeVolume: z.number().optional(),
  growthRate: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const MarketInsightSchema = z.object({
  market: MarketSchema,
  insights: z.array(z.string()),
  opportunities: z.array(z.string()),
  risks: z.array(z.string()),
  tradeData: z.record(z.unknown()).optional(),
});

export type MarketSchemaType = z.infer<typeof MarketSchema>;
export type MarketInsightSchemaType = z.infer<typeof MarketInsightSchema>;
