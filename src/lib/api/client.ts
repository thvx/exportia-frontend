import { toast } from 'sonner';
import { tokenManager } from '../auth/tokenManager';
import type { ApiErrorResponse } from '../../types/api';

const DEFAULT_API_BASE_URL = 'https://exportia-backend-production-59f3.up.railway.app/api';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? DEFAULT_API_BASE_URL;
const TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 30000);
const LOGGING = import.meta.env.VITE_ENABLE_LOGGING === 'true';

function log(...args: unknown[]) {
  if (LOGGING) console.log('[API]', ...args);
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(response: ApiErrorResponse & { status: number }) {
    super(response.message ?? response.error ?? 'Ocurrió un error.');
    this.name = 'ApiError';
    this.status = response.status ?? 500;
    this.code = response.code;
    this.details = response.details;
  }
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = `${BASE_URL}${path}`;
  if (!params) return url;
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const qs = new URLSearchParams(filtered as Record<string, string>).toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, unknown>
): Promise<T> {
  const url = buildUrl(path, params);
  const token = tokenManager.getToken();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const init: RequestInit = {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  log(method, url, body ?? '');

  let response: Response;
  try {
    response = await fetchWithTimeout(url, init);
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      toast.error('La solicitud tardó demasiado. Inténtalo de nuevo.');
    } else {
      toast.error('Sin conexión. Verifica tu red.');
    }
    throw err;
  }

  if (!response.ok) {
    let errorData: ApiErrorResponse = { message: response.statusText };
    try {
      errorData = await response.json();
    } catch { /* response without body */ }

    const error = new ApiError({ ...errorData, status: response.status });

    if (response.status === 401) {
      tokenManager.clearAll();
      toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
    } else if (response.status >= 500) {
      toast.error('Error del servidor. Inténtalo más tarde.');
    } else if (response.status >= 400) {
      toast.error(errorData.message ?? errorData.error ?? 'Ocurrió un error.');
    }

    throw error;
  }

  if (response.status === 204) return null as T;

  const json: T = await response.json();
  log('Response:', json);
  return json;
}

export const apiClient = {
  get<T>(path: string, params?: Record<string, unknown>) {
    return request<T>('GET', path, undefined, params);
  },
  post<T>(path: string, body?: unknown) {
    return request<T>('POST', path, body);
  },
  put<T>(path: string, body?: unknown) {
    return request<T>('PUT', path, body);
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>('PATCH', path, body);
  },
  delete<T>(path: string) {
    return request<T>('DELETE', path);
  },
};
