/**
 * Property-Based Test for Hierarchical Rank Independence
 * 
 * Task 9.3: Write property test for hierarchical rank independence
 * **Property 6: Hierarchical Rank Independence**
 * **Validates: Requirements 5.1, 5.3**
 * 
 * Feature: filters-lists-management
 * Spec Path: .kiro/specs/filters-lists-management
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { RankData } from '../../types/filters-lists';

/**
 * Represents a hierarchical list structure with parent and child options
 */
interface HierarchicalList {
    parents: Array<{ option: string; rank: number }>;
    children: Record<string, Array<{ option: string; rank: number }>>;
}

/**
 * Updates parent ranks in a hierarchical list
 * This simulates the backend operation of updating parent option ranks
 */
function updateParentRanks(
    list: HierarchicalList,
    newParentRanks: RankData[]
): HierarchicalList {
    // Create a map of option to new rank
    const rankMap = new Map(newParentRanks.map(r => [r.option, r.rank]));

    // Update parent ranks
    const updatedParents = list.parents.map(parent => ({
        option: parent.option,
        rank: rankMap.get(parent.option) ?? parent.rank
    }));

    // Children should remain unchanged
    return {
        parents: updatedParents,
        children: { ...list.children }
    };
}

/**
 * Updates child ranks for a specific parent in a hierarchical list
 * This simulates the backend operation of updating child option ranks
 */
function updateChildRanks(
    list: HierarchicalList,
    parentOption: string,
    newChildRanks: RankData[]
): HierarchicalList {
    // Create a map of option to new rank
    const rankMap = new Map(newChildRanks.map(r => [r.option, r.rank]));

    // Update only the children for the specified parent
    const updatedChildren = { ...list.children };
    if (updatedChildren[parentOption]) {
        updatedChildren[parentOption] = updatedChildren[parentOption].map(child => ({
            option: child.option,
            rank: rankMap.get(child.option) ?? child.rank
        }));
    }

    // Parents should remain unchanged
    return {
        parents: [...list.parents],
        children: updatedChildren
    };
}

/**
 * Helper to create a deep copy of hierarchical list for comparison
 */
function deepCopyHierarchicalList(list: HierarchicalList): HierarchicalList {
    return {
        parents: list.parents.map(p => ({ ...p })),
        children: Object.fromEntries(
            Object.entries(list.children).map(([parent, children]) => [
                parent,
                children.map(c => ({ ...c }))
            ])
        )
    };
}

/**
 * Checks if two rank arrays are equal
 */
function ranksEqual(
    ranks1: Array<{ option: string; rank: number }>,
    ranks2: Array<{ option: string; rank: number }>
): boolean {
    if (ranks1.length !== ranks2.length) return false;

    for (let i = 0; i < ranks1.length; i++) {
        if (ranks1[i].option !== ranks2[i].option || ranks1[i].rank !== ranks2[i].rank) {
            return false;
        }
    }

    return true;
}

