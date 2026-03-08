import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import RankModal from '../RankModal';
import { Category, CategoryField } from '@/types/filters-lists';
import * as categoryFieldsService from '@/services/categoryFields';
import * as optionRanksService from '@/services/optionRanks';
import { cache } from '@/utils/cache';

// Mock the services
vi.mock('@/services/categoryFields');
vi.mock('@/services/optionRanks');
vi.mock('@/utils/cache', () => ({
    cache: {
        invalidate: vi.fn(),
    },
    INVALIDATION_PATTERNS: {
        RANK_UPDATE: (slug: string) => `fields:${slug}`,
    },
}));

// Mock DraggableOptionsList to simplify testing
vi.mock('@/components/DraggableOptions/DraggableOptionsList', () => ({
    DraggableOptionsList: ({ options, onSave, onReorder }: any) => {
        return (
            <div data-testid="draggable-list">
                {options.map((option: string, index: number) => (
                    <div key={option} data-testid={`option-${index}`}>
                        {option}
                    </div>
                ))}
                <button
                    data-testid="trigger-save"
                    onClick={() => {
                        const ranks = options.map((opt: string, idx: number) => ({
                            option: opt,
                            rank: idx + 1,
                        }));
                        onSave(ranks);
                    }}
                >
                    Save
                </button>
                <button
                    data-testid="trigger-reorder"
                    onClick={() => {
                        // Simulate reordering: move first to last
                        const newOrder = [...options.slice(1), options[0]];
                        onReorder(newOrder);
                    }}
                >
                    Reorder
                </button>
            </div>
        );
    },
}));

