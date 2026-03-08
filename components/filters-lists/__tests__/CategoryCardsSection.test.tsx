import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoryCardsSection from '../CategoryCardsSection';
import { Category } from '@/types/filters-lists';
import * as categoriesService from '@/services/categories';
import * as cacheUtils from '@/utils/cache';

// Mock the services
vi.mock('@/services/categories');
vi.mock('@/utils/cache');
vi.mock('../CategoryCard', () => ({
    default: ({ category, onRankClick, onEditClick }: any) => (
        <div data-testid={`category-card-${category.slug}`}>
            <h3>{category.name}</h3>
            <button onClick={() => onRankClick({ field_name: 'test', category_slug: category.slug, id: 1, display_name: 'Test', type: 'select', required: true, filterable: true, options: [], is_active: true, sort_order: 1, created_at: '2024-01-01', updated_at: '2024-01-01' })}>Rank</button>
            <button onClick={() => onEditClick({ field_name: 'test', category_slug: category.slug, id: 1, display_name: 'Test', type: 'select', required: true, filterable: true, options: [], is_active: true, sort_order: 1, created_at: '2024-01-01', updated_at: '2024-01-01' })}>Edit</button>
        </div>
    ),
}));

describe('CategoryCardsSection Component', () => {
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
        {
            id: 3,
            slug: 'inactive',
            name: 'غير نشط',
            icon: '/inactive.png',
            is_active: false,
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
        (categoriesService.fetchCategories as any).mockResolvedValue(mockCategories);
    });

    describe('Rendering', () => {
        it('should render section title', async () => {
            render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('إدارة الأقسام')).toBeInTheDocument();
            });
        });

        it('should render loading state initially', () => {
            render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            const skeletonCards = document.querySelectorAll('.skeleton-card');
            expect(skeletonCards.length).toBeGreaterThan(0);
        });

        it('should render category cards after loading', async () => {
            render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('سيارات')).toBeInTheDocument();
                expect(screen.getByText('عقارات')).toBeInTheDocument();
            });
        });

        it('should only render active categories', async () => {
            render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('سيارات')).toBeInTheDocument();
                expect(screen.getByText('عقارات')).toBeInTheDocument();
                expect(screen.queryByText('غير نشط')).not.toBeInTheDocument();
            });
        });
    });

    describe('Data Fetching', () => {
        it('should fetch categories on mount', async () => {
            render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            await waitFor(() => {
                expect(categoriesService.fetchCategories).toHaveBeenCalled();
            });
        });

        it('should cache fetched categories', async () => {
            render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            await waitFor(() => {
                expect(cacheUtils.cache.set).toHaveBeenCalledWith(
                    'categories:all',
                    expect.arrayContaining([
                        expect.objectContaining({ slug: 'cars' }),
                        expect.objectContaining({ slug: 'real-estate' }),
                    ]),
                    expect.any(Number)
                );
            });
        });

        it('should use cached categories if available', async () => {
            const cachedCategories = mockCategories.filter(cat => cat.is_active);
            (cacheUtils.cache.get as any).mockReturnValue(cachedCategories);

            render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('سيارات')).toBeInTheDocument();
            });

            expect(categoriesService.fetchCategories).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should display error message on fetch failure', async () => {
            (categoriesService.fetchCategories as any).mockRejectedValue(
                new Error('API Error')
            );

            render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('API Error')).toBeInTheDocument();
            });
        });

        it('should display retry button on error', async () => {
            (categoriesService.fetchCategories as any).mockRejectedValue(
                new Error('API Error')
            );

            render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('إعادة المحاولة')).toBeInTheDocument();
            });
        });

        it('should retry fetching on retry button click', async () => {
            (categoriesService.fetchCategories as any)
                .mockRejectedValueOnce(new Error('API Error'))
                .mockResolvedValueOnce(mockCategories);

            render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('إعادة المحاولة')).toBeInTheDocument();
            });

            const retryButton = screen.getByText('إعادة المحاولة');
            fireEvent.click(retryButton);

            await waitFor(() => {
                expect(screen.getByText('سيارات')).toBeInTheDocument();
            });
        });
    });

    describe('Callback Handling', () => {
        it('should call onRankClick with category and field', async () => {
            render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('سيارات')).toBeInTheDocument();
            });

            const rankButtons = screen.getAllByText('Rank');
            fireEvent.click(rankButtons[0]);

            await waitFor(() => {
                expect(mockOnRankClick).toHaveBeenCalledWith(
                    expect.objectContaining({ slug: 'cars' }),
                    expect.objectContaining({ field_name: 'test' })
                );
            });
        });

        it('should call onEditClick with category and field', async () => {
            render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            await waitFor(() => {
                expect(screen.getByText('سيارات')).toBeInTheDocument();
            });

            const editButtons = screen.getAllByText('Edit');
            fireEvent.click(editButtons[0]);

            await waitFor(() => {
                expect(mockOnEditClick).toHaveBeenCalledWith(
                    expect.objectContaining({ slug: 'cars' }),
                    expect.objectContaining({ field_name: 'test' })
                );
            });
        });
    });

    describe('Responsive Grid Layout', () => {
        it('should render grid container', async () => {
            render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            await waitFor(() => {
                const grid = document.querySelector('.categories-grid');
                expect(grid).toBeInTheDocument();
            });
        });

        it('should render correct number of category cards', async () => {
            render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            await waitFor(() => {
                const cards = document.querySelectorAll('[data-testid^="category-card-"]');
                expect(cards.length).toBe(2);
            });
        });
    });
});
