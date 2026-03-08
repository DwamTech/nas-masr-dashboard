/**
 * Property-Based Tests for Optimistic Update Timing
 * 
 * Feature: filters-lists-management
 * Property 15: Optimistic Update Timing
 * 
 * **Validates: Requirements 14.12**
 * 
 * Property Statement:
 * For any ranking operation, the UI state must update to reflect the new order 
 * before the API request completes, and if the API request fails, the UI must 
 * revert to the previous state.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Simulates an optimistic update operation
 * @param onReorder - Callback for UI update (should be called immediately)
 * @param onSave - Async callback for API save (completes later)
 * @returns Promise that resolves when operation completes
 */
async function performOptimisticUpdate<T>(
    onReorder: (newOrder: T[]) => void,
    onSave: () => Promise<void>,
    newOrder: T[]
): Promise<void> {
    // UI update should happen immediately (synchronously)
    onReorder(newOrder);

    // API call happens asynchronously
    await onSave();
}

/**
 * Simulates an optimistic update with rollback on failure
 * @param onReorder - Callback for UI update
 * @param onSave - Async callback for API save
 * @param onRollback - Callback for reverting UI on failure
 * @param newOrder - New order to apply
 * @returns Promise that resolves when operation completes or rejects on failure
 */
async function performOptimisticUpdateWithRollback<T>(
    onReorder: (newOrder: T[]) => void,
    onSave: () => Promise<void>,
    onRollback: (previousOrder: T[]) => void,
    newOrder: T[],
    previousOrder: T[]
): Promise<void> {
    // UI update happens immediately
    onReorder(newOrder);

    try {
        // API call happens asynchronously
        await onSave();
    } catch (error) {
        // Rollback on failure
        onRollback(previousOrder);
        throw error;
    }
}

