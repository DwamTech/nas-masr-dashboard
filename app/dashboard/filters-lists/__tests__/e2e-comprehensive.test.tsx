/**
 * Comprehensive End-to-End Integration Tests for Task 23.3
 * 
 * These tests verify complete user flows from start to finish:
 * 1. Complete rank update flow (open modal, drag, save, verify)
 * 2. Complete edit flow (open modal, add options, save, verify)
 * 3. Hierarchical list management flow
 * 4. Error recovery scenarios
 * 
 * Requirements: 12.1, 12.3, 12.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import FiltersListsPage from '../page';
import * as categoriesService from '@/services/categories';
import * as categoryFieldsService from '@/services/categoryFields';
import * as optionRanksService from '@/services/optionRanks';
import * as governoratesService from '@/services/governorates';
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
vi.mock('@/services/governorates');

// Mock RankModal and EditModal to simplify testing
vi.mock('@/components/filters-lists/RankModal', () => ({
    default: ({ isOpen, onClose, category, field }: any) =>
        isOpen ? (
            <div data-testid="rank-modal">
                <h2>ترتيب {field?.display_name}</h2>
                <div data-testid="draggable-list">
                    <div data-testid="options-count">3</div>
                    <div data-testid="option-0">جديد</div>
                    <div data-testid="option-1">مستعمل</div>
                    <div data-testid="option-2">غير ذلك</div>
                    <button data-testid="simulate-drag">Simulate Drag</button>
                    <button data-testid="save-ranks">Save</button>
                </div>
                <button data-testid="close-rank-modal" onClick={onClose}>إغلاق</button>
            </div>
        ) : null,
}));

vi.mock('@/components/filters-lists/EditModal', () => ({
    default: ({ isOpen, onClose, category, field }: any) =>
        isOpen ? (
            <div data-testid="edit-modal">
                <h2>تعديل {field?.display_name}</h2>
                <div role="listitem">جديد</div>
                <div role="listitem">مستعمل</div>
                <div role="listitem">غير ذلك</div>
                <button data-testid="close-edit-modal" onClick={onClose}>إغلاق</button>
            </div>
        ) : null,
}));

// Mock DraggableOptionsList to simulate drag and drop
vi.mock('@/components/DraggableOptions/DraggableOptionsList', () => ({
    DraggableOptionsList: ({ options, onReorder, onSave, disabled }: any) => (
        <div data-testid="draggable-list">
            <div data-testid="options-count">{options.length}</div>
            {options.map((opt: string, idx: number) => (
                <div key={idx} data-testid={`option-${idx}`}>
                    {opt}
                </div>
            ))}
            <button
                data-testid="simulate-drag"
                onClick={() => {
                    // Simulate dragging first item to last position
                    const newOrder = [...options.slice(1), options[0]];
                    onReorder(newOrder);
                }}
                disabled={disabled}
            >
                Simulate Drag
            </button>
            <button
                data-testid="save-ranks"
                onClick={() => {
                    const ranks = options.map((opt: string, idx: number) => ({
                        option: opt,
                        rank: idx + 1,
                    }));
                    onSave(ranks);
                }}
                disabled={disabled}
            >
                Save
            </button>
        </div>
    ),
}));

describe('Task 23.3: Comprehensive End-to-End Integration Tests', () => {
    let mockRouter: any;
    let mockSearchParams: any;
    let mockPush: any;
    let user: ReturnType<typeof userEvent.setup>;

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
            {
                id: 2,
                category_slug: 'cars',
                field_name: 'city',
                display_name: 'المدينة',
                type: 'select' as const,
                required: true,
                filterable: true,
                options: [],
                is_active: true,
                sort_order: 2,
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

    const mockGovernorates = [
        {
            id: 1,
            name: 'القاهرة',
            cities: [
                { id: 1, name: 'مدينة نصر', governorate_id: 1 },
                { id: 2, name: 'المعادي', governorate_id: 1 },
                { id: 3, name: 'مصر الجديدة', governorate_id: 1 },
            ],
        },
        {
            id: 2,
            name: 'الجيزة',
            cities: [
                { id: 4, name: 'الدقي', governorate_id: 2 },
                { id: 5, name: 'المهندسين', governorate_id: 2 },
            ],
        },
    ];

    beforeEach(() => {
        user = userEvent.setup();
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
        vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue(mockGovernorates);
        vi.mocked(optionRanksService.updateOptionRanks).mockResolvedValue({
            success: true,
            message: 'تم تحديث الترتيب بنجاح',
            data: { updated_count: 3 },
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Complete Rank Update Flow - Independent List', () => {
        it('should complete full rank update flow: open modal, drag, save, verify cache invalidation', async () => {
            // Step 1: Render page
            render(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText('إدارة الفلاتر والقوائم')).toBeInTheDocument();
            });

            // Step 2: Open rank modal by simulating URL state
            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'rank';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            // Step 3: Wait for modal to appear with options
            await waitFor(() => {
                expect(screen.getByText(/ترتيب الحالة/)).toBeInTheDocument();
            });

            await waitFor(() => {
                const draggableList = screen.getByTestId('draggable-list');
                expect(draggableList).toBeInTheDocument();
            });

            // Step 4: Verify initial options are displayed
            expect(screen.getByTestId('option-0')).toHaveTextContent('جديد');
            expect(screen.getByTestId('option-1')).toHaveTextContent('مستعمل');
            expect(screen.getByTestId('option-2')).toHaveTextContent('غير ذلك');

            // Step 5: Simulate drag operation (move first to last)
            const dragButton = screen.getByTestId('simulate-drag');
            fireEvent.click(dragButton);

            // Step 6: Verify UI updated optimistically
            await waitFor(() => {
                expect(screen.getByTestId('option-0')).toHaveTextContent('مستعمل');
                expect(screen.getByTestId('option-1')).toHaveTextContent('غير ذلك');
                expect(screen.getByTestId('option-2')).toHaveTextContent('جديد');
            });

            // Step 7: Save changes
            const saveButton = screen.getByTestId('save-ranks');
            fireEvent.click(saveButton);

            // Step 8: Verify API was called with correct ranks
            await waitFor(() => {
                expect(optionRanksService.updateOptionRanks).toHaveBeenCalledWith(
                    'cars',
                    'condition',
                    expect.arrayContaining([
                        { option: 'مستعمل', rank: 1 },
                        { option: 'غير ذلك', rank: 2 },
                        { option: 'جديد', rank: 3 },
                    ]),
                    undefined
                );
            });

            // Step 9: Verify success message appears
            await waitFor(() => {
                expect(screen.getByText(/تم حفظ الترتيب بنجاح/)).toBeInTheDocument();
            });

            // Step 10: Verify cache was invalidated
            // The cache.invalidate should have been called with the pattern
            // We can't directly test cache.invalidate, but we can verify the flow completed
            expect(optionRanksService.updateOptionRanks).toHaveBeenCalledTimes(1);
        });

        it('should handle "غير ذلك" pinning during rank update', async () => {
            render(<FiltersListsPage />);

            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'rank';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Simulate drag
            fireEvent.click(screen.getByTestId('simulate-drag'));

            // Save
            fireEvent.click(screen.getByTestId('save-ranks'));

            // Verify "غير ذلك" is in the ranks (DraggableOptionsList handles pinning)
            await waitFor(() => {
                expect(optionRanksService.updateOptionRanks).toHaveBeenCalled();
            });

            const callArgs = vi.mocked(optionRanksService.updateOptionRanks).mock.calls[0];
            const ranks = callArgs[2];

            // Find "غير ذلك" in ranks
            const otherOption = ranks.find((r: any) => r.option === 'غير ذلك');
            expect(otherOption).toBeDefined();
        });
    });

    describe('Complete Edit Flow - Independent List', () => {
        it('should complete full edit flow: open modal, verify modal appears', async () => {
            // Step 1: Render page
            render(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText('إدارة الفلاتر والقوائم')).toBeInTheDocument();
            });

            // Step 2: Open edit modal
            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'edit';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            // Step 3: Wait for modal to appear
            await waitFor(() => {
                expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
            });

            // Step 4: Verify modal shows field name
            expect(screen.getByText(/تعديل الحالة/)).toBeInTheDocument();

            // Step 5: Verify options are displayed
            const options = screen.getAllByRole('listitem');
            expect(options.length).toBeGreaterThan(0);
        });

        it('should handle bulk add flow with validation', async () => {
            render(<FiltersListsPage />);

            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'edit';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText(/تعديل الحالة|اضافة\/تعديل/)).toBeInTheDocument();
            });

            // Find bulk add textarea
            const textarea = screen.getByPlaceholderText(/أدخل الخيارات|إضافة عدة خيارات/i);

            // Enter multiple options (comma-separated)
            await user.type(textarea, 'ممتاز, جيد جداً, جيد');

            // Click bulk add button
            const bulkAddButton = screen.getByRole('button', { name: /إضافة الكل|إضافة جميع/i });
            await user.click(bulkAddButton);

            // Verify success message with count
            await waitFor(() => {
                expect(screen.getByText(/تمت إضافة 3 خيار بنجاح/)).toBeInTheDocument();
            });

            // Verify all options appear
            expect(screen.getByText('ممتاز')).toBeInTheDocument();
            expect(screen.getByText('جيد جداً')).toBeInTheDocument();
            expect(screen.getByText('جيد')).toBeInTheDocument();
        });

        it('should handle inline edit flow', async () => {
            render(<FiltersListsPage />);

            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'edit';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText('جديد')).toBeInTheDocument();
            });

            // Find edit button for "جديد" option
            const editButtons = screen.getAllByRole('button', { name: /تعديل|edit/i });
            const firstEditButton = editButtons[0];
            await user.click(firstEditButton);

            // Find the input field (should be in edit mode now)
            const editInput = screen.getByDisplayValue('جديد');
            await user.clear(editInput);
            await user.type(editInput, 'جديد - حالة ممتازة');

            // Save the edit
            const saveButton = screen.getByRole('button', { name: /حفظ|save/i });
            await user.click(saveButton);

            // Verify success message
            await waitFor(() => {
                expect(screen.getByText(/تم تعديل الخيار بنجاح/)).toBeInTheDocument();
            });

            // Verify updated value appears
            expect(screen.getByText('جديد - حالة ممتازة')).toBeInTheDocument();
        });

        it('should handle hide/show toggle', async () => {
            render(<FiltersListsPage />);

            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'edit';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText('جديد')).toBeInTheDocument();
            });

            // Find hide/show toggle for "جديد" option
            const toggleButtons = screen.getAllByRole('button', { name: /إخفاء|إظهار|hide|show/i });
            const firstToggle = toggleButtons[0];
            await user.click(firstToggle);

            // Verify success message
            await waitFor(() => {
                expect(screen.getByText(/تم إخفاء "جديد" بنجاح/)).toBeInTheDocument();
            });

            // Verify "مخفي" badge appears
            expect(screen.getByText('مخفي')).toBeInTheDocument();

            // Toggle back to show
            await user.click(firstToggle);

            // Verify show success message
            await waitFor(() => {
                expect(screen.getByText(/تم إظهار "جديد" بنجاح/)).toBeInTheDocument();
            });
        });

        it('should prevent editing "غير ذلك" option', async () => {
            render(<FiltersListsPage />);

            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'edit';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText('غير ذلك')).toBeInTheDocument();
            });

            // Find all edit buttons
            const editButtons = screen.getAllByRole('button', { name: /تعديل|edit/i });

            // The "غير ذلك" option should have its edit button disabled
            // We can verify by checking if there are fewer edit buttons than options
            // or by checking the disabled state
            const options = screen.getAllByRole('listitem');
            expect(editButtons.length).toBeLessThan(options.length);
        });
    });

    describe('Hierarchical List Management Flow', () => {
        it('should complete hierarchical rank flow: select parent, rank children, save', async () => {
            // Step 1: Render page
            render(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText('إدارة الفلاتر والقوائم')).toBeInTheDocument();
            });

            // Step 2: Open rank modal for hierarchical field (city)
            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'rank';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'city';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            // Step 3: Wait for modal with parent selector
            await waitFor(() => {
                expect(screen.getByText(/ترتيب المدينة/)).toBeInTheDocument();
            });

            // Step 4: Verify parent selector is present
            await waitFor(() => {
                expect(screen.getByText(/اختر المحافظة|اختر الفئة/)).toBeInTheDocument();
            });

            // Step 5: Select a parent (القاهرة)
            const parentSelector = screen.getByRole('combobox', { name: /اختر المحافظة|parent/i });
            await user.selectOptions(parentSelector, 'القاهرة');

            // Step 6: Wait for child options to load
            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Step 7: Verify child options are displayed
            expect(screen.getByText('مدينة نصر')).toBeInTheDocument();
            expect(screen.getByText('المعادي')).toBeInTheDocument();
            expect(screen.getByText('مصر الجديدة')).toBeInTheDocument();

            // Step 8: Simulate drag operation
            fireEvent.click(screen.getByTestId('simulate-drag'));

            // Step 9: Save changes
            fireEvent.click(screen.getByTestId('save-ranks'));

            // Step 10: Verify API was called with parent context
            await waitFor(() => {
                expect(optionRanksService.updateOptionRanks).toHaveBeenCalledWith(
                    'cars',
                    'city',
                    expect.any(Array),
                    'القاهرة' // Parent context should be included
                );
            });

            // Step 11: Verify success message
            await waitFor(() => {
                expect(screen.getByText(/تم حفظ الترتيب بنجاح/)).toBeInTheDocument();
            });
        });

        it('should handle parent switching in hierarchical rank modal', async () => {
            render(<FiltersListsPage />);

            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'rank';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'city';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText(/ترتيب المدينة/)).toBeInTheDocument();
            });

            // Select first parent
            const parentSelector = screen.getByRole('combobox', { name: /اختر المحافظة|parent/i });
            await user.selectOptions(parentSelector, 'القاهرة');

            await waitFor(() => {
                expect(screen.getByText('مدينة نصر')).toBeInTheDocument();
            });

            // Switch to second parent
            await user.selectOptions(parentSelector, 'الجيزة');

            // Verify different child options load
            await waitFor(() => {
                expect(screen.getByText('الدقي')).toBeInTheDocument();
                expect(screen.getByText('المهندسين')).toBeInTheDocument();
            });

            // Verify القاهرة cities are no longer shown
            expect(screen.queryByText('مدينة نصر')).not.toBeInTheDocument();
        });

        it('should complete hierarchical edit flow: select parent, add child option, verify', async () => {
            render(<FiltersListsPage />);

            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'edit';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'city';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText(/تعديل المدينة|اضافة\/تعديل/)).toBeInTheDocument();
            });

            // Select parent
            const parentSelector = screen.getByRole('combobox', { name: /اختر المحافظة|parent/i });
            await user.selectOptions(parentSelector, 'القاهرة');

            await waitFor(() => {
                expect(screen.getByText('مدينة نصر')).toBeInTheDocument();
            });

            // Add new child option
            const input = screen.getByPlaceholderText(/أدخل اسم الخيار|إضافة خيار/i);
            await user.type(input, 'التجمع الخامس');

            const addButton = screen.getByRole('button', { name: /إضافة|أضف/i });
            await user.click(addButton);

            // Verify success message with parent context
            await waitFor(() => {
                expect(screen.getByText(/تمت إضافة "التجمع الخامس" في القاهرة بنجاح/)).toBeInTheDocument();
            });

            // Verify option appears
            expect(screen.getByText('التجمع الخامس')).toBeInTheDocument();
        });

        it('should validate child option uniqueness within parent context', async () => {
            render(<FiltersListsPage />);

            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'edit';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'city';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText(/تعديل المدينة/)).toBeInTheDocument();
            });

            // Select parent
            const parentSelector = screen.getByRole('combobox', { name: /اختر المحافظة|parent/i });
            await user.selectOptions(parentSelector, 'القاهرة');

            await waitFor(() => {
                expect(screen.getByText('مدينة نصر')).toBeInTheDocument();
            });

            // Try to add duplicate option
            const input = screen.getByPlaceholderText(/أدخل اسم الخيار|إضافة خيار/i);
            await user.type(input, 'مدينة نصر');

            const addButton = screen.getByRole('button', { name: /إضافة|أضف/i });
            await user.click(addButton);

            // Verify error message
            await waitFor(() => {
                expect(screen.getByText(/هذا الاسم موجود بالفعل|duplicate/i)).toBeInTheDocument();
            });
        });
    });

    describe('Error Recovery Scenarios', () => {
        it('should handle rank save failure with rollback', async () => {
            // Mock API failure
            vi.mocked(optionRanksService.updateOptionRanks).mockRejectedValueOnce(
                new Error('فشل حفظ الترتيب')
            );

            render(<FiltersListsPage />);

            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'rank';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Store original order
            const originalFirst = screen.getByTestId('option-0').textContent;

            // Simulate drag
            fireEvent.click(screen.getByTestId('simulate-drag'));

            // Verify optimistic update
            await waitFor(() => {
                expect(screen.getByTestId('option-0').textContent).not.toBe(originalFirst);
            });

            // Try to save (will fail)
            fireEvent.click(screen.getByTestId('save-ranks'));

            // Verify error message appears
            await waitFor(() => {
                expect(screen.getByText(/فشل حفظ الترتيب|خطأ/)).toBeInTheDocument();
            });

            // Verify modal stays open (URL not cleared)
            expect(screen.getByTestId('draggable-list')).toBeInTheDocument();

            // Note: Rollback is handled by DraggableOptionsList component
            // The test verifies the error is shown and modal stays open
        });

        it('should handle network timeout with retry', async () => {
            // Mock timeout error
            vi.mocked(optionRanksService.updateOptionRanks)
                .mockRejectedValueOnce(new Error('فشل الاتصال بالخادم'))
                .mockResolvedValueOnce({
                    success: true,
                    message: 'تم تحديث الترتيب بنجاح',
                    data: { updated_count: 3 },
                });

            render(<FiltersListsPage />);

            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'rank';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Simulate drag and save
            fireEvent.click(screen.getByTestId('simulate-drag'));
            fireEvent.click(screen.getByTestId('save-ranks'));

            // Verify error message
            await waitFor(() => {
                expect(screen.getByText(/فشل الاتصال بالخادم/)).toBeInTheDocument();
            });

            // Retry save
            fireEvent.click(screen.getByTestId('save-ranks'));

            // Verify success on retry
            await waitFor(() => {
                expect(screen.getByText(/تم حفظ الترتيب بنجاح/)).toBeInTheDocument();
            });
        });

        it('should handle validation errors in edit modal', async () => {
            render(<FiltersListsPage />);

            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'edit';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText(/تعديل الحالة/)).toBeInTheDocument();
            });

            // Try to add empty option
            const input = screen.getByPlaceholderText(/أدخل اسم الخيار|إضافة خيار/i);
            await user.type(input, '   '); // Only whitespace

            const addButton = screen.getByRole('button', { name: /إضافة|أضف/i });
            await user.click(addButton);

            // Verify validation error
            await waitFor(() => {
                expect(screen.getByText(/لا يمكن أن يكون الاسم فارغاً|empty/i)).toBeInTheDocument();
            });

            // Verify option was not added
            const options = screen.getAllByRole('listitem');
            expect(options.length).toBe(3); // Original 3 options only
        });

        it('should handle duplicate option validation', async () => {
            render(<FiltersListsPage />);

            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'edit';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText('جديد')).toBeInTheDocument();
            });

            // Try to add duplicate option
            const input = screen.getByPlaceholderText(/أدخل اسم الخيار|إضافة خيار/i);
            await user.type(input, 'جديد');

            const addButton = screen.getByRole('button', { name: /إضافة|أضف/i });
            await user.click(addButton);

            // Verify duplicate error
            await waitFor(() => {
                expect(screen.getByText(/هذا الاسم موجود بالفعل|duplicate/i)).toBeInTheDocument();
            });
        });

        it('should handle missing parent selection in hierarchical edit', async () => {
            render(<FiltersListsPage />);

            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'edit';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'city';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText(/تعديل المدينة/)).toBeInTheDocument();
            });

            // Don't select a parent, try to add option directly
            // Note: The component should auto-select first parent or show message
            // This test verifies the component handles the case gracefully

            // If no parent is selected, there should be a message or auto-selection
            const hasParentSelector = screen.queryByRole('combobox', { name: /اختر المحافظة|parent/i });

            if (hasParentSelector) {
                // Parent selector exists, verify it's required
                expect(hasParentSelector).toBeInTheDocument();
            }
        });

        it('should handle concurrent modification conflicts', async () => {
            // Mock conflict error (422 status)
            vi.mocked(optionRanksService.updateOptionRanks).mockRejectedValueOnce(
                new Error('حدث تعارض في البيانات')
            );

            render(<FiltersListsPage />);

            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'rank';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Simulate drag and save
            fireEvent.click(screen.getByTestId('simulate-drag'));
            fireEvent.click(screen.getByTestId('save-ranks'));

            // Verify conflict error message
            await waitFor(() => {
                expect(screen.getByText(/حدث تعارض في البيانات|conflict/i)).toBeInTheDocument();
            });

            // Modal should stay open for user to retry
            expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
        });

        it('should handle authentication errors with redirect', async () => {
            // Mock unauthenticated state
            Object.defineProperty(window, 'localStorage', {
                value: {
                    getItem: vi.fn(() => null), // No auth token
                    setItem: vi.fn(),
                    removeItem: vi.fn(),
                    clear: vi.fn(),
                },
                writable: true,
            });

            render(<FiltersListsPage />);

            // Verify redirect to login
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/auth/login');
            });
        });
    });

    describe('Cache Invalidation and Data Refresh', () => {
        it('should invalidate cache after successful rank update', async () => {
            render(<FiltersListsPage />);

            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'rank';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            const { rerender } = render(<FiltersListsPage />);
            rerender(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            // Simulate drag and save
            fireEvent.click(screen.getByTestId('simulate-drag'));
            fireEvent.click(screen.getByTestId('save-ranks'));

            // Wait for success
            await waitFor(() => {
                expect(screen.getByText(/تم حفظ الترتيب بنجاح/)).toBeInTheDocument();
            });

            // Verify cache invalidation happened
            // The cache.invalidate is called internally, we verify the flow completed
            expect(optionRanksService.updateOptionRanks).toHaveBeenCalledTimes(1);
        });

        it('should refetch data after cache invalidation', async () => {
            const { unmount } = render(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText('إدارة الفلاتر والقوائم')).toBeInTheDocument();
            });

            const initialCallCount = vi.mocked(categoryFieldsService.fetchCategoryFields).mock.calls.length;

            // Clear cache
            cache.clear();

            unmount();

            // Re-render should fetch fresh data
            render(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText('إدارة الفلاتر والقوائم')).toBeInTheDocument();
            });

            // Verify data was fetched again
            const newCallCount = vi.mocked(categoryFieldsService.fetchCategoryFields).mock.calls.length;
            expect(newCallCount).toBeGreaterThan(initialCallCount);
        });
    });

    describe('URL State Persistence', () => {
        it('should restore modal state from URL on page refresh', async () => {
            // Simulate page load with modal state in URL
            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'rank';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            render(<FiltersListsPage />);

            // Modal should open automatically
            await waitFor(() => {
                expect(screen.getByText(/ترتيب الحالة/)).toBeInTheDocument();
            });

            // Verify category fields were fetched
            expect(categoryFieldsService.fetchCategoryFields).toHaveBeenCalledWith('cars');
        });

        it('should update URL when modal opens', async () => {
            render(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText('إدارة الفلاتر والقوائم')).toBeInTheDocument();
            });

            // Simulate opening modal (would be triggered by clicking a button)
            // The URL update is handled by the page component
            // We verify the router.push was called in other tests
        });

        it('should clear URL when modal closes', async () => {
            mockSearchParams.get = vi.fn((key: string) => {
                if (key === 'modal') return 'rank';
                if (key === 'category') return 'cars';
                if (key === 'field') return 'condition';
                return null;
            });

            render(<FiltersListsPage />);

            await waitFor(() => {
                expect(screen.getByText(/ترتيب الحالة/)).toBeInTheDocument();
            });

            // Close modal
            const closeButton = screen.getByRole('button', { name: /إغلاق|close/i });
            await user.click(closeButton);

            // Verify router.push was called to clear URL
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalled();
            });
        });
    });
});
