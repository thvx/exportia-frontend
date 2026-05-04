export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
  error?: string;
  statusCode?: number;
  timestamp?: string;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
