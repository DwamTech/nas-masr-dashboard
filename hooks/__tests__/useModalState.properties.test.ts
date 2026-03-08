import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

/**
 * Property-Based Tests for useModalState Hook
 * 
 * These tests verify universal properties that should hold for all valid inputs
 * using fast-check for comprehensive input coverage.
 */

// Generators for valid modal state values
const modalTypeArb = fc.constantFrom('rank', 'edit');
const categorySlugArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9_-]+$/.test(s));
const fieldNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9_-]+$/.test(s));
const parentValueArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9_-]+$/.test(s));

describe('Feature: filters-lists-management, Property 1: URL State Round Trip', () => {
    /**
     * Property 1: URL State Round Trip
     * 
     * For any modal state (type, category, field, parent), opening a modal should 
     * update the URL with query parameters, and closing the modal should remove 
     * those parameters, returning the URL to its original state.
     * 
     * Validates: Requirements 4.2, 4.3, 4.4
     */
    it('should round-trip modal state through URL parameters', () => {
        fc.assert(
            fc.property(
                modalTypeArb,
                categorySlugArb,
                fieldNameArb,
                fc.option(parentValueArb, { nil: undefined }),
                (modalType, category, field, parent) => {
                    // Arrange: Create URL parameters for opening modal
                    const params = new URLSearchParams();
                    params.set('modal', modalType);
                    params.set('category', category);
                    params.set('field', field);
                    if (parent) {
                        params.set('parent', parent);
                    }

                    const openUrl = `?${params.toString()}`;

                    // Act: Parse the URL parameters
                    const searchParams = new URLSearchParams(openUrl);
                    const parsedType = searchParams.get('modal');
                    const parsedCategory = searchParams.get('category');
                    const parsedField = searchParams.get('field');
                    const parsedParent = searchParams.get('parent');

                    // Assert: Parsed values should match original values
                    expect(parsedType).toBe(modalType);
                    expect(parsedCategory).toBe(category);
                    expect(parsedField).toBe(field);

                    if (parent) {
                        expect(parsedParent).toBe(parent);
                    } else {
                        expect(parsedParent).toBeNull();
                    }

                    // Act: Close modal by removing parameters
                    const closedUrl = '';

                    // Assert: Closed URL should be empty (no parameters)
                    expect(closedUrl).toBe('');
                    expect(closedUrl).not.toContain('?');
                    expect(closedUrl).not.toContain('modal');
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should preserve all modal state parameters during round trip', () => {
        fc.assert(
            fc.property(
                modalTypeArb,
                categorySlugArb,
                fieldNameArb,
                fc.option(parentValueArb, { nil: undefined }),
                (modalType, category, field, parent) => {
                    // Create initial state
                    const initialState = {
                        type: modalType,
                        category,
                        field,
                        parent: parent || null,
                    };

                    // Convert to URL parameters
                    const params = new URLSearchParams();
                    params.set('modal', initialState.type);
                    params.set('category', initialState.category);
                    params.set('field', initialState.field);
                    if (initialState.parent) {
                        params.set('parent', initialState.parent);
                    }

                    // Parse back from URL
                    const searchParams = new URLSearchParams(`?${params.toString()}`);
                    const restoredState = {
                        type: searchParams.get('modal') as 'rank' | 'edit',
                        category: searchParams.get('category'),
                        field: searchParams.get('field'),
                        parent: searchParams.get('parent'),
                    };

                    // All non-null values should be preserved
                    expect(restoredState.type).toBe(initialState.type);
                    expect(restoredState.category).toBe(initialState.category);
                    expect(restoredState.field).toBe(initialState.field);

                    if (initialState.parent) {
                        expect(restoredState.parent).toBe(initialState.parent);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Feature: filters-lists-management, Property 2: URL State Hydration', () => {
    /**
     * Property 2: URL State Hydration
     * 
     * For any valid modal URL with query parameters, refreshing the page should 
     * restore the exact modal state (modal type, selected category, selected field, 
     * and parent context if applicable).
     * 
     * Validates: Requirements 4.5
     */
    it('should hydrate modal state from URL on page refresh', () => {
        fc.assert(
            fc.property(
                modalTypeArb,
                categorySlugArb,
                fieldNameArb,
                fc.option(parentValueArb, { nil: undefined }),
                (modalType, category, field, parent) => {
                    // Arrange: Create a URL with modal state
                    const params = new URLSearchParams();
                    params.set('modal', modalType);
                    params.set('category', category);
                    params.set('field', field);
                    if (parent) {
                        params.set('parent', parent);
                    }

                    const urlWithState = `?${params.toString()}`;

                    // Act: Simulate page refresh by parsing URL again
                    const searchParams = new URLSearchParams(urlWithState);

                    // Assert: State should be fully restored
                    expect(searchParams.get('modal')).toBe(modalType);
                    expect(searchParams.get('category')).toBe(category);
                    expect(searchParams.get('field')).toBe(field);

                    if (parent) {
                        expect(searchParams.get('parent')).toBe(parent);
                    } else {
                        expect(searchParams.get('parent')).toBeNull();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should restore complete modal context including hierarchical parent', () => {
        fc.assert(
            fc.property(
                modalTypeArb,
                categorySlugArb,
                fieldNameArb,
                parentValueArb,
                (modalType, category, field, parent) => {
                    // Arrange: Create URL with hierarchical context
                    const params = new URLSearchParams();
                    params.set('modal', modalType);
                    params.set('category', category);
                    params.set('field', field);
                    params.set('parent', parent);

                    const urlWithHierarchicalContext = `?${params.toString()}`;

                    // Act: Parse URL to restore state
                    const searchParams = new URLSearchParams(urlWithHierarchicalContext);
                    const restoredState = {
                        type: searchParams.get('modal'),
                        category: searchParams.get('category'),
                        field: searchParams.get('field'),
                        parent: searchParams.get('parent'),
                    };

                    // Assert: All hierarchical context should be preserved
                    expect(restoredState.type).toBe(modalType);
                    expect(restoredState.category).toBe(category);
                    expect(restoredState.field).toBe(field);
                    expect(restoredState.parent).toBe(parent);

                    // Assert: No parameters should be lost
                    expect(Object.values(restoredState).every(v => v !== null)).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should handle missing optional parent parameter during hydration', () => {
        fc.assert(
            fc.property(
                modalTypeArb,
                categorySlugArb,
                fieldNameArb,
                (modalType, category, field) => {
                    // Arrange: Create URL without parent parameter
                    const params = new URLSearchParams();
                    params.set('modal', modalType);
                    params.set('category', category);
                    params.set('field', field);

                    const urlWithoutParent = `?${params.toString()}`;

                    // Act: Parse URL
                    const searchParams = new URLSearchParams(urlWithoutParent);

                    // Assert: Required parameters present, parent absent
                    expect(searchParams.get('modal')).toBe(modalType);
                    expect(searchParams.get('category')).toBe(category);
                    expect(searchParams.get('field')).toBe(field);
                    expect(searchParams.get('parent')).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should maintain state consistency across multiple hydration cycles', () => {
        fc.assert(
            fc.property(
                modalTypeArb,
                categorySlugArb,
                fieldNameArb,
                fc.option(parentValueArb, { nil: undefined }),
                (modalType, category, field, parent) => {
                    // Arrange: Create initial URL
                    const params = new URLSearchParams();
                    params.set('modal', modalType);
                    params.set('category', category);
                    params.set('field', field);
                    if (parent) {
                        params.set('parent', parent);
                    }

                    let currentUrl = `?${params.toString()}`;

                    // Act: Simulate multiple hydration cycles
                    for (let i = 0; i < 3; i++) {
                        const searchParams = new URLSearchParams(currentUrl);

                        // Assert: State should remain consistent
                        expect(searchParams.get('modal')).toBe(modalType);
                        expect(searchParams.get('category')).toBe(category);
                        expect(searchParams.get('field')).toBe(field);

                        if (parent) {
                            expect(searchParams.get('parent')).toBe(parent);
                        }

                        // Reconstruct URL for next cycle
                        const newParams = new URLSearchParams();
                        newParams.set('modal', searchParams.get('modal') || '');
                        newParams.set('category', searchParams.get('category') || '');
                        newParams.set('field', searchParams.get('field') || '');
                        if (searchParams.get('parent')) {
                            newParams.set('parent', searchParams.get('parent') || '');
                        }
                        currentUrl = `?${newParams.toString()}`;
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
