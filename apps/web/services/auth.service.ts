import { apiRequest } from '@/lib/api';

import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from '@/types/auth';

export class AuthService {
  async register(data: RegisterRequest): Promise<User> {
    return apiRequest<User, RegisterRequest>('/auth/register', {
      method: 'POST',
      body: data,
    });
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    return apiRequest<LoginResponse, LoginRequest>('/auth/login', {
      method: 'POST',
      body: data,
    });
  }

  async getCurrentUser(token: string): Promise<User> {
    return apiRequest<User>('/auth/me', {
      token,
    });
  }

  logout(): void {
    localStorage.removeItem('access_token');
  }
}

export const authService = new AuthService();