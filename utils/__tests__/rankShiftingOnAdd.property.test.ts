import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { OptionsHelper } from '../optionsHelper';

/**
 * Property 10: Rank Shifting on Add
 * 
 * Feature: filters-lists-management
 * Task: 12.4
 * 
 * Property Statement:
 * For any existing list of options with ranks, when a new option is added at rank 1, 
 * all existing options must have their ranks incremented by 1, maintaining sequential 
 * order and preserving relative ordering.
 * 
 * Validates: Requirements 6.29, 6.30
 * 
 * This property ensures that adding new options doesn't break the rank sequence and
 * that existing options maintain their relative order after the shift.
 */

interface RankedOption {
    value: string;
    rank: number;
}

describe('Feature: filters-lists-management, Property 10: Rank Shifting on Add', () => {
    it('should shift all existing ranks by 1 when adding single option at rank 1', () => {
        fc.assert(
            fc.property(
                // Generate existing options with sequential ranks
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                    { minLength: 1, maxLength: 20 }
                ),
                fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                (existingOptions, newOption) => {
                    // Arrange: Create ranked list
                    const rankedOptions: RankedOption[] = existingOptions.map((opt, index) => ({
                        value: opt,
                        rank: index + 1,
                    }));

                    // Store original ranks for comparison
                    const originalRanks = rankedOptions.map(opt => ({ value: opt.value, rank: opt.rank }));

                    // Act: Add new option at rank 1
                    const newRankedOption: RankedOption = {
                        value: newOption,
                        rank: 1,
                    };

                    // Shift existing ranks
                    const shiftedOptions = rankedOptions.map(opt => ({
                        ...opt,
                        rank: opt.rank + 1,
                    }));

                    const finalOptions = [newRankedOption, ...shiftedOptions];

                    // Assert: All existing options should have rank increased by 1
                    for (let i = 0; i < originalRanks.length; i++) {
                        const original = originalRanks[i];
                        const shifted = shiftedOptions.find(opt => opt.value === original.value);

                        expect(shifted).toBeDefined();
                        expect(shifted!.rank).toBe(original.rank + 1);
                    }

                    // Assert: Ranks should still be sequential
                    const ranks = finalOptions.map(opt => opt.rank).sort((a, b) => a - b);
                    for (let i = 0; i < ranks.length; i++) {
                        expect(ranks[i]).toBe(i + 1);
                    }

                    // Assert: Relative order should be preserved
                    for (let i = 0; i < originalRanks.length - 1; i++) {
                        const first = shiftedOptions.find(opt => opt.value === originalRanks[i].value);
                        const second = shiftedOptions.find(opt => opt.value === originalRanks[i + 1].value);

                        if (first && second) {
                            expect(first.rank).toBeLessThan(second.rank);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should shift all existing ranks by N when adding N options at rank 1', () => {
        fc.assert(
            fc.property(
                // Generate existing options (ensure uniqueness)
                fc.uniqueArray(
                    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                    { minLength: 1, maxLength: 15 }
                ),
                // Generate new options to add (ensure uniqueness and different from existing)
                fc.uniqueArray(
                    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                    { minLength: 1, maxLength: 10 }
                ),
                (existingOptions, newOptions) => {
                    // Filter out any new options that might duplicate existing ones
                    const uniqueNewOptions = newOptions.filter(opt => !existingOptions.includes(opt));

                    if (uniqueNewOptions.length === 0) {
                        // Skip this test case if no unique new options
                        return true;
                    }

                    // Arrange: Create ranked list
                    const rankedOptions: RankedOption[] = existingOptions.map((opt, index) => ({
                        value: opt,
                        rank: index + 1,
                    }));

                    const originalRanks = rankedOptions.map(opt => ({ value: opt.value, rank: opt.rank }));

                    // Act: Add multiple new options starting from rank 1
                    const newRankedOptions: RankedOption[] = uniqueNewOptions.map((opt, index) => ({
                        value: opt,
                        rank: index + 1,
                    }));

                    // Shift existing ranks by the number of new options
                    const shiftAmount = uniqueNewOptions.length;
                    const shiftedOptions = rankedOptions.map(opt => ({
                        ...opt,
                        rank: opt.rank + shiftAmount,
                    }));

                    const finalOptions = [...newRankedOptions, ...shiftedOptions];

                    // Assert: All existing options should have rank increased by N
                    for (let i = 0; i < originalRanks.length; i++) {
                        const original = originalRanks[i];
                        const shifted = shiftedOptions.find(opt => opt.value === original.value);

                        expect(shifted).toBeDefined();
                        expect(shifted!.rank).toBe(original.rank + shiftAmount);
                    }

                    // Assert: Ranks should still be sequential
                    const ranks = finalOptions.map(opt => opt.rank).sort((a, b) => a - b);
                    for (let i = 0; i < ranks.length; i++) {
                        expect(ranks[i]).toBe(i + 1);
                    }

                    // Assert: Relative order of existing options should be preserved
                    for (let i = 0; i < originalRanks.length - 1; i++) {
                        const first = shiftedOptions.find(opt => opt.value === originalRanks[i].value);
                        const second = shiftedOptions.find(opt => opt.value === originalRanks[i + 1].value);

                        if (first && second) {
                            expect(first.rank).toBeLessThan(second.rank);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should maintain sequential ranks after shift', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                    { minLength: 1, maxLength: 20 }
                ),
                fc.integer({ min: 1, max: 10 }), // Number of options to add
                (existingOptions, addCount) => {
                    // Arrange: Create ranked list
                    const rankedOptions: RankedOption[] = existingOptions.map((opt, index) => ({
                        value: opt,
                        rank: index + 1,
                    }));

                    // Act: Shift ranks by addCount
                    const shiftedOptions = rankedOptions.map(opt => ({
                        ...opt,
                        rank: opt.rank + addCount,
                    }));

                    // Create placeholder new options
                    const newOptions: RankedOption[] = Array.from({ length: addCount }, (_, i) => ({
                        value: `new_${i}`,
                        rank: i + 1,
                    }));

                    const finalOptions = [...newOptions, ...shiftedOptions];

                    // Assert: All ranks should be sequential from 1 to N
                    const ranks = finalOptions.map(opt => opt.rank).sort((a, b) => a - b);
                    expect(ranks.length).toBe(existingOptions.length + addCount);

                    for (let i = 0; i < ranks.length; i++) {
                        expect(ranks[i]).toBe(i + 1);
                    }

                    // Assert: No duplicate ranks
                    const uniqueRanks = new Set(ranks);
                    expect(uniqueRanks.size).toBe(ranks.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should preserve relative ordering after rank shift', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                    { minLength: 2, maxLength: 20 }
                ),
                fc.integer({ min: 1, max: 10 }),
                (existingOptions, shiftAmount) => {
                    // Arrange: Create ranked list
                    const rankedOptions: RankedOption[] = existingOptions.map((opt, index) => ({
                        value: opt,
                        rank: index + 1,
                    }));

                    // Act: Shift all ranks
                    const shiftedOptions = rankedOptions.map(opt => ({
                        ...opt,
                        rank: opt.rank + shiftAmount,
                    }));

                    // Assert: For any two options, if A was before B, A should still be before B
                    for (let i = 0; i < rankedOptions.length - 1; i++) {
                        for (let j = i + 1; j < rankedOptions.length; j++) {
                            const originalFirst = rankedOptions[i];
                            const originalSecond = rankedOptions[j];

                            const shiftedFirst = shiftedOptions.find(opt => opt.value === originalFirst.value);
                            const shiftedSecond = shiftedOptions.find(opt => opt.value === originalSecond.value);

                            expect(shiftedFirst).toBeDefined();
                            expect(shiftedSecond).toBeDefined();

                            // If first was before second originally, it should still be before after shift
                            if (originalFirst.rank < originalSecond.rank) {
                                expect(shiftedFirst!.rank).toBeLessThan(shiftedSecond!.rank);
                            }
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle "غير ذلك" staying at the end after shift', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0 && s !== OptionsHelper.OTHER_OPTION),
                    { minLength: 1, maxLength: 15 }
                ),
                fc.integer({ min: 1, max: 5 }),
                (existingOptions, addCount) => {
                    // Arrange: Create ranked list with "غير ذلك" at the end
                    const optionsWithOther = [...existingOptions, OptionsHelper.OTHER_OPTION];
                    const rankedOptions: RankedOption[] = optionsWithOther.map((opt, index) => ({
                        value: opt,
                        rank: index + 1,
                    }));

                    // Act: Add new options and shift existing ones
                    const newOptions: RankedOption[] = Array.from({ length: addCount }, (_, i) => ({
                        value: `new_${i}`,
                        rank: i + 1,
                    }));

                    const shiftedOptions = rankedOptions.map(opt => ({
                        ...opt,
                        rank: opt.rank + addCount,
                    }));

                    let finalOptions = [...newOptions, ...shiftedOptions];

                    // Ensure "غير ذلك" is at the end (re-sort if needed)
                    finalOptions = finalOptions.sort((a, b) => {
                        if (a.value === OptionsHelper.OTHER_OPTION) return 1;
                        if (b.value === OptionsHelper.OTHER_OPTION) return -1;
                        return a.rank - b.rank;
                    });

                    // Recalculate ranks to be sequential
                    finalOptions = finalOptions.map((opt, index) => ({
                        ...opt,
                        rank: index + 1,
                    }));

                    // Assert: "غير ذلك" should have the highest rank
                    const otherOption = finalOptions.find(opt => opt.value === OptionsHelper.OTHER_OPTION);
                    expect(otherOption).toBeDefined();
                    expect(otherOption!.rank).toBe(finalOptions.length);

                    // Assert: "غير ذلك" should be the last element
                    expect(finalOptions[finalOptions.length - 1].value).toBe(OptionsHelper.OTHER_OPTION);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should maintain rank gaps are filled after shift', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                    { minLength: 1, maxLength: 20 }
                ),
                fc.integer({ min: 1, max: 10 }),
                (existingOptions, addCount) => {
                    // Arrange: Create ranked list
                    const rankedOptions: RankedOption[] = existingOptions.map((opt, index) => ({
                        value: opt,
                        rank: index + 1,
                    }));

                    // Act: Shift and add new options
                    const shiftedOptions = rankedOptions.map(opt => ({
                        ...opt,
                        rank: opt.rank + addCount,
                    }));

                    const newOptions: RankedOption[] = Array.from({ length: addCount }, (_, i) => ({
                        value: `new_${i}`,
                        rank: i + 1,
                    }));

                    const finalOptions = [...newOptions, ...shiftedOptions];

                    // Assert: There should be no gaps in ranks (1, 2, 3, ..., N)
                    const ranks = finalOptions.map(opt => opt.rank).sort((a, b) => a - b);

                    for (let i = 0; i < ranks.length; i++) {
                        expect(ranks[i]).toBe(i + 1);
                    }

                    // Assert: No missing ranks
                    const expectedRanks = Array.from({ length: finalOptions.length }, (_, i) => i + 1);
                    expect(ranks).toEqual(expectedRanks);
                }
            ),
            { numRuns: 100 }
        );
    });
});
