export type AlertType = 'sanitary' | 'tariff' | 'regulatory' | 'other';
export type AlertSeverity = 'low' | 'medium' | 'high';

export interface Alert {
  id: string;
  title: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  isRead: boolean;
  productId?: string;
  marketId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlert {
  title: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  productId?: string;
  marketId?: string;
}

export type UpdateAlert = Partial<CreateAlert>;

export type BackendAlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface EpingAlert {
  id: string;
  product: string;
  country: string;
  description: string;
  reference: string;
  startDate: string;
  endDate?: string;
  severity: BackendAlertSeverity;
  apiSource: 'ePing' | 'QR';
}

export interface QRQuota {
  id: string;
  product: string;
  country: string;
  quotaValue: number;
  quotaUnit: string;
  remainingQuota: number;
  expiryDate?: string;
  restrictions?: string[];
}

export interface QRRegulation {
  id: number;
  reporter_member?: {
    code?: string;
    name?: {
      es?: string;
      en?: string;
    };
  };
  general_description: string;
  in_force_from?: string;
  termination_dt?: string | null;
  measures?: Array<{
    description?: string | { es?: string; en?: string; fr?: string };
  } & Record<string, unknown>>;
  affected_products?: Array<{ code?: string; description?: string }>;
  notified_in?: Array<{
    symbol?: string;
    document_symbol?: string;
  } & Record<string, unknown>>;
  details?: string;
}

export interface QRProduct {
  code: string;
  description: string | { es?: string; en?: string; fr?: string };
  hs_version: string;
}

export interface QRListMeta {
  total: number;
  page: number;
  last_page: number;
}

export interface QRListResponse {
  success: boolean;
  data: QRRegulation[];
  meta: QRListMeta;
  timestamp?: string;
}

export interface ProductEvents {
  alerts: EpingAlert[];
  quotas: QRQuota[];
}
