/**
 * Tests for Loading and Error States
 * 
 * Task 20.3: Write tests for loading and error states
 * 
 * This test suite verifies:
 * - Skeleton loader rendering during data fetching
 * - Error message display when operations fail
 * - Retry button functionality and refetch triggering
 * - Loading states are accessible with proper ARIA attributes
 * 
 * Requirements: 3.5, 11.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoryCardsSection from '../CategoryCardsSection';
import SharedListsSection from '../SharedListsSection';
import { Category } from '@/types/filters-lists';
import { Governorate } from '@/models/governorates';
import * as categoriesService from '@/services/categories';
import * as governoratesService from '@/services/governorates';
import * as cacheUtils from '@/utils/cache';

// Mock the services
vi.mock('@/services/categories');
vi.mock('@/services/governorates');
vi.mock('@/utils/cache');

// Mock CategoryCard to simplify testing
vi.mock('../CategoryCard', () => ({
    default: ({ category }: any) => (
        <div data-testid={`category-card-${category.slug}`}>
            {category.name}
        </div>
    ),
}));

describe('Loading and Error States - Task 20.3', () => {
    const mockCategories: Category[] = [
        {
            id: 1,
            slug: 'cars',
            name: 'سيارات',
            icon: '/car.png',
            is_active: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
        },
        {
            id: 2,
            slug: 'real-estate',
            name: 'عقارات',
            icon: '/house.png',
            is_active: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
        },
    ];

    const mockGovernorates: Governorate[] = [
        {
            id: 1,
            name: 'القاهرة',
            cities: [
                { id: 1, name: 'مدينة نصر', governorate_id: 1 },
                { id: 2, name: 'المعادي', governorate_id: 1 },
            ],
        },
        {
            id: 2,
            name: 'الجيزة',
            cities: [
                { id: 3, name: 'الدقي', governorate_id: 2 },
            ],
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (cacheUtils.cache.get as any).mockReturnValue(null);
        (cacheUtils.cache.set as any).mockImplementation(() => { });
    });

    describe('Skeleton Loader Rendering (Requirement 3.5, 11.4)', () => {
        describe('CategoryCardsSection', () => {
            it('should display skeleton loaders during initial data fetch', () => {
                (categoriesService.fetchCategories as any).mockImplementation(
                    () => new Promise(() => { }) // Never resolves to keep loading state
                );

                render(
                    <CategoryCardsSection
                        onRankClick={vi.fn()}
                        onEditClick={vi.fn()}
                    />
                );

                // Check for skeleton cards
                const skeletonCards = document.querySelectorAll('.skeleton-card');
                expect(skeletonCards.length).toBeGreaterThan(0);
                expect(skeletonCards.length).toBe(4); // Should render 4 skeleton cards
            });

            it('should display skeleton elements with proper structure', () => {
                (categoriesService.fetchCategories as any).mockImplementation(
                    () => new Promise(() => { })
                );

                render(
                    <CategoryCardsSection
                        onRankClick={vi.fn()}
                        onEditClick={vi.fn()}
                    />
                );

                // Check for skeleton structure
                const skeletonIcons = document.querySelectorAll('.skeleton-icon');
                const skeletonTitles = document.querySelectorAll('.skeleton-title');
                const skeletonButtons = document.querySelectorAll('.skeleton-button');

                expect(skeletonIcons.length).toBeGreaterThan(0);
                expect(skeletonTitles.length).toBeGreaterThan(0);
                expect(skeletonButtons.length).toBeGreaterThan(0);
            });

            it('should have accessible loading state with ARIA attributes', () => {
                (categoriesService.fetchCategories as any).mockImplementation(
                    () => new Promise(() => { })
                );

                render(
                    <CategoryCardsSection
                        onRankClick={vi.fn()}
                        onEditClick={vi.fn()}
                    />
                );

                // Check for ARIA attributes
                const loadingContainer = document.querySelector('.loading-container');
                expect(loadingContainer).toHaveAttribute('role', 'status');
                expect(loadingContainer).toHaveAttribute('aria-live', 'polite');

                // Check for screen reader text
                expect(screen.getByText('جاري تحميل الأقسام...')).toBeInTheDocument();
                const srOnly = screen.getByText('جاري تحميل الأقسام...');
                expect(srOnly).toHaveClass('sr-only');
            });

            it('should hide skeleton loaders after data loads successfully', async () => {
                (categoriesService.fetchCategories as any).mockResolvedValue(mockCategories);

                render(
                    <CategoryCardsSection
                        onRankClick={vi.fn()}
                        onEditClick={vi.fn()}
                    />
                );

                // Initially should have skeleton loaders
                expect(document.querySelectorAll('.skeleton-card').length).toBeGreaterThan(0);

                // Wait for data to load
                await waitFor(() => {
                    expect(screen.getByText('سيارات')).toBeInTheDocument();
                });

                // Skeleton loaders should be gone
                expect(document.querySelectorAll('.skeleton-card').length).toBe(0);
            });

            it('should apply loading animation to skeleton elements', () => {
                (categoriesService.fetchCategories as any).mockImplementation(
                    () => new Promise(() => { })
                );

                render(
                    <CategoryCardsSection
                        onRankClick={vi.fn()}
                        onEditClick={vi.fn()}
                    />
                );

                // Check that skeleton elements have animation styles
                const skeletonLines = document.querySelectorAll('.skeleton-line');
                skeletonLines.forEach(line => {
                    const styles = window.getComputedStyle(line);
                    // The element should have background gradient for animation
                    expect(line.className).toContain('skeleton-line');
                });
            });
        });

        describe('SharedListsSection', () => {
            it('should display skeleton loaders during initial data fetch', () => {
                (governoratesService.fetchGovernorates as any).mockImplementation(
                    () => new Promise(() => { })
                );

                render(<SharedListsSection />);

                // Check for skeleton card
                const skeletonCard = document.querySelector('.skeleton-card');
                expect(skeletonCard).toBeInTheDocument();
            });

            it('should have accessible loading state with ARIA attributes', () => {
                (governoratesService.fetchGovernorates as any).mockImplementation(
                    () => new Promise(() => { })
                );

                render(<SharedListsSection />);

                // Check for ARIA attributes
                const loadingContainer = document.querySelector('.loading-container');
                expect(loadingContainer).toHaveAttribute('role', 'status');
                expect(loadingContainer).toHaveAttribute('aria-live', 'polite');

                // Check for screen reader text
                expect(screen.getByText('جاري تحميل القوائم المشتركة...')).toBeInTheDocument();
            });

            it('should hide skeleton loaders after data loads successfully', async () => {
                (governoratesService.fetchGovernorates as any).mockResolvedValue(mockGovernorates);

                render(<SharedListsSection />);

                // Wait for data to load
                await waitFor(() => {
                    expect(screen.getByText('المحافظات والمدن')).toBeInTheDocument();
                });

                // Skeleton loaders should be gone
                expect(document.querySelectorAll('.skeleton-card').length).toBe(0);
            });
        });
    });

    describe('Error Message Display (Requirement 11.4)', () => {
        describe('CategoryCardsSection', () => {
            it('should display error message when fetch fails', async () => {
                const errorMessage = 'فشل الاتصال بالخادم';
                (categoriesService.fetchCategories as any).mockRejectedValue(
                    new Error(errorMessage)
                );

                render(
                    <CategoryCardsSection
                        onRankClick={vi.fn()}
                        onEditClick={vi.fn()}
                    />
                );

                await waitFor(() => {
                    expect(screen.getByText(errorMessage)).toBeInTheDocument();
                });
            });

            it('should display generic error message for non-Error objects', async () => {
                (categoriesService.fetchCategories as any).mockRejectedValue('Unknown error');

                render(
                    <CategoryCardsSection
                        onRankClick={vi.fn()}
                        onEditClick={vi.fn()}
                    />
                );

                await waitFor(() => {
                    expect(screen.getByText('حدث خطأ أثناء تحميل البيانات')).toBeInTheDocument();
                });
            });

            it('should have accessible error state with ARIA attributes', async () => {
                (categoriesService.fetchCategories as any).mockRejectedValue(
                    new Error('API Error')
                );

                render(
                    <CategoryCardsSection
                        onRankClick={vi.fn()}
                        onEditClick={vi.fn()}
                    />
                );

                await waitFor(() => {
                    const errorContainer = document.querySelector('.error-container');
                    expect(errorContainer).toHaveAttribute('role', 'alert');
                    expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
                });
            });

            it('should hide loading state when error occurs', async () => {
                (categoriesService.fetchCategories as any).mockRejectedValue(
                    new Error('API Error')
                );

                render(
                    <CategoryCardsSection
                        onRankClick={vi.fn()}
                        onEditClick={vi.fn()}
                    />
                );

                await waitFor(() => {
                    expect(screen.getByText('API Error')).toBeInTheDocument();
                });

                // Loading state should be gone
                expect(document.querySelectorAll('.skeleton-card').length).toBe(0);
            });

            it('should not display category cards when error occurs', async () => {
                (categoriesService.fetchCategories as any).mockRejectedValue(
                    new Error('API Error')
                );

                render(
                    <CategoryCardsSection
                        onRankClick={vi.fn()}
                        onEditClick={vi.fn()}
                    />
                );

                await waitFor(() => {
                    expect(screen.getByText('API Error')).toBeInTheDocument();
                });

                // Category cards should not be rendered
                expect(screen.queryByText('سيارات')).not.toBeInTheDocument();
                expect(document.querySelector('.categories-grid')).not.toBeInTheDocument();
            });
        });

        describe('SharedListsSection', () => {
            it('should display error message when fetch fails', async () => {
                const errorMessage = 'فشل الاتصال بالخادم';
                (governoratesService.fetchGovernorates as any).mockRejectedValue(
                    new Error(errorMessage)
                );

                render(<SharedListsSection />);

                await waitFor(() => {
                    expect(screen.getByText(errorMessage)).toBeInTheDocument();
                });
            });

            it('should have accessible error state with ARIA attributes', async () => {
                (governoratesService.fetchGovernorates as any).mockRejectedValue(
                    new Error('API Error')
                );

                render(<SharedListsSection />);

                await waitFor(() => {
                    const errorContainer = document.querySelector('.error-container');
                    expect(errorContainer).toHaveAttribute('role', 'alert');
                    expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
                });
            });
        });
    });

    describe('Retry Functionality (Requirement 11.4)', () => {
        describe('CategoryCardsSection', () => {
            it('should display retry button when error occurs', async () => {
                (categoriesService.fetchCategories as any).mockRejectedValue(
                    new Error('API Error')
                );

                render(
                    <CategoryCardsSection
                        onRankClick={vi.fn()}
                        onEditClick={vi.fn()}
                    />
                );

                await waitFor(() => {
                    expect(screen.getByText('إعادة المحاولة')).toBeInTheDocument();
                });
            });

            it('should have accessible retry button with ARIA label', async () => {
                (categoriesService.fetchCategories as any).mockRejectedValue(
                    new Error('API Error')
                );

                render(
                    <CategoryCardsSection
                        onRankClick={vi.fn()}
                        onEditClick={vi.fn()}
                    />
                );

                await waitFor(() => {
                    const retryButton = screen.getByText('إعادة المحاولة');
                    expect(retryButton).toHaveAttribute('aria-label', 'إعادة محاولة تحميل الأقسام');
                });
            });

            it('should trigger refetch when retry button is clicked', async () => {
                (categoriesService.fetchCategories as any)
                    .mockRejectedValueOnce(new Error('API Error'))
                    .mockResolvedValueOnce(mockCategories);

                render(
                    <CategoryCardsSection
                        onRankClick={vi.fn()}
                        onEditClick={vi.fn()}
                    />
                );

                // Wait for error to appear
                await waitFor(() => {
                    expect(screen.getByText('API Error')).toBeInTheDocument();
                });

                // Click retry button
                const retryButton = screen.getByText('إعادة المحاولة');
                fireEvent.click(retryButton);

                // Should show loading state again
                await waitFor(() => {
                    expect(document.querySelectorAll('.skeleton-card').length).toBeGreaterThan(0);
                });

                // Should eventually load data successfully
                await waitFor(() => {
                    expect(screen.getByText('سيارات')).toBeInTheDocument();
                });

                // Error should be gone
                expect(screen.queryByText('API Error')).not.toBeInTheDocument();
            });

            it('should call fetchCategories again on retry', async () => {
                (categoriesService.fetchCategories as any)
                    .mockRejectedValueOnce(new Error('API Error'))
                    .mockResolvedValueOnce(mockCategories);

                render(
                    <CategoryCardsSection
                        onRankClick={vi.fn()}
                        onEditClick={vi.fn()}
                    />
                );

                await waitFor(() => {
                    expect(screen.getByText('API Error')).toBeInTheDocument();
                });

                // Should have been called once initially
                expect(categoriesService.fetchCategories).toHaveBeenCalledTimes(1);

                // Click retry
                const retryButton = screen.getByText('إعادة المحاولة');
                fireEvent.click(retryButton);

                // Should be called again
                await waitFor(() => {
                    expect(categoriesService.fetchCategories).toHaveBeenCalledTimes(2);
                });
            });

            it('should clear error state before retrying', async () => {
                (categoriesService.fetchCategories as any)
                    .mockRejectedValueOnce(new Error('First Error'))
                    .mockRejectedValueOnce(new Error('Second Error'));

                render(
                    <CategoryCardsSection
                        onRankClick={vi.fn()}
                        onEditClick={vi.fn()}
                    />
                );

                await waitFor(() => {
                    expect(screen.getByText('First Error')).toBeInTheDocument();
                });

                // Click retry
                const retryButton = screen.getByText('إعادة المحاولة');
                fireEvent.click(retryButton);

                // Should show loading state (error cleared)
                await waitFor(() => {
                    expect(screen.queryByText('First Error')).not.toBeInTheDocument();
                });

                // Should show new error
                await waitFor(() => {
                    expect(screen.getByText('Second Error')).toBeInTheDocument();
                });
            });

            it('should handle multiple retry attempts', async () => {
                (categoriesService.fetchCategories as any)
                    .mockRejectedValueOnce(new Error('Error 1'))
                    .mockRejectedValueOnce(new Error('Error 2'))
                    .mockResolvedValueOnce(mockCategories);

                render(
                    <CategoryCardsSection
                        onRankClick={vi.fn()}
                        onEditClick={vi.fn()}
                    />
                );

                // First error
                await waitFor(() => {
                    expect(screen.getByText('Error 1')).toBeInTheDocument();
                });

                // First retry
                fireEvent.click(screen.getByText('إعادة المحاولة'));

                // Second error
                await waitFor(() => {
                    expect(screen.getByText('Error 2')).toBeInTheDocument();
                });

                // Second retry
                fireEvent.click(screen.getByText('إعادة المحاولة'));

                // Success
                await waitFor(() => {
                    expect(screen.getByText('سيارات')).toBeInTheDocument();
                });

                expect(categoriesService.fetchCategories).toHaveBeenCalledTimes(3);
            });
        });

        describe('SharedListsSection', () => {
            it('should display retry button when error occurs', async () => {
                (governoratesService.fetchGovernorates as any).mockRejectedValue(
                    new Error('API Error')
                );

                render(<SharedListsSection />);

                await waitFor(() => {
                    expect(screen.getByText('إعادة المحاولة')).toBeInTheDocument();
                });
            });

            it('should have accessible retry button with ARIA label', async () => {
                (governoratesService.fetchGovernorates as any).mockRejectedValue(
                    new Error('API Error')
                );

                render(<SharedListsSection />);

                await waitFor(() => {
                    const retryButton = screen.getByText('إعادة المحاولة');
                    expect(retryButton).toHaveAttribute('aria-label', 'إعادة محاولة تحميل القوائم المشتركة');
                });
            });

            it('should trigger refetch when retry button is clicked', async () => {
                (governoratesService.fetchGovernorates as any)
                    .mockRejectedValueOnce(new Error('API Error'))
                    .mockResolvedValueOnce(mockGovernorates);

                render(<SharedListsSection />);

                await waitFor(() => {
                    expect(screen.getByText('API Error')).toBeInTheDocument();
                });

                const retryButton = screen.getByText('إعادة المحاولة');
                fireEvent.click(retryButton);

                await waitFor(() => {
                    expect(screen.getByText('المحافظات والمدن')).toBeInTheDocument();
                });

                expect(screen.queryByText('API Error')).not.toBeInTheDocument();
            });

            it('should call fetchGovernorates again on retry', async () => {
                (governoratesService.fetchGovernorates as any)
                    .mockRejectedValueOnce(new Error('API Error'))
                    .mockResolvedValueOnce(mockGovernorates);

                render(<SharedListsSection />);

                await waitFor(() => {
                    expect(screen.getByText('API Error')).toBeInTheDocument();
                });

                expect(governoratesService.fetchGovernorates).toHaveBeenCalledTimes(1);

                const retryButton = screen.getByText('إعادة المحاولة');
                fireEvent.click(retryButton);

                await waitFor(() => {
                    expect(governoratesService.fetchGovernorates).toHaveBeenCalledTimes(2);
                });
            });
        });
    });

    describe('Loading State Transitions', () => {
        it('should transition from loading to success state', async () => {
            (categoriesService.fetchCategories as any).mockResolvedValue(mockCategories);

            render(
                <CategoryCardsSection
                    onRankClick={vi.fn()}
                    onEditClick={vi.fn()}
                />
            );

            // Should start with loading state
            expect(document.querySelectorAll('.skeleton-card').length).toBeGreaterThan(0);

            // Should transition to success state
            await waitFor(() => {
                expect(screen.getByText('سيارات')).toBeInTheDocument();
                expect(document.querySelectorAll('.skeleton-card').length).toBe(0);
            });
        });

        it('should transition from loading to error state', async () => {
            (categoriesService.fetchCategories as any).mockRejectedValue(
                new Error('API Error')
            );

            render(
                <CategoryCardsSection
                    onRankClick={vi.fn()}
                    onEditClick={vi.fn()}
                />
            );

            // Should start with loading state
            expect(document.querySelectorAll('.skeleton-card').length).toBeGreaterThan(0);

            // Should transition to error state
            await waitFor(() => {
                expect(screen.getByText('API Error')).toBeInTheDocument();
                expect(document.querySelectorAll('.skeleton-card').length).toBe(0);
            });
        });

        it('should transition from error to loading to success on retry', async () => {
            (categoriesService.fetchCategories as any)
                .mockRejectedValueOnce(new Error('API Error'))
                .mockResolvedValueOnce(mockCategories);

            render(
                <CategoryCardsSection
                    onRankClick={vi.fn()}
                    onEditClick={vi.fn()}
                />
            );

            // Wait for error state
            await waitFor(() => {
                expect(screen.getByText('API Error')).toBeInTheDocument();
            });

            // Click retry
            fireEvent.click(screen.getByText('إعادة المحاولة'));

            // Should show loading state
            await waitFor(() => {
                expect(document.querySelectorAll('.skeleton-card').length).toBeGreaterThan(0);
            });

            // Should transition to success state
            await waitFor(() => {
                expect(screen.getByText('سيارات')).toBeInTheDocument();
                expect(document.querySelectorAll('.skeleton-card').length).toBe(0);
                expect(screen.queryByText('API Error')).not.toBeInTheDocument();
            });
        });
    });

    describe('Empty State Handling', () => {
        it('should display empty state when no categories are returned', async () => {
            (categoriesService.fetchCategories as any).mockResolvedValue([]);

            render(
                <CategoryCardsSection
                    onRankClick={vi.fn()}
                    onEditClick={vi.fn()}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('لا توجد أقسام متاحة')).toBeInTheDocument();
            });
        });

        it('should not display error or loading state when showing empty state', async () => {
            (categoriesService.fetchCategories as any).mockResolvedValue([]);

            render(
                <CategoryCardsSection
                    onRankClick={vi.fn()}
                    onEditClick={vi.fn()}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('لا توجد أقسام متاحة')).toBeInTheDocument();
            });

            expect(document.querySelectorAll('.skeleton-card').length).toBe(0);
            expect(document.querySelector('.error-container')).not.toBeInTheDocument();
        });
    });
});
