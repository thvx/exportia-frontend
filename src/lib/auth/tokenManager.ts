const ACCESS_TOKEN_KEY = 'exportia_access_token';
const REFRESH_TOKEN_KEY = 'exportia_refresh_token';

export const tokenManager = {
  setToken(token: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  getToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  clearToken() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
  isTokenValid(): boolean {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  setRefreshToken(token: string) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  clearRefreshToken() {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  clearAll() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
