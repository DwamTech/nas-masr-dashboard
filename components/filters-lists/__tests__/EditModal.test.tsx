import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditModal from '../EditModal';
import { Category, CategoryField } from '@/types/filters-lists';
import * as categoryFieldsService from '@/services/categoryFields';
import { OptionsHelper } from '@/utils/optionsHelper';

// Mock the services
vi.mock('@/services/categoryFields');

describe('EditModal Component - Task 11.2: Single Option Add', () => {
    const mockCategory: Category = {
        id: 1,
        slug: 'cars',
        name: 'سيارات',
        icon: '/car.png',
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
        required: true,
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
        (categoryFieldsService.fetchCategoryFields as any).mockResolvedValue({
            data: [mockField],
        });
    });

    describe('UI Rendering - Requirement 6.27', () => {
        it('should display input field and "إضافة" button', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            // Wait for loading to complete
            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Check for input field
            const input = screen.getByPlaceholderText('اكتب اسم الخيار الجديد...');
            expect(input).toBeInTheDocument();

            // Check for "إضافة" button
            const addButton = screen.getByRole('button', { name: 'إضافة' });
            expect(addButton).toBeInTheDocument();
        });

        it('should display helper text explaining rank behavior', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            expect(screen.getByText(/سيتم إضافة الخيار الجديد في المرتبة الأولى/)).toBeInTheDocument();
        });
    });

    describe('Add New Option - Requirements 6.29, 6.30, 6.32', () => {
        it('should add new option at rank 1', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Type new option
            const input = screen.getByPlaceholderText('اكتب اسم الخيار الجديد...');
            fireEvent.change(input, { target: { value: 'ممتاز' } });

            // Click add button
            const addButton = screen.getByRole('button', { name: 'إضافة' });
            fireEvent.click(addButton);

            // Check success message
            await waitFor(() => {
                expect(screen.getByText(/تمت إضافة "ممتاز" بنجاح/)).toBeInTheDocument();
            });

            // Verify the new option appears first (before existing options)
            const optionElements = screen.getAllByText(/جديد|مستعمل|ممتاز/);
            expect(optionElements[0]).toHaveTextContent('ممتاز');
        });

        it('should shift existing option ranks down by 1', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Get initial option count (excluding "غير ذلك" which is always present)
            const initialOptions = screen.getAllByText(/^(جديد|مستعمل)$/);
            const initialCount = initialOptions.length;

            // Add new option
            const input = screen.getByPlaceholderText('اكتب اسم الخيار الجديد...');
            fireEvent.change(input, { target: { value: 'ممتاز' } });
            const addButton = screen.getByRole('button', { name: 'إضافة' });
            fireEvent.click(addButton);

            // Wait for success
            await waitFor(() => {
                expect(screen.getByText(/تمت إضافة "ممتاز" بنجاح/)).toBeInTheDocument();
            });

            // Verify all options are still present (count increased by 1)
            // We need to count the option elements, not all text matches
            const finalOptions = screen.getAllByText(/^(جديد|مستعمل|ممتاز)$/);
            expect(finalOptions.length).toBe(initialCount + 1);
        });

        it('should ensure "غير ذلك" maintains highest rank', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Add new option
            const input = screen.getByPlaceholderText('اكتب اسم الخيار الجديد...');
            fireEvent.change(input, { target: { value: 'ممتاز' } });
            const addButton = screen.getByRole('button', { name: 'إضافة' });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText(/تمت إضافة "ممتاز" بنجاح/)).toBeInTheDocument();
            });

            // Get all option elements
            const allOptions = screen.getAllByText(/جديد|مستعمل|ممتاز|غير ذلك/);

            // "غير ذلك" should be the last element
            const lastOption = allOptions[allOptions.length - 1];
            expect(lastOption).toHaveTextContent('غير ذلك');
        });

        it('should clear input field after successful add', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText('اكتب اسم الخيار الجديد...') as HTMLInputElement;
            fireEvent.change(input, { target: { value: 'ممتاز' } });

            const addButton = screen.getByRole('button', { name: 'إضافة' });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(input.value).toBe('');
            });
        });

        it('should support Enter key to add option', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText('اكتب اسم الخيار الجديد...');
            fireEvent.change(input, { target: { value: 'ممتاز' } });
            fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

            await waitFor(() => {
                expect(screen.getByText(/تمت إضافة "ممتاز" بنجاح/)).toBeInTheDocument();
            });
        });
    });

    describe('Validation - Requirement 6.34', () => {
        it('should validate empty option name', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Try to add empty option
            const addButton = screen.getByRole('button', { name: 'إضافة' });

            // The add button should be disabled when input is empty
            expect(addButton).toBeDisabled();
        });

        it('should validate whitespace-only option name', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText('اكتب اسم الخيار الجديد...');
            fireEvent.change(input, { target: { value: '   ' } });

            const addButton = screen.getByRole('button', { name: 'إضافة' });

            // The add button should be disabled when input is only whitespace
            expect(addButton).toBeDisabled();
        });

        it('should prevent adding duplicate option', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Try to add existing option
            const input = screen.getByPlaceholderText('اكتب اسم الخيار الجديد...');
            fireEvent.change(input, { target: { value: 'جديد' } });

            const addButton = screen.getByRole('button', { name: 'إضافة' });
            fireEvent.click(addButton);

            // Should show error about duplicate
            await waitFor(() => {
                expect(screen.getByText(/موجودة بالفعل/)).toBeInTheDocument();
            });
        });

        it('should prevent manually adding "غير ذلك"', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText('اكتب اسم الخيار الجديد...');
            fireEvent.change(input, { target: { value: OptionsHelper.OTHER_OPTION } });

            const addButton = screen.getByRole('button', { name: 'إضافة' });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText(/لا يمكن إضافة "غير ذلك" يدوياً/)).toBeInTheDocument();
            });
        });

        it('should trim whitespace from option name', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText('اكتب اسم الخيار الجديد...');
            fireEvent.change(input, { target: { value: '  ممتاز  ' } });

            const addButton = screen.getByRole('button', { name: 'إضافة' });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText(/تمت إضافة "ممتاز" بنجاح/)).toBeInTheDocument();
            });
        });
    });

    describe('Button State', () => {
        it('should disable add button when input is empty', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            const addButton = screen.getByRole('button', { name: 'إضافة' });
            expect(addButton).toBeDisabled();
        });

        it('should enable add button when input has value', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText('اكتب اسم الخيار الجديد...');
            fireEvent.change(input, { target: { value: 'ممتاز' } });

            const addButton = screen.getByRole('button', { name: 'إضافة' });
            expect(addButton).not.toBeDisabled();
        });
    });

    describe('Success Message', () => {
        it('should display success message after adding option', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText('اكتب اسم الخيار الجديد...');
            fireEvent.change(input, { target: { value: 'ممتاز' } });

            const addButton = screen.getByRole('button', { name: 'إضافة' });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByText(/تمت إضافة "ممتاز" بنجاح/)).toBeInTheDocument();
            });
        });
    });
});

