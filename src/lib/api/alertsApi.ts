import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../../types/api';
import type {
  Alert,
  AlertSeverity,
  AlertType,
  CreateAlert,
  EpingAlert,
  ProductEvents,
  QRProduct,
  QRListResponse,
  UpdateAlert,
} from '../../types/alerts';

export interface AlertsParams extends PaginationParams {
  isRead?: boolean;
  severity?: AlertSeverity;
  type?: AlertType;
  product?: string;
  days?: number;
}

export interface QuotasParams extends PaginationParams {
  product_codes?: string;
  country?: string;
  reporter_member_code?: string;
  in_force_only?: boolean;
}

export interface WtoMember {
  value: string;
  text: string;
}

export const alertsApi = {
  getAll(params?: AlertsParams) {
    return apiClient.get<ApiResponse<EpingAlert[]>>('/alerts', params as Record<string, unknown>);
  },
  getCritical(params?: Pick<AlertsParams, 'product' | 'days'>) {
    return apiClient.get<ApiResponse<EpingAlert[]>>('/alerts/critical', params as Record<string, unknown>);
  },
  getEvents(product: string) {
    return apiClient.get<ApiResponse<ProductEvents>>('/events', { product });
  },
  getQuotaProducts(description: string) {
    return apiClient.get<ApiResponse<QRProduct[]>>('/quotas/products', { description });
  },
  getQuotaMembers() {
    return apiClient.get<ApiResponse<WtoMember[]>>('/quotas/members');
  },
  getQuotas(params?: QuotasParams) {
    return apiClient.get<QRListResponse>('/quotas', params as Record<string, unknown>);
  },
  getById(id: string) {
    return apiClient.get<ApiResponse<Alert>>(`/alerts/${id}`);
  },
  create(data: CreateAlert) {
    return apiClient.post<ApiResponse<Alert>>('/alerts', data);
  },
  update(id: string, data: UpdateAlert) {
    return apiClient.put<ApiResponse<Alert>>(`/alerts/${id}`, data);
  },
  delete(id: string) {
    return apiClient.delete<ApiResponse<null>>(`/alerts/${id}`);
  },
  markAsRead(id: string) {
    return apiClient.post<ApiResponse<Alert>>(`/alerts/${id}/read`);
  },
};
