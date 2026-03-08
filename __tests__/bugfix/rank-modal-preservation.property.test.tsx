/**
 * Preservation Property Tests for Rank Modal
 * Task 2: Write preservation property tests (BEFORE implementing fix)
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
 * 
 * CRITICAL: These tests verify behaviors that MUST remain unchanged after the fix.
 * Tests should PASS on UNFIXED code to establish baseline behavior.
 * 
 * Property 2: Preservation - السلوكيات الحالية للنافذة
 * 
 * For any interaction with the modal that does NOT involve scrolling content,
 * the fixed code must behave identically to the original code, preserving all
 * current functionality without any changes.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import * as fc from 'fast-check';
import RankModal from '@/components/filters-lists/RankModal';
import type { Category, CategoryField } from '@/types/filters-lists';
import * as categoryFieldsService from '@/services/categoryFields';
import * as optionRanksService from '@/services/optionRanks';
import * as governoratesService from '@/services/governorates';

// Mock the services
vi.mock('@/services/categoryFields');
vi.mock('@/services/optionRanks');
vi.mock('@/services/governorates');

// Mock the lazy loaded component
vi.mock('@/components/DraggableOptions/DraggableOptionsList', () => ({
    DraggableOptionsList: ({ options, onSave, onReorder, disabled }: any) => (
        <div data-testid="draggable-list" data-disabled={disabled}>
            <div data-testid="options-container">
                {options.map((option: string, index: number) => (
                    <div key={index} data-testid={`option-${index}`}>
                        {option}
                    </div>
                ))}
            </div>
            <button
                data-testid="trigger-save"
                onClick={async () => {
                    const ranks = options.map((opt: string, idx: number) => ({
                        option: opt,
                        rank: idx + 1,
                    }));
                    await onSave(ranks);
                }}
            >
                Save
            </button>
            <button
                data-testid="trigger-reorder"
                onClick={() => {
                    const newOrder = [...options.slice(1), options[0]];
                    onReorder(newOrder);
                }}
            >
                Reorder
            </button>
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

describe('Preservation Property Tests: Rank Modal Non-Scroll Behaviors', () => {
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
        options: ['جديد', 'مستعمل', 'غير ذلك']
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default mocks
        vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
            data: [mockField],
            governorates: [],
            makes: [],
            supports_make_model: false,
            supports_sections: false,
            main_sections: [],
        });

        vi.mocked(optionRanksService.updateOptionRanks).mockResolvedValue({
            success: true,
            message: 'تم تحديث الترتيب بنجاح',
            data: { updated_count: 3 },
        });

        vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue([]);
    });

    afterEach(() => {
        // Restore body overflow
        document.body.style.overflow = '';
    });

    /**
     * Requirement 3.1: Modal closes correctly (X button, outside click)
     * Requirement 3.2: Escape key closes modal
     */
    describe('Property: Modal Close Behavior (Req 3.1, 3.2)', () => {
        it('should close modal when X button is clicked', async () => {
            const onClose = vi.fn();

            render(
                <RankModal
                    isOpen={true}
                    onClose={onClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByText(/ترتيب الحالة/)).toBeInTheDocument();
            });

            // Find and click close button (the X button in header)
            const closeButton = screen.getByLabelText('إغلاق نافذة ترتيب الخيارات');

            await act(async () => {
                fireEvent.click(closeButton);
                // Wait for animation to complete (200ms)
                await new Promise(resolve => setTimeout(resolve, 250));
            });

            // Verify onClose was called
            expect(onClose).toHaveBeenCalled();
        });

        it('should close modal when clicking outside (backdrop)', async () => {
            const onClose = vi.fn();

            const { container } = render(
                <RankModal
                    isOpen={true}
                    onClose={onClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByText(/ترتيب الحالة/)).toBeInTheDocument();
            });

            // Find backdrop and click it
            const backdrop = container.querySelector('.modal-backdrop') as HTMLElement;
            expect(backdrop).toBeInTheDocument();

            await act(async () => {
                fireEvent.click(backdrop);
                // Wait for animation to complete (200ms)
                await new Promise(resolve => setTimeout(resolve, 250));
            });

            // Verify onClose was called
            expect(onClose).toHaveBeenCalled();
        });

        it('should close modal when Escape key is pressed', async () => {
            const onClose = vi.fn();

            render(
                <RankModal
                    isOpen={true}
                    onClose={onClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByText(/ترتيب الحالة/)).toBeInTheDocument();
            });

            // Press Escape key
            await act(async () => {
                const escapeEvent = new KeyboardEvent('keydown', {
                    key: 'Escape',
                    bubbles: true,
                    cancelable: true,
                });
                document.dispatchEvent(escapeEvent);
                // Wait for animation to complete (200ms)
                await new Promise(resolve => setTimeout(resolve, 250));
            });

            // Verify onClose was called
            expect(onClose).toHaveBeenCalled();
        });

        it('should close modal when footer close button is clicked', async () => {
            const onClose = vi.fn();

            render(
                <RankModal
                    isOpen={true}
                    onClose={onClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Find and click footer close button
            const footerCloseButton = screen.getByLabelText('إغلاق نافذة الترتيب');

            await act(async () => {
                fireEvent.click(footerCloseButton);
                // Wait for animation to complete (200ms)
                await new Promise(resolve => setTimeout(resolve, 250));
            });

            // Verify onClose was called
            expect(onClose).toHaveBeenCalled();
        });
    });

    /**
     * Requirement 3.3: Body scroll prevented when modal open (body overflow: hidden)
     */
    describe('Property: Body Scroll Prevention (Req 3.3)', () => {
        it('should set body overflow to hidden when modal opens', async () => {
            render(
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

            // Verify body overflow is hidden
            expect(document.body.style.overflow).toBe('hidden');
        });

        it('should restore body overflow when modal closes', async () => {
            const originalOverflow = 'auto';
            document.body.style.overflow = originalOverflow;

            const { rerender } = render(
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

            // Close modal
            rerender(
                <RankModal
                    isOpen={false}
                    onClose={() => { }}
                    category={mockCategory}
                    field={mockField}
                />
            );

            // Verify body overflow is restored
            await waitFor(() => {
                expect(document.body.style.overflow).toBe(originalOverflow);
            });
        });
    });

    /**
     * Requirement 3.4: Drag & drop functionality works
     */
    describe('Property: Drag & Drop Functionality (Req 3.4)', () => {
        it('should render DraggableOptionsList component', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={() => { }}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Verify all options are rendered
            expect(screen.getByTestId('option-0')).toBeInTheDocument();
            expect(screen.getByTestId('option-1')).toBeInTheDocument();
            expect(screen.getByTestId('option-2')).toBeInTheDocument();
        });

        it('should update options state when reorder is triggered', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={() => { }}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Trigger reorder
            const reorderButton = screen.getByTestId('trigger-reorder');
            fireEvent.click(reorderButton);

            // Component should handle reorder without errors
            // (State update is internal, we verify no errors occur)
            expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
        });
    });

    /**
     * Requirement 3.5: Save functionality works
     */
    describe('Property: Save Functionality (Req 3.5)', () => {
        it('should call updateOptionRanks with correct parameters', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={() => { }}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Trigger save
            const saveButton = screen.getByTestId('trigger-save');
            fireEvent.click(saveButton);

            // Verify API call
            await waitFor(() => {
                expect(optionRanksService.updateOptionRanks).toHaveBeenCalledWith(
                    'real-estate',
                    'condition',
                    [
                        { option: 'جديد', rank: 1 },
                        { option: 'مستعمل', rank: 2 },
                        { option: 'غير ذلك', rank: 3 },
                    ],
                    undefined
                );
            });
        });

        it('should display success message after save', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={() => { }}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Trigger save
            const saveButton = screen.getByTestId('trigger-save');
            fireEvent.click(saveButton);

            // Wait for success message
            await waitFor(() => {
                expect(screen.getByText('تم حفظ الترتيب بنجاح')).toBeInTheDocument();
            });
        });

        it('should display error message on save failure', async () => {
            vi.mocked(optionRanksService.updateOptionRanks).mockRejectedValue(
                new Error('فشل الاتصال بالخادم')
            );

            render(
                <RankModal
                    isOpen={true}
                    onClose={() => { }}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Trigger save
            const saveButton = screen.getByTestId('trigger-save');
            fireEvent.click(saveButton);

            // Wait for error message
            await waitFor(() => {
                expect(screen.getByText('فشل الاتصال بالخادم')).toBeInTheDocument();
            });
        });
    });

    /**
     * Requirement 3.7: Error and success messages display correctly
     */
    describe('Property: Message Display (Req 3.7)', () => {
        it('should display loading state while fetching options', () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={() => { }}
                    category={mockCategory}
                    field={mockField}
                />
            );

            // Loading spinner should be visible
            const spinner = document.querySelector('.animate-spin');
            expect(spinner).toBeInTheDocument();
        });

        it('should display error message when fetch fails', async () => {
            vi.mocked(categoryFieldsService.fetchCategoryFields).mockRejectedValue(
                new Error('فشل تحميل البيانات')
            );

            render(
                <RankModal
                    isOpen={true}
                    onClose={() => { }}
                    category={mockCategory}
                    field={mockField}
                />
            );

            // Wait for error message
            await waitFor(() => {
                expect(screen.getByText('فشل تحميل البيانات')).toBeInTheDocument();
            });
        });
    });

    /**
     * Requirement 3.8: Keyboard navigation (Tab, Shift+Tab) and focus trap work
     */
    describe('Property: Keyboard Navigation and Focus Trap (Req 3.8)', () => {
        it('should have proper ARIA attributes for accessibility', async () => {
            render(
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

            // Check for dialog role
            const dialog = screen.getByRole('dialog');
            expect(dialog).toBeInTheDocument();
            expect(dialog).toHaveAttribute('aria-modal', 'true');
            expect(dialog).toHaveAttribute('aria-labelledby', 'rank-modal-title');
        });

        it('should have modal title with proper ID for aria-labelledby', async () => {
            render(
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

            // Check modal title has proper ID
            const title = document.getElementById('rank-modal-title');
            expect(title).toBeInTheDocument();
            expect(title).toHaveTextContent('ترتيب الحالة');
        });

        it('should have accessible close button with aria-label', async () => {
            render(
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

            // Check close button has proper accessibility attributes
            const closeButton = screen.getByLabelText('إغلاق نافذة ترتيب الخيارات');
            expect(closeButton).toBeInTheDocument();
            expect(closeButton).toHaveAttribute('title');
        });
    });

    /**
     * Property-Based Test: Modal close behavior across different interaction types
     */
    describe('Property-Based: Modal Close Interactions', () => {
        it('should close modal for any valid close action', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom('x-button', 'backdrop', 'escape', 'footer-button'),
                    async (closeAction) => {
                        const onClose = vi.fn();
                        const { container, unmount } = render(
                            <RankModal
                                isOpen={true}
                                onClose={onClose}
                                category={mockCategory}
                                field={mockField}
                            />
                        );

                        try {
                            await waitFor(() => {
                                expect(screen.getByText(/ترتيب الحالة/)).toBeInTheDocument();
                            }, { timeout: 3000 });

                            // Perform close action based on type
                            await act(async () => {
                                switch (closeAction) {
                                    case 'x-button':
                                        const closeButton = screen.getByLabelText('إغلاق نافذة ترتيب الخيارات');
                                        fireEvent.click(closeButton);
                                        break;
                                    case 'backdrop':
                                        const backdrop = container.querySelector('.modal-backdrop') as HTMLElement;
                                        fireEvent.click(backdrop);
                                        break;
                                    case 'escape':
                                        const escapeEvent = new KeyboardEvent('keydown', {
                                            key: 'Escape',
                                            bubbles: true,
                                            cancelable: true,
                                        });
                                        document.dispatchEvent(escapeEvent);
                                        break;
                                    case 'footer-button':
                                        await waitFor(() => {
                                            expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
                                        });
                                        const footerButton = screen.getByLabelText('إغلاق نافذة الترتيب');
                                        fireEvent.click(footerButton);
                                        break;
                                }
                                // Wait for animation to complete
                                await new Promise(resolve => setTimeout(resolve, 250));
                            });

                            // Verify onClose was called for all actions
                            expect(onClose).toHaveBeenCalled();
                        } finally {
                            unmount();
                        }
                    }
                ),
                {
                    numRuns: 10,
                    verbose: true
                }
            );
        });
    });

    /**
     * Property-Based Test: Save functionality with various option counts
     */
    describe('Property-Based: Save with Different Option Counts', () => {
        it('should save successfully for any number of options', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 1, max: 10 }),
                    async (optionCount) => {
                        // Clear mocks before each property test run
                        vi.clearAllMocks();

                        const options = Array.from({ length: optionCount }, (_, i) => `خيار ${i + 1}`);
                        const testField: CategoryField = {
                            ...mockField,
                            options
                        };

                        vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
                            data: [testField],
                            governorates: [],
                            makes: [],
                            supports_make_model: false,
                            supports_sections: false,
                            main_sections: [],
                        });

                        vi.mocked(optionRanksService.updateOptionRanks).mockResolvedValue({
                            success: true,
                            message: 'تم تحديث الترتيب بنجاح',
                            data: { updated_count: optionCount },
                        });

                        const { unmount } = render(
                            <RankModal
                                isOpen={true}
                                onClose={() => { }}
                                category={mockCategory}
                                field={testField}
                            />
                        );

                        try {
                            await waitFor(() => {
                                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
                            }, { timeout: 3000 });

                            // Trigger save
                            const saveButton = screen.getByTestId('trigger-save');
                            fireEvent.click(saveButton);

                            // Verify save was called with correct number of options
                            await waitFor(() => {
                                expect(optionRanksService.updateOptionRanks).toHaveBeenCalled();
                            }, { timeout: 3000 });

                            const callArgs = vi.mocked(optionRanksService.updateOptionRanks).mock.calls[0];
                            expect(callArgs[2]).toHaveLength(optionCount);
                        } finally {
                            unmount();
                        }
                    }
                ),
                {
                    numRuns: 5,
                    verbose: true
                }
            );
        });
    });
});
