import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, type AuthUser } from '../api/authApi';
import { tokenManager } from './tokenManager';
import { toast } from 'sonner';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    originCountry?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  const setUser = (user: AuthUser | null) =>
    setState({ user, isAuthenticated: !!user, loading: false });

  useEffect(() => {
    if (!tokenManager.isTokenValid()) {
      setState({ user: null, isAuthenticated: false, loading: false });
      return;
    }
    authApi
      .me()
      .then((res) => setUser(res.data))
      .catch(() => {
        tokenManager.clearAll();
        setUser(null);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    tokenManager.setToken(res.data.token);
    setUser(res.data.user);
    toast.success('Sesión iniciada');
  }, []);

  const register = useCallback(async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    originCountry?: string;
  }) => {
    const res = await authApi.register({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      password: data.password,
      origin_country: data.originCountry || undefined,
    });
    tokenManager.setToken(res.data.token);
    setUser(res.data.user);
    toast.success('Cuenta creada');
  }, []);

  const logout = useCallback(async () => {
    tokenManager.clearAll();
    setUser(null);
    toast.success('Sesión cerrada');
  }, []);

  const refreshToken = useCallback(async () => {
    const token = tokenManager.getToken();
    if (!token) return;
    const me = await authApi.me();
    setUser(me.data);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