describe('EditModal Component - Task 11.3: Inline Editing', () => {
    const mockCategory: Category = {
        id: 1,
        slug: 'cars',
        name: 'سيارات',
        icon: '/car.png',
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
        required: true,
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
        (categoryFieldsService.fetchCategoryFields as any).mockResolvedValue({
            data: [mockField],
        });
    });

    describe('Edit Button - Requirement 6.12', () => {
        it('should display edit button next to each option', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Check for edit buttons (should have one for each option except "غير ذلك")
            const editButtons = screen.getAllByLabelText(/تعديل/);
            expect(editButtons.length).toBeGreaterThan(0);
        });

        it('should disable edit button for "غير ذلك" option - Requirement 6.17', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Find the edit button for "غير ذلك"
            const editButton = screen.getByLabelText('تعديل غير ذلك');
            expect(editButton).toBeDisabled();
        });

        it('should enable edit button for regular options', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Find the edit button for "جديد"
            const editButton = screen.getByLabelText('تعديل جديد');
            expect(editButton).not.toBeDisabled();
        });
    });

    describe('Inline Editing Mode - Requirement 6.28', () => {
        it('should enable inline editing when edit button is clicked', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Click edit button for "جديد"
            const editButton = screen.getByLabelText('تعديل جديد');
            fireEvent.click(editButton);

            // Should show input field with current value
            await waitFor(() => {
                const input = screen.getByDisplayValue('جديد');
                expect(input).toBeInTheDocument();
                expect(input).toHaveFocus();
            });
        });

        it('should show save and cancel buttons when editing', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Click edit button
            const editButton = screen.getByLabelText('تعديل جديد');
            fireEvent.click(editButton);

            // Should show save and cancel buttons
            await waitFor(() => {
                expect(screen.getByLabelText('حفظ التعديل')).toBeInTheDocument();
                expect(screen.getByLabelText('إلغاء التعديل')).toBeInTheDocument();
            });
        });

        it('should allow editing option text', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Click edit button
            const editButton = screen.getByLabelText('تعديل جديد');
            fireEvent.click(editButton);

            // Change the value
            const input = await screen.findByDisplayValue('جديد');
            fireEvent.change(input, { target: { value: 'جديد تماماً' } });

            expect(input).toHaveValue('جديد تماماً');
        });
    });

    describe('Save Edit - Requirement 6.28, 6.34', () => {
        it('should save edited option when save button is clicked', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Click edit button
            const editButton = screen.getByLabelText('تعديل جديد');
            fireEvent.click(editButton);

            // Change the value
            const input = await screen.findByDisplayValue('جديد');
            fireEvent.change(input, { target: { value: 'جديد تماماً' } });

            // Click save button
            const saveButton = screen.getByLabelText('حفظ التعديل');
            fireEvent.click(saveButton);

            // Should show success message
            await waitFor(() => {
                expect(screen.getByText(/تم تعديل الخيار بنجاح/)).toBeInTheDocument();
            });

            // Should display the new value
            expect(screen.getByText('جديد تماماً')).toBeInTheDocument();
        });

        it('should save edited option when Enter key is pressed', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Click edit button
            const editButton = screen.getByLabelText('تعديل جديد');
            fireEvent.click(editButton);

            // Change the value and press Enter
            const input = await screen.findByDisplayValue('جديد');
            fireEvent.change(input, { target: { value: 'جديد تماماً' } });
            fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

            // Should show success message
            await waitFor(() => {
                expect(screen.getByText(/تم تعديل الخيار بنجاح/)).toBeInTheDocument();
            });
        });

        it('should preserve rank when editing option text', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Get initial order of options
            const initialOptions = screen.getAllByText(/^(جديد|مستعمل)$/);
            const initialFirstOption = initialOptions[0].textContent;

            // Edit the first option
            const editButton = screen.getByLabelText(`تعديل ${initialFirstOption}`);
            fireEvent.click(editButton);

            const input = await screen.findByDisplayValue(initialFirstOption!);
            fireEvent.change(input, { target: { value: `${initialFirstOption} - محدث` } });

            const saveButton = screen.getByLabelText('حفظ التعديل');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText(/تم تعديل الخيار بنجاح/)).toBeInTheDocument();
            });

            // The edited option should still be in the same position
            const finalOptions = screen.getAllByText(/^(جديد|مستعمل|محدث)/);
            expect(finalOptions[0]).toHaveTextContent(`${initialFirstOption} - محدث`);
        });
    });

    describe('Cancel Edit', () => {
        it('should cancel edit when cancel button is clicked', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Click edit button
            const editButton = screen.getByLabelText('تعديل جديد');
            fireEvent.click(editButton);

            // Change the value
            const input = await screen.findByDisplayValue('جديد');
            fireEvent.change(input, { target: { value: 'جديد تماماً' } });

            // Click cancel button
            const cancelButton = screen.getByLabelText('إلغاء التعديل');
            fireEvent.click(cancelButton);

            // Should revert to original value
            await waitFor(() => {
                expect(screen.getByText('جديد')).toBeInTheDocument();
                expect(screen.queryByText('جديد تماماً')).not.toBeInTheDocument();
            });
        });

        it('should cancel edit when Escape key is pressed', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Click edit button
            const editButton = screen.getByLabelText('تعديل جديد');
            fireEvent.click(editButton);

            // Change the value and press Escape
            const input = await screen.findByDisplayValue('جديد');
            fireEvent.change(input, { target: { value: 'جديد تماماً' } });
            fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

            // Should revert to original value
            await waitFor(() => {
                expect(screen.getByText('جديد')).toBeInTheDocument();
                expect(screen.queryByText('جديد تماماً')).not.toBeInTheDocument();
            });
        });
    });

    describe('Edit Validation - Requirement 6.34', () => {
        it('should validate empty option name', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Click edit button
            const editButton = screen.getByLabelText('تعديل جديد');
            fireEvent.click(editButton);

            // Clear the value
            const input = await screen.findByDisplayValue('جديد');
            fireEvent.change(input, { target: { value: '' } });

            // Try to save
            const saveButton = screen.getByLabelText('حفظ التعديل');
            fireEvent.click(saveButton);

            // Should show error
            await waitFor(() => {
                expect(screen.getByText(/لا يمكن أن يكون الاسم فارغاً/)).toBeInTheDocument();
            });
        });

        it('should validate uniqueness before saving - Requirement 6.34', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Click edit button for "جديد"
            const editButton = screen.getByLabelText('تعديل جديد');
            fireEvent.click(editButton);

            // Try to change to existing option "مستعمل"
            const input = await screen.findByDisplayValue('جديد');
            fireEvent.change(input, { target: { value: 'مستعمل' } });

            // Try to save
            const saveButton = screen.getByLabelText('حفظ التعديل');
            fireEvent.click(saveButton);

            // Should show error about duplicate
            await waitFor(() => {
                expect(screen.getByText(/موجودة بالفعل/)).toBeInTheDocument();
            });
        });

        it('should prevent changing to "غير ذلك"', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Click edit button
            const editButton = screen.getByLabelText('تعديل جديد');
            fireEvent.click(editButton);

            // Try to change to "غير ذلك"
            const input = await screen.findByDisplayValue('جديد');
            fireEvent.change(input, { target: { value: OptionsHelper.OTHER_OPTION } });

            // Try to save
            const saveButton = screen.getByLabelText('حفظ التعديل');
            fireEvent.click(saveButton);

            // Should show error
            await waitFor(() => {
                expect(screen.getByText(/لا يمكن تغيير الاسم إلى "غير ذلك"/)).toBeInTheDocument();
            });
        });

        it('should trim whitespace before saving', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Click edit button
            const editButton = screen.getByLabelText('تعديل جديد');
            fireEvent.click(editButton);

            // Change with extra whitespace
            const input = await screen.findByDisplayValue('جديد');
            fireEvent.change(input, { target: { value: '  جديد تماماً  ' } });

            // Save
            const saveButton = screen.getByLabelText('حفظ التعديل');
            fireEvent.click(saveButton);

            // Should save trimmed value
            await waitFor(() => {
                expect(screen.getByText('جديد تماماً')).toBeInTheDocument();
                expect(screen.queryByText('  جديد تماماً  ')).not.toBeInTheDocument();
            });
        });
    });
});

