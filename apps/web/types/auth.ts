/**
 * Authentication request DTOs
 * Matches backend: apps/api/src/auth/dto/login.dto.ts, register.dto.ts
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * Authentication response DTOs
 * Matches backend: apps/api/src/auth/auth.service.ts
 *
 * Both login() and register() return { access_token, user }.
 */

export interface AuthResponse {
  access_token: string;
  user: User;
}

/**
 * User object returned by the backend.
 * Matches backend: apps/api/src/auth/interfaces/authenticated-user.interface.ts
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Authentication Context API
 */

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}