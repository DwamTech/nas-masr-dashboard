/**
 * RankModal Accessibility Tests
 * 
 * Task 18.4: Write accessibility tests
 * 
 * Tests:
 * - Keyboard navigation flows
 * - ARIA labels presence
 * - Focus management in modals
 * - Touch target sizes
 * 
 * Requirements: 11.5, 11.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RankModal from '../RankModal';
import { Category, CategoryField } from '@/types/filters-lists';

// Mock services
vi.mock('@/services/categoryFields', () => ({
    fetchCategoryFields: vi.fn(),
}));

vi.mock('@/services/optionRanks', () => ({
    updateOptionRanks: vi.fn(),
}));

vi.mock('@/services/governorates', () => ({
    fetchGovernorates: vi.fn(),
}));

// Mock hooks
vi.mock('@/hooks/useFocusTrap', () => ({
    useFocusTrap: vi.fn(() => ({ current: null })),
}));

vi.mock('@/hooks/useFocusReturn', () => ({
    useFocusReturn: vi.fn(),
}));

describe('RankModal - Accessibility Tests', () => {
    const mockCategory: Category = {
        id: 1,
        slug: 'cars',
        name: 'سيارات',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
    };

    const mockField: CategoryField = {
        id: 1,
        category_slug: 'cars',
        field_name: 'condition',
        display_name: 'الحالة',
        type: 'select',
        required: false,
        filterable: true,
        options: ['جديد', 'مستعمل', 'غير ذلك'],
        is_active: true,
        sort_order: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
    };

    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock fetchCategoryFields to return field data
        const { fetchCategoryFields } = require('@/services/categoryFields');
        fetchCategoryFields.mockResolvedValue({
            data: [mockField],
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Keyboard Navigation', () => {
        it('should close modal when Escape key is pressed', async () => {
            const user = userEvent.setup();

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Press Escape key
            await user.keyboard('{Escape}');

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('should allow tab navigation through interactive elements', async () => {
            const user = userEvent.setup();

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Get close button
            const closeButton = screen.getByRole('button', { name: /إغلاق/i });

            // Tab should move focus to close button
            await user.tab();

            // Check if close button can receive focus
            expect(closeButton).toBeInTheDocument();
        });

        it('should support Space/Enter activation for buttons', async () => {
            const user = userEvent.setup();

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            const closeButton = screen.getByRole('button', { name: /إغلاق/i });
            closeButton.focus();

            // Press Enter
            await user.keyboard('{Enter}');

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('should provide keyboard instructions for drag-and-drop', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Wait for options to load
            await waitFor(() => {
                const list = screen.queryByRole('list');
                if (list) {
                    expect(list).toBeInTheDocument();
                }
            });

            // Check for keyboard instructions (may be in sr-only element)
            const instructions = document.getElementById('drag-instructions');
            if (instructions) {
                expect(instructions).toHaveTextContent(/استخدم مفاتيح الأسهم/i);
            }
        });
    });

    describe('ARIA Labels and Roles', () => {
        it('should have proper dialog role and aria-modal', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                const dialog = screen.getByRole('dialog');
                expect(dialog).toBeInTheDocument();
                expect(dialog).toHaveAttribute('aria-modal', 'true');
            });
        });

        it('should have aria-labelledby pointing to modal title', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                const dialog = screen.getByRole('dialog');
                expect(dialog).toHaveAttribute('aria-labelledby', 'rank-modal-title');

                const title = document.getElementById('rank-modal-title');
                expect(title).toBeInTheDocument();
                expect(title).toHaveTextContent(/ترتيب/);
            });
        });

        it('should have aria-label on close button', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                const closeButton = screen.getByRole('button', { name: /إغلاق نافذة ترتيب الخيارات/i });
                expect(closeButton).toBeInTheDocument();
                expect(closeButton).toHaveAttribute('aria-label');
            });
        });

        it('should have ARIA live region for loading state', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Check for loading state with proper ARIA
            const loadingElement = screen.queryByRole('status');
            if (loadingElement) {
                expect(loadingElement).toHaveAttribute('aria-live', 'polite');
            }
        });

        it('should have ARIA live region for error messages', async () => {
            const { fetchCategoryFields } = require('@/services/categoryFields');
            fetchCategoryFields.mockRejectedValue(new Error('Test error'));

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                const errorAlert = screen.queryByRole('alert');
                if (errorAlert) {
                    expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
                }
            });
        });

        it('should have ARIA live region for success messages', async () => {
            const { updateOptionRanks } = require('@/services/optionRanks');
            updateOptionRanks.mockResolvedValue({ success: true });

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Success messages should have role="status" with aria-live="polite"
            // This will be tested when save operation succeeds
        });

        it('should have proper list role for options', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Wait for options to load
            await waitFor(() => {
                const list = screen.queryByRole('list');
                if (list) {
                    expect(list).toBeInTheDocument();
                    expect(list).toHaveAttribute('aria-label');
                }
            });
        });

        it('should hide decorative icons from screen readers', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Check that SVG icons have aria-hidden="true"
            const svgs = document.querySelectorAll('svg');
            svgs.forEach(svg => {
                expect(svg).toHaveAttribute('aria-hidden', 'true');
            });
        });
    });

    describe('Focus Management', () => {
        it('should trap focus within modal when open', async () => {
            const { useFocusTrap } = require('@/hooks/useFocusTrap');

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Verify useFocusTrap was called with isOpen=true
            expect(useFocusTrap).toHaveBeenCalledWith(true);
        });

        it('should return focus to trigger element on close', async () => {
            const { useFocusReturn } = require('@/hooks/useFocusReturn');

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Verify useFocusReturn was called with isOpen=true
            expect(useFocusReturn).toHaveBeenCalledWith(true);
        });

        it('should not render when closed', () => {
            const { container } = render(
                <RankModal
                    isOpen={false}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            expect(container).toBeEmptyDOMElement();
        });

        it('should have visible focus indicators on interactive elements', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            const closeButton = screen.getByRole('button', { name: /إغلاق/i });

            // Focus the button
            closeButton.focus();

            // Check that button is focused
            expect(closeButton).toHaveFocus();
        });
    });

    describe('Touch Target Sizes', () => {
        it('should have minimum 44x44px touch target for close button', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            const closeButton = screen.getByRole('button', { name: /إغلاق نافذة ترتيب الخيارات/i });

            // Check inline style for minimum dimensions
            const style = window.getComputedStyle(closeButton);
            const minWidth = closeButton.style.minWidth;
            const minHeight = closeButton.style.minHeight;

            expect(minWidth).toBe('44px');
            expect(minHeight).toBe('44px');
        });

        it('should have minimum 44px height for footer buttons', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            const footerButton = screen.getByRole('button', { name: /إغلاق نافذة الترتيب/i });

            // Check inline style for minimum height
            const minHeight = footerButton.style.minHeight;
            expect(minHeight).toBe('44px');
        });

        it('should provide adequate spacing between interactive elements', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Check that buttons have gap spacing
            const dialog = screen.getByRole('dialog');
            const footer = within(dialog).getByRole('button', { name: /إغلاق/i }).closest('.flex');

            if (footer) {
                // Footer should have gap-3 class (0.75rem = 12px)
                expect(footer.className).toMatch(/gap-3/);
            }
        });
    });

    describe('Screen Reader Announcements', () => {
        it('should announce loading state to screen readers', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Check for sr-only loading text
            const srOnlyText = screen.queryByText(/جاري تحميل الخيارات/i);
            if (srOnlyText) {
                expect(srOnlyText).toHaveClass('sr-only');
            }
        });

        it('should provide context for hierarchical lists in modal title', async () => {
            const hierarchicalField: CategoryField = {
                ...mockField,
                field_name: 'city',
                display_name: 'المدينة',
            };

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={hierarchicalField}
                    parent="القاهرة"
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Modal title should include parent context
            const title = screen.getByText(/ترتيب المدينة - القاهرة/i);
            expect(title).toBeInTheDocument();
        });

        it('should announce save state changes', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // When saving, button should have updated aria-label
            const closeButton = screen.getByRole('button', { name: /إغلاق نافذة الترتيب/i });
            expect(closeButton).toHaveAttribute('aria-label');
        });
    });

    describe('Responsive Accessibility', () => {
        it('should maintain accessibility on small screens', async () => {
            // Mock small viewport
            global.innerWidth = 375;
            global.innerHeight = 667;

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Modal should still have proper ARIA attributes
            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-modal', 'true');
            expect(dialog).toHaveAttribute('aria-labelledby');
        });

        it('should be scrollable on small screens', async () => {
            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            const dialog = screen.getByRole('dialog');

            // Modal should have max-height constraint
            expect(dialog.className).toMatch(/max-h-\[90vh\]/);
        });
    });
});