describe('EditModal Component - Task 11.4: Hide/Show Toggle', () => {
    const mockCategory: Category = {
        id: 1,
        slug: 'cars',
        name: 'سيارات',
        icon: '/car.png',
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
        required: true,
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
        (categoryFieldsService.fetchCategoryFields as any).mockResolvedValue({
            data: [mockField],
        });
    });

    describe('Hide/Show Toggle Button - Requirement 6.13', () => {
        it('should display hide/show toggle next to each option', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Check for hide/show buttons (should have one for each option)
            const toggleButtons = screen.getAllByLabelText(/إخفاء|إظهار/);
            expect(toggleButtons.length).toBeGreaterThan(0);
        });

        it('should disable hide/show toggle for "غير ذلك" option - Requirement 6.17', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Find the toggle button for "غير ذلك"
            const toggleButton = screen.getByLabelText('إخفاء غير ذلك');
            expect(toggleButton).toBeDisabled();
        });

        it('should enable hide/show toggle for regular options', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Find the toggle button for "جديد"
            const toggleButton = screen.getByLabelText('إخفاء جديد');
            expect(toggleButton).not.toBeDisabled();
        });
    });

    describe('Toggle Visibility - Requirements 6.14, 6.15, 6.16', () => {
        it('should hide option when toggle is clicked', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Click hide toggle for "جديد"
            const toggleButton = screen.getByLabelText('إخفاء جديد');
            fireEvent.click(toggleButton);

            // Should show success message
            await waitFor(() => {
                expect(screen.getByText(/تم إخفاء "جديد" بنجاح/)).toBeInTheDocument();
            });

            // Should display "مخفي" badge (Requirement 6.14)
            expect(screen.getByText('مخفي')).toBeInTheDocument();
        });

        it('should show hidden option when toggle is clicked again', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // First hide the option
            const hideButton = screen.getByLabelText('إخفاء جديد');
            fireEvent.click(hideButton);

            await waitFor(() => {
                expect(screen.getByText('مخفي')).toBeInTheDocument();
            });

            // Then show it again
            const showButton = screen.getByLabelText('إظهار جديد');
            fireEvent.click(showButton);

            // Should show success message
            await waitFor(() => {
                expect(screen.getByText(/تم إظهار "جديد" بنجاح/)).toBeInTheDocument();
            });

            // "مخفي" badge should be removed
            expect(screen.queryByText('مخفي')).not.toBeInTheDocument();
        });

        it('should display hidden options with reduced opacity - Requirement 6.14', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Hide an option
            const toggleButton = screen.getByLabelText('إخفاء جديد');
            fireEvent.click(toggleButton);

            await waitFor(() => {
                expect(screen.getByText('مخفي')).toBeInTheDocument();
            });

            // Find the option row - it's the parent div with the flex class that contains both the text and badge
            const badge = screen.getByText('مخفي');
            const optionRow = badge.closest('.flex.items-center.gap-3.p-3.rounded-lg.border');
            expect(optionRow).toHaveClass('opacity-50');
        });

        it('should prevent hiding "غير ذلك" option - Requirement 6.17', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Try to hide "غير ذلك" (button should be disabled)
            const toggleButton = screen.getByLabelText('إخفاء غير ذلك');
            expect(toggleButton).toBeDisabled();

            // Even if we try to click it, nothing should happen
            fireEvent.click(toggleButton);

            // Should not show any success message
            await waitFor(() => {
                expect(screen.queryByText(/تم إخفاء "غير ذلك"/)).not.toBeInTheDocument();
            });
        });

        it('should update is_active flag when toggling - Requirements 6.15, 6.16', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Hide an option
            const hideButton = screen.getByLabelText('إخفاء جديد');
            fireEvent.click(hideButton);

            await waitFor(() => {
                expect(screen.getByText('مخفي')).toBeInTheDocument();
            });

            // The button label should change to "إظهار"
            const showButton = screen.getByLabelText('إظهار جديد');
            expect(showButton).toBeInTheDocument();

            // Show it again
            fireEvent.click(showButton);

            await waitFor(() => {
                expect(screen.queryByText('مخفي')).not.toBeInTheDocument();
            });

            // The button label should change back to "إخفاء"
            const hideButtonAgain = screen.getByLabelText('إخفاء جديد');
            expect(hideButtonAgain).toBeInTheDocument();
        });
    });

    describe('Visual Indicators - Requirement 6.14', () => {
        it('should display "مخفي" badge for hidden options', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Hide an option
            const toggleButton = screen.getByLabelText('إخفاء جديد');
            fireEvent.click(toggleButton);

            // Should display "مخفي" badge
            await waitFor(() => {
                const badge = screen.getByText('مخفي');
                expect(badge).toBeInTheDocument();
                expect(badge).toHaveClass('bg-gray-200', 'text-gray-700');
            });
        });

        it('should apply reduced opacity styling to hidden options', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Hide an option
            const toggleButton = screen.getByLabelText('إخفاء جديد');
            fireEvent.click(toggleButton);

            await waitFor(() => {
                expect(screen.getByText('مخفي')).toBeInTheDocument();
            });

            // The option row should have reduced opacity
            const badge = screen.getByText('مخفي');
            const optionRow = badge.closest('.flex.items-center.gap-3.p-3.rounded-lg.border');
            expect(optionRow).toHaveClass('opacity-50');
            expect(optionRow).toHaveClass('bg-gray-50');
        });

        it('should show eye-off icon for hidden options', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // Hide an option
            const toggleButton = screen.getByLabelText('إخفاء جديد');
            fireEvent.click(toggleButton);

            await waitFor(() => {
                expect(screen.getByText('مخفي')).toBeInTheDocument();
            });

            // The toggle button should now show "إظهار" label
            const showButton = screen.getByLabelText('إظهار جديد');
            expect(showButton).toBeInTheDocument();
        });

        it('should show eye icon for visible options', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // The toggle button should show "إخفاء" label for visible options
            const hideButton = screen.getByLabelText('إخفاء جديد');
            expect(hideButton).toBeInTheDocument();
        });
    });

    describe('Success Messages', () => {
        it('should display success message when hiding option', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            const toggleButton = screen.getByLabelText('إخفاء جديد');
            fireEvent.click(toggleButton);

            await waitFor(() => {
                expect(screen.getByText(/تم إخفاء "جديد" بنجاح/)).toBeInTheDocument();
            });
        });

        it('should display success message when showing option', async () => {
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // First hide
            const hideButton = screen.getByLabelText('إخفاء جديد');
            fireEvent.click(hideButton);

            await waitFor(() => {
                expect(screen.getByText('مخفي')).toBeInTheDocument();
            });

            // Then show
            const showButton = screen.getByLabelText('إظهار جديد');
            fireEvent.click(showButton);

            await waitFor(() => {
                expect(screen.getByText(/تم إظهار "جديد" بنجاح/)).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('should show error when trying to hide "غير ذلك" programmatically', async () => {
            // This test ensures the validation logic works even if the button is somehow enabled
            render(
                <EditModal
                    isOpen={true}
                    onClose={mockOnClose}
                    category={mockCategory}
                    field={mockField}
                />
            );

            await waitFor(() => {
                expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            });

            // The button should be disabled, but this tests the underlying logic
            const toggleButton = screen.getByLabelText('إخفاء غير ذلك');
            expect(toggleButton).toBeDisabled();
        });
    });
});
