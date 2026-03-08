import { useState, useEffect, useCallback } from 'react';
import { cache } from '@/utils/cache';

/**
 * Custom hook for data fetching with cache support
 * 
 * This hook implements a cache-first strategy:
 * - Checks cache first before fetching
 * - Returns cached data immediately if available
 * - Fetches fresh data if cache is stale or empty
 * - Provides refetch functionality for manual cache invalidation
 * - Manages loading and error states
 * 
 * @template T - Type of data being fetched
 * @param key - Cache key for storing/retrieving data
 * @param fetcher - Async function that fetches the data
 * @param staleTime - Time in milliseconds before cached data becomes stale
 * @returns Object containing data, loading state, error state, and refetch function
 * 
 * @example
 * ```typescript
 * const { data, loading, error, refetch } = useCachedFetch(
 *   'categories',
 *   () => fetchCategories(),
 *   CACHE_TIMES.CATEGORIES
 * );
 * ```
 */
export function useCachedFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    staleTime: number
): {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
} {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;

        async function load() {
            // Check cache first
            const cached = cache.get<T>(key);
            if (cached) {
                if (mounted) {
                    setData(cached);
                    setLoading(false);
                }
                return;
            }

            // Fetch fresh data if cache miss
            try {
                const result = await fetcher();
                if (mounted) {
                    cache.set(key, result, staleTime);
                    setData(result);
                    setError(null);
                }
            } catch (err) {
                if (mounted) {
                    setError(err as Error);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            mounted = false;
        };
    }, [key, staleTime]);

    /**
     * Manually refetch data and invalidate cache
     * Useful for forcing a refresh after mutations
     */
    const refetch = useCallback(async () => {
        setLoading(true);
        cache.invalidate(key);

        try {
            const result = await fetcher();
            cache.set(key, result, staleTime);
            setData(result);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [key, fetcher, staleTime]);

    return { data, loading, error, refetch };
}
