import { ApiError } from '@/types/api';

// Retry configuration
const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 2000; // Start with 2 seconds

// Sleep utility for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if error should be retried
const shouldRetry = (error: any, status?: number): boolean => {
  // Network errors (fetch failures)
  if (!status && error instanceof TypeError) {
    return true;
  }

  // Server errors (5xx) are retryable
  if (status && status >= 500) {
    return true;
  }

  return false;
};

// Validate and get API URL
const getApiBaseUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // In production, API URL must be set
  if (process.env.NODE_ENV === 'production' && !apiUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_URL environment variable is required in production. ' +
      'Please set it in your environment variables.'
    );
  }

  // Development fallback with warning
  if (!apiUrl) {
    console.warn(
      '⚠️  NEXT_PUBLIC_API_URL not set, using localhost fallback. ' +
      'Set NEXT_PUBLIC_API_URL in your .env file for production deployment.'
    );
    return 'http://localhost:5000/api';
  }

  // Append /api to the base URL if not already present
  // The server mounts all routes under /api prefix
  return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Fetch wrapper that mimics axios API
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    method: string,
    url: string,
    data?: any,
    options?: RequestInit,
    retryCount: number = 0
  ): Promise<{ data: T }> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(fullUrl, config);

      let responseData;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        const apiError = new ApiError(
          responseData?.message || responseData?.error || 'Request failed',
          response.status,
          responseData
        );

        // Retry on server errors (5xx)
        if (shouldRetry(null, response.status) && retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
          console.warn(`🔄 Retrying request (${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms:`, {
            url: fullUrl,
            method,
            status: response.status,
          });
          await sleep(delay);
          return this.request<T>(method, url, data, options, retryCount + 1);
        }

        throw apiError;
      }

      return { data: responseData };
    } catch (error) {
      // If it's already an ApiError, check if we should retry
      if (error instanceof ApiError) {
        if (shouldRetry(error, error.statusCode) && retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
          console.warn(`🔄 Retrying request (${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms:`, {
            url: fullUrl,
            method,
            error: error.message,
          });
          await sleep(delay);
          return this.request<T>(method, url, data, options, retryCount + 1);
        }
        throw error;
      }

      // Network errors (TypeError from fetch)
      if (error instanceof TypeError && retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
        console.warn(`🔄 Retrying request (${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms:`, {
          url: fullUrl,
          method,
          error: 'Network error',
        });
        await sleep(delay);
        return this.request<T>(method, url, data, options, retryCount + 1);
      }

      // Create user-friendly error message
      let errorMessage = 'Network error';
      if (error instanceof TypeError) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Connection timed out. The server may be experiencing issues. Please try again in a moment.';
        }
      }

      throw new ApiError(
        error instanceof Error ? errorMessage : 'Network error',
        undefined,
        error
      );
    }
  }

  async get<T>(url: string, options?: RequestInit): Promise<{ data: T }> {
    return this.request<T>('GET', url, undefined, options);
  }

  async post<T>(url: string, data?: any, options?: RequestInit): Promise<{ data: T }> {
    return this.request<T>('POST', url, data, options);
  }

  async put<T>(url: string, data?: any, options?: RequestInit): Promise<{ data: T }> {
    return this.request<T>('PUT', url, data, options);
  }

  async patch<T>(url: string, data?: any, options?: RequestInit): Promise<{ data: T }> {
    return this.request<T>('PATCH', url, data, options);
  }

  async delete<T>(url: string, options?: RequestInit): Promise<{ data: T }> {
    return this.request<T>('DELETE', url, undefined, options);
  }
}

const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;
