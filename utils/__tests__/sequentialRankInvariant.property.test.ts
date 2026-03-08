/**
 * Property-Based Test for Sequential Rank Invariant
 * 
 * Task 8.5: Write property test for sequential rank invariant
 * **Property 4: Sequential Rank Invariant**
 * **Validates: Requirements 4.21, 5.10, 5.11**
 * 
 * Feature: filters-lists-management
 * Spec Path: .kiro/specs/filters-lists-management
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { OptionsHelper } from '../optionsHelper';

describe('Property 4: Sequential Rank Invariant', () => {
    /**
     * Property: For any list of options after a reordering operation, the rank 
     * values must be sequential integers starting from 1 with no gaps (1, 2, 3, 4, ..., n).
     * 
     * This property validates that:
     * 1. Ranks start from 1 (Requirement 5.11)
     * 2. Ranks are sequential with no gaps (Requirements 4.21, 5.10)
     * 3. Each rank value is unique
     * 4. The number of ranks equals the number of options
     * 5. The invariant holds regardless of input order or list size
     */

    it('Property: calculateRanks produces sequential ranks starting from 1 without gaps', () => {
        fc.assert(
            fc.property(
                // Generator: array of option strings with various sizes
                fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 100 }),
                (options) => {
                    // Act: Calculate ranks for the options
                    const ranks = OptionsHelper.calculateRanks(options);

                    // Assert: Number of ranks equals number of options
                    expect(ranks.length).toBe(options.length);

                    // Assert: Extract rank values
                    const rankValues = ranks.map(r => r.rank);

                    // Assert: Ranks start from 1
                    expect(Math.min(...rankValues)).toBe(1);

                    // Assert: Ranks are sequential (1, 2, 3, ..., n)
                    for (let i = 0; i < rankValues.length; i++) {
                        expect(rankValues).toContain(i + 1);
                    }

                    // Assert: No gaps in sequence
                    const sortedRanks = [...rankValues].sort((a, b) => a - b);
                    for (let i = 0; i < sortedRanks.length; i++) {
                        expect(sortedRanks[i]).toBe(i + 1);
                    }

                    // Assert: All ranks are unique
                    const uniqueRanks = new Set(rankValues);
                    expect(uniqueRanks.size).toBe(rankValues.length);

                    // Assert: Maximum rank equals list length
                    expect(Math.max(...rankValues)).toBe(options.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Sequential ranks hold for Arabic option names', () => {
        fc.assert(
            fc.property(
                // Generator: array of Arabic-like strings
                fc.array(
                    fc.oneof(
                        fc.constant('جديد'),
                        fc.constant('مستعمل'),
                        fc.constant('ممتاز'),
                        fc.constant('غير ذلك'),
                        fc.constant('القاهرة'),
                        fc.constant('الجيزة'),
                        fc.constant('الإسكندرية'),
                        fc.string({ minLength: 1, maxLength: 20 })
                    ),
                    { minLength: 1, maxLength: 50 }
                ),
                (options) => {
                    // Act: Calculate ranks
                    const ranks = OptionsHelper.calculateRanks(options);

                    // Assert: Sequential ranks
                    const rankValues = ranks.map(r => r.rank).sort((a, b) => a - b);
                    for (let i = 0; i < rankValues.length; i++) {
                        expect(rankValues[i]).toBe(i + 1);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Sequential ranks hold for English option names', () => {
        fc.assert(
            fc.property(
                // Generator: array of English strings
                fc.array(
                    fc.oneof(
                        fc.constant('New'),
                        fc.constant('Used'),
                        fc.constant('Excellent'),
                        fc.constant('Other'),
                        fc.string({ minLength: 1, maxLength: 20 })
                    ),
                    { minLength: 1, maxLength: 50 }
                ),
                (options) => {
                    // Act: Calculate ranks
                    const ranks = OptionsHelper.calculateRanks(options);

                    // Assert: Sequential ranks
                    const rankValues = ranks.map(r => r.rank).sort((a, b) => a - b);
                    for (let i = 0; i < rankValues.length; i++) {
                        expect(rankValues[i]).toBe(i + 1);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Sequential ranks hold for numeric option names', () => {
        fc.assert(
            fc.property(
                // Generator: array of numeric strings
                fc.array(
                    fc.oneof(
                        fc.integer({ min: 2000, max: 2024 }).map(String),
                        fc.integer({ min: 1, max: 100 }).map(String),
                        fc.string({ minLength: 1, maxLength: 10 })
                    ),
                    { minLength: 1, maxLength: 50 }
                ),
                (options) => {
                    // Act: Calculate ranks
                    const ranks = OptionsHelper.calculateRanks(options);

                    // Assert: Sequential ranks
                    const rankValues = ranks.map(r => r.rank).sort((a, b) => a - b);
                    for (let i = 0; i < rankValues.length; i++) {
                        expect(rankValues[i]).toBe(i + 1);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Sequential ranks hold for options with special characters', () => {
        fc.assert(
            fc.property(
                // Generator: array of strings with special characters
                fc.array(
                    fc.oneof(
                        fc.constant('Option@1'),
                        fc.constant('Option#2'),
                        fc.constant('Option$3'),
                        fc.constant('Option-4'),
                        fc.constant('Option_5'),
                        fc.string({ minLength: 1, maxLength: 20 })
                    ),
                    { minLength: 1, maxLength: 50 }
                ),
                (options) => {
                    // Act: Calculate ranks
                    const ranks = OptionsHelper.calculateRanks(options);

                    // Assert: Sequential ranks
                    const rankValues = ranks.map(r => r.rank).sort((a, b) => a - b);
                    for (let i = 0; i < rankValues.length; i++) {
                        expect(rankValues[i]).toBe(i + 1);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Sequential ranks hold for large lists', () => {
        fc.assert(
            fc.property(
                // Generator: large array of options
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 }),
                    { minLength: 100, maxLength: 1000 }
                ),
                (options) => {
                    // Act: Calculate ranks
                    const ranks = OptionsHelper.calculateRanks(options);

                    // Assert: Number of ranks equals number of options
                    expect(ranks.length).toBe(options.length);

                    // Assert: Sequential ranks
                    const rankValues = ranks.map(r => r.rank);
                    expect(Math.min(...rankValues)).toBe(1);
                    expect(Math.max(...rankValues)).toBe(options.length);

                    // Assert: No gaps (check every expected rank exists)
                    for (let i = 1; i <= options.length; i++) {
                        expect(rankValues).toContain(i);
                    }
                }
            ),
            { numRuns: 20 } // Fewer runs for large lists
        );
    });

    it('Property: Sequential ranks preserve option order', () => {
        fc.assert(
            fc.property(
                // Generator: array of unique options
                fc.uniqueArray(
                    fc.string({ minLength: 1, maxLength: 20 }),
                    { minLength: 1, maxLength: 50 }
                ),
                (options) => {
                    // Act: Calculate ranks
                    const ranks = OptionsHelper.calculateRanks(options);

                    // Assert: Options appear in same order with sequential ranks
                    for (let i = 0; i < options.length; i++) {
                        expect(ranks[i].option).toBe(options[i]);
                        expect(ranks[i].rank).toBe(i + 1);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Sequential ranks hold after reordering (simulated)', () => {
        fc.assert(
            fc.property(
                // Generator: array of options and two indices to swap
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 }),
                    { minLength: 2, maxLength: 50 }
                ),
                fc.integer({ min: 0, max: 100 }),
                fc.integer({ min: 0, max: 100 }),
                (options, idx1Raw, idx2Raw) => {
                    // Normalize indices to valid range
                    const idx1 = idx1Raw % options.length;
                    const idx2 = idx2Raw % options.length;

                    // Simulate reordering by swapping two elements
                    const reordered = [...options];
                    [reordered[idx1], reordered[idx2]] = [reordered[idx2], reordered[idx1]];

                    // Act: Calculate ranks for reordered list
                    const ranks = OptionsHelper.calculateRanks(reordered);

                    // Assert: Sequential ranks still hold
                    const rankValues = ranks.map(r => r.rank).sort((a, b) => a - b);
                    for (let i = 0; i < rankValues.length; i++) {
                        expect(rankValues[i]).toBe(i + 1);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Sequential ranks hold with duplicate option names', () => {
        fc.assert(
            fc.property(
                // Generator: array that may contain duplicates
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 }),
                    { minLength: 1, maxLength: 50 }
                ),
                (options) => {
                    // Act: Calculate ranks (even with duplicates)
                    const ranks = OptionsHelper.calculateRanks(options);

                    // Assert: Sequential ranks still hold
                    const rankValues = ranks.map(r => r.rank).sort((a, b) => a - b);
                    for (let i = 0; i < rankValues.length; i++) {
                        expect(rankValues[i]).toBe(i + 1);
                    }

                    // Assert: Each option gets a unique rank
                    expect(ranks.length).toBe(options.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Unit tests for edge cases
    describe('Edge Cases', () => {
        it('handles empty array', () => {
            const ranks = OptionsHelper.calculateRanks([]);
            expect(ranks).toEqual([]);
        });

        it('handles single option', () => {
            const ranks = OptionsHelper.calculateRanks(['option1']);
            expect(ranks).toEqual([{ option: 'option1', rank: 1 }]);
        });

        it('handles two options', () => {
            const ranks = OptionsHelper.calculateRanks(['option1', 'option2']);
            expect(ranks).toEqual([
                { option: 'option1', rank: 1 },
                { option: 'option2', rank: 2 }
            ]);
        });

        it('handles options with "غير ذلك"', () => {
            const options = ['جديد', 'مستعمل', 'غير ذلك'];
            const ranks = OptionsHelper.calculateRanks(options);

            expect(ranks).toEqual([
                { option: 'جديد', rank: 1 },
                { option: 'مستعمل', rank: 2 },
                { option: 'غير ذلك', rank: 3 }
            ]);

            // "غير ذلك" should have the highest rank
            const otherRank = ranks.find(r => r.option === 'غير ذلك');
            expect(otherRank?.rank).toBe(ranks.length);
        });

        it('handles very long option names', () => {
            const longOption = 'A'.repeat(1000);
            const ranks = OptionsHelper.calculateRanks([longOption, 'short']);

            expect(ranks).toEqual([
                { option: longOption, rank: 1 },
                { option: 'short', rank: 2 }
            ]);
        });

        it('handles options with whitespace', () => {
            const options = ['  option1  ', 'option2', '  option3'];
            const ranks = OptionsHelper.calculateRanks(options);

            // Should preserve whitespace in option names
            expect(ranks).toEqual([
                { option: '  option1  ', rank: 1 },
                { option: 'option2', rank: 2 },
                { option: '  option3', rank: 3 }
            ]);
        });

        it('handles options with empty strings', () => {
            const options = ['option1', '', 'option2'];
            const ranks = OptionsHelper.calculateRanks(options);

            // Should still assign sequential ranks
            expect(ranks).toEqual([
                { option: 'option1', rank: 1 },
                { option: '', rank: 2 },
                { option: 'option2', rank: 3 }
            ]);
        });

        it('handles null input gracefully', () => {
            const ranks = OptionsHelper.calculateRanks(null as any);
            expect(ranks).toEqual([]);
        });

        it('handles undefined input gracefully', () => {
            const ranks = OptionsHelper.calculateRanks(undefined as any);
            expect(ranks).toEqual([]);
        });
    });

    // Real-world scenarios
    describe('Real-world Scenarios', () => {
        it('scenario: car condition options', () => {
            const conditions = ['جديد', 'مستعمل', 'ممتاز', 'غير ذلك'];
            const ranks = OptionsHelper.calculateRanks(conditions);

            // Verify sequential ranks
            expect(ranks.map(r => r.rank)).toEqual([1, 2, 3, 4]);

            // Verify "غير ذلك" has highest rank
            const otherRank = ranks.find(r => r.option === 'غير ذلك');
            expect(otherRank?.rank).toBe(4);
        });

        it('scenario: governorates list', () => {
            const governorates = ['القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'غير ذلك'];
            const ranks = OptionsHelper.calculateRanks(governorates);

            // Verify sequential ranks
            expect(ranks.map(r => r.rank)).toEqual([1, 2, 3, 4, 5]);

            // Verify no gaps
            const rankValues = ranks.map(r => r.rank);
            for (let i = 1; i <= 5; i++) {
                expect(rankValues).toContain(i);
            }
        });

        it('scenario: cities within governorate (hierarchical child level)', () => {
            const cities = ['مدينة نصر', 'المعادي', 'مصر الجديدة', 'غير ذلك'];
            const ranks = OptionsHelper.calculateRanks(cities);

            // Verify sequential ranks starting from 1
            expect(ranks[0].rank).toBe(1);
            expect(ranks.map(r => r.rank)).toEqual([1, 2, 3, 4]);
        });

        it('scenario: car brands (hierarchical parent level)', () => {
            const brands = ['تويوتا', 'هوندا', 'نيسان', 'مرسيدس', 'غير ذلك'];
            const ranks = OptionsHelper.calculateRanks(brands);

            // Verify sequential ranks
            expect(ranks.map(r => r.rank)).toEqual([1, 2, 3, 4, 5]);
        });

        it('scenario: after adding new option at rank 1', () => {
            // Simulate existing options
            const existingOptions = ['option2', 'option3', 'غير ذلك'];

            // Simulate adding new option at beginning
            const afterAdd = ['newOption', ...existingOptions];

            // Calculate new ranks
            const ranks = OptionsHelper.calculateRanks(afterAdd);

            // Verify sequential ranks (1, 2, 3, 4)
            expect(ranks.map(r => r.rank)).toEqual([1, 2, 3, 4]);

            // Verify new option has rank 1
            expect(ranks[0]).toEqual({ option: 'newOption', rank: 1 });
        });

        it('scenario: after bulk add of multiple options', () => {
            // Simulate existing options
            const existingOptions = ['option1', 'غير ذلك'];

            // Simulate bulk add at beginning
            const newOptions = ['bulk1', 'bulk2', 'bulk3'];
            const afterBulkAdd = [...newOptions, ...existingOptions];

            // Calculate new ranks
            const ranks = OptionsHelper.calculateRanks(afterBulkAdd);

            // Verify sequential ranks (1, 2, 3, 4, 5)
            expect(ranks.map(r => r.rank)).toEqual([1, 2, 3, 4, 5]);

            // Verify no gaps
            const rankValues = ranks.map(r => r.rank);
            for (let i = 1; i <= 5; i++) {
                expect(rankValues).toContain(i);
            }
        });

        it('scenario: after reordering options', () => {
            // Original order
            const original = ['option1', 'option2', 'option3', 'غير ذلك'];

            // Simulate reordering (move option3 to first position)
            const reordered = ['option3', 'option1', 'option2', 'غير ذلك'];

            // Calculate ranks
            const ranks = OptionsHelper.calculateRanks(reordered);

            // Verify sequential ranks maintained
            expect(ranks.map(r => r.rank)).toEqual([1, 2, 3, 4]);

            // Verify option3 now has rank 1
            expect(ranks[0]).toEqual({ option: 'option3', rank: 1 });
        });

        it('scenario: large list of 100 options', () => {
            const options = Array.from({ length: 100 }, (_, i) => `option${i + 1}`);
            const ranks = OptionsHelper.calculateRanks(options);

            // Verify all ranks are sequential from 1 to 100
            expect(ranks.length).toBe(100);
            expect(ranks[0].rank).toBe(1);
            expect(ranks[99].rank).toBe(100);

            // Verify no gaps
            const rankValues = ranks.map(r => r.rank);
            for (let i = 1; i <= 100; i++) {
                expect(rankValues).toContain(i);
            }
        });
    });

    // Integration with ensureOtherIsLast
    describe('Integration with ensureOtherIsLast', () => {
        it('sequential ranks hold after ensuring "غير ذلك" is last', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.string({ minLength: 1, maxLength: 20 })
                            .filter(str => str !== 'غير ذلك'),
                        { minLength: 1, maxLength: 50 }
                    ),
                    fc.integer({ min: 0, max: 100 }),
                    (options, insertPosition) => {
                        // Insert "غير ذلك" at random position
                        const position = insertPosition % (options.length + 1);
                        const withOther = [
                            ...options.slice(0, position),
                            'غير ذلك',
                            ...options.slice(position)
                        ];

                        // Act: Ensure "غير ذلك" is last, then calculate ranks
                        const ordered = OptionsHelper.ensureOtherIsLast(withOther);
                        const ranks = OptionsHelper.calculateRanks(ordered);

                        // Assert: Sequential ranks
                        const rankValues = ranks.map(r => r.rank).sort((a, b) => a - b);
                        for (let i = 0; i < rankValues.length; i++) {
                            expect(rankValues[i]).toBe(i + 1);
                        }

                        // Assert: "غير ذلك" has highest rank
                        const otherRank = ranks.find(r => r.option === 'غير ذلك');
                        expect(otherRank?.rank).toBe(ranks.length);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
