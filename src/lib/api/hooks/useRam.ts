import { useQuery } from '@tanstack/react-query';
import { ramApi } from '../ramApi';

export function useRamProductCountries(hsCode?: string) {
  return useQuery({
    queryKey: ['ram-countries', hsCode],
    queryFn: () => ramApi.getProductCountries(hsCode!),
    enabled: !!hsCode,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });
}

export function useRamRequirements(hsCode?: string, countryName?: string, countryId?: number) {
  return useQuery({
    queryKey: ['ram-requirements', hsCode, countryName, countryId],
    queryFn: () => ramApi.getRequirements(hsCode!, countryName!, countryId),
    enabled: !!hsCode && !!countryName,
    staleTime: 30 * 60 * 1000, // 30 min
    retry: 1,
  });
}
