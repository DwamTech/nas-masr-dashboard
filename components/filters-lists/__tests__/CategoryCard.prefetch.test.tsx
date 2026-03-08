/**
 * Tests for CategoryCard prefetching functionality
 * Task 21.2: Implement prefetching strategy
 * Requirement 14.14: Prefetch category data when hovering over category cards
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryCard from '../CategoryCard';
import { fetchCategoryFields } from '@/services/categoryFields';
import { fetchGovernorates } from '@/services/governorates';
import { cache } from '@/utils/cache';
import type { Category, CategoryField } from '@/types/filters-lists';

// Mock the services
vi.mock('@/services/categoryFields', () => ({
    fetchCategoryFields: vi.fn()
}));

vi.mock('@/services/governorates', () => ({
    fetchGovernorates: vi.fn()
}));

// Mock the cache
vi.mock('@/utils/cache', () => ({
    cache: {
        get: vi.fn(),
        set: vi.fn(),
        invalidate: vi.fn(),
        clear: vi.fn()
    },
    CACHE_TIMES: {
        CATEGORIES: 15 * 60 * 1000,
        CATEGORY_FIELDS: 10 * 60 * 1000,
        GOVERNORATES: 30 * 60 * 1000,
        CITIES: 30 * 60 * 1000,
    },
    INVALIDATION_PATTERNS: {
        RANK_UPDATE: (slug: string) => `fields:${slug}`,
        OPTION_UPDATE: (slug: string, field: string) => `fields:${slug}:${field}`,
        CITY_UPDATE: () => 'governorates',
        ALL: () => '',
    }
}));

describe('CategoryCard Prefetching', () => {
    const mockCategory: Category = {
        id: 1,
        slug: 'cars',
        name: 'سيارات',
        icon: '/car.png',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
    };

    const mockFields: CategoryField[] = [
        {
            id: 1,
            category_slug: 'cars',
            field_name: 'governorate',
            display_name: 'المحافظة',
            type: 'select',
            required: true,
            filterable: true,
            options: ['القاهرة', 'الجيزة', 'الإسكندرية'],
            is_active: true,
            sort_order: 1,
            created_at: '2024-01-01',
            updated_at: '2024-01-01'
        },
        {
            id: 2,
            category_slug: 'cars',
            field_name: 'city',
            display_name: 'المدينة',
            type: 'select',
            required: true,
            filterable: true,
            options: ['مدينة نصر', 'المعادي', 'مصر الجديدة'],
            is_active: true,
            sort_order: 2,
            created_at: '2024-01-01',
            updated_at: '2024-01-01'
        }
    ];

    const mockGovernorates = [
        {
            id: 1,
            name: 'القاهرة',
            cities: [
                { id: 1, name: 'مدينة نصر', governorate_id: 1 },
                { id: 2, name: 'المعادي', governorate_id: 1 }
            ]
        },
        {
            id: 2,
            name: 'الجيزة',
            cities: [
                { id: 3, name: 'الدقي', governorate_id: 2 },
                { id: 4, name: 'المهندسين', governorate_id: 2 }
            ]
        }
    ];

    const mockOnRankClick = vi.fn();
    const mockOnEditClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
        (fetchCategoryFields as ReturnType<typeof vi.fn>).mockResolvedValue(mockFields);
        (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Card Hover Prefetching', () => {
        it('should prefetch category fields on card hover', async () => {
            const user = userEvent.setup();

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const card = screen.getByText('سيارات').closest('.category-card');
            expect(card).toBeInTheDocument();

            if (card) {
                await user.hover(card);

                await waitFor(() => {
                    expect(fetchCategoryFields).toHaveBeenCalledWith('cars');
                });
            }
        });

        it('should cache prefetched fields', async () => {
            const user = userEvent.setup();

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const card = screen.getByText('سيارات').closest('.category-card');

            if (card) {
                await user.hover(card);

                await waitFor(() => {
                    expect(cache.set).toHaveBeenCalledWith(
                        'fields:cars',
                        mockFields,
                        expect.any(Number)
                    );
                });
            }
        });
    });

    describe('Button Hover Prefetching', () => {
        it('should prefetch parent options when hovering rank button for hierarchical fields', async () => {
            const user = userEvent.setup();

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });
            await user.hover(rankButton);

            await waitFor(() => {
                expect(fetchCategoryFields).toHaveBeenCalledWith('cars');
            }, { timeout: 3000 });

            // Should prefetch governorates for hierarchical fields
            await waitFor(() => {
                expect(fetchGovernorates).toHaveBeenCalled();
            }, { timeout: 3000 });
        });

        it('should prefetch parent options when hovering edit button for hierarchical fields', async () => {
            const user = userEvent.setup();

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const editButton = screen.getByRole('button', { name: /اضافة أو تعديل اختيارات/i });
            await user.hover(editButton);

            await waitFor(() => {
                expect(fetchCategoryFields).toHaveBeenCalledWith('cars');
            }, { timeout: 3000 });

            // Should prefetch governorates for hierarchical fields
            await waitFor(() => {
                expect(fetchGovernorates).toHaveBeenCalled();
            }, { timeout: 3000 });
        });

        it('should cache prefetched governorates', async () => {
            const user = userEvent.setup();

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });
            await user.hover(rankButton);

            await waitFor(() => {
                expect(cache.set).toHaveBeenCalledWith(
                    'governorates',
                    mockGovernorates,
                    expect.any(Number)
                );
            }, { timeout: 3000 });
        });

        it('should not prefetch parent options twice', async () => {
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

            // Hover rank button
            await user.hover(rankButton);
            await waitFor(() => {
                expect(fetchGovernorates).toHaveBeenCalledTimes(1);
            }, { timeout: 3000 });

            // Hover edit button - should not fetch again
            await user.hover(editButton);
            await waitFor(() => {
                // Should still be called only once
                expect(fetchGovernorates).toHaveBeenCalledTimes(1);
            }, { timeout: 1000 });
        });

        it('should use cached governorates if available', async () => {
            const user = userEvent.setup();
            (cache.get as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
                if (key === 'governorates') return mockGovernorates;
                return null;
            });

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });
            await user.hover(rankButton);

            // Should not fetch governorates since they're cached
            await waitFor(() => {
                expect(fetchCategoryFields).toHaveBeenCalled();
            }, { timeout: 3000 });

            // Wait a bit to ensure fetchGovernorates is not called
            await new Promise(resolve => setTimeout(resolve, 500));
            expect(fetchGovernorates).not.toHaveBeenCalled();
        });
    });

    describe('Non-Hierarchical Fields', () => {
        it('should not prefetch governorates for non-hierarchical fields', async () => {
            const user = userEvent.setup();
            const nonHierarchicalFields: CategoryField[] = [
                {
                    id: 1,
                    category_slug: 'cars',
                    field_name: 'condition',
                    display_name: 'الحالة',
                    type: 'select',
                    required: true,
                    filterable: true,
                    options: ['جديد', 'مستعمل', 'غير ذلك'],
                    is_active: true,
                    sort_order: 1,
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01'
                }
            ];

            (fetchCategoryFields as ReturnType<typeof vi.fn>).mockResolvedValue(nonHierarchicalFields);

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });
            await user.hover(rankButton);

            await waitFor(() => {
                expect(fetchCategoryFields).toHaveBeenCalled();
            }, { timeout: 3000 });

            // Should not fetch governorates for non-hierarchical fields
            await new Promise(resolve => setTimeout(resolve, 500));
            expect(fetchGovernorates).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle prefetch errors gracefully', async () => {
            const user = userEvent.setup();
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });
            await user.hover(rankButton);

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    'Failed to prefetch parent options:',
                    expect.any(Error)
                );
            }, { timeout: 3000 });

            consoleErrorSpy.mockRestore();
        });

        it('should allow retry after prefetch error', async () => {
            const user = userEvent.setup();
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            // First call fails
            (fetchGovernorates as ReturnType<typeof vi.fn>)
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce(mockGovernorates);

            render(
                <CategoryCard
                    category={mockCategory}
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const rankButton = screen.getByRole('button', { name: /ترتيب اختيارات/i });

            // First hover - should fail
            await user.hover(rankButton);
            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalled();
            }, { timeout: 3000 });

            // Unhover and hover again - should retry
            await user.unhover(rankButton);
            await user.hover(rankButton);

            await waitFor(() => {
                expect(fetchGovernorates).toHaveBeenCalledTimes(2);
            }, { timeout: 3000 });

            consoleErrorSpy.mockRestore();
        });
    });
});
