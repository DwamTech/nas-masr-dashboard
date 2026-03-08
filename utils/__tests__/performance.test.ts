/**
 * Tests for Performance Utilities
 * 
 * Task 21.4: Write performance tests
 * 
 * Tests debouncing and throttling behavior
 * 
 * Requirements: 12.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, throttle, debounceCancellable } from '../performance';

describe('Performance Utilities - Task 21.3, 21.4', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('debounce', () => {
        it('should delay function execution', () => {
            const mockFn = vi.fn();
            const debounced = debounce(mockFn, 300);

            debounced('test');
            expect(mockFn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(299);
            expect(mockFn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(1);
            expect(mockFn).toHaveBeenCalledWith('test');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('should reset delay on subsequent calls', () => {
            const mockFn = vi.fn();
            const debounced = debounce(mockFn, 300);

            debounced('first');
            vi.advanceTimersByTime(200);

            debounced('second');
            vi.advanceTimersByTime(200);

            debounced('third');
            vi.advanceTimersByTime(299);
            expect(mockFn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(1);
            expect(mockFn).toHaveBeenCalledWith('third');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('should execute only once after multiple rapid calls', () => {
            const mockFn = vi.fn();
            const debounced = debounce(mockFn, 300);

            // Rapid calls
            for (let i = 0; i < 10; i++) {
                debounced(`call-${i}`);
            }

            expect(mockFn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(300);
            expect(mockFn).toHaveBeenCalledTimes(1);
            expect(mockFn).toHaveBeenCalledWith('call-9'); // Last call
        });

        it('should handle multiple separate invocations', () => {
            const mockFn = vi.fn();
            const debounced = debounce(mockFn, 300);

            debounced('first');
            vi.advanceTimersByTime(300);
            expect(mockFn).toHaveBeenCalledWith('first');

            debounced('second');
            vi.advanceTimersByTime(300);
            expect(mockFn).toHaveBeenCalledWith('second');

            expect(mockFn).toHaveBeenCalledTimes(2);
        });

        it('should preserve function arguments', () => {
            const mockFn = vi.fn();
            const debounced = debounce(mockFn, 300);

            debounced('arg1', 'arg2', 'arg3');
            vi.advanceTimersByTime(300);

            expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
        });
    });

    describe('throttle', () => {
        it('should execute immediately on first call', () => {
            const mockFn = vi.fn();
            const throttled = throttle(mockFn, 16);

            throttled('test');
            expect(mockFn).toHaveBeenCalledWith('test');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('should limit execution rate', () => {
            const mockFn = vi.fn();
            const throttled = throttle(mockFn, 16);

            // First call executes immediately
            throttled('call-1');
            expect(mockFn).toHaveBeenCalledTimes(1);

            // Subsequent calls within throttle period are queued
            throttled('call-2');
            throttled('call-3');
            expect(mockFn).toHaveBeenCalledTimes(1);

            // After throttle period, last queued call executes
            vi.advanceTimersByTime(16);
            expect(mockFn).toHaveBeenCalledTimes(2);
            expect(mockFn).toHaveBeenLastCalledWith('call-3');
        });

        it('should execute at most once per time interval', () => {
            const mockFn = vi.fn();
            const throttled = throttle(mockFn, 16);

            // Simulate 60fps drag events (16ms intervals)
            for (let i = 0; i < 10; i++) {
                throttled(`frame-${i}`);
                vi.advanceTimersByTime(5); // 5ms between calls
            }

            // Should have executed fewer times than total calls
            expect(mockFn.mock.calls.length).toBeLessThan(10);
        });

        it('should execute last call after throttle period', () => {
            const mockFn = vi.fn();
            const throttled = throttle(mockFn, 16);

            throttled('first');
            expect(mockFn).toHaveBeenCalledWith('first');

            throttled('second');
            throttled('third');
            throttled('fourth');

            vi.advanceTimersByTime(16);
            expect(mockFn).toHaveBeenLastCalledWith('fourth');
        });

        it('should handle continuous calls over time', () => {
            const mockFn = vi.fn();
            const throttled = throttle(mockFn, 16);

            // First batch
            throttled('batch-1-call-1');
            throttled('batch-1-call-2');
            expect(mockFn).toHaveBeenCalledTimes(1);

            vi.advanceTimersByTime(16);
            expect(mockFn).toHaveBeenCalledTimes(2);

            // Second batch
            throttled('batch-2-call-1');
            throttled('batch-2-call-2');
            expect(mockFn).toHaveBeenCalledTimes(3);

            vi.advanceTimersByTime(16);
            expect(mockFn).toHaveBeenCalledTimes(4);
        });

        it('should preserve function arguments', () => {
            const mockFn = vi.fn();
            const throttled = throttle(mockFn, 16);

            throttled('arg1', 'arg2', 'arg3');
            expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
        });
    });

    describe('debounceCancellable', () => {
        it('should support cancellation', () => {
            const mockFn = vi.fn();
            const debounced = debounceCancellable(mockFn, 300);

            debounced('test');
            expect(mockFn).not.toHaveBeenCalled();

            debounced.cancel();
            vi.advanceTimersByTime(300);

            expect(mockFn).not.toHaveBeenCalled();
        });

        it('should work like regular debounce when not cancelled', () => {
            const mockFn = vi.fn();
            const debounced = debounceCancellable(mockFn, 300);

            debounced('test');
            vi.advanceTimersByTime(300);

            expect(mockFn).toHaveBeenCalledWith('test');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('should allow cancellation between calls', () => {
            const mockFn = vi.fn();
            const debounced = debounceCancellable(mockFn, 300);

            debounced('first');
            vi.advanceTimersByTime(200);
            debounced.cancel();

            debounced('second');
            vi.advanceTimersByTime(300);

            expect(mockFn).toHaveBeenCalledWith('second');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });
    });

    describe('Real-world scenarios', () => {
        it('should debounce bulk input parsing (300ms)', () => {
            const parseBulkInput = vi.fn();
            const debouncedParse = debounce(parseBulkInput, 300);

            // Simulate user typing
            debouncedParse('option1');
            vi.advanceTimersByTime(100);
            debouncedParse('option1, option2');
            vi.advanceTimersByTime(100);
            debouncedParse('option1, option2, option3');

            // Should not have parsed yet
            expect(parseBulkInput).not.toHaveBeenCalled();

            // After 300ms from last input
            vi.advanceTimersByTime(300);
            expect(parseBulkInput).toHaveBeenCalledWith('option1, option2, option3');
            expect(parseBulkInput).toHaveBeenCalledTimes(1);
        });

        it('should throttle drag move events (16ms for 60fps)', () => {
            const handleDragMove = vi.fn();
            const throttledDragMove = throttle(handleDragMove, 16);

            // Simulate rapid drag events (every 5ms)
            for (let i = 0; i < 20; i++) {
                throttledDragMove({ x: i * 10, y: i * 10 });
                vi.advanceTimersByTime(5);
            }

            // Should have executed significantly fewer times than 20
            expect(handleDragMove.mock.calls.length).toBeLessThan(20);
            // But should have executed multiple times (not just once)
            expect(handleDragMove.mock.calls.length).toBeGreaterThan(1);
        });
    });
});
