/**
 * Performance Utilities
 * 
 * Task 21.3: Add debouncing and throttling
 * 
 * Provides reusable debounce and throttle functions for performance optimization.
 * 
 * Requirements: 12.3
 */

/**
 * Debounce function
 * 
 * Delays the execution of a function until after a specified delay has elapsed
 * since the last time it was invoked. Useful for expensive operations that
 * shouldn't run on every input change.
 * 
 * @param func - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the function
 * 
 * Example:
 * ```ts
 * const debouncedSearch = debounce((query: string) => {
 *   performSearch(query);
 * }, 300);
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;

    return function debounced(...args: Parameters<T>) {
        // Clear previous timeout
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        // Set new timeout
        timeoutId = setTimeout(() => {
            func(...args);
            timeoutId = null;
        }, delay);
    };
}

/**
 * Throttle function
 * 
 * Ensures a function is called at most once per specified time interval.
 * Useful for rate-limiting expensive operations like scroll or drag handlers.
 * 
 * @param func - The function to throttle
 * @param limit - The minimum time between calls in milliseconds
 * @returns A throttled version of the function
 * 
 * Example:
 * ```ts
 * const throttledScroll = throttle((event: Event) => {
 *   handleScroll(event);
 * }, 16); // 60fps
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;
    let lastArgs: Parameters<T> | null = null;

    return function throttled(...args: Parameters<T>) {
        if (!inThrottle) {
            // Execute immediately
            func(...args);
            inThrottle = true;

            // Reset throttle after limit
            setTimeout(() => {
                inThrottle = false;

                // Execute with last args if there were additional calls
                if (lastArgs !== null) {
                    func(...lastArgs);
                    lastArgs = null;
                }
            }, limit);
        } else {
            // Store last args for execution after throttle period
            lastArgs = args;
        }
    };
}

/**
 * Cancel a debounced or throttled function
 * 
 * Note: This is a helper type for functions that support cancellation.
 * The actual implementation would need to be extended to support this.
 */
export interface CancellableFunction<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): void;
    cancel: () => void;
}

/**
 * Debounce with cancellation support
 * 
 * Similar to debounce but returns a function with a cancel method
 * to clear pending executions.
 */
export function debounceCancellable<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): CancellableFunction<T> {
    let timeoutId: NodeJS.Timeout | null = null;

    const debounced = function (...args: Parameters<T>) {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            func(...args);
            timeoutId = null;
        }, delay);
    } as CancellableFunction<T>;

    debounced.cancel = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debounced;
}
