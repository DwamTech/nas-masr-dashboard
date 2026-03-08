import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCachedFetch } from '../useCachedFetch';
import { cache } from '@/utils/cache';

describe('useCachedFetch', () => {
    beforeEach(() => {
        cache.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        cache.clear();
    });

    it('should fetch data when cache is empty', async () => {
        const mockData = { id: 1, name: 'Test' };
        const fetcher = vi.fn().mockResolvedValue(mockData);

        const { result } = renderHook(() =>
            useCachedFetch('test-key', fetcher, 1000)
        );

        // Initially loading
        expect(result.current.loading).toBe(true);
        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(null);

        // Wait for data to load
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual(mockData);
        expect(result.current.error).toBe(null);
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should return cached data immediately if available', async () => {
        const mockData = { id: 1, name: 'Cached' };
        cache.set('test-key', mockData, 1000);

        const fetcher = vi.fn().mockResolvedValue({ id: 2, name: 'Fresh' });

        const { result } = renderHook(() =>
            useCachedFetch('test-key', fetcher, 1000)
        );

        // Should return cached data immediately
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual(mockData);
        expect(fetcher).not.toHaveBeenCalled();
    });

    it('should handle fetch errors', async () => {
        const mockError = new Error('Fetch failed');
        const fetcher = vi.fn().mockRejectedValue(mockError);

        const { result } = renderHook(() =>
            useCachedFetch('test-key', fetcher, 1000)
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBe(null);
        expect(result.current.error).toEqual(mockError);
    });

    it('should refetch data and invalidate cache when refetch is called', async () => {
        const initialData = { id: 1, name: 'Initial' };
        const refreshedData = { id: 2, name: 'Refreshed' };

        const fetcher = vi.fn()
            .mockResolvedValueOnce(initialData)
            .mockResolvedValueOnce(refreshedData);

        const { result } = renderHook(() =>
            useCachedFetch('test-key', fetcher, 1000)
        );

        // Wait for initial load
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual(initialData);
        expect(fetcher).toHaveBeenCalledTimes(1);

        // Call refetch wrapped in act
        await act(async () => {
            await result.current.refetch();
        });

        expect(result.current.data).toEqual(refreshedData);
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should set loading to true during refetch', async () => {
        const mockData = { id: 1, name: 'Test' };
        let resolvePromise: (value: any) => void;
        const delayedPromise = new Promise((resolve) => {
            resolvePromise = resolve;
        });

        const fetcher = vi.fn()
            .mockResolvedValueOnce(mockData)
            .mockImplementationOnce(() => delayedPromise);

        const { result } = renderHook(() =>
            useCachedFetch('test-key', fetcher, 1000)
        );

        // Wait for initial load
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Start refetch (don't await yet)
        act(() => {
            result.current.refetch();
        });

        // Should be loading during refetch
        await waitFor(() => {
            expect(result.current.loading).toBe(true);
        });

        // Resolve the promise
        act(() => {
            resolvePromise!(mockData);
        });

        // Should finish loading
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
    });

    it('should handle refetch errors', async () => {
        const initialData = { id: 1, name: 'Initial' };
        const mockError = new Error('Refetch failed');

        const fetcher = vi.fn()
            .mockResolvedValueOnce(initialData)
            .mockRejectedValueOnce(mockError);

        const { result } = renderHook(() =>
            useCachedFetch('test-key', fetcher, 1000)
        );

        // Wait for initial load
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual(initialData);
        expect(result.current.error).toBe(null);

        // Call refetch which will fail
        await act(async () => {
            await result.current.refetch();
        });

        expect(result.current.error).toEqual(mockError);
    });

    it('should cache fetched data with correct stale time', async () => {
        const mockData = { id: 1, name: 'Test' };
        const fetcher = vi.fn().mockResolvedValue(mockData);
        const staleTime = 5000;

        renderHook(() =>
            useCachedFetch('test-key', fetcher, staleTime)
        );

        await waitFor(() => {
            expect(cache.has('test-key')).toBe(true);
        });

        // Verify data is in cache
        const cachedData = cache.get('test-key');
        expect(cachedData).toEqual(mockData);
    });

    it('should not fetch if cache is still valid', async () => {
        const mockData = { id: 1, name: 'Cached' };
        cache.set('test-key', mockData, 10000); // 10 seconds

        const fetcher = vi.fn();

        const { result } = renderHook(() =>
            useCachedFetch('test-key', fetcher, 10000)
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual(mockData);
        expect(fetcher).not.toHaveBeenCalled();
    });

    it('should cleanup on unmount', async () => {
        const mockData = { id: 1, name: 'Test' };
        const fetcher = vi.fn().mockResolvedValue(mockData);

        const { unmount } = renderHook(() =>
            useCachedFetch('test-key', fetcher, 1000)
        );

        // Unmount before fetch completes
        unmount();

        // Wait a bit to ensure fetch would have completed
        await new Promise(resolve => setTimeout(resolve, 100));

        // Should not throw errors or update state after unmount
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple concurrent fetches for same key', async () => {
        const mockData = { id: 1, name: 'Test' };
        const fetcher = vi.fn().mockResolvedValue(mockData);

        const { result: result1 } = renderHook(() =>
            useCachedFetch('test-key', fetcher, 1000)
        );

        const { result: result2 } = renderHook(() =>
            useCachedFetch('test-key', fetcher, 1000)
        );

        await waitFor(() => {
            expect(result1.current.loading).toBe(false);
            expect(result2.current.loading).toBe(false);
        });

        // Both should have the same data
        expect(result1.current.data).toEqual(mockData);
        expect(result2.current.data).toEqual(mockData);
    });

    it('should clear error on successful refetch', async () => {
        const mockError = new Error('Initial error');
        const mockData = { id: 1, name: 'Success' };

        const fetcher = vi.fn()
            .mockRejectedValueOnce(mockError)
            .mockResolvedValueOnce(mockData);

        const { result } = renderHook(() =>
            useCachedFetch('test-key', fetcher, 1000)
        );

        // Wait for initial error
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toEqual(mockError);
        expect(result.current.data).toBe(null);

        // Refetch should succeed
        await act(async () => {
            await result.current.refetch();
        });

        expect(result.current.data).toEqual(mockData);
        expect(result.current.error).toBe(null);
    });
});
