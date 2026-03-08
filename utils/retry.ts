/**
 * Retry utility with exponential backoff
 * 
 * This utility provides a retry mechanism for failed operations with exponential backoff.
 * It's particularly useful for network requests that may fail due to temporary issues.
 */

export interface RetryOptions {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: Error, attempt: number) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    shouldRetry: (error: Error) => {
        // Retry on network errors or 5xx server errors
        const message = error.message.toLowerCase();
        return (
            message.includes('network') ||
            message.includes('timeout') ||
            message.includes('fetch') ||
            message.includes('connection')
        );
    },
};

/**
 * Executes an async operation with retry logic and exponential backoff
 * 
 * @param operation - The async operation to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to the operation result
 * @throws The last error if all retry attempts fail
 */
export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const config = { ...DEFAULT_OPTIONS, ...options };
    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Don't retry if this is the last attempt or if shouldRetry returns false
            if (attempt === config.maxAttempts || !config.shouldRetry(lastError, attempt)) {
                throw lastError;
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(
                config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
                config.maxDelay
            );

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
}

/**
 * Creates a retry wrapper for a function
 * 
 * @param fn - The function to wrap with retry logic
 * @param options - Retry configuration options
 * @returns A wrapped function with retry logic
 */
export function withRetry<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
    return (...args: TArgs) => retryWithBackoff(() => fn(...args), options);
}
