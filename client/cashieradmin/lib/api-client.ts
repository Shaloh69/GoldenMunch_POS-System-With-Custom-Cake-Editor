import type { ApiResponse } from "@/types/api";

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";

// Retry configuration
const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 2000; // Start with 2 seconds
const RETRY_TIMEOUT_ERRORS = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'];

// Sleep utility for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if error is retryable
const isRetryableError = (error: AxiosError): boolean => {
  // Network errors (no response from server)
  if (!error.response && error.code) {
    return RETRY_TIMEOUT_ERRORS.includes(error.code);
  }

  // Server errors (5xx) are retryable
  if (error.response && error.response.status >= 500) {
    return true;
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED') {
    return true;
  }

  return false;
};

// Validate API URL configuration
const getApiBaseUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // In production, API URL must be set
  if (process.env.NODE_ENV === "production" && !apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL environment variable is required in production. " +
        "Please set it in your Render environment variables.",
    );
  }

  // Development fallback with warning
  if (!apiUrl) {
    console.warn(
      "⚠️  NEXT_PUBLIC_API_URL not set, using localhost fallback. " +
        "Set NEXT_PUBLIC_API_URL in your .env file for production deployment.",
    );

    return "http://localhost:5000";
  }

  return apiUrl;
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: getApiBaseUrl(),
      timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 60000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("auth_token");

          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse>) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            window.location.href = "/login";
          }
          return Promise.reject(error);
        }

        // Attempt retry for retryable errors
        if (isRetryableError(error)) {
          const config = error.config as AxiosRequestConfig & { retryCount?: number };

          if (config) {
            // Initialize retry count
            config.retryCount = config.retryCount || 0;

            // Check if we should retry
            if (config.retryCount < MAX_RETRIES) {
              // Increment retry count
              config.retryCount += 1;

              // Calculate delay with exponential backoff
              const delay = RETRY_DELAY_MS * Math.pow(2, config.retryCount - 1);

              console.warn(`🔄 Retrying request (${config.retryCount}/${MAX_RETRIES}) after ${delay}ms:`, {
                url: config.url,
                method: config.method,
                error: error.code || error.message,
              });

              // Wait before retrying
              await sleep(delay);

              // Retry the request
              return this.client(config);
            }
          }
        }

        return Promise.reject(error);
      },
    );
  }

  async get<T>(url: string, config = {}): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, config);

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post<T>(url: string, data?: any, config = {}): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(
        url,
        data,
        config,
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any, config = {}): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data, config);

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch<T>(
    url: string,
    data?: any,
    config = {},
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(
        url,
        data,
        config,
      );

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete<T>(url: string, config = {}): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config);

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async postFormData<T>(
    url: string,
    formData: FormData,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async putFormData<T>(
    url: string,
    formData: FormData,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): ApiResponse {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse>;

      // Server responded with error data
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }

      // Network/connection errors - provide user-friendly messages
      if (!axiosError.response) {
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
          return {
            success: false,
            message: "Unable to connect to the server. Please check your internet connection and try again.",
            error: "Connection refused",
          };
        }
        if (axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ECONNABORTED') {
          return {
            success: false,
            message: "Connection timed out. The server may be experiencing issues. Please try again in a moment.",
            error: "Connection timeout",
          };
        }
      }

      // Server errors (5xx)
      if (axiosError.response?.status && axiosError.response.status >= 500) {
        return {
          success: false,
          message: "Server error occurred. Please try again or contact support if the problem persists.",
          error: `Server error (${axiosError.response.status})`,
        };
      }

      return {
        success: false,
        message: axiosError.message || "Network error occurred",
        error: axiosError.message,
      };
    }

    return {
      success: false,
      message: "An unexpected error occurred",
      error: error?.message || "Unknown error",
    };
  }
}

export const apiClient = new ApiClient();
