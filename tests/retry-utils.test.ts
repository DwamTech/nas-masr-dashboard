import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retryWithBackoff, withRetry } from '@/utils/retry';

describe('Retry Utilities - Exponential Backoff', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('retryWithBackoff', () => {
        it('should succeed on first attempt', async () => {
            const operation = vi.fn().mockResolvedValue('success');

            const result = await retryWithBackoff(operation);

            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should retry on network errors', async () => {
            const operation = vi
                .fn()
                .mockRejectedValueOnce(new Error('network error'))
                .mockResolvedValueOnce('success');

            const promise = retryWithBackoff(operation, { maxAttempts: 3 });

            // Fast-forward through the delay
            await vi.runAllTimersAsync();

            const result = await promise;

            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(2);
        });

        it('should use exponential backoff delays', async () => {
            const operation = vi
                .fn()
                .mockRejectedValueOnce(new Error('network error'))
                .mockRejectedValueOnce(new Error('network error'))
                .mockResolvedValueOnce('success');

            const promise = retryWithBackoff(operation, {
                maxAttempts: 3,
                initialDelay: 1000,
                backoffMultiplier: 2,
            });

            // First retry after 1000ms
            await vi.advanceTimersByTimeAsync(1000);
            expect(operation).toHaveBeenCalledTimes(2);

            // Second retry after 2000ms (exponential backoff)
            await vi.advanceTimersByTimeAsync(2000);
            expect(operation).toHaveBeenCalledTimes(3);

            const result = await promise;
            expect(result).toBe('success');
        });

        it('should respect maxDelay', async () => {
            const operation = vi
                .fn()
                .mockRejectedValueOnce(new Error('network error'))
                .mockRejectedValueOnce(new Error('network error'))
                .mockResolvedValueOnce('success');

            const promise = retryWithBackoff(operation, {
                maxAttempts: 3,
                initialDelay: 1000,
                backoffMultiplier: 10,
                maxDelay: 2000,
            });

            // First retry after 1000ms
            await vi.advanceTimersByTimeAsync(1000);

            // Second retry should be capped at maxDelay (2000ms) instead of 10000ms
            await vi.advanceTimersByTimeAsync(2000);

            const result = await promise;
            expect(result).toBe('success');
        });

        it('should throw error after max attempts', async () => {
            const operation = vi.fn().mockRejectedValue(new Error('network error'));

            const promise = retryWithBackoff(operation, { maxAttempts: 3 });

            await vi.runAllTimersAsync();

            await expect(promise).rejects.toThrow('network error');
            expect(operation).toHaveBeenCalledTimes(3);
        });

        it('should not retry on non-retryable errors', async () => {
            const operation = vi.fn().mockRejectedValue(new Error('validation error'));

            const promise = retryWithBackoff(operation, {
                maxAttempts: 3,
                shouldRetry: (error) => error.message.includes('network'),
            });

            await expect(promise).rejects.toThrow('validation error');
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should use custom shouldRetry function', async () => {
            const operation = vi
                .fn()
                .mockRejectedValueOnce(new Error('500 server error'))
                .mockResolvedValueOnce('success');

            const shouldRetry = vi.fn((error: Error) => {
                return error.message.includes('500');
            });

            const promise = retryWithBackoff(operation, {
                maxAttempts: 3,
                shouldRetry,
            });

            await vi.runAllTimersAsync();

            const result = await promise;
            expect(result).toBe('success');
            expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 1);
        });
    });

    describe('withRetry', () => {
        it('should create a wrapped function with retry logic', async () => {
            const originalFn = vi
                .fn()
                .mockRejectedValueOnce(new Error('network error'))
                .mockResolvedValueOnce('success');

            const wrappedFn = withRetry(originalFn, { maxAttempts: 3 });

            const promise = wrappedFn('arg1', 'arg2');

            await vi.runAllTimersAsync();

            const result = await promise;

            expect(result).toBe('success');
            expect(originalFn).toHaveBeenCalledTimes(2);
            expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
        });

        it('should preserve function arguments', async () => {
            const originalFn = vi.fn().mockResolvedValue('success');

            const wrappedFn = withRetry(originalFn);

            await wrappedFn(1, 'test', { key: 'value' });

            expect(originalFn).toHaveBeenCalledWith(1, 'test', { key: 'value' });
        });
    });
});
