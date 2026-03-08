/**
 * Bug Condition Exploration Test for Rank Modal Scroll Issue
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 * 
 * CRITICAL: This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists: scroll events inside the modal
 * propagate to the body element instead of being contained.
 * 
 * Bug Condition: When user scrolls inside the modal's scroll container,
 * the scroll event propagates to the body element, causing the main page
 * to scroll instead of the modal content.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import RankModal from '@/components/filters-lists/RankModal';
import type { Category, CategoryField } from '@/types/filters-lists';

// Mock the services
vi.mock('@/services/categoryFields', () => ({
    fetchCategoryFields: vi.fn(() => Promise.resolve({
        data: [
            {
                id: 1,
                field_name: 'condition',
                display_name: 'الحالة',
                options: Array.from({ length: 30 }, (_, i) => `خيار ${i + 1}`)
            }
        ]
    }))
}));

vi.mock('@/services/optionRanks', () => ({
    updateOptionRanks: vi.fn(() => Promise.resolve())
}));

vi.mock('@/services/governorates', () => ({
    fetchGovernorates: vi.fn(() => Promise.resolve([]))
}));

// Mock the lazy loaded component
vi.mock('@/components/DraggableOptions/DraggableOptionsList', () => ({
    DraggableOptionsList: ({ options }: { options: string[] }) => (
        <div data-testid="draggable-list">
            {options.map((option, index) => (
                <div key={index} data-testid={`option-${index}`}>
                    {option}
                </div>
            ))}
        </div>
    )
}));

// Mock hooks
vi.mock('@/hooks/useFocusTrap', () => ({
    useFocusTrap: () => ({ current: null })
}));

vi.mock('@/hooks/useFocusReturn', () => ({
    useFocusReturn: () => { }
}));

describe('Bug Condition Exploration: Rank Modal Scroll Issue', () => {
    const mockCategory: Category = {
        id: 1,
        name: 'عقارات',
        slug: 'real-estate',
        icon: 'home'
    };

    const mockField: CategoryField = {
        id: 1,
        field_name: 'condition',
        display_name: 'الحالة',
        options: Array.from({ length: 30 }, (_, i) => `خيار ${i + 1}`)
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset body scroll
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    });

    afterEach(() => {
        // Restore body overflow
        document.body.style.overflow = '';
    });

    /**
     * Property 1: Fault Condition - Scroll داخل النافذة فقط
     * 
     * This test encodes the EXPECTED behavior (scroll should stay in modal).
     * On UNFIXED code, this test will FAIL because scroll propagates to body.
     * 
     * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
     */
    describe('Property 1: Scroll Containment (EXPECTED TO FAIL on unfixed code)', () => {
        it('should contain scroll events within modal content area - mouse wheel', async () => {
            const { container } = render(
                <RankModal
                    isOpen={true}
                    onClose={() => { }}
                    category={mockCategory}
                    field={mockField}
                />
            );

            // Wait for modal to render and content to load
            await waitFor(() => {
                expect(screen.getByText(/ترتيب الحالة/)).toBeInTheDocument();
            });

            await waitFor(() => {
                expect(screen.queryByRole('status')).not.toBeInTheDocument();
            });

            // Find the scroll container (the div with overflow-y-auto)
            const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;
            expect(scrollContainer).toBeInTheDocument();

            // Track if event propagates to body
            let eventPropagatedToBody = false;
            const bodyWheelHandler = () => {
                eventPropagatedToBody = true;
            };
            document.body.addEventListener('wheel', bodyWheelHandler);

            try {
                // Create wheel event with deltaY != 0
                const wheelEvent = new WheelEvent('wheel', {
                    bubbles: true,
                    cancelable: true,
                    deltaY: 100, // Scroll down
                    clientX: 100,
                    clientY: 100
                });

                // Dispatch on scroll container
                scrollContainer.dispatchEvent(wheelEvent);

                // BUG CONDITION CHECK:
                // On unfixed code, event WILL propagate to body (eventPropagatedToBody = true)
                // On fixed code, event should NOT propagate (eventPropagatedToBody = false)

                // This assertion documents the EXPECTED behavior (will fail on unfixed code)
                expect(eventPropagatedToBody).toBe(false);
            } finally {
                document.body.removeEventListener('wheel', bodyWheelHandler);
            }
        });

        it('should prevent scroll chaining when reaching content boundaries', async () => {
            const { container } = render(
                <RankModal
                    isOpen={true}
                    onClose={() => { }}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByText(/ترتيب الحالة/)).toBeInTheDocument();
            });

            await waitFor(() => {
                expect(screen.queryByRole('status')).not.toBeInTheDocument();
            });

            const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;
            expect(scrollContainer).toBeInTheDocument();

            // Track if event propagates to body
            let eventPropagatedToBody = false;
            const bodyWheelHandler = () => {
                eventPropagatedToBody = true;
            };
            document.body.addEventListener('wheel', bodyWheelHandler);

            try {
                // Try to scroll (should not propagate to body)
                const wheelEvent = new WheelEvent('wheel', {
                    bubbles: true,
                    cancelable: true,
                    deltaY: 100,
                    clientX: 100,
                    clientY: 100
                });

                scrollContainer.dispatchEvent(wheelEvent);

                // EXPECTED: Event should not propagate to body (scroll chaining prevented)
                // BUG: On unfixed code, this will fail - event will propagate
                expect(eventPropagatedToBody).toBe(false);
            } finally {
                document.body.removeEventListener('wheel', bodyWheelHandler);
            }
        });
    });

    /**
     * Property-Based Test: Scroll events with various deltaY values
     * 
     * Tests that scroll containment works across different scroll amounts
     */
    describe('Property-Based: Scroll Event Containment', () => {
        it('should contain scroll for any deltaY value', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: -500, max: 500 }).filter(n => n !== 0), // deltaY values
                    async (deltaY) => {
                        const { container, unmount } = render(
                            <RankModal
                                isOpen={true}
                                onClose={() => { }}
                                category={mockCategory}
                                field={mockField}
                            />
                        );

                        try {
                            await waitFor(() => {
                                expect(screen.getByText(/ترتيب الحالة/)).toBeInTheDocument();
                            }, { timeout: 3000 });

                            await waitFor(() => {
                                expect(screen.queryByRole('status')).not.toBeInTheDocument();
                            }, { timeout: 3000 });

                            const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;
                            if (!scrollContainer) {
                                throw new Error('Scroll container not found');
                            }

                            // Track if event propagates to body
                            let eventPropagatedToBody = false;
                            const bodyWheelHandler = () => {
                                eventPropagatedToBody = true;
                            };
                            document.body.addEventListener('wheel', bodyWheelHandler);

                            try {
                                // Dispatch wheel event with generated deltaY
                                const wheelEvent = new WheelEvent('wheel', {
                                    bubbles: true,
                                    cancelable: true,
                                    deltaY,
                                    clientX: 100,
                                    clientY: 100
                                });

                                scrollContainer.dispatchEvent(wheelEvent);

                                // Event should not propagate to body for any deltaY value
                                expect(eventPropagatedToBody).toBe(false);
                            } finally {
                                document.body.removeEventListener('wheel', bodyWheelHandler);
                            }
                        } finally {
                            unmount();
                        }
                    }
                ),
                {
                    numRuns: 20,
                    verbose: true,
                    endOnFailure: true
                }
            );
        });
    });
});