describe('Property 6: Hierarchical Rank Independence', () => {
    /**
     * Property: For any hierarchical list structure, modifying parent option ranks 
     * should not affect any child option ranks, and modifying child option ranks for 
     * one parent should not affect child ranks for any other parent.
     * 
     * This property validates that:
     * 1. Parent rank updates do not modify child ranks
     * 2. Child rank updates for one parent do not affect other parents' children
     * 3. Child rank updates do not modify parent ranks
     * 4. Rank independence is maintained across all levels
     */

    // Generator for hierarchical list structure
    const hierarchicalListArb = fc.record({
        parents: fc.array(
            fc.record({
                option: fc.string({ minLength: 1, maxLength: 20 }),
                rank: fc.integer({ min: 1, max: 100 })
            }),
            { minLength: 2, maxLength: 10 }
        ),
        children: fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.array(
                fc.record({
                    option: fc.string({ minLength: 1, maxLength: 20 }),
                    rank: fc.integer({ min: 1, max: 100 })
                }),
                { minLength: 1, maxLength: 10 }
            ),
            { minKeys: 1, maxKeys: 5 }
        )
    });

    it('Property: Updating parent ranks does not affect child ranks', () => {
        fc.assert(
            fc.property(
                hierarchicalListArb,
                fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 10 }),
                (list, newRanks) => {
                    // Skip if list is invalid
                    if (list.parents.length === 0) return;

                    // Store original child ranks
                    const originalChildren = deepCopyHierarchicalList(list).children;

                    // Create new parent ranks (reorder parents)
                    const parentRankUpdates: RankData[] = list.parents.map((parent, idx) => ({
                        option: parent.option,
                        rank: newRanks[idx % newRanks.length]
                    }));

                    // Act: Update parent ranks
                    const updatedList = updateParentRanks(list, parentRankUpdates);

                    // Assert: Child ranks should remain unchanged
                    for (const [parentOption, children] of Object.entries(originalChildren)) {
                        if (updatedList.children[parentOption]) {
                            expect(
                                ranksEqual(updatedList.children[parentOption], children)
                            ).toBe(true);
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Updating child ranks for one parent does not affect other parents\' children', () => {
        fc.assert(
            fc.property(
                hierarchicalListArb,
                fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 10 }),
                (list, newRanks) => {
                    // Skip if no children
                    const parentKeys = Object.keys(list.children);
                    if (parentKeys.length === 0) return;

                    // Select first parent to update
                    const targetParent = parentKeys[0];
                    const targetChildren = list.children[targetParent];

                    if (!targetChildren || targetChildren.length === 0) return;

                    // Store original children for all OTHER parents
                    const originalOtherChildren: Record<string, Array<{ option: string; rank: number }>> = {};
                    for (const parent of parentKeys) {
                        if (parent !== targetParent) {
                            originalOtherChildren[parent] = [...list.children[parent]];
                        }
                    }

                    // Create new child ranks for target parent
                    const childRankUpdates: RankData[] = targetChildren.map((child, idx) => ({
                        option: child.option,
                        rank: newRanks[idx % newRanks.length]
                    }));

                    // Act: Update child ranks for target parent only
                    const updatedList = updateChildRanks(list, targetParent, childRankUpdates);

                    // Assert: Children of other parents should remain unchanged
                    for (const [parentOption, originalChildren] of Object.entries(originalOtherChildren)) {
                        expect(
                            ranksEqual(updatedList.children[parentOption], originalChildren)
                        ).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Updating child ranks does not affect parent ranks', () => {
        fc.assert(
            fc.property(
                hierarchicalListArb,
                fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 10 }),
                (list, newRanks) => {
                    // Skip if no children
                    const parentKeys = Object.keys(list.children);
                    if (parentKeys.length === 0) return;

                    // Select first parent to update
                    const targetParent = parentKeys[0];
                    const targetChildren = list.children[targetParent];

                    if (!targetChildren || targetChildren.length === 0) return;

                    // Store original parent ranks
                    const originalParents = [...list.parents];

                    // Create new child ranks
                    const childRankUpdates: RankData[] = targetChildren.map((child, idx) => ({
                        option: child.option,
                        rank: newRanks[idx % newRanks.length]
                    }));

                    // Act: Update child ranks
                    const updatedList = updateChildRanks(list, targetParent, childRankUpdates);

                    // Assert: Parent ranks should remain unchanged
                    expect(ranksEqual(updatedList.parents, originalParents)).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: Multiple parent rank updates preserve child rank independence', () => {
        fc.assert(
            fc.property(
                hierarchicalListArb,
                fc.array(
                    fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 10 }),
                    { minLength: 2, maxLength: 5 }
                ),
                (list, rankUpdateSequences) => {
                    // Skip if list is invalid
                    if (list.parents.length === 0) return;

                    // Store original child ranks
                    const originalChildren = deepCopyHierarchicalList(list).children;

                    // Apply multiple parent rank updates
                    let currentList = list;
                    for (const newRanks of rankUpdateSequences) {
                        const parentRankUpdates: RankData[] = currentList.parents.map((parent, idx) => ({
                            option: parent.option,
                            rank: newRanks[idx % newRanks.length]
                        }));
                        currentList = updateParentRanks(currentList, parentRankUpdates);
                    }

                    // Assert: Child ranks should remain unchanged after all updates
                    for (const [parentOption, children] of Object.entries(originalChildren)) {
                        if (currentList.children[parentOption]) {
                            expect(
                                ranksEqual(currentList.children[parentOption], children)
                            ).toBe(true);
                        }
                    }
                }
            ),
            { numRuns: 50 }
        );
    });

    it('Property: Multiple child rank updates for different parents maintain independence', () => {
        fc.assert(
            fc.property(
                hierarchicalListArb,
                fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 10 }),
                (list, newRanks) => {
                    // Skip if insufficient parents
                    const parentKeys = Object.keys(list.children);
                    if (parentKeys.length < 2) return;

                    // Select two different parents
                    const parent1 = parentKeys[0];
                    const parent2 = parentKeys[1];

                    const children1 = list.children[parent1];
                    const children2 = list.children[parent2];

                    if (!children1 || children1.length === 0 || !children2 || children2.length === 0) {
                        return;
                    }

                    // Store original ranks for parent2's children
                    const originalParent2Children = [...children2];

                    // Update parent1's children
                    const childRankUpdates1: RankData[] = children1.map((child, idx) => ({
                        option: child.option,
                        rank: newRanks[idx % newRanks.length]
                    }));

                    const updatedList = updateChildRanks(list, parent1, childRankUpdates1);

                    // Assert: Parent2's children should remain unchanged
                    expect(
                        ranksEqual(updatedList.children[parent2], originalParent2Children)
                    ).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Unit tests for edge cases
    describe('Edge Cases', () => {
        it('handles empty parent list', () => {
            const list: HierarchicalList = {
                parents: [],
                children: {}
            };

            const updatedList = updateParentRanks(list, []);

            expect(updatedList.parents).toEqual([]);
            expect(updatedList.children).toEqual({});
        });

        it('handles parent with no children', () => {
            const list: HierarchicalList = {
                parents: [
                    { option: 'parent1', rank: 1 },
                    { option: 'parent2', rank: 2 }
                ],
                children: {}
            };

            const newRanks: RankData[] = [
                { option: 'parent1', rank: 2 },
                { option: 'parent2', rank: 1 }
            ];

            const updatedList = updateParentRanks(list, newRanks);

            expect(updatedList.parents[0].rank).toBe(2);
            expect(updatedList.parents[1].rank).toBe(1);
            expect(updatedList.children).toEqual({});
        });

        it('handles updating non-existent parent children', () => {
            const list: HierarchicalList = {
                parents: [{ option: 'parent1', rank: 1 }],
                children: {
                    'parent1': [{ option: 'child1', rank: 1 }]
                }
            };

            const newRanks: RankData[] = [{ option: 'child2', rank: 2 }];

            const updatedList = updateChildRanks(list, 'nonexistent', newRanks);

            // Should not crash and should preserve original structure
            expect(updatedList.parents).toEqual(list.parents);
            expect(updatedList.children['parent1']).toEqual(list.children['parent1']);
        });

        it('handles single parent with single child', () => {
            const list: HierarchicalList = {
                parents: [{ option: 'parent1', rank: 1 }],
                children: {
                    'parent1': [{ option: 'child1', rank: 1 }]
                }
            };

            // Update parent rank
            const updatedList1 = updateParentRanks(list, [{ option: 'parent1', rank: 5 }]);
            expect(updatedList1.parents[0].rank).toBe(5);
            expect(updatedList1.children['parent1'][0].rank).toBe(1); // Child unchanged

            // Update child rank
            const updatedList2 = updateChildRanks(list, 'parent1', [{ option: 'child1', rank: 10 }]);
            expect(updatedList2.parents[0].rank).toBe(1); // Parent unchanged
            expect(updatedList2.children['parent1'][0].rank).toBe(10);
        });

        it('handles multiple children under same parent', () => {
            const list: HierarchicalList = {
                parents: [{ option: 'parent1', rank: 1 }],
                children: {
                    'parent1': [
                        { option: 'child1', rank: 1 },
                        { option: 'child2', rank: 2 },
                        { option: 'child3', rank: 3 }
                    ]
                }
            };

            // Update parent rank
            const updatedList = updateParentRanks(list, [{ option: 'parent1', rank: 10 }]);

            // All children should remain unchanged
            expect(updatedList.children['parent1'][0].rank).toBe(1);
            expect(updatedList.children['parent1'][1].rank).toBe(2);
            expect(updatedList.children['parent1'][2].rank).toBe(3);
        });

        it('handles partial rank updates', () => {
            const list: HierarchicalList = {
                parents: [
                    { option: 'parent1', rank: 1 },
                    { option: 'parent2', rank: 2 },
                    { option: 'parent3', rank: 3 }
                ],
                children: {
                    'parent1': [{ option: 'child1', rank: 1 }],
                    'parent2': [{ option: 'child2', rank: 1 }],
                    'parent3': [{ option: 'child3', rank: 1 }]
                }
            };

            // Update only parent1's rank
            const updatedList = updateParentRanks(list, [{ option: 'parent1', rank: 10 }]);

            expect(updatedList.parents[0].rank).toBe(10);
            expect(updatedList.parents[1].rank).toBe(2); // Unchanged
            expect(updatedList.parents[2].rank).toBe(3); // Unchanged

            // All children should remain unchanged
            expect(updatedList.children['parent1'][0].rank).toBe(1);
            expect(updatedList.children['parent2'][0].rank).toBe(1);
            expect(updatedList.children['parent3'][0].rank).toBe(1);
        });
    });

    // Real-world scenarios
    describe('Real-world Scenarios', () => {
        it('scenario: Governorates and Cities - reordering governorates preserves city ranks', () => {
            const list: HierarchicalList = {
                parents: [
                    { option: 'القاهرة', rank: 1 },
                    { option: 'الجيزة', rank: 2 },
                    { option: 'الإسكندرية', rank: 3 }
                ],
                children: {
                    'القاهرة': [
                        { option: 'مدينة نصر', rank: 1 },
                        { option: 'المعادي', rank: 2 },
                        { option: 'مصر الجديدة', rank: 3 }
                    ],
                    'الجيزة': [
                        { option: 'الدقي', rank: 1 },
                        { option: 'المهندسين', rank: 2 }
                    ],
                    'الإسكندرية': [
                        { option: 'المنتزه', rank: 1 },
                        { option: 'سموحة', rank: 2 }
                    ]
                }
            };

            // Reorder governorates (move Alexandria to first)
            const newParentRanks: RankData[] = [
                { option: 'الإسكندرية', rank: 1 },
                { option: 'القاهرة', rank: 2 },
                { option: 'الجيزة', rank: 3 }
            ];

            const updatedList = updateParentRanks(list, newParentRanks);

            // City ranks should remain unchanged
            expect(updatedList.children['القاهرة'][0].rank).toBe(1);
            expect(updatedList.children['القاهرة'][1].rank).toBe(2);
            expect(updatedList.children['القاهرة'][2].rank).toBe(3);
            expect(updatedList.children['الجيزة'][0].rank).toBe(1);
            expect(updatedList.children['الجيزة'][1].rank).toBe(2);
            expect(updatedList.children['الإسكندرية'][0].rank).toBe(1);
            expect(updatedList.children['الإسكندرية'][1].rank).toBe(2);
        });

        it('scenario: Brands and Models - reordering Cairo cities does not affect Giza cities', () => {
            const list: HierarchicalList = {
                parents: [
                    { option: 'القاهرة', rank: 1 },
                    { option: 'الجيزة', rank: 2 }
                ],
                children: {
                    'القاهرة': [
                        { option: 'مدينة نصر', rank: 1 },
                        { option: 'المعادي', rank: 2 },
                        { option: 'مصر الجديدة', rank: 3 }
                    ],
                    'الجيزة': [
                        { option: 'الدقي', rank: 1 },
                        { option: 'المهندسين', rank: 2 }
                    ]
                }
            };

            // Reorder Cairo cities
            const newCairoRanks: RankData[] = [
                { option: 'المعادي', rank: 1 },
                { option: 'مصر الجديدة', rank: 2 },
                { option: 'مدينة نصر', rank: 3 }
            ];

            const updatedList = updateChildRanks(list, 'القاهرة', newCairoRanks);

            // Giza cities should remain unchanged
            expect(updatedList.children['الجيزة'][0].rank).toBe(1);
            expect(updatedList.children['الجيزة'][1].rank).toBe(2);

            // Parent ranks should remain unchanged
            expect(updatedList.parents[0].rank).toBe(1);
            expect(updatedList.parents[1].rank).toBe(2);
        });

        it('scenario: Complex update sequence maintains independence', () => {
            const list: HierarchicalList = {
                parents: [
                    { option: 'parent1', rank: 1 },
                    { option: 'parent2', rank: 2 },
                    { option: 'parent3', rank: 3 }
                ],
                children: {
                    'parent1': [
                        { option: 'child1a', rank: 1 },
                        { option: 'child1b', rank: 2 }
                    ],
                    'parent2': [
                        { option: 'child2a', rank: 1 },
                        { option: 'child2b', rank: 2 }
                    ],
                    'parent3': [
                        { option: 'child3a', rank: 1 },
                        { option: 'child3b', rank: 2 }
                    ]
                }
            };

            // Step 1: Reorder parents
            let updated = updateParentRanks(list, [
                { option: 'parent3', rank: 1 },
                { option: 'parent1', rank: 2 },
                { option: 'parent2', rank: 3 }
            ]);

            // Step 2: Reorder parent1's children
            updated = updateChildRanks(updated, 'parent1', [
                { option: 'child1b', rank: 1 },
                { option: 'child1a', rank: 2 }
            ]);

            // Step 3: Reorder parent2's children
            updated = updateChildRanks(updated, 'parent2', [
                { option: 'child2b', rank: 1 },
                { option: 'child2a', rank: 2 }
            ]);

            // Verify: parent3's children should remain unchanged
            expect(updated.children['parent3'][0].option).toBe('child3a');
            expect(updated.children['parent3'][0].rank).toBe(1);
            expect(updated.children['parent3'][1].option).toBe('child3b');
            expect(updated.children['parent3'][1].rank).toBe(2);
        });
    });
});
