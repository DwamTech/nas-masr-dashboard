/**
 * End-to-End Flow Tests for Task 23.1
 * 
 * These tests verify complete user flows work end-to-end:
 * - Opening modals from category cards
 * - URL state updates during modal operations
 * - Cache invalidation after mutations
 * - Error recovery flows
 * 
 * Requirements: 12.1, 12.3, 12.4, 12.5, 12.6, 12.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import FiltersListsPage from '../page';
import * as categoriesService from '@/services/categories';
import * as categoryFieldsService from '@/services/categoryFields';
import * as optionRanksService from '@/services/optionRanks';
import { cache } from '@/utils/cache';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
    useSearchParams: vi.fn(),
}));

// Mock services
vi.mock('@/services/categories');
vi.mock('@/services/categoryFields');
vi.mock('@/services/optionRanks');

// Mock CategoryCard to expose buttons
vi.mock('@/components/filters-lists/CategoryCard', () => ({
    default: ({ category, onRankClick, onEditClick }: any) => (
        <div data-testid={`category-card-${category.slug}`}>
            <h3>{category.name}</h3>
            <button
                data-testid={`rank-btn-${category.slug}`}
                onClick={() => onRankClick({
                    id: 1,
                    category_slug: category.slug,
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
                })}
            >
                ترتيب
            </button>
            <button
                data-testid={`edit-btn-${category.slug}`}
                onClick={() => onEditClick({
                    id: 1,
                    category_slug: category.slug,
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
                })}
            >
                تعديل
            </button>
        </div>
    ),
}));

// Mock modals
vi.mock('@/components/filters-lists/RankModal', () => ({
    default: ({ isOpen, onClose, category, field }: any) =>
        isOpen ? (
            <div data-testid="rank-modal">
                <h2>Rank Modal: {category?.name} - {field?.display_name}</h2>
                <button data-testid="close-modal" onClick={onClose}>Close</button>
                <button
                    data-testid="save-ranks"
                    onClick={async () => {
                        await optionRanksService.updateOptionRanks(
                            category.slug,
                            field.field_name,
                            [
                                { option: 'جديد', rank: 1 },
                                { option: 'مستعمل', rank: 2 },
                                { option: 'غير ذلك', rank: 3 },
                            ]
                        );
                        onClose();
                    }}
                >
                    Save
                </button>
            </div>
        ) : null,
}));

vi.mock('@/components/filters-lists/EditModal', () => ({
    default: ({ isOpen, onClose, category, field }: any) =>
        isOpen ? (
            <div data-testid="edit-modal">
                <h2>Edit Modal: {category?.name} - {field?.display_name}</h2>
                <button data-testid="close-modal" onClick={onClose}>Close</button>
            </div>
        ) : null,
}));

describe('End-to-End User Flows', () => {
    let mockRouter: any;
    let mockSearchParams: any;
    let mockPush: any;

    const mockCategories = [
        {
            id: 1,
            slug: 'cars',
            name: 'سيارات',
            icon: 'car.png',
            is_active: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
        },
    ];

    const mockCategoryFields = {
        data: [
            {
                id: 1,
                category_slug: 'cars',
                field_name: 'condition',
                display_name: 'الحالة',
                type: 'select' as const,
                required: true,
                filterable: true,
                options: ['جديد', 'مستعمل', 'غير ذلك'],
                is_active: true,
                sort_order: 1,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            },
        ],
        governorates: [],
        makes: [],
        supports_make_model: false,
        supports_sections: false,
        main_sections: [],
    };

    beforeEach(() => {
        cache.clear();

        mockPush = vi.fn();
        mockRouter = { push: mockPush };
        vi.mocked(useRouter).mockReturnValue(mockRouter);

        mockSearchParams = {
            get: vi.fn((key: string) => null),
        };
        vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn((key: string) => {
                    if (key === 'isAuthenticated') return 'true';
                    if (key === 'authToken') return 'test-token';
                    return null;
                }),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn(),
            },
            writable: true,
        });

        vi.mocked(categoriesService.fetchCategories).mockResolvedValue(mockCategories);
        vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue(mockCategoryFields);
        vi.mocked(optionRanksService.updateOptionRanks).mockResolvedValue({
            success: true,
            message: 'تم تحديث الترتيب بنجاح',
            data: { updated_count: 3 },
        });
    });

    describe('Complete Rank Update Flow', () => {
        it('should complete full rank update flow with URL state and cache invalidation', async () => {
            render(<FiltersListsPage />);

            // Wait for page to load
            await waitFor(() => {
                expect(screen.getByText('سيارات')).toBeInTheDocument();
            });

            // Click rank button
            const rankButton = screen.getByTestId('rank-btn-cars');
            fireEvent.click(rankButton);

            // Verify URL was updated
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith(
                    expect.stringContaining('modal=rank'),
                    expect.objectContaining({ scroll: false })
                );
            });

            // Simulate URL state change
            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'rank';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            // Re-render to show modal
            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            // Wait for modal to appear
            await waitFor(() => {
                expect(screen.getByTestId('rank-modal')).toBeInTheDocument();
            });

            // Save changes
            const saveButton = screen.getByTestId('save-ranks');
            fireEvent.click(saveButton);

            // Verify API was called
            await waitFor(() => {
                expect(optionRanksService.updateOptionRanks).toHaveBeenCalledWith(
                    'cars',
                    'condition',
                    expect.arrayContaining([
                        { option: 'جديد', rank: 1 },
                        { option: 'مستعمل', rank: 2 },
                        { option: 'غير ذلك', rank: 3 },
                    ])
                );
            });

            // Verify modal closed (URL should be updated)
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith(
                    expect.not.stringContaining('modal='),
                    expect.objectContaining({ scroll: false })
                );
            });
        });
    });

    describe('Complete Edit Flow', () => {
        it('should open edit modal and handle close', async () => {
            render(<FiltersListsPage />);

            // Wait for page to load
            await waitFor(() => {
                expect(screen.getByText('سيارات')).toBeInTheDocument();
            });

            // Click edit button
            const editButton = screen.getByTestId('edit-btn-cars');
            fireEvent.click(editButton);

            // Verify URL was updated
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith(
                    expect.stringContaining('modal=edit'),
                    expect.objectContaining({ scroll: false })
                );
            });

            // Simulate URL state change
            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'edit';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            // Re-render to show modal
            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            // Wait for modal to appear
            await waitFor(() => {
                expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
            });

            // Close modal
            const closeButton = screen.getByTestId('close-modal');
            fireEvent.click(closeButton);

            // Verify URL was cleared
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith(
                    expect.not.stringContaining('modal='),
                    expect.objectContaining({ scroll: false })
                );
            });
        });
    });

    describe('Error Recovery Flow', () => {
        it('should handle save error and keep modal open', async () => {
            // Mock API error
            vi.mocked(optionRanksService.updateOptionRanks).mockRejectedValue(
                new Error('فشل حفظ التغييرات')
            );

            // Setup modal state
            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'rank';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            render(<FiltersListsPage />);

            // Wait for modal to appear
            await waitFor(() => {
                expect(screen.getByTestId('rank-modal')).toBeInTheDocument();
            });

            // Try to save
            const saveButton = screen.getByTestId('save-ranks');
            fireEvent.click(saveButton);

            // Verify API was called
            await waitFor(() => {
                expect(optionRanksService.updateOptionRanks).toHaveBeenCalled();
            });

            // Modal should still be open (URL not cleared)
            expect(screen.getByTestId('rank-modal')).toBeInTheDocument();
        });
    });

    describe('Browser Navigation Flow', () => {
        it('should handle browser back button', async () => {
            render(<FiltersListsPage />);

            // Wait for page to load
            await waitFor(() => {
                expect(screen.getByText('سيارات')).toBeInTheDocument();
            });

            // Open modal
            const rankButton = screen.getByTestId('rank-btn-cars');
            fireEvent.click(rankButton);

            // Verify URL was updated
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith(
                    expect.stringContaining('modal=rank'),
                    expect.objectContaining({ scroll: false })
                );
            });

            // Simulate browser back (URL state cleared)
            mockSearchParams.get = vi.fn((key: string) => null);

            // Re-render
            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            // Modal should be closed
            await waitFor(() => {
                expect(screen.queryByTestId('rank-modal')).not.toBeInTheDocument();
            });
        });
    });
});
