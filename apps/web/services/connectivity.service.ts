import { apiClient, isApiError } from '@/lib/api';
import { env } from '@/lib/config';

export interface ApiConnectivityResult {
  success: boolean;
  status?: number;
  message?: string;
  response?: string;
  latencyMs: number;
  apiUrl: string;
  timestamp: string;
}

/**
 * Temporary Day 1 API Connectivity Test Service.
 * Tests basic frontend-to-backend communication against confirmed root endpoint `GET /`.
 */
export class ConnectivityService {
  /**
   * Pings the backend API root endpoint to verify reachability and network round-trip.
   */
  async testConnectivity(): Promise<ApiConnectivityResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      // Confirmed root endpoint in apps/api/src/app.controller.ts
      const response = await apiClient.get<string>('/');
      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        status: 200,
        message: 'Successfully connected to backend API',
        response: typeof response === 'string' ? response : JSON.stringify(response),
        latencyMs,
        apiUrl: env.apiUrl,
        timestamp,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      if (isApiError(error)) {
        return {
          success: false,
          status: error.status,
          message: error.message,
          latencyMs,
          apiUrl: env.apiUrl,
          timestamp,
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown connectivity failure',
        latencyMs,
        apiUrl: env.apiUrl,
        timestamp,
      };
    }
  }
}

export const connectivityService = new ConnectivityService();
export default connectivityService;
