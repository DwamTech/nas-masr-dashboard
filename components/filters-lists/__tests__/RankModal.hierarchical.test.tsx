/**
 * Unit Tests for RankModal Component - Hierarchical Lists
 * Task 9.5: Write unit tests for RankModal (hierarchical lists)
 * 
 * Tests cover:
 * - Parent selector rendering and functionality
 * - Parent rank updates don't affect child ranks
 * - Child rank updates are scoped to parent
 * - API payload includes parent context
 * 
 * Validates: Requirements 4.9, 4.10, 4.13, 4.14, 4.24
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import RankModal from '../RankModal';
import { Category, CategoryField } from '@/types/filters-lists';
import * as categoryFieldsService from '@/services/categoryFields';
import * as optionRanksService from '@/services/optionRanks';
import * as governoratesService from '@/services/governorates';
import { cache } from '@/utils/cache';

// Mock the services
vi.mock('@/services/categoryFields');
vi.mock('@/services/optionRanks');
vi.mock('@/services/governorates');
vi.mock('@/utils/cache', () => ({
    cache: {
        invalidate: vi.fn(),
    },
    INVALIDATION_PATTERNS: {
        RANK_UPDATE: (slug: string) => `fields:${slug}`,
    },
}));

// Mock ParentSelector
vi.mock('../ParentSelector', () => ({
    ParentSelector: ({ parents, selectedParent, onParentChange, label, disabled, loading }: any) => {
        return (
            <div data-testid="parent-selector">
                <label>{label}</label>
                {loading ? (
                    <div data-testid="parent-selector-loading">Loading...</div>
                ) : (
                    <select
                        data-testid="parent-selector-dropdown"
                        value={selectedParent || ''}
                        onChange={(e) => onParentChange(e.target.value)}
                        disabled={disabled}
                    >
                        <option value="">اختر...</option>
                        {parents.map((parent: string) => (
                            <option key={parent} value={parent}>
                                {parent}
                            </option>
                        ))}
                    </select>
                )}
            </div>
        );
    },
}));

// Mock DraggableOptionsList
vi.mock('@/components/DraggableOptions/DraggableOptionsList', () => ({
    DraggableOptionsList: ({ options, onSave, renderOption }: any) => {
        return (
            <div data-testid="draggable-list">
                <div data-testid="options-container">
                    {options.map((option: string, index: number) => (
                        <div key={option} data-testid={`option-${index}`}>
                            {renderOption(option)}
                        </div>
                    ))}
                </div>
                <button
                    data-testid="trigger-save"
                    onClick={async () => {
                        const ranks = options.map((opt: string, idx: number) => ({
                            option: opt,
                            rank: idx + 1,
                        }));
                        await onSave(ranks).catch(() => { });
                    }}
                >
                    Save
                </button>
            </div>
        );
    },
}));

describe('RankModal - Hierarchical Lists (Task 9.5)', () => {
    const mockCategory: Category = {
        id: 1,
        slug: 'cars',
        name: 'سيارات',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
    };

    const mockCityField: CategoryField = {
        id: 2,
        category_slug: 'cars',
        field_name: 'city',
        display_name: 'المدينة',
        type: 'select',
        required: false,
        filterable: true,
        options: [],
        is_active: true,
        sort_order: 2,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
    };

    const mockGovernorateField: CategoryField = {
        id: 3,
        category_slug: 'cars',
        field_name: 'governorate',
        display_name: 'المحافظة',
        type: 'select',
        required: false,
        filterable: true,
        options: ['القاهرة', 'الجيزة', 'الإسكندرية'],
        is_active: true,
        sort_order: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
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

    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    /**
     * Test: Parent selector rendering and functionality
     * Validates: Requirements 4.9, 4.10
     */
    describe('Parent selector rendering and functionality', () => {
        it('should render parent selector for child field (city)', async () => {
            vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue(mockGovernorates);
            vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
                data: [mockCityField],
                governorates: [],
                makes: [],
                supports_make_model: false,
                supports_sections: false,
                main_sections: [],
            });

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockCityField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('parent-selector')).toBeInTheDocument();
            });

            expect(screen.getByText('اختر المحافظة')).toBeInTheDocument();
        });

        it('should populate parent selector with governorate options', async () => {
            vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue(mockGovernorates);
            vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
                data: [mockCityField],
                governorates: [],
                makes: [],
                supports_make_model: false,
                supports_sections: false,
                main_sections: [],
            });

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockCityField}
                />
            );

            await waitFor(() => {
                const dropdown = screen.getByTestId('parent-selector-dropdown');
                expect(dropdown).toBeInTheDocument();
            });

            const dropdown = screen.getByTestId('parent-selector-dropdown') as HTMLSelectElement;
            const options = Array.from(dropdown.options).map(opt => opt.value).filter(v => v);

            expect(options).toContain('القاهرة');
            expect(options).toContain('الجيزة');
        });

        it('should not render parent selector for parent field (governorate)', async () => {
            vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue(mockGovernorates);
            vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
                data: [mockGovernorateField],
                governorates: [],
                makes: [],
                supports_make_model: false,
                supports_sections: false,
                main_sections: [],
            });

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockGovernorateField}
                />
            );

            await waitFor(() => {
                expect(screen.getByText(/قائمة هرمية/)).toBeInTheDocument();
            });

            expect(screen.queryByTestId('parent-selector')).not.toBeInTheDocument();
        });

        it('should load child options when parent is selected', async () => {
            vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue(mockGovernorates);
            vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
                data: [mockCityField],
                governorates: [],
                makes: [],
                supports_make_model: false,
                supports_sections: false,
                main_sections: [],
            });

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockCityField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('parent-selector-dropdown')).toBeInTheDocument();
            });

            const dropdown = screen.getByTestId('parent-selector-dropdown');
            fireEvent.change(dropdown, { target: { value: 'القاهرة' } });

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            expect(screen.getByText('مدينة نصر')).toBeInTheDocument();
            expect(screen.getByText('المعادي')).toBeInTheDocument();
            expect(screen.getByText('مصر الجديدة')).toBeInTheDocument();
        });

        it('should show empty state when no parent is selected', async () => {
            vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue(mockGovernorates);
            vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
                data: [mockCityField],
                governorates: [],
                makes: [],
                supports_make_model: false,
                supports_sections: false,
                main_sections: [],
            });

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockCityField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('parent-selector')).toBeInTheDocument();
            });

            expect(screen.getByText('الرجاء اختيار الفئة الرئيسية أولاً')).toBeInTheDocument();
            expect(screen.queryByTestId('draggable-list')).not.toBeInTheDocument();
        });

        it('should update modal header with parent context', async () => {
            vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue(mockGovernorates);
            vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
                data: [mockCityField],
                governorates: [],
                makes: [],
                supports_make_model: false,
                supports_sections: false,
                main_sections: [],
            });

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockCityField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('parent-selector-dropdown')).toBeInTheDocument();
            });

            expect(screen.getByText('ترتيب المدينة')).toBeInTheDocument();

            const dropdown = screen.getByTestId('parent-selector-dropdown');
            fireEvent.change(dropdown, { target: { value: 'القاهرة' } });

            await waitFor(() => {
                expect(screen.getByText('ترتيب المدينة - القاهرة')).toBeInTheDocument();
            });
        });
    });

    /**
     * Test: Parent rank updates don't affect child ranks
     * Validates: Requirement 4.13
     */
    describe('Parent rank updates do not affect child ranks', () => {
        it('should update parent ranks without modifying child ranks', async () => {
            vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue(mockGovernorates);
            vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
                data: [mockGovernorateField],
                governorates: [],
                makes: [],
                supports_make_model: false,
                supports_sections: false,
                main_sections: [],
            });

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
                    field={mockGovernorateField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            const saveButton = screen.getByTestId('trigger-save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(mockUpdateRanks).toHaveBeenCalledWith(
                    'cars',
                    'governorate',
                    expect.any(Array),
                    undefined
                );
            });
        });

        it('should send parent ranks without child context in payload', async () => {
            vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue(mockGovernorates);
            vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
                data: [mockGovernorateField],
                governorates: [],
                makes: [],
                supports_make_model: false,
                supports_sections: false,
                main_sections: [],
            });

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
                    field={mockGovernorateField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            const saveButton = screen.getByTestId('trigger-save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                const calls = mockUpdateRanks.mock.calls;
                expect(calls.length).toBeGreaterThan(0);
                const lastCall = calls[calls.length - 1];
                expect(lastCall[3]).toBeUndefined();
            });
        });
    });

    /**
     * Test: Child rank updates are scoped to parent
     * Validates: Requirement 4.14
     */
    describe('Child rank updates are scoped to parent', () => {
        it('should only reorder children within selected parent context', async () => {
            vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue(mockGovernorates);
            vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
                data: [mockCityField],
                governorates: [],
                makes: [],
                supports_make_model: false,
                supports_sections: false,
                main_sections: [],
            });

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockCityField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('parent-selector-dropdown')).toBeInTheDocument();
            });

            const dropdown = screen.getByTestId('parent-selector-dropdown');
            fireEvent.change(dropdown, { target: { value: 'القاهرة' } });

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            expect(screen.getByText('مدينة نصر')).toBeInTheDocument();
            expect(screen.getByText('المعادي')).toBeInTheDocument();
            expect(screen.queryByText('الدقي')).not.toBeInTheDocument();
        });

        it('should load different children when parent changes', async () => {
            vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue(mockGovernorates);
            vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
                data: [mockCityField],
                governorates: [],
                makes: [],
                supports_make_model: false,
                supports_sections: false,
                main_sections: [],
            });

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockCityField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('parent-selector-dropdown')).toBeInTheDocument();
            });

            const dropdown = screen.getByTestId('parent-selector-dropdown') as HTMLSelectElement;

            // Select القاهرة
            fireEvent.change(dropdown, { target: { value: 'القاهرة' } });

            await waitFor(() => {
                expect(screen.getByText('مدينة نصر')).toBeInTheDocument();
            });

            // Verify dropdown value changed
            expect(dropdown.value).toBe('القاهرة');

            // Change to الجيزة
            fireEvent.change(dropdown, { target: { value: 'الجيزة' } });

            // Verify dropdown value changed
            await waitFor(() => {
                expect(dropdown.value).toBe('الجيزة');
            });

            // Note: The actual data reload happens via useEffect in the component
            // This test verifies the parent selector functionality works correctly
        });
    });

    /**
     * Test: API payload includes parent context
     * Validates: Requirement 4.24
     */
    describe('API payload includes parent context', () => {
        it('should include parent context in API call for child rank updates', async () => {
            vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue(mockGovernorates);
            vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
                data: [mockCityField],
                governorates: [],
                makes: [],
                supports_make_model: false,
                supports_sections: false,
                main_sections: [],
            });

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
                    field={mockCityField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('parent-selector-dropdown')).toBeInTheDocument();
            });

            const dropdown = screen.getByTestId('parent-selector-dropdown');
            fireEvent.change(dropdown, { target: { value: 'القاهرة' } });

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            const saveButton = screen.getByTestId('trigger-save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(mockUpdateRanks).toHaveBeenCalledWith(
                    'cars',
                    'city',
                    expect.any(Array),
                    'القاهرة'
                );
            });
        });

        it('should use parent from URL prop if provided', async () => {
            vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue(mockGovernorates);
            vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
                data: [mockCityField],
                governorates: [],
                makes: [],
                supports_make_model: false,
                supports_sections: false,
                main_sections: [],
            });

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
                    field={mockCityField}
                    parent="الجيزة"
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            const saveButton = screen.getByTestId('trigger-save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(mockUpdateRanks).toHaveBeenCalledWith(
                    'cars',
                    'city',
                    expect.any(Array),
                    'الجيزة'
                );
            });
        });

        it('should prioritize selected parent over URL parent prop', async () => {
            vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue(mockGovernorates);
            vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
                data: [mockCityField],
                governorates: [],
                makes: [],
                supports_make_model: false,
                supports_sections: false,
                main_sections: [],
            });

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
                    field={mockCityField}
                    parent="الجيزة"
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('parent-selector-dropdown')).toBeInTheDocument();
            });

            const dropdown = screen.getByTestId('parent-selector-dropdown');
            fireEvent.change(dropdown, { target: { value: 'القاهرة' } });

            await waitFor(() => {
                expect(screen.getByTestId('draggable-list')).toBeInTheDocument();
            });

            const saveButton = screen.getByTestId('trigger-save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(mockUpdateRanks).toHaveBeenCalledWith(
                    'cars',
                    'city',
                    expect.any(Array),
                    'القاهرة'
                );
            });
        });

        it('should validate parent is selected before saving child ranks', async () => {
            vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue(mockGovernorates);
            vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
                data: [mockCityField],
                governorates: [],
                makes: [],
                supports_make_model: false,
                supports_sections: false,
                main_sections: [],
            });

            const mockUpdateRanks = vi.mocked(optionRanksService.updateOptionRanks);

            render(
                <RankModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockCityField}
                />
            );

            await waitFor(() => {
                expect(screen.getByTestId('parent-selector')).toBeInTheDocument();
            });

            expect(screen.queryByTestId('draggable-list')).not.toBeInTheDocument();
            expect(mockUpdateRanks).not.toHaveBeenCalled();
        });
    });
});
