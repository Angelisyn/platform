import { apiRequest } from '@/lib/api';
import { removeStoredToken } from '@/lib/auth';

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '@/types/auth';

export class AuthService {
  /**
   * Register a new user.
   * Backend returns { access_token, user } on success.
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiRequest<AuthResponse, RegisterRequest>('/auth/register', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Login with email and password.
   * Backend returns { access_token, user } on success.
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    return apiRequest<AuthResponse, LoginRequest>('/auth/login', {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Fetch the current authenticated user via GET /auth/me.
   * Requires a valid Bearer token.
   */
  async getCurrentUser(token: string): Promise<User> {
    return apiRequest<User>('/auth/me', {
      token,
    });
  }

  /**
   * Clear the stored authentication token.
   */
  logout(): void {
    removeStoredToken();
  }
}

export const authService = new AuthService();