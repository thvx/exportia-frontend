import { apiClient } from './client';
import type { ApiResponse } from '../../types/api';

export interface RamRequirementsData {
  hasData: boolean;
  productId: number | null;
  countryId: number | null;
  downloadUrl: string | null;
  requirements: unknown;
}

export interface RamCountryItem {
  id: number;
  name: string;
}

export const ramApi = {
  getProductCountries(hsCode: string) {
    return apiClient.get<ApiResponse<RamCountryItem[]>>('/ram/countries', { hs_code: hsCode });
  },

  getRequirements(hsCode: string, countryName: string, countryId?: number) {
    return apiClient.get<ApiResponse<RamRequirementsData>>('/ram/requirements', {
      hs_code: hsCode,
      country_name: countryName,
      country_id: countryId,
    });
  },
};
