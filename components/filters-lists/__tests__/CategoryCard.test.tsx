import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoryCard from '../CategoryCard';
import { Category, CategoryField } from '@/types/filters-lists';
import * as categoryFieldsService from '@/services/categoryFields';
import * as cacheUtils from '@/utils/cache';

// Mock the services
vi.mock('@/services/categoryFields');
vi.mock('@/utils/cache');

describe('CategoryCard Component', () => {
    const mockCategory: Category = {
        id: 1,
        slug: 'cars',
        name: 'سيارات',
        icon: '/car.png',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
    };

    const mockFields: CategoryField[] = [
        {
            id: 1,
            category_slug: 'cars',
            field_name: 'condition',
            display_name: 'الحالة',
            type: 'select',
            required: true,
            filterable: true,
            options: ['جديد', 'مستعمل'],
            is_active: true,
            sort_order: 1,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
        },
        {
            id: 2,
            category_slug: 'cars',
            field_name: 'brand',
            display_name: 'الماركة',
            type: 'select',
            required: true,
            filterable: true,
            options: ['تويوتا', 'هونداي'],
            is_active: true,
            sort_order: 2,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
        },
    ];

    const mockOnRankClick = vi.fn();
    const mockOnEditClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (cacheUtils.cache.get as any).mockReturnValue(null);
        (cacheUtils.cache.set as any).mockImplementation(() => { });
        (categoryFieldsService.fetchCategoryFields as any).mockResolvedValue(mockFields);
    });

    describe('Rendering', () => {
        it('should render category name', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            expect(screen.getByText('سيارات')).toBeInTheDocument();
        });

        it('should render category icon', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const icon = screen.getByAltText('سيارات');
            expect(icon).toBeInTheDocument();
            expect(icon).toHaveAttribute('src', '/car.png');
        });

        it('should render rank button', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            expect(screen.getByText('ترتيب الاختيارات')).toBeInTheDocument();
        });

        it('should render edit button', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            expect(screen.getByText('اضافة/تعديل الاختيارات')).toBeInTheDocument();
        });

        it('should not display field count initially', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            expect(screen.queryByText(/حقل/)).not.toBeInTheDocument();
        });
    });

    describe('Prefetching on Hover', () => {
        it('should prefetch category fields on mouse enter', async () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const card = screen.getByText('سيارات').closest('.category-card');
            fireEvent.mouseEnter(card!);

            await waitFor(() => {
                expect(categoryFieldsService.fetchCategoryFields).toHaveBeenCalledWith('cars');
            });
        });

        it('should display field count after prefetch', async () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const card = screen.getByText('سيارات').closest('.category-card');
            fireEvent.mouseEnter(card!);

            await waitFor(() => {
                expect(screen.getByText('2 حقل')).toBeInTheDocument();
            });
        });

        it('should cache fetched fields', async () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const card = screen.getByText('سيارات').closest('.category-card');
            fireEvent.mouseEnter(card!);

            await waitFor(() => {
                expect(cacheUtils.cache.set).toHaveBeenCalledWith(
                    'fields:cars',
                    mockFields,
                    expect.any(Number)
                );
            });
        });

        it('should use cached fields if available', async () => {
            (cacheUtils.cache.get as any).mockReturnValue(mockFields);

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const card = screen.getByText('سيارات').closest('.category-card');
            fireEvent.mouseEnter(card!);

            await waitFor(() => {
                expect(screen.getByText('2 حقل')).toBeInTheDocument();
            });

            // Should not fetch from API if cached
            expect(categoryFieldsService.fetchCategoryFields).not.toHaveBeenCalled();
        });

        it('should not prefetch twice', async () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const card = screen.getByText('سيارات').closest('.category-card');

            fireEvent.mouseEnter(card!);
            await waitFor(() => {
                expect(screen.getByText('2 حقل')).toBeInTheDocument();
            });

            fireEvent.mouseEnter(card!);
            await waitFor(() => {
                expect(categoryFieldsService.fetchCategoryFields).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('Button Clicks', () => {
        it('should call onRankClick with first field when rank button clicked', async () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByText('ترتيب الاختيارات');
            fireEvent.click(rankButton);

            await waitFor(() => {
                expect(mockOnRankClick).toHaveBeenCalledWith(mockFields[0]);
            });
        });

        it('should call onEditClick with first field when edit button clicked', async () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const editButton = screen.getByText('اضافة/تعديل الاختيارات');
            fireEvent.click(editButton);

            await waitFor(() => {
                expect(mockOnEditClick).toHaveBeenCalledWith(mockFields[0]);
            });
        });

        it('should fetch fields if not cached when rank button clicked', async () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByText('ترتيب الاختيارات');
            fireEvent.click(rankButton);

            await waitFor(() => {
                expect(categoryFieldsService.fetchCategoryFields).toHaveBeenCalledWith('cars');
            });
        });

        it('should use cached fields when rank button clicked', async () => {
            (cacheUtils.cache.get as any).mockReturnValue(mockFields);

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByText('ترتيب الاختيارات');
            fireEvent.click(rankButton);

            await waitFor(() => {
                expect(mockOnRankClick).toHaveBeenCalledWith(mockFields[0]);
            });

            // Should not fetch from API if cached
            expect(categoryFieldsService.fetchCategoryFields).not.toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => {
        it('should have proper aria-labels on buttons', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByLabelText('ترتيب اختيارات سيارات');
            const editButton = screen.getByLabelText('اضافة/تعديل اختيارات سيارات');

            expect(rankButton).toBeInTheDocument();
            expect(editButton).toBeInTheDocument();
        });

        it('should have proper alt text for icon', () => {
            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const icon = screen.getByAltText('سيارات');
            expect(icon).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('should handle fetch error gracefully on hover', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (categoryFieldsService.fetchCategoryFields as any).mockRejectedValue(
                new Error('API Error')
            );

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const card = screen.getByText('سيارات').closest('.category-card');
            fireEvent.mouseEnter(card!);

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            consoleErrorSpy.mockRestore();
        });

        it('should handle fetch error gracefully on button click', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (categoryFieldsService.fetchCategoryFields as any).mockRejectedValue(
                new Error('API Error')
            );

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByText('ترتيب الاختيارات');
            fireEvent.click(rankButton);

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            consoleErrorSpy.mockRestore();
        });
    });

    describe('Category without icon', () => {
        it('should render without icon if not provided', () => {
            const categoryWithoutIcon: Category = {
                ...mockCategory,
                icon: undefined,
            };

            render(
                <CategoryCard
                    category={categoryWithoutIcon}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            expect(screen.getByText('سيارات')).toBeInTheDocument();
            expect(screen.queryByAltText('سيارات')).not.toBeInTheDocument();
        });
    });
});
