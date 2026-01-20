import logger from './logger';

export interface RetryOptions {
  retries?: number;
  initialDelay?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

/**
 * A generic retry utility with exponential backoff and jitter.
 * @param fn The async function to execute.
 * @param options Configuration for the retry mechanism.
 * @returns The result of the function `fn`.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    initialDelay = 1000,
    shouldRetry = () => true,
    onRetry,
  } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn(); // Attempt the function call
    } catch (error) {
      if (attempt === retries || !shouldRetry(error)) {
        throw error; // On last attempt or if error is not retryable, re-throw
      }

      if (onRetry) onRetry(error, attempt);

      const delay = initialDelay * Math.pow(2, attempt - 1) + (Math.random() * 500);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This line should be unreachable, but it satisfies TypeScript's return path analysis.
  throw new Error('Retry logic failed unexpectedly.');
}