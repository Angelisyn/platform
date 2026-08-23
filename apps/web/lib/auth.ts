const TOKEN_KEY = 'access_token';

/**
 * Retrieves the stored JWT authentication token from browser localStorage.
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Stores the JWT authentication token in browser localStorage.
 */
export function setStoredToken(token: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * Removes the stored JWT authentication token from browser localStorage.
 */
export function removeStoredToken(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(TOKEN_KEY);
  }
}
