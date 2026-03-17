/**
 * Unit Tests for EditModal - Hierarchical Lists
 * 
 * Task 13.3: Write unit tests for EditModal (hierarchical lists)
 * Requirements: 6.9, 6.10, 6.31, 6.35
 * 
 * Tests:
 * - Parent selector rendering and functionality
 * - Child option add with parent context
 * - Uniqueness validation within parent
 * - API payload includes parent context
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EditModal from '../EditModal';
import { Category, CategoryField } from '@/types/filters-lists';
import * as categoryFieldsService from '@/services/categoryFields';
import * as governoratesService from '@/services/governorates';

// Mock the services
vi.mock('@/services/categoryFields');
vi.mock('@/services/governorates');

describe('EditModal - Hierarchical Lists', () => {
    const mockCategory: Category = {
        id: 1,
        slug: 'cars',
        name: 'سيارات',
        icon: 'car.png',
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
        id: 1,
        category_slug: 'cars',
        field_name: 'governorate',
        display_name: 'المحافظة',
        type: 'select',
        required: false,
        filterable: true,
        options: ['القاهرة', 'الجيزة', 'الإسكندرية', 'غير ذلك'],
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
                { id: 4, name: 'غير ذلك', governorate_id: 1 },
            ],
        },
        {
            id: 2,
            name: 'الجيزة',
            cities: [
                { id: 5, name: 'الدقي', governorate_id: 2 },
                { id: 6, name: 'المهندسين', governorate_id: 2 },
                { id: 7, name: 'غير ذلك', governorate_id: 2 },
            ],
        },
        {
            id: 3,
            name: 'الإسكندرية',
            cities: [
                { id: 8, name: 'المنتزه', governorate_id: 3 },
                { id: 9, name: 'غير ذلك', governorate_id: 3 },
            ],
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock fetchCategoryFields
        vi.mocked(categoryFieldsService.fetchCategoryFields).mockResolvedValue({
            data: [mockGovernorateField, mockCityField],
            governorates: mockGovernorates,
            makes: [],
            supports_make_model: false,
            supports_sections: false,
            main_sections: [],
        });

        // Mock fetchGovernorates
        vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue(mockGovernorates);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    /**
     * Test: Parent selector rendering
     * Requirement 6.9: Render parent selector before options list
     */
    it('should render parent selector for hierarchical child field', async () => {
        render(
            <EditModal
                isOpen={true}
                onClose={vi.fn()}
                category={mockCategory}
                field={mockCityField}
            />
        );

        // Wait for data to load
        await waitFor(() => {
            expect(screen.queryByText(/جاري التحميل/i)).not.toBeInTheDocument();
        });

        // Check that parent selector is rendered
        expect(screen.getByText(/اختر المحافظة/i)).toBeInTheDocument();

        // Check that governorates are loaded
        expect(governoratesService.fetchGovernorates).toHaveBeenCalled();
    });


    /**
     * Test: Parent selector functionality
     * Requirement 6.10: Fetch parent options and allow selection
     */
    it('should load and display parent options in selector', async () => {
        render(
            <EditModal
                isOpen={true}
                onClose={vi.fn()}
                category={mockCategory}
                field={mockCityField}
            />
        );

        // Wait for data to load
        await waitFor(() => {
            expect(screen.queryByText(/جاري التحميل/i)).not.toBeInTheDocument();
        });

        // Find and click the parent selector dropdown
        const dropdown = screen.getByRole('button', { name: /القاهرة|اختر/i });
        fireEvent.click(dropdown);

        // Check that all governorates are displayed
        await waitFor(() => {
            expect(screen.getByText('القاهرة')).toBeInTheDocument();
            expect(screen.getByText('الجيزة')).toBeInTheDocument();
            expect(screen.getByText('الإسكندرية')).toBeInTheDocument();
        });
    });

    /**
     * Test: Child options load when parent selected
     * Requirement 6.10: Load child options based on selected parent
     */
    it('should load child options when parent is selected', async () => {
        render(
            <EditModal
                isOpen={true}
                onClose={vi.fn()}
                category={mockCategory}
                field={mockCityField}
            />
        );

        // Wait for initial load (القاهرة should be selected by default)
        await waitFor(() => {
            expect(screen.queryByText(/جاري التحميل/i)).not.toBeInTheDocument();
        });

        // Check that Cairo's cities are displayed
        await waitFor(() => {
            expect(screen.getByText('مدينة نصر')).toBeInTheDocument();
            expect(screen.getByText('المعادي')).toBeInTheDocument();
            expect(screen.getByText('مصر الجديدة')).toBeInTheDocument();
        });

        // Change to الجيزة
        const dropdown = screen.getByRole('button', { name: /القاهرة/i });
        fireEvent.click(dropdown);

        const gizaOption = screen.getByText('الجيزة');
        fireEvent.click(gizaOption);

        // Check that Giza's cities are now displayed
        await waitFor(() => {
            expect(screen.getByText('الدقي')).toBeInTheDocument();
            expect(screen.getByText('المهندسين')).toBeInTheDocument();
            // Cairo cities should no longer be visible
            expect(screen.queryByText('مدينة نصر')).not.toBeInTheDocument();
        });
    });

    /**
     * Test: Modal header shows parent context
     * Requirement 6.11: Display parent context in modal header
     */
    it('should display parent context in modal header', async () => {
        render(
            <EditModal
                isOpen={true}
                onClose={vi.fn()}
                category={mockCategory}
                field={mockCityField}
                parent="القاهرة"
            />
        );

        // Wait for data to load
        await waitFor(() => {
            expect(screen.queryByText(/جاري التحميل/i)).not.toBeInTheDocument();
        });

        // Check that header includes parent context
        expect(screen.getByText(/تعديل المدينة - القاهرة/i)).toBeInTheDocument();
    });

    /**
     * Test: Add child option with parent context
     * Requirement 6.31: Add child option at rank 1 within parent context
     */
    it('should add child option within selected parent context', async () => {
        render(
            <EditModal
                isOpen={true}
                onClose={vi.fn()}
                category={mockCategory}
                field={mockCityField}
            />
        );

        // Wait for data to load
        await waitFor(() => {
            expect(screen.queryByText(/جاري التحميل/i)).not.toBeInTheDocument();
        });

        // Find the single option add input
        const input = screen.getByPlaceholderText(/اكتب اسم الخيار الجديد/i);
        // Get all buttons with "إضافة" and select the second one (single add button)
        const addButtons = screen.getAllByRole('button', { name: /إضافة/i });
        const addButton = addButtons[addButtons.length - 1]; // Last one is the single add button

        // Add a new city
        fireEvent.change(input, { target: { value: 'الزمالك' } });
        fireEvent.click(addButton);

        // Check that success message includes parent context
        await waitFor(() => {
            expect(screen.getByText(/تمت إضافة "الزمالك" في القاهرة بنجاح/i)).toBeInTheDocument();
        });

        // Check that new option appears in the list
        expect(screen.getByText('الزمالك')).toBeInTheDocument();
    });

    /**
     * Test: Uniqueness validation within parent context
     * Requirement 6.35: Validate child option uniqueness within parent context
     */
    it('should validate uniqueness within parent context', async () => {
        render(
            <EditModal
                isOpen={true}
                onClose={vi.fn()}
                category={mockCategory}
                field={mockCityField}
            />
        );

        // Wait for data to load
        await waitFor(() => {
            expect(screen.queryByText(/جاري التحميل/i)).not.toBeInTheDocument();
        });

        // Try to add a duplicate city name (مدينة نصر already exists in القاهرة)
        const input = screen.getByPlaceholderText(/اكتب اسم الخيار الجديد/i);
        const addButtons = screen.getAllByRole('button', { name: /إضافة/i });
        const addButton = addButtons[addButtons.length - 1];

        fireEvent.change(input, { target: { value: 'مدينة نصر' } });
        fireEvent.click(addButton);

        // Check that error message is displayed
        await waitFor(() => {
            expect(screen.getByText(/الاسم موجود بالفعل/i)).toBeInTheDocument();
        });

        // Option should not be added again
        const cityElements = screen.getAllByText('مدينة نصر');
        expect(cityElements).toHaveLength(1); // Only the original one
    });

    /**
     * Test: Different parents have independent option lists
     * Requirement 6.35: Child options are unique within their parent context
     */
    it('should allow same option name in different parent contexts', async () => {
        render(
            <EditModal
                isOpen={true}
                onClose={vi.fn()}
                category={mockCategory}
                field={mockCityField}
            />
        );

        // Wait for القاهرة to load
        await waitFor(() => {
            expect(screen.queryByText(/جاري التحميل/i)).not.toBeInTheDocument();
        });

        // Add "الزمالك" to القاهرة
        const input = screen.getByPlaceholderText(/اكتب اسم الخيار الجديد/i);
        const addButtons = screen.getAllByRole('button', { name: /إضافة/i });
        const addButton = addButtons[addButtons.length - 1];

        fireEvent.change(input, { target: { value: 'الزمالك' } });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByText(/تمت إضافة "الزمالك"/i)).toBeInTheDocument();
        });

        // Switch to الجيزة
        const dropdown = screen.getByRole('button', { name: /القاهرة/i });
        fireEvent.click(dropdown);

        const gizaOption = screen.getByText('الجيزة');
        fireEvent.click(gizaOption);

        // Wait for الجيزة cities to load
        await waitFor(() => {
            expect(screen.getByText('الدقي')).toBeInTheDocument();
        });

        // Add "الزمالك" to الجيزة (should be allowed since it's a different parent)
        const input2 = screen.getByPlaceholderText(/اكتب اسم الخيار الجديد/i);
        const addButtons2 = screen.getAllByRole('button', { name: /إضافة/i });
        const addButton2 = addButtons2[addButtons2.length - 1];

        fireEvent.change(input2, { target: { value: 'الزمالك' } });
        fireEvent.click(addButton2);

        // Should succeed since it's in a different parent context
        await waitFor(() => {
            expect(screen.getByText(/تمت إضافة "الزمالك" في الجيزة بنجاح/i)).toBeInTheDocument();
        });
    });

    /**
     * Test: Parent field (governorate) editing works as independent list
     * Requirement 6.9: Parent fields should work like independent lists
     */
    it('should handle parent field editing as independent list', async () => {
        render(
            <EditModal
                isOpen={true}
                onClose={vi.fn()}
                category={mockCategory}
                field={mockGovernorateField}
            />
        );

        // Wait for data to load
        await waitFor(() => {
            expect(screen.queryByText(/جاري التحميل/i)).not.toBeInTheDocument();
        });

        // Should NOT show parent selector (this IS the parent field)
        expect(screen.queryByText(/اختر المحافظة/i)).not.toBeInTheDocument();

        // Should show "قائمة هرمية (رئيسية)" label
        expect(screen.getByText(/قائمة هرمية \(رئيسية\)/i)).toBeInTheDocument();

        // Should display all governorates
        expect(screen.getByText('القاهرة')).toBeInTheDocument();
        expect(screen.getByText('الجيزة')).toBeInTheDocument();
        expect(screen.getByText('الإسكندرية')).toBeInTheDocument();

        // Should be able to add new governorate
        const input = screen.getByPlaceholderText(/اكتب اسم الخيار الجديد/i);
        const addButtons = screen.getAllByRole('button', { name: /إضافة/i });
        const addButton = addButtons[addButtons.length - 1];

        fireEvent.change(input, { target: { value: 'الأقصر' } });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByText(/تمت إضافة "الأقصر" بنجاح/i)).toBeInTheDocument();
        });

        expect(screen.getByText('الأقصر')).toBeInTheDocument();
    });

    /**
     * Test: Require parent selection before adding child option
     * Requirement 6.10: Require parent selection first when adding child option
     */
    it('should require parent selection before adding child option', async () => {
        // Mock to return empty parent options initially
        vi.mocked(governoratesService.fetchGovernorates).mockResolvedValue([]);

        render(
            <EditModal
                isOpen={true}
                onClose={vi.fn()}
                category={mockCategory}
                field={mockCityField}
            />
        );

        // Wait for data to load
        await waitFor(() => {
            expect(screen.queryByText(/جاري التحميل/i)).not.toBeInTheDocument();
        });

        // Should show message to select parent first
        expect(screen.getByText(/يرجى اختيار فئة رئيسية أولاً/i)).toBeInTheDocument();

        // Add button should not be visible or functional
        expect(screen.queryByPlaceholderText(/اكتب اسم الخيار الجديد/i)).not.toBeInTheDocument();
    });
});
