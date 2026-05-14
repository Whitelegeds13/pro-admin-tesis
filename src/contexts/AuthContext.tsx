'use client';

/**
 * AuthContext — Contexto de autenticación con JWT.
 *
 * Maneja:
 * - Login/Register de clientes con JWT
 * - Auto-refresh de access tokens
 * - Sesión persistente con cookies HttpOnly
 * - Logout seguro (limpia cookies + localStorage)
 */

import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode, useRef } from 'react';

export interface Client {
  _id: string;
  name: string;
  documentType: 'DNI' | 'RUC' | 'CE' | 'PASSPORT';
  documentNumber: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  district?: string;
  isActive: boolean;
  totalPurchases: number;
  lastPurchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthState {
  client: Client | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
}

type AuthAction =
  | { type: 'LOGIN'; payload: { client: Client; accessToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_TOKEN'; payload: string };

const initialState: AuthState = {
  client: null,
  isAuthenticated: false,
  isLoading: true,
  accessToken: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        client: action.payload.client,
        accessToken: action.payload.accessToken,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        client: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        client: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'UPDATE_TOKEN':
      return {
        ...state,
        accessToken: action.payload,
      };
    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (clientData: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateClient: (clientData: Client) => void;
  refreshClient: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
}

export interface RegisterData {
  name: string;
  documentType: 'DNI' | 'RUC' | 'CE' | 'PASSPORT';
  documentNumber: string;
  phone: string;
  email: string;
  password: string;
  address?: string;
  city?: string;
  district?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Refresh Token automático ───────────────────────────────

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Envía cookies HttpOnly
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.accessToken) {
          dispatch({ type: 'UPDATE_TOKEN', payload: data.accessToken });
          return data.accessToken;
        }
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // ─── Cargar sesión al iniciar ───────────────────────────────

  useEffect(() => {
    const loadSession = async () => {
      try {
        // Intentar refrescar el token (la cookie HttpOnly se envía automáticamente)
        const token = await refreshAccessToken();

        if (token) {
          // Si tenemos token, obtener datos del cliente
          const storedClient = localStorage.getItem('client');
          if (storedClient) {
            const client = JSON.parse(storedClient);
            dispatch({ type: 'LOGIN', payload: { client, accessToken: token } });
          } else {
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          // No hay sesión válida
          localStorage.removeItem('client');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch {
        localStorage.removeItem('client');
        dispatch({ type: 'LOGOUT' });
      }
    };

    loadSession();
  }, [refreshAccessToken]);

  // ─── Auto-refresh cada 12 minutos ──────────────────────────

  useEffect(() => {
    if (state.isAuthenticated) {
      refreshIntervalRef.current = setInterval(async () => {
        await refreshAccessToken();
      }, 12 * 60 * 1000); // 12 minutos (antes de que expire a los 15)
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [state.isAuthenticated, refreshAccessToken]);

  // ─── Login ─────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await fetch('/api/auth/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Para recibir cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.client && data.accessToken) {
        dispatch({
          type: 'LOGIN',
          payload: { client: data.client, accessToken: data.accessToken },
        });
        localStorage.setItem('client', JSON.stringify(data.client));
        return { success: true };
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: false, message: data.message || 'Error al iniciar sesión' };
      }
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, message: 'Error de conexión' };
    }
  };

  // ─── Register ──────────────────────────────────────────────

  const register = async (clientData: RegisterData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await fetch('/api/auth/client/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(clientData),
      });

      const data = await response.json();

      if (data.success && data.client && data.accessToken) {
        dispatch({
          type: 'LOGIN',
          payload: { client: data.client, accessToken: data.accessToken },
        });
        localStorage.setItem('client', JSON.stringify(data.client));
        return { success: true };
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: false, message: data.message || 'Error al registrar' };
      }
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, message: 'Error de conexión' };
    }
  };

  // ─── Logout ────────────────────────────────────────────────

  const logout = async () => {
    try {
      // Llamar al endpoint de logout para limpiar cookies server-side
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Continuar con el logout local aunque falle el server
    }

    try {
      localStorage.removeItem('client');
      localStorage.removeItem('cart');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cart:clear'));
      }
    } catch {}

    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    dispatch({ type: 'LOGOUT' });
  };

  // ─── Update Client ─────────────────────────────────────────

  const updateClient = (clientData: Client) => {
    dispatch({ type: 'UPDATE_CLIENT', payload: clientData });
    localStorage.setItem('client', JSON.stringify(clientData));
  };

  // ─── Refresh Client Data ───────────────────────────────────

  const refreshClient = async () => {
    if (!state.client || !state.accessToken) return;

    try {
      const response = await fetch('/api/auth/client/me', {
        headers: {
          'Authorization': `Bearer ${state.accessToken}`,
          'x-client-id': state.client._id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          dispatch({ type: 'UPDATE_CLIENT', payload: data.client });
          localStorage.setItem('client', JSON.stringify(data.client));
        }
      }
    } catch (error) {
      console.error('Error refreshing client:', error);
    }
  };

  // ─── Auth Headers Helper ───────────────────────────────────

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (state.accessToken) {
      headers['Authorization'] = `Bearer ${state.accessToken}`;
    }
    if (state.client?._id) {
      headers['x-client-id'] = state.client._id;
    }
    return headers;
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        register,
        logout,
        updateClient,
        refreshClient,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