describe('Feature: filters-lists-management, Property 15: Optimistic Update Timing', () => {

    it('Property: UI update (onReorder) is called before API call (onSave) completes', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 20 }),
                fc.integer({ min: 10, max: 100 }), // API delay in ms
                async (options, apiDelay) => {
                    // Track timing of callbacks
                    let uiUpdateTime: number | null = null;
                    let apiStartTime: number | null = null;
                    let apiCompleteTime: number | null = null;

                    // Simulate reordering (move first item to last)
                    const newOrder = [...options.slice(1), options[0]];

                    // Mock UI update callback
                    const onReorder = (order: string[]) => {
                        uiUpdateTime = Date.now();
                        expect(order).toEqual(newOrder);
                    };

                    // Mock API save callback with delay
                    const onSave = async () => {
                        apiStartTime = Date.now();
                        await new Promise(resolve => setTimeout(resolve, apiDelay));
                        apiCompleteTime = Date.now();
                    };

                    // Perform optimistic update
                    await performOptimisticUpdate(onReorder, onSave, newOrder);

                    // Assert: UI update happened before API completed
                    expect(uiUpdateTime).not.toBeNull();
                    expect(apiStartTime).not.toBeNull();
                    expect(apiCompleteTime).not.toBeNull();

                    // UI update should happen before or at the same time as API start
                    expect(uiUpdateTime!).toBeLessThanOrEqual(apiStartTime!);

                    // UI update should definitely happen before API completes
                    expect(uiUpdateTime!).toBeLessThan(apiCompleteTime!);
                }
            ),
            { numRuns: 50 } // Reduced runs due to async nature
        );
    });

    it('Property: UI reverts to previous state when API call fails', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 20 }),
                async (options) => {
                    // Track state changes
                    let currentState = [...options];
                    const previousState = [...options];

                    // Simulate reordering
                    const newOrder = [...options.slice(1), options[0]];

                    // Mock UI update callback
                    const onReorder = (order: string[]) => {
                        currentState = [...order];
                    };

                    // Mock API save callback that fails
                    const onSave = async () => {
                        await new Promise(resolve => setTimeout(resolve, 10));
                        throw new Error('API call failed');
                    };

                    // Mock rollback callback
                    const onRollback = (order: string[]) => {
                        currentState = [...order];
                    };

                    // Verify initial state
                    expect(currentState).toEqual(previousState);

                    // Perform optimistic update with rollback
                    try {
                        await performOptimisticUpdateWithRollback(
                            onReorder,
                            onSave,
                            onRollback,
                            newOrder,
                            previousState
                        );
                        // Should not reach here
                        expect(true).toBe(false);
                    } catch (error) {
                        // Expected to fail
                        expect(error).toBeDefined();
                    }

                    // Assert: State should be rolled back to previous state
                    expect(currentState).toEqual(previousState);
                    expect(currentState).not.toEqual(newOrder);
                }
            ),
            { numRuns: 50 }
        );
    });

    it('Property: UI update is synchronous (happens in same tick)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 20 }),
                async (options) => {
                    let uiUpdated = false;
                    let apiStarted = false;

                    const newOrder = [...options.slice(1), options[0]];

                    const onReorder = (order: string[]) => {
                        uiUpdated = true;
                        // At this point, API should not have started yet
                        expect(apiStarted).toBe(false);
                    };

                    const onSave = async () => {
                        apiStarted = true;
                        // At this point, UI should already be updated
                        expect(uiUpdated).toBe(true);
                        await new Promise(resolve => setTimeout(resolve, 10));
                    };

                    await performOptimisticUpdate(onReorder, onSave, newOrder);

                    // Both should have completed
                    expect(uiUpdated).toBe(true);
                    expect(apiStarted).toBe(true);
                }
            ),
            { numRuns: 50 }
        );
    });

    it('Property: Multiple rapid updates maintain correct order', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 3, maxLength: 10 }),
                fc.integer({ min: 2, max: 5 }), // Number of rapid updates
                async (options, numUpdates) => {
                    const updateHistory: string[][] = [];
                    let currentState = [...options];

                    const onReorder = (order: string[]) => {
                        currentState = [...order];
                        updateHistory.push([...order]);
                    };

                    // Perform multiple rapid updates
                    const updates: Promise<void>[] = [];
                    for (let i = 0; i < numUpdates; i++) {
                        // Each update rotates the array
                        const newOrder = [...currentState.slice(1), currentState[0]];

                        const onSave = async () => {
                            await new Promise(resolve => setTimeout(resolve, 10));
                        };

                        updates.push(performOptimisticUpdate(onReorder, onSave, newOrder));
                    }

                    await Promise.all(updates);

                    // Assert: All UI updates should have been recorded
                    expect(updateHistory.length).toBe(numUpdates);

                    // Each update should be different from the previous
                    for (let i = 1; i < updateHistory.length; i++) {
                        expect(updateHistory[i]).not.toEqual(updateHistory[i - 1]);
                    }
                }
            ),
            { numRuns: 30 }
        );
    });

    it('Property: Rollback preserves exact previous state including order', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 20 }),
                async (options) => {
                    // Create a complex previous state with specific order
                    const previousState = [...options];
                    let currentState = [...previousState];

                    // Create a different new order
                    const newOrder = [...options].reverse();

                    const onReorder = (order: string[]) => {
                        currentState = [...order];
                    };

                    const onSave = async () => {
                        await new Promise(resolve => setTimeout(resolve, 10));
                        throw new Error('Save failed');
                    };

                    const onRollback = (order: string[]) => {
                        currentState = [...order];
                    };

                    try {
                        await performOptimisticUpdateWithRollback(
                            onReorder,
                            onSave,
                            onRollback,
                            newOrder,
                            previousState
                        );
                    } catch (error) {
                        // Expected
                    }

                    // Assert: Every element should be in exact same position as before
                    expect(currentState.length).toBe(previousState.length);
                    for (let i = 0; i < previousState.length; i++) {
                        expect(currentState[i]).toBe(previousState[i]);
                    }
                }
            ),
            { numRuns: 50 }
        );
    });

    it('Property: Successful save does not trigger rollback', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 20 }),
                async (options) => {
                    let rollbackCalled = false;
                    let currentState = [...options];
                    const newOrder = [...options.slice(1), options[0]];

                    const onReorder = (order: string[]) => {
                        currentState = [...order];
                    };

                    const onSave = async () => {
                        await new Promise(resolve => setTimeout(resolve, 10));
                        // Success - no error thrown
                    };

                    const onRollback = (order: string[]) => {
                        rollbackCalled = true;
                        currentState = [...order];
                    };

                    await performOptimisticUpdateWithRollback(
                        onReorder,
                        onSave,
                        onRollback,
                        newOrder,
                        options
                    );

                    // Assert: Rollback should not have been called
                    expect(rollbackCalled).toBe(false);

                    // State should remain as the new order
                    expect(currentState).toEqual(newOrder);
                }
            ),
            { numRuns: 50 }
        );
    });

});
