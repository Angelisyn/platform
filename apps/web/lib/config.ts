/**
 * Environment configuration for the Angelisyn Web Application.
 */

const DEFAULT_API_URL = 'http://localhost:3001';

/**
 * Normalizes the API URL by removing any trailing slashes.
 */
function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export const env = {
  /**
   * Base URL for the Angelisyn backend API.
   * Configured via NEXT_PUBLIC_API_URL environment variable with fallback to http://localhost:3001.
   */
  apiUrl: normalizeUrl(process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL),

  /**
   * Whether the application is running in production mode.
   */
  isProduction: process.env.NODE_ENV === 'production',

  /**
   * Whether the application is running in development mode.
   */
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;

export default env;
