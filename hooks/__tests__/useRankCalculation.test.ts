import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRankCalculation } from '../useRankCalculation';

describe('useRankCalculation', () => {
    describe('calculateRanks', () => {
        it('should calculate sequential ranks starting from 1', () => {
            const { result } = renderHook(() => useRankCalculation());
            const options = ['Option 1', 'Option 2', 'Option 3'];

            const ranks = result.current.calculateRanks(options);

            expect(ranks).toEqual([
                { option: 'Option 1', rank: 1 },
                { option: 'Option 2', rank: 2 },
                { option: 'Option 3', rank: 3 },
            ]);
        });

        it('should ensure "غير ذلك" gets the highest rank', () => {
            const { result } = renderHook(() => useRankCalculation());
            const options = ['Option 1', 'غير ذلك', 'Option 2'];

            const ranks = result.current.calculateRanks(options);

            // Find "غير ذلك" rank
            const otherRank = ranks.find(r => r.option === 'غير ذلك')?.rank;
            expect(otherRank).toBe(2); // Position 2 in the array

            // Verify sequential ranks
            expect(ranks).toEqual([
                { option: 'Option 1', rank: 1 },
                { option: 'غير ذلك', rank: 2 },
                { option: 'Option 2', rank: 3 },
            ]);
        });

        it('should handle empty array', () => {
            const { result } = renderHook(() => useRankCalculation());
            const options: string[] = [];

            const ranks = result.current.calculateRanks(options);

            expect(ranks).toEqual([]);
        });

        it('should handle single option', () => {
            const { result } = renderHook(() => useRankCalculation());
            const options = ['Only Option'];

            const ranks = result.current.calculateRanks(options);

            expect(ranks).toEqual([
                { option: 'Only Option', rank: 1 },
            ]);
        });
    });

    describe('ensureOtherIsLast', () => {
        it('should move "غير ذلك" to the end if not already there', () => {
            const { result } = renderHook(() => useRankCalculation());
            const options = ['Option 1', 'غير ذلك', 'Option 2'];

            const reordered = result.current.ensureOtherIsLast(options);

            expect(reordered).toEqual(['Option 1', 'Option 2', 'غير ذلك']);
            expect(reordered[reordered.length - 1]).toBe('غير ذلك');
        });

        it('should not modify array if "غير ذلك" is already last', () => {
            const { result } = renderHook(() => useRankCalculation());
            const options = ['Option 1', 'Option 2', 'غير ذلك'];

            const reordered = result.current.ensureOtherIsLast(options);

            expect(reordered).toEqual(['Option 1', 'Option 2', 'غير ذلك']);
        });

        it('should return array unchanged if "غير ذلك" is not present', () => {
            const { result } = renderHook(() => useRankCalculation());
            const options = ['Option 1', 'Option 2', 'Option 3'];

            const reordered = result.current.ensureOtherIsLast(options);

            expect(reordered).toEqual(['Option 1', 'Option 2', 'Option 3']);
        });

        it('should handle custom otherOptionLabel', () => {
            const { result } = renderHook(() =>
                useRankCalculation({ otherOptionLabel: 'Other' })
            );
            const options = ['Option 1', 'Other', 'Option 2'];

            const reordered = result.current.ensureOtherIsLast(options);

            expect(reordered).toEqual(['Option 1', 'Option 2', 'Other']);
            expect(reordered[reordered.length - 1]).toBe('Other');
        });

        it('should handle "غير ذلك" at the beginning', () => {
            const { result } = renderHook(() => useRankCalculation());
            const options = ['غير ذلك', 'Option 1', 'Option 2'];

            const reordered = result.current.ensureOtherIsLast(options);

            expect(reordered).toEqual(['Option 1', 'Option 2', 'غير ذلك']);
        });

        it('should handle array with only "غير ذلك"', () => {
            const { result } = renderHook(() => useRankCalculation());
            const options = ['غير ذلك'];

            const reordered = result.current.ensureOtherIsLast(options);

            expect(reordered).toEqual(['غير ذلك']);
        });
    });

    describe('Integration: calculateRanks + ensureOtherIsLast', () => {
        it('should ensure "غير ذلك" has highest rank after reordering', () => {
            const { result } = renderHook(() => useRankCalculation());
            const options = ['Option 1', 'غير ذلك', 'Option 2'];

            // First ensure "غير ذلك" is last
            const reordered = result.current.ensureOtherIsLast(options);

            // Then calculate ranks
            const ranks = result.current.calculateRanks(reordered);

            // Verify "غير ذلك" has the highest rank
            const otherRank = ranks.find(r => r.option === 'غير ذلك')?.rank;
            const maxRank = Math.max(...ranks.map(r => r.rank));

            expect(otherRank).toBe(maxRank);
            expect(otherRank).toBe(3);
        });
    });
});
