import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../../types/api';
import type { Product, CreateProduct, UpdateProduct, UnitExportPrice } from '../../types/products';
import type { QRProduct } from '../../types/alerts';

export interface ClassifyRequest {
  descripcion: string;
  usos?: string;
  presentacion?: string;
  materiales?: string;
  informacion_adicional?: string;
  caracteristicas?: string;
  proceso?: string;
  origen?: string;
  ingredientes?: string;
  estado_fisico?: string;
  grado_procesamiento?: string;
}

export interface ClassifyTaskResponse {
  task_id: string;
  status: string;
  message?: string;
}

export interface ClassifyStatusResponse {
  task_id: string;
  status: string;
  result?: Record<string, unknown>;
  progress_message?: string | null;
  current_step?: number;
  total_steps?: number;
}

export interface ProductsParams extends PaginationParams {
  category?: string;
  search?: string;
}

export const productsApi = {
  getAll(params?: ProductsParams) {
    return apiClient.get<ApiResponse<Product[]>>('/product', params as Record<string, unknown>);
  },
  getById(id: string) {
    return apiClient.get<ApiResponse<Product>>(`/product/${id}`);
  },
  searchMatches(description: string) {
    return apiClient.get<ApiResponse<QRProduct[]>>('/quotas/products', { description });
  },
  create(data: CreateProduct) {
    const payload = {
      ...data,
      hs_code: data.hs_code ?? data.hsCode,
    };
    return apiClient.post<ApiResponse<Product>>('/product', payload);
  },
  update(id: string, data: UpdateProduct) {
    return apiClient.put<ApiResponse<Product>>(`/product/${id}`, data);
  },
  delete(id: string) {
    return apiClient.delete<ApiResponse<null>>(`/user/me/products/${id}`);
  },
  getUnitPrice(hsCode: string, destinationCountry: string) {
    return apiClient.get<ApiResponse<UnitExportPrice>>(
      `/products/${hsCode}/unit-price`,
      { destinationCountry } as Record<string, unknown>
    );
  },
  classify(data: ClassifyRequest) {
    return apiClient.post<ApiResponse<ClassifyTaskResponse>>('/classify', data as unknown as Record<string, unknown>);
  },
  getClassifyStatus(taskId: string) {
    return apiClient.get<ApiResponse<ClassifyStatusResponse>>(`/classify/${taskId}`);
  },
  updateClassificationData(productId: string, data: Record<string, unknown>) {
    return apiClient.patch<ApiResponse<null>>(`/product/${productId}/classification-data`, data);
  },
};
