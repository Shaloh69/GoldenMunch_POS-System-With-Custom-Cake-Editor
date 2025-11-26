import { ApiResponse } from '../models/types';

/**
 * Generate a random verification code
 */
export const generateVerificationCode = (length: number = 6): string => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
};

/**
 * Generate order number
 */
export const generateOrderNumber = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  return `ORD${dateStr}-${randomNum}`;
};

/**
 * Success response helper
 */
export const successResponse = <T>(
  message: string,
  data?: T
): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
  };
};

/**
 * Error response helper
 */
export const errorResponse = (message: string, error?: string): ApiResponse => {
  return {
    success: false,
    message,
    error,
  };
};

/**
 * Calculate pagination metadata
 */
export const calculatePagination = (
  page: number,
  limit: number,
  total: number
) => {
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    total,
    totalPages,
    offset,
  };
};

/**
 * Format currency (Philippine Peso)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Philippine format)
 */
export const isValidPhone = (phone: string): boolean => {
  // Accepts formats: 09123456789, +639123456789, 9123456789
  const phoneRegex = /^(\+63|0)?9\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Calculate order total with taxes and discounts
 * NOTE: Tax is disabled system-wide (always 0)
 */
export const calculateOrderTotal = (
  subtotal: number,
  taxRate: number = 0,
  discountAmount: number = 0
): {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
} => {
  const tax = 0; // Tax disabled
  const total = subtotal - discountAmount;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: 0,
    discount: parseFloat(discountAmount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
};

/**
 * Check if date is in the future
 */
export const isFutureDate = (date: Date | string): boolean => {
  const targetDate = new Date(date);
  const now = new Date();
  return targetDate > now;
};

/**
 * Check if time is within range
 */
export const isTimeInRange = (
  currentTime: string,
  startTime: string,
  endTime: string
): boolean => {
  const current = new Date(`2000-01-01 ${currentTime}`);
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);

  return current >= start && current <= end;
};

/**
 * Format date to MySQL DATE format (YYYY-MM-DD)
 */
export const toMySQLDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
};

/**
 * Format date to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
 */
export const toMySQLDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * Add days to date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Calculate age from birthdate
 */
export const calculateAge = (birthdate: Date | string): number => {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .toLowerCase();
};

/**
 * Generate session ID
 */
export const generateSessionId = (): string => {
  return `kiosk-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Sleep/delay function
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Remove undefined/null values from object
 */
export const cleanObject = (obj: any): any => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null)
  );
};

/**
 * Build safe UPDATE query with column whitelisting
 * Prevents SQL injection by only allowing whitelisted columns
 *
 * @param updates - Object containing column names and values
 * @param allowedColumns - Array of column names that are allowed to be updated
 * @returns Object with SQL SET clause and values array
 * @throws Error if attempting to update non-whitelisted column
 */
export const buildSafeUpdateQuery = (
  updates: Record<string, any>,
  allowedColumns: string[]
): { setClause: string; values: any[] } => {
  const updateKeys = Object.keys(updates);

  // Validate all update keys are in allowed columns
  const invalidColumns = updateKeys.filter(key => !allowedColumns.includes(key));
  if (invalidColumns.length > 0) {
    throw new Error(`Invalid columns for update: ${invalidColumns.join(', ')}`);
  }

  if (updateKeys.length === 0) {
    throw new Error('No valid columns to update');
  }

  // Build SET clause with whitelisted columns only
  const setClause = updateKeys.map(key => `${key} = ?`).join(', ');
  const values = updateKeys.map(key => updates[key]);

  return { setClause, values };
};

/**
 * Validate date range
 * Ensures start_date is before or equal to end_date
 *
 * @param start_date - Start date string or Date object
 * @param end_date - End date string or Date object
 * @param maxDaysRange - Optional maximum allowed range in days
 * @throws Error if date range is invalid
 */
export const validateDateRange = (
  start_date: string | Date,
  end_date: string | Date,
  maxDaysRange?: number
): void => {
  const start = new Date(start_date);
  const end = new Date(end_date);

  // Check if dates are valid
  if (isNaN(start.getTime())) {
    throw new Error('Invalid start_date');
  }
  if (isNaN(end.getTime())) {
    throw new Error('Invalid end_date');
  }

  // Check if start is before or equal to end
  if (start > end) {
    throw new Error('start_date must be before or equal to end_date');
  }

  // Check max range if specified
  if (maxDaysRange) {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > maxDaysRange) {
      throw new Error(`Date range cannot exceed ${maxDaysRange} days`);
    }
  }
};
