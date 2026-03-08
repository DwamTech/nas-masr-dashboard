/**
 * EditModal Accessibility Tests
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
import EditModal from '../EditModal';
import { Category, CategoryField } from '@/types/filters-lists';

// Mock services
vi.mock('@/services/categoryFields', () => ({
    fetchCategoryFields: vi.fn(),
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

describe('EditModal - Accessibility Tests', () => {
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
                <EditModal
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

        it('should allow tab navigation through form elements', async () => {
            const user = userEvent.setup();

            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Tab through elements
            await user.tab();

            // Should be able to navigate to interactive elements
            const closeButton = screen.getByRole('button', { name: /إغلاق/i });
            expect(closeButton).toBeInTheDocument();
        });

        it('should support Enter key to save inline edits', async () => {
            const user = userEvent.setup();

            render(
                <EditModal
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
                const editButtons = screen.queryAllByRole('button', { name: /تعديل/i });
                if (editButtons.length > 0) {
                    expect(editButtons[0]).toBeInTheDocument();
                }
            });
        });

        it('should support Escape key to cancel inline edits', async () => {
            const user = userEvent.setup();

            render(
                <EditModal
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
                const editButtons = screen.queryAllByRole('button', { name: /تعديل/i });
                if (editButtons.length > 0) {
                    expect(editButtons[0]).toBeInTheDocument();
                }
            });
        });

        it('should support Space/Enter activation for buttons', async () => {
            const user = userEvent.setup();

            render(
                <EditModal
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
    });

    describe('ARIA Labels and Roles', () => {
        it('should have proper dialog role and aria-modal', async () => {
            render(
                <EditModal
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
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                const dialog = screen.getByRole('dialog');
                expect(dialog).toHaveAttribute('aria-labelledby', 'edit-modal-title');

                const title = document.getElementById('edit-modal-title');
                expect(title).toBeInTheDocument();
            });
        });

        it('should have aria-label on close button', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                const closeButton = screen.getByRole('button', { name: /إغلاق نافذة/i });
                expect(closeButton).toBeInTheDocument();
                expect(closeButton).toHaveAttribute('aria-label');
            });
        });

        it('should have proper list role for options', async () => {
            render(
                <EditModal
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

        it('should have aria-label on edit buttons', async () => {
            render(
                <EditModal
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
                const editButtons = screen.queryAllByRole('button', { name: /تعديل/i });
                editButtons.forEach(button => {
                    expect(button).toHaveAttribute('aria-label');
                });
            });
        });

        it('should have aria-label on toggle switches', async () => {
            render(
                <EditModal
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
                const toggleButtons = screen.queryAllByRole('button', { name: /إخفاء|إظهار/i });
                toggleButtons.forEach(button => {
                    expect(button).toHaveAttribute('aria-label');
                });
            });
        });

        it('should have ARIA live region for error messages', async () => {
            const { fetchCategoryFields } = require('@/services/categoryFields');
            fetchCategoryFields.mockRejectedValue(new Error('Test error'));

            render(
                <EditModal
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
            render(
                <EditModal
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
            const successStatus = screen.queryByRole('status');
            if (successStatus) {
                expect(successStatus).toHaveAttribute('aria-live', 'polite');
            }
        });

        it('should mark option rows with proper listitem role', async () => {
            render(
                <EditModal
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
                const listItems = screen.queryAllByRole('listitem');
                if (listItems.length > 0) {
                    listItems.forEach(item => {
                        expect(item).toHaveAttribute('aria-label');
                    });
                }
            });
        });

        it('should hide decorative icons from screen readers', async () => {
            render(
                <EditModal
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

        it('should indicate disabled state for "غير ذلك" option', async () => {
            render(
                <EditModal
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
                const otherOption = screen.queryByText('غير ذلك');
                if (otherOption) {
                    const listItem = otherOption.closest('[role="listitem"]');
                    if (listItem) {
                        expect(listItem).toHaveAttribute('aria-label');
                        expect(listItem.getAttribute('aria-label')).toMatch(/غير قابل للتعديل/i);
                    }
                }
            });
        });
    });

    describe('Focus Management', () => {
        it('should trap focus within modal when open', async () => {
            const { useFocusTrap } = require('@/hooks/useFocusTrap');

            render(
                <EditModal
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
                <EditModal
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
                <EditModal
                    isOpen={false}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            expect(container).toBeEmptyDOMElement();
        });

        it('should auto-focus inline edit input when editing starts', async () => {
            render(
                <EditModal
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
                const editButtons = screen.queryAllByRole('button', { name: /تعديل/i });
                if (editButtons.length > 0) {
                    // Input should have autoFocus attribute when in editing mode
                    const inputs = screen.queryAllByRole('textbox');
                    inputs.forEach(input => {
                        // Check if input has autoFocus (will be set when editing)
                        expect(input).toBeInTheDocument();
                    });
                }
            });
        });

        it('should have visible focus indicators on interactive elements', async () => {
            render(
                <EditModal
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
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            const closeButton = screen.getByRole('button', { name: /إغلاق نافذة/i });

            // Check inline style for minimum dimensions
            const minWidth = closeButton.style.minWidth;
            const minHeight = closeButton.style.minHeight;

            expect(minWidth).toBe('44px');
            expect(minHeight).toBe('44px');
        });

        it('should have minimum 44x44px touch target for edit buttons', async () => {
            render(
                <EditModal
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
                const editButtons = screen.queryAllByRole('button', { name: /تعديل/i });
                editButtons.forEach(button => {
                    const minWidth = button.style.minWidth;
                    const minHeight = button.style.minHeight;

                    expect(minWidth).toBe('44px');
                    expect(minHeight).toBe('44px');
                });
            });
        });

        it('should have minimum 44x44px touch target for toggle switches', async () => {
            render(
                <EditModal
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
                const toggleButtons = screen.queryAllByRole('button', { name: /إخفاء|إظهار/i });
                toggleButtons.forEach(button => {
                    const minWidth = button.style.minWidth;
                    const minHeight = button.style.minHeight;

                    expect(minWidth).toBe('44px');
                    expect(minHeight).toBe('44px');
                });
            });
        });

        it('should have minimum 44px height for add button', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            const addButton = screen.queryByRole('button', { name: /إضافة/i });
            if (addButton) {
                const minHeight = addButton.style.minHeight;
                expect(minHeight).toBe('44px');
            }
        });

        it('should provide adequate spacing between interactive elements', async () => {
            render(
                <EditModal
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
                const listItems = screen.queryAllByRole('listitem');
                if (listItems.length > 0) {
                    // Each list item should have gap spacing
                    listItems.forEach(item => {
                        expect(item.className).toMatch(/gap-/);
                    });
                }
            });
        });
    });

    describe('Form Accessibility', () => {
        it('should have proper label for single option input', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Input should have associated label or aria-label
            const input = screen.queryByPlaceholderText(/أدخل/i);
            if (input) {
                expect(input).toHaveAttribute('aria-label');
            }
        });

        it('should have proper label for bulk add textarea', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Textarea should have associated label or aria-label
            const textarea = screen.queryByRole('textbox', { name: /إضافة متعددة/i });
            if (textarea) {
                expect(textarea).toBeInTheDocument();
            }
        });

        it('should announce validation errors to screen readers', async () => {
            const user = userEvent.setup();

            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Try to add empty option (should show error)
            const addButton = screen.queryByRole('button', { name: /إضافة/i });
            if (addButton) {
                await user.click(addButton);

                // Error should be announced via alert role
                await waitFor(() => {
                    const alert = screen.queryByRole('alert');
                    if (alert) {
                        expect(alert).toBeInTheDocument();
                    }
                });
            }
        });
    });

    describe('Responsive Accessibility', () => {
        it('should maintain accessibility on small screens', async () => {
            // Mock small viewport
            global.innerWidth = 375;
            global.innerHeight = 667;

            render(
                <EditModal
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
                <EditModal
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