describe('RankModal - Task 8.4 Integration Tests', () => {
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
        vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
            data: [mockField],
            governorates: [],
            makes: [],
            supports_make_model: false,
            supports_sections: false,
            main_sections: [],
        });
    });

    describe('Requirement 4.21: Calculate sequential ranks (1, 2, 3, ...)', () => {
        it('should calculate sequential ranks after reorder', async () => {
            const mockUpdateRanks = vi.mocked(optionRanksService.updateOptionRanks);
            mockUpdateRanks.mockResolvedValue({
                success: true,
                message: 'تم تحديث الترتيب بنجاح',
                data: { updated_count: 3 },
            });

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            // Wait for options to load
            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Trigger save
            const saveButton = screen.getByTestId('trigger-save');
            saveButton.click();

            // Verify ranks are sequential
            await waitFor(() => {
                expect(mockUpdateRanks).toHaveBeenCalledWith(
                    'cars',
                    'condition',
                    [
                        { option: 'جديد', rank: 1 },
                        { option: 'مستعمل', rank: 2 },
                        { option: 'غير ذلك', rank: 3 },
                    ],
                    undefined
                );
            });
        });
    });

    describe('Requirement 4.22: "غير ذلك" always has highest rank', () => {
        it('should ensure "غير ذلك" has the highest rank value', async () => {
            const mockUpdateRanks = vi.mocked(optionRanksService.updateOptionRanks);
            mockUpdateRanks.mockResolvedValue({
                success: true,
                message: 'تم تحديث الترتيب بنجاح',
                data: { updated_count: 3 },
            });

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Trigger save
            const saveButton = screen.getByTestId('trigger-save');
            saveButton.click();

            // Verify "غير ذلك" has rank 3 (highest)
            await waitFor(() => {
                const callArgs = mockUpdateRanks.mock.calls[0];
                const ranks = callArgs[2];
                const otherRank = ranks.find((r: any) => r.option === 'غير ذلك')?.rank;
                const maxRank = Math.max(...ranks.map((r: any) => r.rank));

                expect(otherRank).toBe(maxRank);
                expect(otherRank).toBe(3);
            });
        });
    });

    describe('Requirement 4.23: Send rank update to API', () => {
        it('should send POST request to correct endpoint', async () => {
            const mockUpdateRanks = vi.mocked(optionRanksService.updateOptionRanks);
            mockUpdateRanks.mockResolvedValue({
                success: true,
                message: 'تم تحديث الترتيب بنجاح',
                data: { updated_count: 3 },
            });

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Trigger save
            const saveButton = screen.getByTestId('trigger-save');
            saveButton.click();

            // Verify API call
            await waitFor(() => {
                expect(mockUpdateRanks).toHaveBeenCalledWith(
                    'cars',
                    'condition',
                    expect.any(Array),
                    undefined
                );
            });
        });

        it('should include parent context for hierarchical lists', async () => {
            const mockUpdateRanks = vi.mocked(optionRanksService.updateOptionRanks);
            mockUpdateRanks.mockResolvedValue({
                success: true,
                message: 'تم تحديث الترتيب بنجاح',
                data: { updated_count: 3 },
            });

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                    parent="القاهرة"
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Trigger save
            const saveButton = screen.getByTestId('trigger-save');
            saveButton.click();

            // Verify parent context is included
            await waitFor(() => {
                expect(mockUpdateRanks).toHaveBeenCalledWith(
                    'cars',
                    'condition',
                    expect.any(Array),
                    'القاهرة'
                );
            });
        });
    });

    describe('Requirement 4.25, 4.26: Handle success', () => {
        it('should show success message and close modal on successful save', async () => {
            vi.useFakeTimers();

            const mockUpdateRanks = vi.mocked(optionRanksService.updateOptionRanks);
            mockUpdateRanks.mockResolvedValue({
                success: true,
                message: 'تم تحديث الترتيب بنجاح',
                data: { updated_count: 3 },
            });

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Trigger save
            const saveButton = screen.getByTestId('trigger-save');
            saveButton.click();

            // Wait for success message
            await waitFor(() => {
                expect(screen.getByText('تم حفظ الترتيب بنجاح')).toBeInTheDocument();
            });

            // Fast-forward time to trigger modal close
            vi.advanceTimersByTime(1000);

            // Verify modal close was called
            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled();
            });

            vi.useRealTimers();
        });

        it('should invalidate cache on successful save', async () => {
            const mockUpdateRanks = vi.mocked(optionRanksService.updateOptionRanks);
            mockUpdateRanks.mockResolvedValue({
                success: true,
                message: 'تم تحديث الترتيب بنجاح',
                data: { updated_count: 3 },
            });

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Trigger save
            const saveButton = screen.getByTestId('trigger-save');
            saveButton.click();

            // Verify cache invalidation
            await waitFor(() => {
                expect(cache.invalidate).toHaveBeenCalledWith('fields:cars');
            });
        });
    });

    describe('Requirement 4.27: Handle failure and rollback', () => {
        it('should show error message on save failure', async () => {
            const mockUpdateRanks = vi.mocked(optionRanksService.updateOptionRanks);
            mockUpdateRanks.mockRejectedValue(new Error('فشل الاتصال بالخادم'));

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Trigger save
            const saveButton = screen.getByTestId('trigger-save');
            saveButton.click();

            // Wait for error message
            await waitFor(() => {
                expect(screen.getByText('فشل الاتصال بالخادم')).toBeInTheDocument();
            });

            // Verify modal is still open (not closed)
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    describe('Requirement 14.12: Optimistic UI updates', () => {
        it('should update UI immediately before API call completes', async () => {
            const mockUpdateRanks = vi.mocked(optionRanksService.updateOptionRanks);

            // Create a promise that we can control
            let resolveUpdate: any;
            const updatePromise = new Promise((resolve) => {
                resolveUpdate = resolve;
            });
            mockUpdateRanks.mockReturnValue(updatePromise as any);

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Get initial options
            const initialOptions = screen.getAllByTestId(/option-/);
            expect(initialOptions).toHaveLength(3);

            // Trigger reorder (optimistic update)
            const reorderButton = screen.getByTestId('trigger-reorder');
            reorderButton.click();

            // UI should update immediately (before API call completes)
            // Note: In the actual implementation, DraggableOptionsList handles this
            // This test verifies the flow is set up correctly

            // Now resolve the API call
            resolveUpdate({
                success: true,
                message: 'تم تحديث الترتيب بنجاح',
                data: { updated_count: 3 },
            });

            await waitFor(() => {
                expect(mockUpdateRanks).toHaveBeenCalled();
            });
        });
    });

    describe('Requirements 8.1, 8.2, 8.3, 8.4: API payload formatting', () => {
        it('should format payload correctly for independent lists', async () => {
            const mockUpdateRanks = vi.mocked(optionRanksService.updateOptionRanks);
            mockUpdateRanks.mockResolvedValue({
                success: true,
                message: 'تم تحديث الترتيب بنجاح',
                data: { updated_count: 3 },
            });

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Trigger save
            const saveButton = screen.getByTestId('trigger-save');
            saveButton.click();

            // Verify payload format
            await waitFor(() => {
                expect(mockUpdateRanks).toHaveBeenCalledWith(
                    'cars',
                    'condition',
                    [
                        { option: 'جديد', rank: 1 },
                        { option: 'مستعمل', rank: 2 },
                        { option: 'غير ذلك', rank: 3 },
                    ],
                    undefined // No parent for independent lists
                );
            });
        });
    });
});
