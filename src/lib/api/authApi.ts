import { apiClient } from './client';
import type { ApiResponse } from '../../types/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  origin_country?: string;
}

export interface AuthUser {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  role: string;
  origin_country: string | null;
  created_at: string;
  updated_at: string;
  destination_countries: Array<{
    country_code: string;
    country_name: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    hs_code: string;
    category?: string | null;
    description?: string | null;
    classification_data?: {
      fields?: Record<string, string>;
      result?: Record<string, unknown>;
      savedAt?: string;
    } | null;
  }>;
}

export interface AuthPayload {
  token: string;
  user: AuthUser;
}

export interface DestinationCountryPayload {
  country_code: string;
  country_name: string;
}

export const authApi = {
  login(credentials: LoginCredentials) {
    return apiClient.post<ApiResponse<AuthPayload>>('/auth/login', credentials);
  },
  register(data: RegisterData) {
    return apiClient.post<ApiResponse<AuthPayload>>('/auth/register', data);
  },
  me() {
    return apiClient.get<ApiResponse<AuthUser>>('/user/me');
  },
  addDestinationCountry(data: DestinationCountryPayload) {
    return apiClient.post<ApiResponse<AuthUser['destination_countries']>>('/user/me/destination-countries', data);
  },
  removeDestinationCountry(countryCode: string) {
    return apiClient.delete<ApiResponse<null>>(`/user/me/destination-countries/${countryCode}`);
  },
};
