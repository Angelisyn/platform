'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { authService } from '@/services/auth.service';
import {
  getStoredToken,
  setStoredToken,
  removeStoredToken,
} from '@/lib/auth';

import type {
  AuthContextValue,
  AuthState,
  LoginRequest,
  RegisterRequest,
} from '@/types/auth';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      return;
    }

    try {
      const user = await authService.getCurrentUser(token);

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      removeStoredToken();

      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    const restoreAuth = async () => {
      await Promise.resolve();
      await refreshUser();
    };

    void restoreAuth();
  }, [refreshUser]);

  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);

    setStoredToken(response.access_token);

    setState({
      user: response.user,
      token: response.access_token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const register = async (data: RegisterRequest) => {
    const response = await authService.register(data);

    setStoredToken(response.access_token);

    setState({
      user: response.user,
      token: response.access_token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    authService.logout();

    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });

    window.location.href = '/login';
  };

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };