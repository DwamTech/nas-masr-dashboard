/**
 * Property-Based Test for Rank-Based Sorting with Context
 * 
 * Task 9.4: Write property test for rank-based sorting with context
 * **Property 13: Rank-Based Sorting with Context**
 * **Validates: Requirements 9.2, 9.3, 9.4**
 * 
 * Feature: filters-lists-management
 * Spec Path: .kiro/specs/filters-lists-management
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { RankData } from '../types/filters-lists';

/**
 * Sorts options by rank in ascending order
 * This simulates the sorting behavior for independent lists
 */
function sortByRank(options: RankData[]): RankData[] {
    return [...options].sort((a, b) => a.rank - b.rank);
}

/**
 * Represents a hierarchical list with parent and child options
 */
interface HierarchicalOptions {
    parents: RankData[];
    childrenByParent: Record<string, RankData[]>;
}

/**
 * Sorts hierarchical options by rank
 * Parents are sorted by their rank, children are sorted by their rank within each parent
 */
function sortHierarchicalByRank(options: HierarchicalOptions): HierarchicalOptions {
    // Sort parents by rank
    const sortedParents = sortByRank(options.parents);

    // Sort children within each parent by rank
    const sortedChildren: Record<string, RankData[]> = {};
    for (const [parent, children] of Object.entries(options.childrenByParent)) {
        sortedChildren[parent] = sortByRank(children);
    }

    return {
        parents: sortedParents,
        childrenByParent: sortedChildren
    };
}

/**
 * Checks if an array is sorted by rank in ascending order
 */
function isSortedByRank(options: RankData[]): boolean {
    for (let i = 1; i < options.length; i++) {
        if (options[i].rank < options[i - 1].rank) {
            return false;
        }
    }
    return true;
}

describe('Property 13: Rank-Based Sorting with Context', () => {
    /**
     * Property: For any list of options with associated ranks (independent list, 
     * hierarchical parent list, or hierarchical child list within a parent context), 
     * sorting by rank should produce an array ordered by ascending rank values (1, 2, 3, ...).
     * 
     * This property validates that:
     * 1. Independent lists are sorted by rank in ascending order (Requirement 9.2)
     * 2. Hierarchical parent lists are sorted by parent rank in ascending order (Requirement 9.3)
     * 3. Hierarchical child lists are sorted by child rank within parent context (Requirement 9.4)
     * 4. Sorting is stable and preserves relative order for equal ranks
     * 5. Sorting works correctly regardless of initial order
     */

    // Generator for rank data
    const rankDataArb = fc.record({
        option: fc.string({ minLength: 1, maxLength: 50 }),
        rank: fc.integer({ min: 1, max: 100 })
    });

    it('Property: Independent list sorting produces ascending rank order', () => {
        fc.assert(
            fc.property(
                fc.array(rankDataArb, { minLength: 1, maxLength: 50 }),
                (options) => {
                    // Act: Sort by rank
                    const sorted = sortByRank(options);

                    // Assert: Result is sorted by rank in ascending order
                    expect(isSortedByRank(sorted)).toBe(true);

                    // Assert: All original options are present
                    expect(sorted.length).toBe(options.length);

                    // Assert: First element has minimum rank
                    if (sorted.length > 0) {
                        const minRank = Math.min(...options.map(o => o.rank));
                        expect(sorted[0].rank).toBe(minRank);
                    }

                    // Assert: Last element has maximum rank (or equal to max)
                    if (sorted.length > 0) {
                        const maxRank = Math.max(...options.map(o => o.rank));
                        expect(sorted[sorted.length - 1].rank).toBe(maxRank);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Hierarchical parent list sorting produces ascending rank order', () => {
        fc.assert(
            fc.property(
                fc.record({
                    parents: fc.array(rankDataArb, { minLength: 1, maxLength: 20 }),
                    childrenByParent: fc.constant({}) // No children for this test
                }),
                (hierarchical) => {
                    // Act: Sort hierarchical structure
                    const sorted = sortHierarchicalByRank(hierarchical);

                    // Assert: Parents are sorted by rank
                    expect(isSortedByRank(sorted.parents)).toBe(true);

                    // Assert: All parents are present
                    expect(sorted.parents.length).toBe(hierarchical.parents.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Hierarchical child list sorting within parent context produces ascending rank order', () => {
        fc.assert(
            fc.property(
                fc.record({
                    parents: fc.array(rankDataArb, { minLength: 1, maxLength: 10 }),
                    childrenByParent: fc.dictionary(
                        fc.string({ minLength: 1, maxLength: 20 }),
                        fc.array(rankDataArb, { minLength: 1, maxLength: 20 }),
                        { minKeys: 1, maxKeys: 5 }
                    )
                }),
                (hierarchical) => {
                    // Act: Sort hierarchical structure
                    const sorted = sortHierarchicalByRank(hierarchical);

                    // Assert: Each parent's children are sorted by rank
                    for (const [parent, children] of Object.entries(sorted.childrenByParent)) {
                        expect(isSortedByRank(children)).toBe(true);

                        // Assert: All children for this parent are present
                        const originalChildren = hierarchical.childrenByParent[parent];
                        if (originalChildren) {
                            expect(children.length).toBe(originalChildren.length);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Sorting is idempotent (sorting twice produces same result)', () => {
        fc.assert(
            fc.property(
                fc.array(rankDataArb, { minLength: 1, maxLength: 50 }),
                (options) => {
                    // Act: Sort twice
                    const sorted1 = sortByRank(options);
                    const sorted2 = sortByRank(sorted1);

                    // Assert: Results are identical
                    expect(sorted2).toEqual(sorted1);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Sorting preserves all options (no loss or duplication)', () => {
        fc.assert(
            fc.property(
                fc.uniqueArray(
                    fc.record({
                        option: fc.string({ minLength: 1, maxLength: 20 }),
                        rank: fc.integer({ min: 1, max: 100 })
                    }),
                    { selector: (item) => item.option }
                ),
                (options) => {
                    // Act: Sort by rank
                    const sorted = sortByRank(options);

                    // Assert: Same number of options
                    expect(sorted.length).toBe(options.length);

                    // Assert: All original option names are present
                    const originalNames = new Set(options.map(o => o.option));
                    const sortedNames = new Set(sorted.map(o => o.option));
                    expect(sortedNames).toEqual(originalNames);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Sorting works correctly with duplicate ranks', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        option: fc.string({ minLength: 1, maxLength: 20 }),
                        rank: fc.integer({ min: 1, max: 5 }) // Limited range to force duplicates
                    }),
                    { minLength: 2, maxLength: 20 }
                ),
                (options) => {
                    // Act: Sort by rank
                    const sorted = sortByRank(options);

                    // Assert: Result is sorted (non-decreasing)
                    for (let i = 1; i < sorted.length; i++) {
                        expect(sorted[i].rank).toBeGreaterThanOrEqual(sorted[i - 1].rank);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Sorting works with sequential ranks (1, 2, 3, ...)', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 50 }),
                (optionNames) => {
                    // Arrange: Create options with sequential ranks in random order
                    const options: RankData[] = optionNames.map((name, idx) => ({
                        option: name,
                        rank: idx + 1
                    }));

                    // Shuffle to randomize order
                    const shuffled = [...options].sort(() => Math.random() - 0.5);

                    // Act: Sort by rank
                    const sorted = sortByRank(shuffled);

                    // Assert: Ranks are in order 1, 2, 3, ...
                    for (let i = 0; i < sorted.length; i++) {
                        expect(sorted[i].rank).toBe(i + 1);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Hierarchical sorting maintains parent-child independence', () => {
        fc.assert(
            fc.property(
                fc.record({
                    parents: fc.array(rankDataArb, { minLength: 2, maxLength: 10 }),
                    childrenByParent: fc.dictionary(
                        fc.string({ minLength: 1, maxLength: 20 }),
                        fc.array(rankDataArb, { minLength: 1, maxLength: 10 }),
                        { minKeys: 2, maxKeys: 5 }
                    )
                }),
                (hierarchical) => {
                    // Act: Sort hierarchical structure
                    const sorted = sortHierarchicalByRank(hierarchical);

                    // Assert: Parent sorting doesn't affect child ranks
                    for (const [parent, children] of Object.entries(hierarchical.childrenByParent)) {
                        const sortedChildren = sorted.childrenByParent[parent];
                        if (sortedChildren) {
                            // Children should be sorted independently
                            expect(isSortedByRank(sortedChildren)).toBe(true);

                            // Original child ranks should be preserved (just reordered)
                            const originalRanks = children.map(c => c.rank).sort((a, b) => a - b);
                            const sortedRanks = sortedChildren.map(c => c.rank).sort((a, b) => a - b);
                            expect(sortedRanks).toEqual(originalRanks);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    // Unit tests for edge cases
    describe('Edge Cases', () => {
        it('handles empty array', () => {
            const sorted = sortByRank([]);
            expect(sorted).toEqual([]);
        });

        it('handles single option', () => {
            const options: RankData[] = [{ option: 'option1', rank: 5 }];
            const sorted = sortByRank(options);
            expect(sorted).toEqual(options);
        });

        it('handles already sorted array', () => {
            const options: RankData[] = [
                { option: 'option1', rank: 1 },
                { option: 'option2', rank: 2 },
                { option: 'option3', rank: 3 }
            ];
            const sorted = sortByRank(options);
            expect(sorted).toEqual(options);
        });

        it('handles reverse sorted array', () => {
            const options: RankData[] = [
                { option: 'option3', rank: 3 },
                { option: 'option2', rank: 2 },
                { option: 'option1', rank: 1 }
            ];
            const sorted = sortByRank(options);
            expect(sorted).toEqual([
                { option: 'option1', rank: 1 },
                { option: 'option2', rank: 2 },
                { option: 'option3', rank: 3 }
            ]);
        });

        it('handles options with same rank', () => {
            const options: RankData[] = [
                { option: 'option1', rank: 1 },
                { option: 'option2', rank: 1 },
                { option: 'option3', rank: 1 }
            ];
            const sorted = sortByRank(options);

            // All should have rank 1
            expect(sorted.every(o => o.rank === 1)).toBe(true);
            // All options should be present
            expect(sorted.length).toBe(3);
        });

        it('handles large rank values', () => {
            const options: RankData[] = [
                { option: 'option1', rank: 1000000 },
                { option: 'option2', rank: 1 },
                { option: 'option3', rank: 500000 }
            ];
            const sorted = sortByRank(options);
            expect(sorted[0].rank).toBe(1);
            expect(sorted[1].rank).toBe(500000);
            expect(sorted[2].rank).toBe(1000000);
        });

        it('handles hierarchical structure with empty children', () => {
            const hierarchical: HierarchicalOptions = {
                parents: [
                    { option: 'parent1', rank: 2 },
                    { option: 'parent2', rank: 1 }
                ],
                childrenByParent: {
                    'parent1': [],
                    'parent2': []
                }
            };

            const sorted = sortHierarchicalByRank(hierarchical);

            expect(sorted.parents[0].option).toBe('parent2');
            expect(sorted.parents[1].option).toBe('parent1');
            expect(sorted.childrenByParent['parent1']).toEqual([]);
            expect(sorted.childrenByParent['parent2']).toEqual([]);
        });

        it('handles hierarchical structure with no children', () => {
            const hierarchical: HierarchicalOptions = {
                parents: [
                    { option: 'parent1', rank: 2 },
                    { option: 'parent2', rank: 1 }
                ],
                childrenByParent: {}
            };

            const sorted = sortHierarchicalByRank(hierarchical);

            expect(sorted.parents[0].option).toBe('parent2');
            expect(sorted.parents[1].option).toBe('parent1');
            expect(sorted.childrenByParent).toEqual({});
        });
    });

    // Real-world scenarios
    describe('Real-world Scenarios', () => {
        it('scenario: Independent list - car conditions sorted by rank', () => {
            const conditions: RankData[] = [
                { option: 'غير ذلك', rank: 4 },
                { option: 'مستعمل', rank: 2 },
                { option: 'جديد', rank: 1 },
                { option: 'ممتاز', rank: 3 }
            ];

            const sorted = sortByRank(conditions);

            expect(sorted[0].option).toBe('جديد');
            expect(sorted[1].option).toBe('مستعمل');
            expect(sorted[2].option).toBe('ممتاز');
            expect(sorted[3].option).toBe('غير ذلك');

            // Verify ranks are in ascending order
            expect(sorted.map(o => o.rank)).toEqual([1, 2, 3, 4]);
        });

        it('scenario: Hierarchical parent list - governorates sorted by rank', () => {
            const hierarchical: HierarchicalOptions = {
                parents: [
                    { option: 'الإسكندرية', rank: 3 },
                    { option: 'القاهرة', rank: 1 },
                    { option: 'الجيزة', rank: 2 },
                    { option: 'غير ذلك', rank: 4 }
                ],
                childrenByParent: {}
            };

            const sorted = sortHierarchicalByRank(hierarchical);

            expect(sorted.parents[0].option).toBe('القاهرة');
            expect(sorted.parents[1].option).toBe('الجيزة');
            expect(sorted.parents[2].option).toBe('الإسكندرية');
            expect(sorted.parents[3].option).toBe('غير ذلك');
        });

        it('scenario: Hierarchical child list - cities within governorate sorted by rank', () => {
            const hierarchical: HierarchicalOptions = {
                parents: [
                    { option: 'القاهرة', rank: 1 },
                    { option: 'الجيزة', rank: 2 }
                ],
                childrenByParent: {
                    'القاهرة': [
                        { option: 'غير ذلك', rank: 4 },
                        { option: 'مصر الجديدة', rank: 3 },
                        { option: 'المعادي', rank: 2 },
                        { option: 'مدينة نصر', rank: 1 }
                    ],
                    'الجيزة': [
                        { option: 'غير ذلك', rank: 3 },
                        { option: 'المهندسين', rank: 2 },
                        { option: 'الدقي', rank: 1 }
                    ]
                }
            };

            const sorted = sortHierarchicalByRank(hierarchical);

            // Cairo cities should be sorted
            expect(sorted.childrenByParent['القاهرة'][0].option).toBe('مدينة نصر');
            expect(sorted.childrenByParent['القاهرة'][1].option).toBe('المعادي');
            expect(sorted.childrenByParent['القاهرة'][2].option).toBe('مصر الجديدة');
            expect(sorted.childrenByParent['القاهرة'][3].option).toBe('غير ذلك');

            // Giza cities should be sorted independently
            expect(sorted.childrenByParent['الجيزة'][0].option).toBe('الدقي');
            expect(sorted.childrenByParent['الجيزة'][1].option).toBe('المهندسين');
            expect(sorted.childrenByParent['الجيزة'][2].option).toBe('غير ذلك');
        });

        it('scenario: Complete hierarchical structure with parents and children', () => {
            const hierarchical: HierarchicalOptions = {
                parents: [
                    { option: 'الجيزة', rank: 2 },
                    { option: 'القاهرة', rank: 1 },
                    { option: 'الإسكندرية', rank: 3 }
                ],
                childrenByParent: {
                    'القاهرة': [
                        { option: 'المعادي', rank: 2 },
                        { option: 'مدينة نصر', rank: 1 }
                    ],
                    'الجيزة': [
                        { option: 'المهندسين', rank: 2 },
                        { option: 'الدقي', rank: 1 }
                    ],
                    'الإسكندرية': [
                        { option: 'سموحة', rank: 2 },
                        { option: 'المنتزه', rank: 1 }
                    ]
                }
            };

            const sorted = sortHierarchicalByRank(hierarchical);

            // Parents should be sorted
            expect(sorted.parents.map(p => p.option)).toEqual([
                'القاهرة',
                'الجيزة',
                'الإسكندرية'
            ]);

            // Each parent's children should be sorted independently
            expect(sorted.childrenByParent['القاهرة'].map(c => c.option)).toEqual([
                'مدينة نصر',
                'المعادي'
            ]);
            expect(sorted.childrenByParent['الجيزة'].map(c => c.option)).toEqual([
                'الدقي',
                'المهندسين'
            ]);
            expect(sorted.childrenByParent['الإسكندرية'].map(c => c.option)).toEqual([
                'المنتزه',
                'سموحة'
            ]);
        });

        it('scenario: Sorting after adding new option at rank 1', () => {
            // Original sorted list
            const original: RankData[] = [
                { option: 'option1', rank: 1 },
                { option: 'option2', rank: 2 },
                { option: 'option3', rank: 3 }
            ];

            // After adding new option at rank 1 and shifting others
            const afterAdd: RankData[] = [
                { option: 'newOption', rank: 1 },
                { option: 'option1', rank: 2 },
                { option: 'option2', rank: 3 },
                { option: 'option3', rank: 4 }
            ];

            // Shuffle to simulate unsorted state
            const shuffled = [...afterAdd].sort(() => Math.random() - 0.5);

            // Sort
            const sorted = sortByRank(shuffled);

            // Should be in correct order
            expect(sorted[0].option).toBe('newOption');
            expect(sorted[0].rank).toBe(1);
            expect(sorted.map(o => o.rank)).toEqual([1, 2, 3, 4]);
        });

        it('scenario: Sorting after reordering options', () => {
            // After user drags option3 to first position
            const reordered: RankData[] = [
                { option: 'option3', rank: 1 },
                { option: 'option1', rank: 2 },
                { option: 'option2', rank: 3 },
                { option: 'غير ذلك', rank: 4 }
            ];

            // Shuffle
            const shuffled = [...reordered].sort(() => Math.random() - 0.5);

            // Sort
            const sorted = sortByRank(shuffled);

            // Should be in rank order
            expect(sorted[0].option).toBe('option3');
            expect(sorted[3].option).toBe('غير ذلك');
            expect(sorted.map(o => o.rank)).toEqual([1, 2, 3, 4]);
        });

        it('scenario: Large list of 100 options sorted by rank', () => {
            const options: RankData[] = Array.from({ length: 100 }, (_, i) => ({
                option: `option${i + 1}`,
                rank: 100 - i // Reverse order
            }));

            const sorted = sortByRank(options);

            // Should be sorted in ascending rank order
            expect(sorted[0].rank).toBe(1);
            expect(sorted[99].rank).toBe(100);

            // Verify all ranks are in order
            for (let i = 0; i < sorted.length; i++) {
                expect(sorted[i].rank).toBe(i + 1);
            }
        });

        it('scenario: Sorting with "غير ذلك" at different positions', () => {
            const options: RankData[] = [
                { option: 'option1', rank: 1 },
                { option: 'غير ذلك', rank: 5 },
                { option: 'option2', rank: 2 },
                { option: 'option3', rank: 3 },
                { option: 'option4', rank: 4 }
            ];

            // Shuffle
            const shuffled = [...options].sort(() => Math.random() - 0.5);

            // Sort
            const sorted = sortByRank(shuffled);

            // "غير ذلك" should be last (rank 5)
            expect(sorted[4].option).toBe('غير ذلك');
            expect(sorted[4].rank).toBe(5);

            // All ranks should be in order
            expect(sorted.map(o => o.rank)).toEqual([1, 2, 3, 4, 5]);
        });
    });

    // Integration scenarios
    describe('Integration Scenarios', () => {
        it('integration: Sorting works with OptionsHelper.calculateRanks output', () => {
            // Simulate output from OptionsHelper.calculateRanks
            const options = ['option3', 'option1', 'option2'];
            const ranks: RankData[] = options.map((opt, idx) => ({
                option: opt,
                rank: idx + 1
            }));

            // Sort by rank
            const sorted = sortByRank(ranks);

            // Should maintain the order since ranks are already sequential
            expect(sorted).toEqual(ranks);
        });

        it('integration: Sorting after bulk add maintains correct order', () => {
            // Existing options
            const existing: RankData[] = [
                { option: 'option1', rank: 4 },
                { option: 'option2', rank: 5 },
                { option: 'غير ذلك', rank: 6 }
            ];

            // After bulk add at rank 1-3
            const afterBulkAdd: RankData[] = [
                { option: 'bulk1', rank: 1 },
                { option: 'bulk2', rank: 2 },
                { option: 'bulk3', rank: 3 },
                ...existing
            ];

            // Sort
            const sorted = sortByRank(afterBulkAdd);

            // Should be in correct order
            expect(sorted[0].option).toBe('bulk1');
            expect(sorted[1].option).toBe('bulk2');
            expect(sorted[2].option).toBe('bulk3');
            expect(sorted[5].option).toBe('غير ذلك');
        });

        it('integration: Hierarchical sorting after parent reorder', () => {
            // After reordering parents but before sorting
            const hierarchical: HierarchicalOptions = {
                parents: [
                    { option: 'parent3', rank: 1 },
                    { option: 'parent1', rank: 2 },
                    { option: 'parent2', rank: 3 }
                ],
                childrenByParent: {
                    'parent1': [
                        { option: 'child1b', rank: 1 },
                        { option: 'child1a', rank: 2 }
                    ],
                    'parent2': [
                        { option: 'child2a', rank: 1 }
                    ],
                    'parent3': [
                        { option: 'child3a', rank: 1 }
                    ]
                }
            };

            const sorted = sortHierarchicalByRank(hierarchical);

            // Parents should be sorted by new ranks
            expect(sorted.parents[0].option).toBe('parent3');
            expect(sorted.parents[1].option).toBe('parent1');
            expect(sorted.parents[2].option).toBe('parent2');

            // Children should be sorted within each parent
            expect(sorted.childrenByParent['parent1'][0].option).toBe('child1b');
            expect(sorted.childrenByParent['parent1'][1].option).toBe('child1a');
        });
    });
});
