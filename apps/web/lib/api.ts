import { env } from './config';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  token?: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

/**
 * Standardized API Error class for Angelisyn HTTP requests.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly statusText?: string;
  public readonly details?: unknown;

  constructor(
    status: number,
    message: string,
    options?: { statusText?: string; details?: unknown },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = options?.statusText;
    this.details = options?.details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidationError(): boolean {
    return this.status === 400 || this.status === 422;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * Type guard to check if an error is an instance of ApiError.
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Helper to build a complete request URL with path and query parameters.
 */
function buildUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseUrl = `${env.apiUrl}${cleanEndpoint}`;

  if (!params) {
    return baseUrl;
  }

  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  }

  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Helper to get the auth token, prioritizing options then browser localStorage.
 */
function resolveAuthToken(explicitToken?: string): string | undefined {
  if (explicitToken) {
    return explicitToken;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('access_token');
    return stored || undefined;
  }

  return undefined;
}

/**
 * Formats error messages returned from backend responses.
 * Handles NestJS class-validator format (where message may be string[]), string message, or error field.
 */
function extractErrorMessage(
  errorPayload: unknown,
  statusText: string,
  statusCode: number,
): string {
  if (typeof errorPayload === 'object' && errorPayload !== null) {
    const payload = errorPayload as Record<string, unknown>;

    if (Array.isArray(payload.message)) {
      return payload.message.join(', ');
    }

    if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
      return payload.message;
    }

    if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
      return payload.error;
    }
  }

  if (typeof errorPayload === 'string' && errorPayload.trim().length > 0) {
    return errorPayload;
  }

  return statusText || `HTTP Request failed with status ${statusCode}`;
}

/**
 * Centralized HTTP request utility for communicating with the Angelisyn backend.
 */
export async function apiRequest<TResponse, TBody = unknown>(
  endpoint: string,
  options: RequestOptions<TBody> = {},
): Promise<TResponse> {
  const {
    method = 'GET',
    body,
    token,
    headers: customHeaders = {},
    params,
    signal,
  } = options;

  const url = buildUrl(endpoint, params);
  const authToken = resolveAuthToken(token);

  const requestHeaders: Record<string, string> = {
    ...customHeaders,
  };

  // Add JSON content type if body is present or for mutating methods unless already set
  const isJsonBody =
    body !== undefined &&
    !(typeof FormData !== 'undefined' && body instanceof FormData) &&
    !(typeof Blob !== 'undefined' && body instanceof Blob);

  if (isJsonBody && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (authToken && !requestHeaders['Authorization']) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  let serializedBody: BodyInit | undefined;
  if (isJsonBody) {
    serializedBody = JSON.stringify(body);
  } else if (body !== undefined) {
    serializedBody = body as unknown as BodyInit;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: serializedBody,
      signal,
    });
  } catch (fetchError) {
    if (fetchError instanceof Error && fetchError.name === 'AbortError') {
      throw fetchError;
    }
    const message =
      fetchError instanceof Error
        ? `Network connection failed: ${fetchError.message}`
        : 'Network connection to backend API failed';
    throw new ApiError(0, message, { details: fetchError });
  }

  if (!response.ok) {
    let errorDetails: unknown;
    const contentType = response.headers.get('content-type') ?? '';

    try {
      if (contentType.includes('application/json')) {
        errorDetails = await response.json();
      } else {
        errorDetails = await response.text();
      }
    } catch {
      // Ignore body extraction failure on error responses
    }

    const errorMessage = extractErrorMessage(
      errorDetails,
      response.statusText,
      response.status,
    );

    throw new ApiError(response.status, errorMessage, {
      statusText: response.statusText,
      details: errorDetails,
    });
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as TResponse;
  }

  // Handle plain text response (e.g. root GET / endpoint returning text)
  const text = await response.text();
  try {
    return JSON.parse(text) as TResponse;
  } catch {
    return text as unknown as TResponse;
  }
}

/**
 * Object-style API Client with convenience methods for standard HTTP verbs.
 */
export const apiClient = {
  get<TResponse>(
    endpoint: string,
    options?: Omit<RequestOptions<never>, 'method' | 'body'>,
  ): Promise<TResponse> {
    return apiRequest<TResponse>(endpoint, { ...options, method: 'GET' });
  },

  post<TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: Omit<RequestOptions<TBody>, 'method' | 'body'>,
  ): Promise<TResponse> {
    return apiRequest<TResponse, TBody>(endpoint, {
      ...options,
      method: 'POST',
      body,
    });
  },

  patch<TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: Omit<RequestOptions<TBody>, 'method' | 'body'>,
  ): Promise<TResponse> {
    return apiRequest<TResponse, TBody>(endpoint, {
      ...options,
      method: 'PATCH',
      body,
    });
  },

  put<TResponse, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    options?: Omit<RequestOptions<TBody>, 'method' | 'body'>,
  ): Promise<TResponse> {
    return apiRequest<TResponse, TBody>(endpoint, {
      ...options,
      method: 'PUT',
      body,
    });
  },

  delete<TResponse>(
    endpoint: string,
    options?: Omit<RequestOptions<never>, 'method' | 'body'>,
  ): Promise<TResponse> {
    return apiRequest<TResponse>(endpoint, { ...options, method: 'DELETE' });
  },
};

export default apiClient;
