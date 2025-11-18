import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Type guard to check if result is an array of rows
 */
export function isRowDataPacket(result: any): result is RowDataPacket[] {
  return Array.isArray(result);
}

/**
 * Type guard to check if result is a single row
 */
export function isSingleRow<T>(result: any): result is T {
  return result !== null && result !== undefined && !Array.isArray(result);
}

/**
 * Type guard for ResultSetHeader (INSERT, UPDATE, DELETE results)
 */
export function isResultSetHeader(result: any): result is ResultSetHeader {
  return result && 'affectedRows' in result;
}

/**
 * Safely get first row from query result
 */
export function getFirstRow<T>(result: any): T | null {
  if (Array.isArray(result) && result.length > 0) {
    return result[0] as T;
  }
  return null;
}

/**
 * Safely get all rows from query result
 */
export function getAllRows<T>(result: any): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }
  return [];
}

/**
 * Get insert ID from result
 */
export function getInsertId(result: any): number {
  if (isResultSetHeader(result)) {
    return result.insertId;
  }
  if (result && typeof result.insertId === 'number') {
    return result.insertId;
  }
  return 0;
}

/**
 * Parse query parameters to numbers safely
 * Uses Number.isFinite() to catch NaN, Infinity, and -Infinity
 */
export function parseQueryNumber(value: any, defaultValue: number = 0): number {
  const parsed = parseInt(value as string, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : defaultValue;
}

/**
 * Parse query parameters to boolean safely
 */
export function parseQueryBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return false;
}

/**
 * Safely extract string from query param
 */
export function parseQueryString(value: any, defaultValue: string = ''): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] || defaultValue;
  return defaultValue;
}
