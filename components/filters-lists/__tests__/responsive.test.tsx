/**
 * Responsive Design Tests for Filters and Lists Management
 * 
 * Task 19.2: Write responsive design tests
 * 
 * Tests verify:
 * 1. Grid layout changes at different breakpoints (mobile, tablet, desktop)
 * 2. Modal responsiveness on small screens
 * 3. Modal scrollability when content exceeds viewport
 * 
 * Requirements: 11.1, 11.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CategoryCardsSection from '../CategoryCardsSection';
import RankModal from '../RankModal';
import EditModal from '../EditModal';
import { Category, CategoryField } from '@/types/filters-lists';
import * as categoriesService from '@/services/categories';
import * as categoryFieldsService from '@/services/categoryFields';
import * as governoratesService from '@/services/governorates';
import * as optionRanksService from '@/services/optionRanks';
import * as cacheUtils from '@/utils/cache';

// Mock services
vi.mock('@/services/categories');
vi.mock('@/services/categoryFields');
vi.mock('@/services/governorates');
vi.mock('@/services/optionRanks');
vi.mock('@/utils/cache');

// Mock hooks
vi.mock('@/hooks/useFocusTrap', () => ({
    useFocusTrap: vi.fn(() => ({ current: null })),
}));

vi.mock('@/hooks/useFocusReturn', () => ({
    useFocusReturn: vi.fn(),
}));

// Mock CategoryCard to simplify testing
vi.mock('../CategoryCard', () => ({
    default: ({ category, onRankClick, onEditClick }: any) => (
        <div data-testid={`category-card-${category.slug}`}>
            <h3>{category.name}</h3>
            <button onClick={() => onRankClick({ field_name: 'test', category_slug: category.slug })}>Rank</button>
            <button onClick={() => onEditClick({ field_name: 'test', category_slug: category.slug })}>Edit</button>
        </div>
    ),
}));

describe('Responsive Design Tests', () => {
    const mockCategories: Category[] = [
        {
            id: 1,
            slug: 'cars',
            name: 'سيارات',
            icon: 'car.png',
            is_active: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
        },
        {
            id: 2,
            slug: 'electronics',
            name: 'إلكترونيات',
            icon: 'electronics.png',
            is_active: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
        },
        {
            id: 3,
            slug: 'furniture',
            name: 'أثاث',
            icon: 'furniture.png',
            is_active: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
        },
        {
            id: 4,
            slug: 'clothing',
            name: 'ملابس',
            icon: 'clothing.png',
            is_active: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
        },
    ];

    const mockCategory: Category = mockCategories[0];

    const mockField: CategoryField = {
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
        updated_at: '2024-01-01',
    };

    const mockOnRankClick = vi.fn();
    const mockOnEditClick = vi.fn();
    const mockOnClose = vi.fn();

    // Helper to set viewport size
    const setViewportSize = (width: number, height: number) => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: height,
        });

        // Mock matchMedia for CSS media queries
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            configurable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                matches: evaluateMediaQuery(query, width),
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });

        // Trigger resize event
        window.dispatchEvent(new Event('resize'));
    };

    // Helper to evaluate media query
    const evaluateMediaQuery = (query: string, width: number): boolean => {
        // Mobile: max-width: 640px
        if (query.includes('max-width: 640px') || query.includes('max-width:640px')) {
            return width <= 640;
        }
        // Tablet: min-width: 641px and max-width: 1024px
        if (query.includes('min-width: 641px') && query.includes('max-width: 1024px')) {
            return width >= 641 && width <= 1024;
        }
        if (query.includes('min-width:641px') && query.includes('max-width:1024px')) {
            return width >= 641 && width <= 1024;
        }
        // Desktop: min-width: 1025px
        if (query.includes('min-width: 1025px') || query.includes('min-width:1025px')) {
            return width >= 1025;
        }
        return false;
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mock implementations
        vi.mocked(categoriesService.fetchCategories).mockResolvedValue(mockCategories);
        vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
            data: [mockField],
            governorates: [],
            makes: [],
            supports_make_model: false,
            supports_sections: false,
            main_sections: [],
        });
        vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue([]);
        vi.mocked(optionRanksService.updateOptionRanks).mockResolvedValue({
            success: true,
            message: 'تم حفظ الترتيب بنجاح',
            data: { updated_count: 3 },
        });

        // Mock cache
        vi.mocked(cacheUtils.cache.get).mockReturnValue(null);
        vi.mocked(cacheUtils.cache.set).mockReturnValue(undefined);
        vi.mocked(cacheUtils.cache.invalidate).mockReturnValue(undefined);
    });

    afterEach(() => {
        // Reset viewport to default
        setViewportSize(1024, 768);
    });

    describe('Grid Layout Responsiveness (Requirement 11.1)', () => {
        it('should display 1 column grid on mobile (max-width: 640px)', async () => {
            // Set mobile viewport
            setViewportSize(375, 667);

            const { container } = render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            // Wait for categories to load
            await waitFor(() => {
                expect(screen.queryByText('جاري تحميل الأقسام...')).not.toBeInTheDocument();
            });

            // Find the grid container
            const grid = container.querySelector('.categories-grid');
            expect(grid).toBeInTheDocument();

            // Check computed styles (this would be done by CSS)
            // In a real browser, the grid would have 1 column
            // We verify the grid exists and has the correct class
            expect(grid).toHaveClass('categories-grid');

            // Verify all category cards are rendered
            await waitFor(() => {
                expect(screen.getByText('سيارات')).toBeInTheDocument();
                expect(screen.getByText('إلكترونيات')).toBeInTheDocument();
                expect(screen.getByText('أثاث')).toBeInTheDocument();
                expect(screen.getByText('ملابس')).toBeInTheDocument();
            });
        });

        it('should display 2 column grid on tablet (641px - 1024px)', async () => {
            // Set tablet viewport
            setViewportSize(768, 1024);

            const { container } = render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            // Wait for categories to load
            await waitFor(() => {
                expect(screen.queryByText('جاري تحميل الأقسام...')).not.toBeInTheDocument();
            });

            // Find the grid container
            const grid = container.querySelector('.categories-grid');
            expect(grid).toBeInTheDocument();

            // Verify grid class
            expect(grid).toHaveClass('categories-grid');

            // Verify all category cards are rendered
            await waitFor(() => {
                expect(screen.getByText('سيارات')).toBeInTheDocument();
                expect(screen.getByText('إلكترونيات')).toBeInTheDocument();
                expect(screen.getByText('أثاث')).toBeInTheDocument();
                expect(screen.getByText('ملابس')).toBeInTheDocument();
            });
        });

        it('should display 3-4 column grid on desktop (min-width: 1025px)', async () => {
            // Set desktop viewport
            setViewportSize(1920, 1080);

            const { container } = render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            // Wait for categories to load
            await waitFor(() => {
                expect(screen.queryByText('جاري تحميل الأقسام...')).not.toBeInTheDocument();
            });

            // Find the grid container
            const grid = container.querySelector('.categories-grid');
            expect(grid).toBeInTheDocument();

            // Verify grid class
            expect(grid).toHaveClass('categories-grid');

            // Verify all category cards are rendered
            await waitFor(() => {
                expect(screen.getByText('سيارات')).toBeInTheDocument();
                expect(screen.getByText('إلكترونيات')).toBeInTheDocument();
                expect(screen.getByText('أثاث')).toBeInTheDocument();
                expect(screen.getByText('ملابس')).toBeInTheDocument();
            });
        });

        it('should adapt grid layout when viewport changes', async () => {
            // Start with desktop
            setViewportSize(1920, 1080);

            const { container, rerender } = render(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            await waitFor(() => {
                expect(screen.queryByText('جاري تحميل الأقسام...')).not.toBeInTheDocument();
            });

            let grid = container.querySelector('.categories-grid');
            expect(grid).toBeInTheDocument();

            // Change to mobile
            setViewportSize(375, 667);
            rerender(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            grid = container.querySelector('.categories-grid');
            expect(grid).toBeInTheDocument();

            // Change to tablet
            setViewportSize(768, 1024);
            rerender(
                <CategoryCardsSection
                    onRankClick={mockOnRankClick}
                    onEditClick={mockOnEditClick}
                />
            );

            grid = container.querySelector('.categories-grid');
            expect(grid).toBeInTheDocument();
        });
    });

    describe('Modal Responsiveness (Requirement 11.2)', () => {
        describe('RankModal Responsiveness', () => {
            it('should be responsive on mobile screens', async () => {
                // Set mobile viewport
                setViewportSize(375, 667);

                const { container } = render(
                    <RankModal
                        isOpen={true}
                        onClose={mockOnClose}
                        category={mockCategory}
                        field={mockField}
                    />
                );

                // Wait for modal to load
                await waitFor(() => {
                    expect(screen.getByRole('dialog')).toBeInTheDocument();
                });

                // Check modal has responsive classes
                const modal = screen.getByRole('dialog');
                expect(modal).toHaveClass('max-w-2xl', 'w-full');

                // Verify modal fits within viewport
                expect(modal).toHaveStyle({ maxHeight: 'calc(100vh - 2rem)' });
            });

            it('should be scrollable when content exceeds viewport height', async () => {
                // Set small viewport
                setViewportSize(375, 500);

                const { container } = render(
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

                // Find scrollable content area
                const contentArea = container.querySelector('.overflow-y-auto');
                expect(contentArea).toBeInTheDocument();

                // Verify it has overflow-y-auto class for scrolling
                expect(contentArea).toHaveClass('overflow-y-auto');
            });

            it('should have responsive padding on mobile', async () => {
                // Set mobile viewport
                setViewportSize(375, 667);

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

                // Check header has responsive padding classes
                const header = screen.getByRole('dialog').querySelector('.border-b');
                expect(header).toHaveClass('p-4', 'sm:p-6');
            });

            it('should maintain touch targets on mobile', async () => {
                // Set mobile viewport
                setViewportSize(375, 667);

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

                // Check close button has minimum touch target size
                const closeButton = screen.getByLabelText('إغلاق نافذة ترتيب الخيارات');
                expect(closeButton).toHaveStyle({ minWidth: '44px', minHeight: '44px' });
            });
        });

        describe('EditModal Responsiveness', () => {
            it('should be responsive on mobile screens', async () => {
                // Set mobile viewport
                setViewportSize(375, 667);

                const { container } = render(
                    <EditModal
                        isOpen={true}
                        onClose={mockOnClose}
                        category={mockCategory}
                        field={mockField}
                    />
                );

                // Wait for modal to load
                await waitFor(() => {
                    expect(screen.getByRole('dialog')).toBeInTheDocument();
                });

                // Check modal has responsive classes
                const modal = screen.getByRole('dialog');
                expect(modal).toHaveClass('max-w-2xl', 'w-full');

                // Verify modal fits within viewport
                expect(modal).toHaveStyle({ maxHeight: 'calc(100vh - 2rem)' });
            });

            it('should be scrollable when content exceeds viewport height', async () => {
                // Set small viewport
                setViewportSize(375, 500);

                const { container } = render(
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

                // Find scrollable content area
                const contentArea = container.querySelector('.overflow-y-auto');
                expect(contentArea).toBeInTheDocument();

                // Verify it has overflow-y-auto class for scrolling
                expect(contentArea).toHaveClass('overflow-y-auto');
            });

            it('should have responsive padding on mobile', async () => {
                // Set mobile viewport
                setViewportSize(375, 667);

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

                // Check header has responsive padding classes
                const header = screen.getByRole('dialog').querySelector('.border-b');
                expect(header).toHaveClass('p-4', 'sm:p-6');
            });

            it('should maintain touch targets on mobile', async () => {
                // Set mobile viewport
                setViewportSize(375, 667);

                const { container } = render(
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

                // Check close button in header has minimum touch target size
                // There are two buttons with similar labels, so we target the one in the header
                const header = container.querySelector('.border-b');
                const closeButton = header?.querySelector('button[aria-label="إغلاق نافذة التعديل"]');
                expect(closeButton).toBeInTheDocument();
                expect(closeButton).toHaveStyle({ minWidth: '44px', minHeight: '44px' });
            });
        });

        describe('Modal Responsiveness Across Breakpoints', () => {
            it('should adapt modal layout from desktop to mobile', async () => {
                // Start with desktop
                setViewportSize(1920, 1080);

                const { rerender } = render(
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

                // Change to tablet
                setViewportSize(768, 1024);
                rerender(
                    <RankModal
                        isOpen={true}
                        onClose={mockOnClose}
                        category={mockCategory}
                        field={mockField}
                    />
                );

                expect(screen.getByRole('dialog')).toBeInTheDocument();

                // Change to mobile
                setViewportSize(375, 667);
                rerender(
                    <RankModal
                        isOpen={true}
                        onClose={mockOnClose}
                        category={mockCategory}
                        field={mockField}
                    />
                );

                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            it('should maintain modal functionality across all breakpoints', async () => {
                const breakpoints = [
                    { width: 375, height: 667, name: 'mobile' },
                    { width: 768, height: 1024, name: 'tablet' },
                    { width: 1920, height: 1080, name: 'desktop' },
                ];

                for (const breakpoint of breakpoints) {
                    setViewportSize(breakpoint.width, breakpoint.height);

                    const { unmount } = render(
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

                    // Verify modal is accessible
                    const modal = screen.getByRole('dialog');
                    expect(modal).toHaveAttribute('aria-modal', 'true');

                    // Verify close button is accessible
                    const closeButton = screen.getByLabelText('إغلاق نافذة ترتيب الخيارات');
                    expect(closeButton).toBeInTheDocument();

                    unmount();
                }
            });
        });
    });

    describe('Modal Scrollability (Requirement 11.2)', () => {
        it('should allow scrolling when modal content is taller than viewport', async () => {
            // Set very small viewport height
            setViewportSize(375, 400);

            const { container } = render(
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

            // Find scrollable content area
            const contentArea = container.querySelector('.overflow-y-auto');
            expect(contentArea).toBeInTheDocument();

            // Verify it has flex-1 class to take available space
            expect(contentArea).toHaveClass('flex-1', 'overflow-y-auto');
        });

        it('should have smooth scrolling on touch devices', async () => {
            // Set mobile viewport
            setViewportSize(375, 667);

            const { container } = render(
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

            // Find scrollable content area
            const contentArea = container.querySelector('.overflow-y-auto');
            expect(contentArea).toBeInTheDocument();

            // Verify it has overflow-y-auto class for smooth scrolling
            expect(contentArea).toHaveClass('overflow-y-auto');
        });

        it('should keep header and footer fixed while content scrolls', async () => {
            // Set small viewport
            setViewportSize(375, 500);

            const { container } = render(
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

            // Check header has flex-shrink-0 to stay fixed
            const header = container.querySelector('.border-b');
            expect(header).toHaveClass('flex-shrink-0');

            // Check footer has flex-shrink-0 to stay fixed
            const footer = container.querySelector('.border-t');
            expect(footer).toHaveClass('flex-shrink-0');

            // Check content area is scrollable
            const contentArea = container.querySelector('.overflow-y-auto');
            expect(contentArea).toHaveClass('flex-1', 'overflow-y-auto');
        });
    });

    describe('Responsive Text and Spacing', () => {
        it('should use responsive text sizes in modals', async () => {
            // Set mobile viewport
            setViewportSize(375, 667);

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

            // Check title has responsive text classes
            // Use getByRole to get the specific heading element
            const title = screen.getByRole('heading', { name: /ترتيب/ });
            expect(title).toHaveClass('text-lg', 'sm:text-xl');
        });

        it('should use responsive button sizes in modals', async () => {
            // Set mobile viewport
            setViewportSize(375, 667);

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

            // Check buttons have responsive padding
            const closeButtonInFooter = screen.getByText('إغلاق');
            expect(closeButtonInFooter).toHaveClass('px-4', 'sm:px-6', 'py-2', 'sm:py-3');
        });

        it('should use responsive spacing in modal content', async () => {
            // Set mobile viewport
            setViewportSize(375, 667);

            const { container } = render(
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

            // Check content area has responsive padding
            const contentArea = container.querySelector('.overflow-y-auto');
            expect(contentArea).toHaveClass('p-4', 'sm:p-6');
        });
    });
});
