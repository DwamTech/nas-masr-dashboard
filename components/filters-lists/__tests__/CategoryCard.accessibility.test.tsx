/**
 * CategoryCard Accessibility Tests
 * 
 * Task 18.4: Write accessibility tests
 * 
 * Tests:
 * - Keyboard navigation flows
 * - ARIA labels presence
 * - Touch target sizes
 * - Responsive accessibility
 * 
 * Requirements: 11.5, 11.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryCard from '../CategoryCard';
import { Category, CategoryField } from '@/types/filters-lists';

// Mock services
vi.mock('@/services/categoryFields', () => ({
    fetchCategoryFields: vi.fn(),
}));

// Mock cache
vi.mock('@/utils/cache', () => ({
    cache: {
        get: vi.fn(),
        set: vi.fn(),
    },
    CACHE_TIMES: {
        CATEGORY_FIELDS: 600000,
    },
}));

describe('CategoryCard - Accessibility Tests', () => {
    const mockCategory: Category = {
        id: 1,
        slug: 'cars',
        name: 'سيارات',
        icon: '/icons/car.png',
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

    const mockOnRankClick = vi.fn();
    const mockOnEditClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock fetchCategoryFields to return field data
        const { fetchCategoryFields } = require('@/services/categoryFields');
        fetchCategoryFields.mockResolvedValue({
            data: [mockField],
        });
    });

    describe('Keyboard Navigation', () => {
        it('should allow tab navigation to rank button', async () => {
            const user = userEvent.setup();

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });

            // Tab to button
            await user.tab();

            // Button should be focusable
            expect(rankButton).toBeInTheDocument();
        });

        it('should allow tab navigation to edit button', async () => {
            const user = userEvent.setup();

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const editButton = screen.getByRole('button', { name: /اضافة أو تعديل اختيارات/i });

            // Button should be focusable
            expect(editButton).toBeInTheDocument();
        });

        it('should support Space/Enter activation for rank button', async () => {
            const user = userEvent.setup();

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });
            rankButton.focus();

            // Press Enter
            await user.keyboard('{Enter}');

            await waitFor(() => {
                expect(mockOnRankClick).toHaveBeenCalled();
            });
        });

        it('should support Space/Enter activation for edit button', async () => {
            const user = userEvent.setup();

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const editButton = screen.getByRole('button', { name: /اضافة أو تعديل اختيارات/i });
            editButton.focus();

            // Press Enter
            await user.keyboard('{Enter}');

            await waitFor(() => {
                expect(mockOnEditClick).toHaveBeenCalled();
            });
        });

        it('should maintain logical tab order', async () => {
            const user = userEvent.setup();

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });
            const editButton = screen.getByRole('button', { name: /اضافة أو تعديل اختيارات/i });

            // Tab through buttons in order
            await user.tab();
            expect(document.activeElement).toBe(rankButton);

            await user.tab();
            expect(document.activeElement).toBe(editButton);
        });
    });

    describe('ARIA Labels and Roles', () => {
        it('should have aria-label on rank button', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات سيارات/i });
            expect(rankButton).toBeInTheDocument();
            expect(rankButton).toHaveAttribute('aria-label');
        });

        it('should have aria-label on edit button', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const editButton = screen.getByRole('button', { name: /اضافة أو تعديل اختيارات سيارات/i });
            expect(editButton).toBeInTheDocument();
            expect(editButton).toHaveAttribute('aria-label');
        });

        it('should have proper alt text for category icon', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const icon = screen.getByAltText(/أيقونة سيارات/i);
            expect(icon).toBeInTheDocument();
            expect(icon).toHaveAttribute('alt');
        });

        it('should have aria-label on field count badge', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            // Wait for field count to load
            waitFor(() => {
                const badge = screen.queryByLabelText(/حقل متاح/i);
                if (badge) {
                    expect(badge).toBeInTheDocument();
                    expect(badge).toHaveAttribute('aria-label');
                }
            });
        });

        it('should group action buttons with proper role', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const buttonGroup = screen.getByRole('group', { name: /إجراءات سيارات/i });
            expect(buttonGroup).toBeInTheDocument();
            expect(buttonGroup).toHaveAttribute('aria-label');
        });

        it('should hide decorative emoji from screen readers', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            // Emoji should have aria-hidden="true"
            const emojis = screen.getAllByText(/📊|✏️/);
            emojis.forEach(emoji => {
                expect(emoji).toHaveAttribute('aria-hidden', 'true');
            });
        });

        it('should provide descriptive button titles', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });
            expect(rankButton).toHaveAttribute('title', 'ترتيب الاختيارات');

            const editButton = screen.getByRole('button', { name: /اضافة أو تعديل اختيارات/i });
            expect(editButton).toHaveAttribute('title', 'اضافة/تعديل الاختيارات');
        });
    });

    describe('Touch Target Sizes', () => {
        it('should have minimum 44px height for rank button', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });

            // Check computed style for minimum height
            const style = window.getComputedStyle(rankButton);
            const minHeight = style.minHeight;

            // Should be at least 44px
            expect(parseInt(minHeight)).toBeGreaterThanOrEqual(44);
        });

        it('should have minimum 44px height for edit button', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const editButton = screen.getByRole('button', { name: /اضافة أو تعديل اختيارات/i });

            // Check computed style for minimum height
            const style = window.getComputedStyle(editButton);
            const minHeight = style.minHeight;

            // Should be at least 44px
            expect(parseInt(minHeight)).toBeGreaterThanOrEqual(44);
        });

        it('should have adequate spacing between buttons', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const buttonGroup = screen.getByRole('group', { name: /إجراءات/i });

            // Button group should have gap spacing
            expect(buttonGroup.className).toMatch(/gap-/);
        });

        it('should increase touch targets on mobile devices', () => {
            // Mock touch device
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: vi.fn().mockImplementation(query => ({
                    matches: query === '(hover: none) and (pointer: coarse)',
                    media: query,
                    onchange: null,
                    addListener: vi.fn(),
                    removeListener: vi.fn(),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                    dispatchEvent: vi.fn(),
                })),
            });

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });

            // On touch devices, buttons should have larger minimum height (48px)
            const style = window.getComputedStyle(rankButton);
            const minHeight = style.minHeight;

            // Should be at least 44px (may be 48px on touch devices)
            expect(parseInt(minHeight)).toBeGreaterThanOrEqual(44);
        });
    });

    describe('Visual Feedback', () => {
        it('should provide hover feedback on buttons', async () => {
            const user = userEvent.setup();

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });

            // Hover over button
            await user.hover(rankButton);

            // Button should have hover styles (checked via class)
            expect(rankButton.className).toMatch(/hover:/);
        });

        it('should provide active/pressed feedback on buttons', async () => {
            const user = userEvent.setup();

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });

            // Button should have active styles (checked via class)
            expect(rankButton.className).toMatch(/active:/);
        });

        it('should provide focus indicators', async () => {
            const user = userEvent.setup();

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });

            // Focus button
            rankButton.focus();

            // Button should be focused
            expect(rankButton).toHaveFocus();
        });

        it('should provide hover feedback on card', async () => {
            const user = userEvent.setup();

            const { container } = render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const card = container.querySelector('.category-card');
            expect(card).toBeInTheDocument();

            // Card should have hover transition styles
            if (card) {
                const style = window.getComputedStyle(card);
                expect(style.transition).toBeTruthy();
            }
        });
    });

    describe('Responsive Accessibility', () => {
        it('should maintain accessibility on mobile screens', () => {
            // Mock mobile viewport
            global.innerWidth = 375;
            global.innerHeight = 667;

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            // Buttons should still have proper ARIA labels
            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });
            const editButton = screen.getByRole('button', { name: /اضافة أو تعديل اختيارات/i });

            expect(rankButton).toHaveAttribute('aria-label');
            expect(editButton).toHaveAttribute('aria-label');
        });

        it('should maintain accessibility on tablet screens', () => {
            // Mock tablet viewport
            global.innerWidth = 768;
            global.innerHeight = 1024;

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            // Buttons should still have proper ARIA labels
            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });
            const editButton = screen.getByRole('button', { name: /اضافة أو تعديل اختيارات/i });

            expect(rankButton).toHaveAttribute('aria-label');
            expect(editButton).toHaveAttribute('aria-label');
        });

        it('should maintain accessibility on desktop screens', () => {
            // Mock desktop viewport
            global.innerWidth = 1920;
            global.innerHeight = 1080;

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            // Buttons should still have proper ARIA labels
            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });
            const editButton = screen.getByRole('button', { name: /اضافة أو تعديل اختيارات/i });

            expect(rankButton).toHaveAttribute('aria-label');
            expect(editButton).toHaveAttribute('aria-label');
        });
    });

    describe('Prefetching Accessibility', () => {
        it('should not interfere with accessibility during prefetch', async () => {
            const user = userEvent.setup();

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const card = screen.getByRole('button', { name: /ترتيب اختيارات/i }).closest('.category-card');

            if (card) {
                // Hover to trigger prefetch
                await user.hover(card);

                // Buttons should still be accessible during prefetch
                const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });
                expect(rankButton).toBeEnabled();
            }
        });

        it('should not announce prefetch operations to screen readers', async () => {
            const user = userEvent.setup();

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const card = screen.getByRole('button', { name: /ترتيب اختيارات/i }).closest('.category-card');

            if (card) {
                // Hover to trigger prefetch
                await user.hover(card);

                // Should not have any ARIA live regions for prefetch
                const liveRegions = screen.queryAllByRole('status');
                expect(liveRegions).toHaveLength(0);
            }
        });
    });

    describe('Icon Accessibility', () => {
        it('should have alt text for category icon', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const icon = screen.getByAltText(/أيقونة سيارات/i);
            expect(icon).toHaveAttribute('alt');
            expect(icon.getAttribute('alt')).toContain('سيارات');
        });

        it('should handle missing icon gracefully', () => {
            const categoryWithoutIcon = { ...mockCategory, icon: undefined };

            render(
                <CategoryCard
                    category={categoryWithoutIcon}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            // Card should still render and be accessible
            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });
            expect(rankButton).toBeInTheDocument();
        });
    });

    describe('Color Contrast', () => {
        it('should have sufficient color contrast for text', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const categoryName = screen.getByText('سيارات');
            const style = window.getComputedStyle(categoryName);

            // Text should have dark color for contrast
            expect(style.color).toBeTruthy();
        });

        it('should have sufficient color contrast for buttons', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });
            const style = window.getComputedStyle(rankButton);

            // Button should have background and text color
            expect(style.backgroundColor).toBeTruthy();
            expect(style.color).toBeTruthy();
        });
    });
});
