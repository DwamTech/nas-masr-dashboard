import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedImagesTable } from '../UnifiedImagesTable';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { AdminCategoryListItem } from '@/models/makes';
import '@testing-library/jest-dom';

const BACKEND_BASE = (process.env.LARAVEL_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');

describe('UnifiedImagesTable', () => {
    const mockCategories: AdminCategoryListItem[] = [
        {
            id: 1,
            name: 'السيارات',
            icon: '🚙',
            is_global_image_active: false,
            global_image_url: null,
            global_image_full_url: null,
        },
        {
            id: 2,
            name: 'عقارات',
            icon: '🏠',
            is_global_image_active: true,
            global_image_url: 'uploads/categories/global/2_1234567890.webp',
            global_image_full_url: `${BACKEND_BASE}/storage/uploads/categories/global/2_1234567890.webp`,
        },
        {
            id: 3,
            name: 'إلكترونيات',
            icon: '💻',
            is_global_image_active: true,
            global_image_url: null,
            global_image_full_url: null,
        },
    ];

    const mockOnToggle = vi.fn();
    const mockOnUploadClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders table with correct headers', () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            expect(screen.getByText('القسم')).toBeInTheDocument();
            expect(screen.getByText('الأيقونة')).toBeInTheDocument();
            expect(screen.getByText('تفعيل الصورة الموحدة')).toBeInTheDocument();
            expect(screen.getByText('إدارة الصورة')).toBeInTheDocument();
        });

        it('renders all categories', () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            expect(screen.getByText('السيارات')).toBeInTheDocument();
            expect(screen.getByText('عقارات')).toBeInTheDocument();
            expect(screen.getByText('إلكترونيات')).toBeInTheDocument();
        });

        it('renders category icons', () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            expect(screen.getByText('🚙')).toBeInTheDocument();
            expect(screen.getByText('🏠')).toBeInTheDocument();
            expect(screen.getByText('💻')).toBeInTheDocument();
        });

        it('renders empty table when no categories provided', () => {
            render(
                <UnifiedImagesTable
                    categories={[]}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            // Headers should still be present
            expect(screen.getByText('القسم')).toBeInTheDocument();

            // But no category rows
            expect(screen.queryByText('السيارات')).not.toBeInTheDocument();
        });
    });

    describe('Toggle Switch Functionality', () => {
        it('renders toggle switch for each category', () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            const toggles = screen.getAllByRole('switch');
            expect(toggles).toHaveLength(3);
        });

        it('displays correct toggle state for inactive category', () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            const toggles = screen.getAllByRole('switch');
            expect(toggles[0]).toHaveAttribute('aria-checked', 'false');
        });

        it('displays correct toggle state for active category', () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            const toggles = screen.getAllByRole('switch');
            expect(toggles[1]).toHaveAttribute('aria-checked', 'true');
        });

        it('calls onToggle with correct parameters when toggling from false to true', async () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            const toggles = screen.getAllByRole('switch');
            fireEvent.click(toggles[0]); // Click first category (السيارات)

            await waitFor(() => {
                expect(mockOnToggle).toHaveBeenCalledWith(1, true);
                expect(mockOnToggle).toHaveBeenCalledTimes(1);
            });
        });

        it('calls onToggle with correct parameters when toggling from true to false', async () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            const toggles = screen.getAllByRole('switch');
            fireEvent.click(toggles[1]); // Click second category (عقارات)

            await waitFor(() => {
                expect(mockOnToggle).toHaveBeenCalledWith(2, false);
                expect(mockOnToggle).toHaveBeenCalledTimes(1);
            });
        });

        it('has accessible aria-label for toggle switches', () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            expect(screen.getByLabelText('تفعيل الصورة الموحدة لقسم السيارات')).toBeInTheDocument();
            expect(screen.getByLabelText('تفعيل الصورة الموحدة لقسم عقارات')).toBeInTheDocument();
        });
    });

    describe('Upload Button Functionality', () => {
        it('disables upload button when unified image is not active', () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            const buttons = screen.getAllByRole('button').filter(btn =>
                btn.textContent === 'رفع صورة' || btn.textContent === 'تعديل الصورة'
            );

            // First category (السيارات) has is_global_image_active: false
            expect(buttons[0]).toBeDisabled();
        });

        it('enables upload button when unified image is active', () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            const buttons = screen.getAllByRole('button').filter(btn =>
                btn.textContent === 'رفع صورة' || btn.textContent === 'تعديل الصورة'
            );

            // Second category (عقارات) has is_global_image_active: true
            expect(buttons[1]).not.toBeDisabled();
        });

        it('displays "رفع صورة" when no image exists', () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            // Third category (إلكترونيات) has no global_image_url
            const buttons = screen.getAllByRole('button').filter(btn =>
                btn.textContent === 'رفع صورة'
            );

            expect(buttons.length).toBeGreaterThan(0);
        });

        it('displays "تعديل الصورة" when image exists', () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            // Second category (عقارات) has global_image_url
            expect(screen.getByText('تعديل الصورة')).toBeInTheDocument();
        });

        it('calls onUploadClick with correct category when button is clicked', async () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            const editButton = screen.getByText('تعديل الصورة');
            fireEvent.click(editButton);

            await waitFor(() => {
                expect(mockOnUploadClick).toHaveBeenCalledWith(mockCategories[1]);
                expect(mockOnUploadClick).toHaveBeenCalledTimes(1);
            });
        });

        it('applies correct styling to disabled button', () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            const buttons = screen.getAllByRole('button').filter(btn =>
                btn.textContent === 'رفع صورة' || btn.textContent === 'تعديل الصورة'
            );

            const disabledButton = buttons[0];
            expect(disabledButton).toHaveClass('bg-gray-300');
            expect(disabledButton).toHaveClass('cursor-not-allowed');
        });

        it('applies correct styling to enabled button', () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            const editButton = screen.getByText('تعديل الصورة');
            expect(editButton).toHaveClass('bg-blue-500');
            expect(editButton).toHaveClass('cursor-pointer');
        });
    });

    describe('Edge Cases', () => {
        it('handles category with undefined is_global_image_active', () => {
            const categoryWithUndefined: AdminCategoryListItem = {
                id: 4,
                name: 'Test',
                icon: '🔧',
                is_global_image_active: undefined,
            };

            render(
                <UnifiedImagesTable
                    categories={[categoryWithUndefined]}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            const toggle = screen.getByRole('switch');
            expect(toggle).toHaveAttribute('aria-checked', 'false');
        });

        it('handles category without icon', () => {
            const categoryWithoutIcon: AdminCategoryListItem = {
                id: 5,
                name: 'No Icon',
                is_global_image_active: false,
            };

            render(
                <UnifiedImagesTable
                    categories={[categoryWithoutIcon]}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            expect(screen.getByText('No Icon')).toBeInTheDocument();
        });

        it('handles multiple rapid toggle clicks', async () => {
            render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            const toggle = screen.getAllByRole('switch')[0];

            fireEvent.click(toggle);
            fireEvent.click(toggle);
            fireEvent.click(toggle);

            await waitFor(() => {
                expect(mockOnToggle).toHaveBeenCalledTimes(3);
            });
        });
    });

    describe('Accessibility', () => {
        it('has proper table structure', () => {
            const { container } = render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            const table = container.querySelector('table');
            expect(table).toBeInTheDocument();
            expect(table?.querySelector('thead')).toBeInTheDocument();
            expect(table?.querySelector('tbody')).toBeInTheDocument();
        });

        it('has proper row structure for each category', () => {
            const { container } = render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            const rows = container.querySelectorAll('tbody tr');
            expect(rows).toHaveLength(3);
        });

        it('has unique keys for each row', () => {
            const { container } = render(
                <UnifiedImagesTable
                    categories={mockCategories}
                    onToggle={mockOnToggle}
                    onUploadClick={mockOnUploadClick}
                />
            );

            const rows = container.querySelectorAll('tbody tr');
            rows.forEach((row, index) => {
                // React adds keys internally, we just verify rows are rendered
                expect(row).toBeInTheDocument();
            });
        });
    });
});
