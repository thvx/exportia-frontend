export interface ClassificationData {
  fields?: Record<string, string>;
  result?: Record<string, unknown>;
  savedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  hs_code?: string;
  hsCode?: string;
  category?: string;
  classification_data?: ClassificationData | null;
  created_by?: string;
  userId?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProduct {
  name: string;
  description?: string;
  hs_code?: string;
  hsCode?: string;
  category?: string;
  classification_data?: ClassificationData;
}

export type UpdateProduct = Partial<CreateProduct>;

export interface UnitExportPrice {
  priceAvg: number;
  priceMin: number;
  priceMax: number;
  unit: string;
  currency: string;
  explanation: string;
  hsCode: string;
  originCountry: string;
  destinationCountry: string;
}
