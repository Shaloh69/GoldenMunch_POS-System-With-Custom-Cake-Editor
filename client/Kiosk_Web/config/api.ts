import axios, { AxiosError, AxiosRequestConfig } from "axios";

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Start with 1 second
const RETRY_TIMEOUT_ERRORS = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'];

// Validate and get API URL
const getApiBaseUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // In production, API URL must be set
  if (process.env.NODE_ENV === "production" && !apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL environment variable is required in production. " +
        "Please set it in your environment variables.",
    );
  }

  // Development fallback with warning
  if (!apiUrl) {
    console.warn(
      "⚠️  NEXT_PUBLIC_API_URL not set, using localhost fallback. " +
        "Set NEXT_PUBLIC_API_URL in your .env file for production deployment.",
    );
    return "http://localhost:5000/api";
  }

  return apiUrl;
};

// API Configuration
export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
};

export const API_BASE_URL = API_CONFIG.baseURL;

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

// Retry function with exponential backoff
const retryRequest = async (error: AxiosError): Promise<any> => {
  const config = error.config as AxiosRequestConfig & { retryCount?: number };

  if (!config) {
    return Promise.reject(error);
  }

  // Initialize retry count
  config.retryCount = config.retryCount || 0;

  // Check if we should retry
  if (!isRetryableError(error) || config.retryCount >= MAX_RETRIES) {
    return Promise.reject(error);
  }

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
  return apiClient(config);
};

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Debug: Log all outgoing API requests
    console.log("🔵 API REQUEST:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      params: config.params,
      cacheHeaders: {
        "Cache-Control": config.headers["Cache-Control"],
        Pragma: config.headers["Pragma"],
        Expires: config.headers["Expires"],
      },
      timestamp: new Date().toISOString(),
    });

    // Add any auth tokens here if needed in the future
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    console.error("🔴 API REQUEST ERROR:", error);
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Debug: Log all API responses
    console.log("🟢 API RESPONSE:", {
      status: response.status,
      url: response.config.url,
      params: response.config.params,
      cacheHeaders: {
        "Cache-Control": response.headers["cache-control"],
        Pragma: response.headers["pragma"],
        Expires: response.headers["expires"],
        ETag: response.headers["etag"],
        "Last-Modified": response.headers["last-modified"],
      },
      dataLength: Array.isArray(response.data?.data)
        ? response.data.data.length
        : "N/A",
      timestamp: new Date().toISOString(),
    });
    return response;
  },
  async (error: AxiosError) => {
    // Handle errors globally
    if (error.response) {
      // Server responded with error
      console.error("🔴 API ERROR (Server):", {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data,
        retryCount: (error.config as any)?.retryCount || 0,
      });
    } else if (error.request) {
      // Request made but no response
      console.error("🔴 API ERROR (Network):", {
        url: error.config?.url,
        message: error.message,
        code: error.code,
        retryCount: (error.config as any)?.retryCount || 0,
      });
    } else {
      // Something else happened
      console.error("🔴 API ERROR (Unknown):", error.message);
    }

    // Try to retry if error is retryable
    if (isRetryableError(error)) {
      return retryRequest(error);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
