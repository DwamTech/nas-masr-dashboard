/**
 * Simple in-memory cache utility for data fetching
 * 
 * This cache implements a stale-time based caching strategy where:
 * - Data is cached with a configurable stale time
 * - Cached data is returned if it's not stale
 * - Stale data is automatically removed
 * - Cache can be invalidated by pattern matching
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    staleTime: number;
}

class SimpleCache {
    private cache = new Map<string, CacheEntry<any>>();

    /**
     * Store data in cache with a stale time
     * @param key - Cache key
     * @param data - Data to cache
     * @param staleTime - Time in milliseconds before data becomes stale
     */
    set<T>(key: string, data: T, staleTime: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            staleTime,
        });
    }

    /**
     * Retrieve data from cache if not stale
     * @param key - Cache key
     * @returns Cached data or null if not found or stale
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) return null;

        const age = Date.now() - entry.timestamp;
        if (age > entry.staleTime) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Invalidate cache entries matching a pattern
     * @param pattern - String pattern to match against cache keys
     */
    invalidate(pattern: string): void {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Check if a key exists in cache and is not stale
     * @param key - Cache key
     * @returns true if key exists and is not stale
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Get all cache keys
     * @returns Array of cache keys
     */
    keys(): string[] {
        return Array.from(this.cache.keys());
    }

    /**
     * Get cache size
     * @returns Number of entries in cache
     */
    size(): number {
        return this.cache.size;
    }
}

// Export singleton instance
export const cache = new SimpleCache();

// Cache time constants (in milliseconds)
export const CACHE_TIMES = {
    CATEGORIES: 15 * 60 * 1000,      // 15 minutes
    CATEGORY_FIELDS: 10 * 60 * 1000, // 10 minutes
    GOVERNORATES: 30 * 60 * 1000,    // 30 minutes
    CITIES: 30 * 60 * 1000,          // 30 minutes
};

// Cache invalidation patterns
export const INVALIDATION_PATTERNS = {
    // Invalidate all category fields when ranks change
    RANK_UPDATE: (categorySlug: string) => `fields:${categorySlug}`,

    // Invalidate specific field when options change
    OPTION_UPDATE: (categorySlug: string, field: string) =>
        `fields:${categorySlug}:${field}`,

    // Invalidate governorates when cities change
    CITY_UPDATE: () => 'governorates',

    // Invalidate all caches (use sparingly)
    ALL: () => '',
};
