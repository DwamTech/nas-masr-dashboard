/**
 * Property-Based Test for "غير ذلك" Position Invariant
 * 
 * Task 7.3: Write property test for "غير ذلك" position invariant
 * **Property 5: "غير ذلك" Position Invariant**
 * **Validates: Requirements 4.22, 7.4, 7.7**
 * 
 * Feature: filters-lists-management
 * Spec Path: .kiro/specs/filters-lists-management
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { OptionsHelper, OTHER_OPTION } from '../optionsHelper';

describe('Property 5: "غير ذلك" Position Invariant', () => {
    /**
     * Property: For any list of options (independent or hierarchical, parent or 
     * child level) containing "غير ذلك", that option must always have the highest 
     * rank value and appear last in the sorted list, regardless of any add, edit, 
     * or reorder operations.
     * 
     * This property validates that:
     * 1. "غير ذلك" always appears at the last position after processing
     * 2. Multiple occurrences of "غير ذلك" are consolidated into a single instance at the end
     * 3. Other options maintain their relative order
     * 4. The invariant holds regardless of initial position of "غير ذلك"
     */

    it('Property: "غير ذلك" always appears at the last position after ensureOtherIsLast', () => {
        fc.assert(
            fc.property(
                // Generator: array of options with "غير ذلك" at various positions
                fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 50 }),
                fc.integer({ min: 0, max: 100 }),
                (options, insertPosition) => {
                    // Remove any existing "غير ذلك" from generated options
                    const cleanedOptions = options.filter(opt => opt !== OTHER_OPTION);

                    if (cleanedOptions.length === 0) {
                        // Edge case: empty list
                        const testOptions = [OTHER_OPTION];
                        const result = OptionsHelper.ensureOtherIsLast(testOptions);

                        expect(result.length).toBe(1);
                        expect(result[0]).toBe(OTHER_OPTION);
                        return;
                    }

                    // Insert "غير ذلك" at a random position
                    const position = insertPosition % (cleanedOptions.length + 1);
                    const testOptions = [
                        ...cleanedOptions.slice(0, position),
                        OTHER_OPTION,
                        ...cleanedOptions.slice(position)
                    ];

                    // Act: Apply ensureOtherIsLast
                    const result = OptionsHelper.ensureOtherIsLast(testOptions);

                    // Assert: "غير ذلك" must be at the last position
                    expect(result[result.length - 1]).toBe(OTHER_OPTION);

                    // Assert: All other options are preserved
                    expect(result.length).toBe(cleanedOptions.length + 1);

                    // Assert: Other options maintain their relative order
                    const resultWithoutOther = result.slice(0, -1);
                    expect(resultWithoutOther).toEqual(cleanedOptions);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Multiple occurrences of "غير ذلك" are consolidated into a single instance at the end', () => {
        fc.assert(
            fc.property(
                // Generator: array of options
                fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 30 }),
                // Number of "غير ذلك" copies to insert
                fc.integer({ min: 2, max: 5 }),
                (options, otherCount) => {
                    // Remove any existing "غير ذلك"
                    const cleanedOptions = options.filter(opt => opt !== OTHER_OPTION);

                    if (cleanedOptions.length === 0) {
                        // Edge case: only "غير ذلك" copies
                        const testOptions = Array(otherCount).fill(OTHER_OPTION);
                        const result = OptionsHelper.ensureOtherIsLast(testOptions);

                        // Should consolidate to single "غير ذلك"
                        expect(result.length).toBe(1);
                        expect(result[0]).toBe(OTHER_OPTION);
                        return;
                    }

                    // Insert multiple "غير ذلك" at random positions
                    const testOptions = [...cleanedOptions];
                    for (let i = 0; i < otherCount; i++) {
                        const randomPos = Math.floor(Math.random() * (testOptions.length + 1));
                        testOptions.splice(randomPos, 0, OTHER_OPTION);
                    }

                    // Act: Apply ensureOtherIsLast
                    const result = OptionsHelper.ensureOtherIsLast(testOptions);

                    // Assert: Only one "غير ذلك" exists
                    const otherOccurrences = result.filter(opt => opt === OTHER_OPTION);
                    expect(otherOccurrences.length).toBe(1);

                    // Assert: "غير ذلك" is at the last position
                    expect(result[result.length - 1]).toBe(OTHER_OPTION);

                    // Assert: All other options are preserved
                    expect(result.length).toBe(cleanedOptions.length + 1);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: "غير ذلك" at the beginning moves to the end', () => {
        fc.assert(
            fc.property(
                // Generator: array of options without "غير ذلك"
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 })
                        .filter(str => str !== OTHER_OPTION),
                    { minLength: 1, maxLength: 30 }
                ),
                (options) => {
                    // Place "غير ذلك" at the beginning
                    const testOptions = [OTHER_OPTION, ...options];

                    // Act: Apply ensureOtherIsLast
                    const result = OptionsHelper.ensureOtherIsLast(testOptions);

                    // Assert: "غير ذلك" moved to the end
                    expect(result[result.length - 1]).toBe(OTHER_OPTION);
                    expect(result[0]).not.toBe(OTHER_OPTION);

                    // Assert: Other options maintain their relative order
                    const resultWithoutOther = result.slice(0, -1);
                    expect(resultWithoutOther).toEqual(options);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: "غير ذلك" in the middle moves to the end', () => {
        fc.assert(
            fc.property(
                // Generator: array of options without "غير ذلك"
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 })
                        .filter(str => str !== OTHER_OPTION),
                    { minLength: 2, maxLength: 30 }
                ),
                (options) => {
                    // Place "غير ذلك" in the middle
                    const middleIndex = Math.floor(options.length / 2);
                    const testOptions = [
                        ...options.slice(0, middleIndex),
                        OTHER_OPTION,
                        ...options.slice(middleIndex)
                    ];

                    // Act: Apply ensureOtherIsLast
                    const result = OptionsHelper.ensureOtherIsLast(testOptions);

                    // Assert: "غير ذلك" moved to the end
                    expect(result[result.length - 1]).toBe(OTHER_OPTION);

                    // Assert: Other options maintain their relative order
                    const resultWithoutOther = result.slice(0, -1);
                    expect(resultWithoutOther).toEqual(options);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: "غير ذلك" already at the end remains at the end', () => {
        fc.assert(
            fc.property(
                // Generator: array of options without "غير ذلك"
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 })
                        .filter(str => str !== OTHER_OPTION),
                    { minLength: 1, maxLength: 30 }
                ),
                (options) => {
                    // Place "غير ذلك" at the end (correct position)
                    const testOptions = [...options, OTHER_OPTION];

                    // Act: Apply ensureOtherIsLast
                    const result = OptionsHelper.ensureOtherIsLast(testOptions);

                    // Assert: "غير ذلك" remains at the end
                    expect(result[result.length - 1]).toBe(OTHER_OPTION);

                    // Assert: Result is identical to input (idempotent)
                    expect(result).toEqual(testOptions);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Relative order of non-"غير ذلك" options is preserved', () => {
        fc.assert(
            fc.property(
                // Generator: array of unique options without "غير ذلك"
                fc.uniqueArray(
                    fc.string({ minLength: 1, maxLength: 20 })
                        .filter(str => str !== OTHER_OPTION),
                    { minLength: 3, maxLength: 20 }
                ),
                fc.integer({ min: 0, max: 100 }),
                (options, insertPosition) => {
                    // Insert "غير ذلك" at random position
                    const position = insertPosition % (options.length + 1);
                    const testOptions = [
                        ...options.slice(0, position),
                        OTHER_OPTION,
                        ...options.slice(position)
                    ];

                    // Act: Apply ensureOtherIsLast
                    const result = OptionsHelper.ensureOtherIsLast(testOptions);

                    // Assert: Extract non-"غير ذلك" options
                    const resultWithoutOther = result.filter(opt => opt !== OTHER_OPTION);

                    // Assert: Relative order is preserved
                    expect(resultWithoutOther).toEqual(options);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Works with large lists efficiently', () => {
        fc.assert(
            fc.property(
                // Generator: large array of options
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 })
                        .filter(str => str !== OTHER_OPTION),
                    { minLength: 100, maxLength: 500 }
                ),
                fc.integer({ min: 0, max: 100 }),
                (options, insertPosition) => {
                    // Insert "غير ذلك" at random position
                    const position = insertPosition % (options.length + 1);
                    const testOptions = [
                        ...options.slice(0, position),
                        OTHER_OPTION,
                        ...options.slice(position)
                    ];

                    // Act: Apply ensureOtherIsLast
                    const startTime = performance.now();
                    const result = OptionsHelper.ensureOtherIsLast(testOptions);
                    const endTime = performance.now();

                    // Assert: "غير ذلك" is at the end
                    expect(result[result.length - 1]).toBe(OTHER_OPTION);

                    // Assert: Performance is reasonable (< 10ms for large lists)
                    expect(endTime - startTime).toBeLessThan(10);
                }
            ),
            { numRuns: 50 } // Fewer runs for large lists
        );
    });

    // Unit tests for edge cases
    describe('Edge Cases', () => {
        it('handles empty array', () => {
            const result = OptionsHelper.ensureOtherIsLast([]);
            expect(result).toEqual([OTHER_OPTION]);
        });

        it('handles array with only "غير ذلك"', () => {
            const result = OptionsHelper.ensureOtherIsLast([OTHER_OPTION]);
            expect(result).toEqual([OTHER_OPTION]);
        });

        it('handles array with multiple "غير ذلك" at different positions', () => {
            const testOptions = [
                OTHER_OPTION,
                'option1',
                OTHER_OPTION,
                'option2',
                OTHER_OPTION,
                'option3'
            ];
            const result = OptionsHelper.ensureOtherIsLast(testOptions);

            expect(result).toEqual(['option1', 'option2', 'option3', OTHER_OPTION]);
            expect(result.filter(opt => opt === OTHER_OPTION).length).toBe(1);
        });

        it('handles array with "غير ذلك" at the beginning', () => {
            const testOptions = [OTHER_OPTION, 'option1', 'option2'];
            const result = OptionsHelper.ensureOtherIsLast(testOptions);

            expect(result).toEqual(['option1', 'option2', OTHER_OPTION]);
        });

        it('handles array with "غير ذلك" in the middle', () => {
            const testOptions = ['option1', OTHER_OPTION, 'option2'];
            const result = OptionsHelper.ensureOtherIsLast(testOptions);

            expect(result).toEqual(['option1', 'option2', OTHER_OPTION]);
        });

        it('handles array with "غير ذلك" at the end (already correct)', () => {
            const testOptions = ['option1', 'option2', OTHER_OPTION];
            const result = OptionsHelper.ensureOtherIsLast(testOptions);

            expect(result).toEqual(['option1', 'option2', OTHER_OPTION]);
        });

        it('preserves order of other options when moving "غير ذلك"', () => {
            const testOptions = ['a', 'b', OTHER_OPTION, 'c', 'd'];
            const result = OptionsHelper.ensureOtherIsLast(testOptions);

            expect(result).toEqual(['a', 'b', 'c', 'd', OTHER_OPTION]);
        });

        it('handles array with all "غير ذلك"', () => {
            const testOptions = [OTHER_OPTION, OTHER_OPTION, OTHER_OPTION];
            const result = OptionsHelper.ensureOtherIsLast(testOptions);

            expect(result).toEqual([OTHER_OPTION]);
        });

        it('handles array with similar but not exact "غير ذلك"', () => {
            const testOptions = [
                'غير',
                'ذلك',
                'غير ذلك ',  // extra space
                OTHER_OPTION,
                ' غير ذلك',  // leading space
                'غيرذلك'     // no space
            ];
            const result = OptionsHelper.ensureOtherIsLast(testOptions);

            // Only exact match should be moved to end
            expect(result[result.length - 1]).toBe(OTHER_OPTION);
            expect(result.filter(opt => opt === OTHER_OPTION).length).toBe(1);
        });

        it('handles null input gracefully', () => {
            const result = OptionsHelper.ensureOtherIsLast(null as any);
            expect(result).toEqual([OTHER_OPTION]);
        });

        it('handles undefined input gracefully', () => {
            const result = OptionsHelper.ensureOtherIsLast(undefined as any);
            expect(result).toEqual([OTHER_OPTION]);
        });
    });

    // Real-world scenarios
    describe('Real-world Scenarios', () => {
        it('scenario: car condition options with "غير ذلك" at beginning', () => {
            const conditions = [OTHER_OPTION, 'جديد', 'مستعمل', 'ممتاز'];
            const result = OptionsHelper.ensureOtherIsLast(conditions);

            expect(result).toEqual(['جديد', 'مستعمل', 'ممتاز', OTHER_OPTION]);
        });

        it('scenario: governorates with "غير ذلك" in middle', () => {
            const governorates = ['القاهرة', 'الجيزة', OTHER_OPTION, 'الإسكندرية'];
            const result = OptionsHelper.ensureOtherIsLast(governorates);

            expect(result).toEqual(['القاهرة', 'الجيزة', 'الإسكندرية', OTHER_OPTION]);
        });

        it('scenario: car brands with multiple "غير ذلك"', () => {
            const brands = ['تويوتا', OTHER_OPTION, 'هوندا', OTHER_OPTION, 'نيسان'];
            const result = OptionsHelper.ensureOtherIsLast(brands);

            expect(result).toEqual(['تويوتا', 'هوندا', 'نيسان', OTHER_OPTION]);
            expect(result.filter(opt => opt === OTHER_OPTION).length).toBe(1);
        });

        it('scenario: job specialties with "غير ذلك" already at end', () => {
            const specialties = ['مطور ويب', 'مطور موبايل', 'مهندس DevOps', OTHER_OPTION];
            const result = OptionsHelper.ensureOtherIsLast(specialties);

            // Should be idempotent
            expect(result).toEqual(specialties);
        });

        it('scenario: cities within governorate (hierarchical child level)', () => {
            const cities = ['مدينة نصر', OTHER_OPTION, 'المعادي', 'مصر الجديدة'];
            const result = OptionsHelper.ensureOtherIsLast(cities);

            expect(result).toEqual(['مدينة نصر', 'المعادي', 'مصر الجديدة', OTHER_OPTION]);
        });

        it('scenario: car models within brand (hierarchical child level)', () => {
            const models = [OTHER_OPTION, 'كامري', 'كورولا', 'راف فور'];
            const result = OptionsHelper.ensureOtherIsLast(models);

            expect(result).toEqual(['كامري', 'كورولا', 'راف فور', OTHER_OPTION]);
        });

        it('scenario: adding new option to existing list with "غير ذلك"', () => {
            const existingOptions = ['option1', 'option2', OTHER_OPTION];
            // Simulate adding new option at rank 1 (beginning)
            const afterAdd = ['newOption', ...existingOptions];
            const result = OptionsHelper.ensureOtherIsLast(afterAdd);

            expect(result).toEqual(['newOption', 'option1', 'option2', OTHER_OPTION]);
        });

        it('scenario: bulk add multiple options to list with "غير ذلك"', () => {
            const existingOptions = ['option1', OTHER_OPTION];
            const newOptions = ['option2', 'option3', 'option4'];
            // Simulate bulk add at beginning
            const afterBulkAdd = [...newOptions, ...existingOptions];
            const result = OptionsHelper.ensureOtherIsLast(afterBulkAdd);

            expect(result).toEqual(['option2', 'option3', 'option4', 'option1', OTHER_OPTION]);
        });
    });

    // Integration with rank calculation
    describe('Integration with Rank Calculation', () => {
        it('ensures "غير ذلك" has the highest rank after ensureOtherIsLast', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.string({ minLength: 1, maxLength: 20 })
                            .filter(str => str !== OTHER_OPTION),
                        { minLength: 1, maxLength: 20 }
                    ),
                    (options) => {
                        // Add "غير ذلك" at random position
                        const randomPos = Math.floor(Math.random() * (options.length + 1));
                        const testOptions = [
                            ...options.slice(0, randomPos),
                            OTHER_OPTION,
                            ...options.slice(randomPos)
                        ];

                        // Act: Ensure "غير ذلك" is last, then calculate ranks
                        const orderedOptions = OptionsHelper.ensureOtherIsLast(testOptions);
                        const ranks = OptionsHelper.calculateRanks(orderedOptions);

                        // Assert: "غير ذلك" has the highest rank
                        const otherRank = ranks.find(r => r.option === OTHER_OPTION);
                        expect(otherRank).toBeDefined();
                        expect(otherRank!.rank).toBe(ranks.length);

                        // Assert: All ranks are sequential
                        const rankValues = ranks.map(r => r.rank).sort((a, b) => a - b);
                        for (let i = 0; i < rankValues.length; i++) {
                            expect(rankValues[i]).toBe(i + 1);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
