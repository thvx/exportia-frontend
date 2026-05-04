import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertsApi, type AlertsParams, type QuotasParams } from '../alertsApi';
import type { AuthUser } from '../authApi';
import type { CreateAlert, UpdateAlert } from '../../../types/alerts';

const ALERTS_KEY = 'alerts';
const QUOTAS_KEY = 'quotas';

function getProfileProducts(user?: AuthUser | null): string[] {
  return (user?.products ?? [])
    .map((product) => product.hs_code || product.name)
    .filter(Boolean);
}

function getProfileCountries(user?: AuthUser | null): string[] {
  return (user?.destination_countries ?? [])
    .map((country) => country.country_name)
    .filter(Boolean);
}

export function toQuotaProductCode(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(0, 4) : value;
}

export function useAlerts(params?: AlertsParams) {
  return useQuery({
    queryKey: [ALERTS_KEY, params],
    queryFn: () => alertsApi.getAll(params),
  });
}

export function useProfileAlerts(user?: AuthUser | null) {
  const products = getProfileProducts(user);
  const product = products[0];

  return useQuery({
    queryKey: [ALERTS_KEY, 'profile', product],
    queryFn: () => alertsApi.getAll(product ? { product } : undefined),
    enabled: !!user && !!product,
  });
}

export function useProfileCriticalAlerts(user?: AuthUser | null, days = 60) {
  const products = getProfileProducts(user);
  const product = products[0];

  return useQuery({
    queryKey: [ALERTS_KEY, 'profile-critical', product, days],
    queryFn: () => alertsApi.getCritical({ product, days }),
    enabled: !!user && !!product,
  });
}

export function useProfileEvents(user?: AuthUser | null) {
  const products = getProfileProducts(user);
  const product = products[0];

  return useQuery({
    queryKey: [ALERTS_KEY, 'events', product],
    queryFn: () => alertsApi.getEvents(product),
    enabled: !!user && !!product,
  });
}

export function useProfileQuotas(user?: AuthUser | null, overrides?: Partial<QuotasParams>) {
  const products = getProfileProducts(user);
  const countries = getProfileCountries(user);
  const productCode = products[0] ? toQuotaProductCode(products[0]) : undefined;
  const country = countries[0];

  return useQuery({
    queryKey: [QUOTAS_KEY, 'profile', productCode, country, overrides],
    queryFn: () =>
      alertsApi.getQuotas({
        in_force_only: true,
        page: 1,
        product_codes: productCode,
        country,
        ...overrides,
      }),
    enabled: !!user && (!!productCode || !!country),
  });
}

export function useProductAlerts(hsCode?: string) {
  return useQuery({
    queryKey: [ALERTS_KEY, 'product', hsCode],
    queryFn: () => alertsApi.getAll({ product: hsCode }),
    enabled: !!hsCode,
  });
}

export function useProductQuotas(productCode?: string) {
  return useQuery({
    queryKey: [QUOTAS_KEY, 'product-all', productCode],
    queryFn: () =>
      alertsApi.getQuotas({
        in_force_only: true,
        page: 1,
        product_codes: productCode,
      }),
    enabled: !!productCode,
  });
}

export function useAlert(id: string) {
  return useQuery({
    queryKey: [ALERTS_KEY, id],
    queryFn: () => alertsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAlert) => alertsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ALERTS_KEY] }),
  });
}

export function useUpdateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlert }) => alertsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ALERTS_KEY] }),
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ALERTS_KEY] }),
  });
}

export function useMarkAlertAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertsApi.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ALERTS_KEY] }),
  });
}
