import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BulkAddTextarea from '../BulkAddTextarea';
import { OptionsHelper } from '@/utils/optionsHelper';

describe('BulkAddTextarea Component - Task 12.1, 12.2', () => {
    const mockOnAdd = vi.fn();
    const existingOptions = ['جديد', 'مستعمل', 'غير ذلك'];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('UI Rendering - Requirement 6.18, 6.19', () => {
        it('should display textarea for bulk input', () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            expect(textarea).toBeInTheDocument();
        });

        it('should display helper text explaining input formats', () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            expect(screen.getByText(/مفصولة بفواصل/)).toBeInTheDocument();
            expect(screen.getByText(/كل خيار في سطر جديد/)).toBeInTheDocument();
        });

        it('should display "إضافة الكل" button', () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const addButton = screen.getByRole('button', { name: /إضافة الكل/ });
            expect(addButton).toBeInTheDocument();
        });
    });

    describe('Comma-Separated Parsing - Requirement 6.18', () => {
        it('should parse comma-separated input', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            fireEvent.change(textarea, { target: { value: 'ممتاز, جيد جداً, جيد' } });

            // Wait for preview to appear
            await waitFor(() => {
                expect(screen.getByText(/معاينة \(3 خيار\)/)).toBeInTheDocument();
            });

            // Check preview shows all options
            expect(screen.getByText('ممتاز')).toBeInTheDocument();
            expect(screen.getByText('جيد جداً')).toBeInTheDocument();
            expect(screen.getByText('جيد')).toBeInTheDocument();
        });

        it('should trim whitespace from comma-separated options', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            fireEvent.change(textarea, { target: { value: '  ممتاز  ,  جيد جداً  ,  جيد  ' } });

            await waitFor(() => {
                expect(screen.getByText(/معاينة \(3 خيار\)/)).toBeInTheDocument();
            });

            // Options should be trimmed in preview
            expect(screen.getByText('ممتاز')).toBeInTheDocument();
            expect(screen.getByText('جيد جداً')).toBeInTheDocument();
            expect(screen.getByText('جيد')).toBeInTheDocument();
        });

        it('should filter out empty entries from comma-separated input', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            fireEvent.change(textarea, { target: { value: 'ممتاز, , جيد, , ' } });

            await waitFor(() => {
                expect(screen.getByText(/معاينة \(2 خيار\)/)).toBeInTheDocument();
            });

            // Only non-empty options should appear
            expect(screen.getByText('ممتاز')).toBeInTheDocument();
            expect(screen.getByText('جيد')).toBeInTheDocument();
        });
    });

    describe('Line-Separated Parsing - Requirement 6.19', () => {
        it('should parse line-separated input', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            fireEvent.change(textarea, { target: { value: 'ممتاز\nجيد جداً\nجيد' } });

            await waitFor(() => {
                expect(screen.getByText(/معاينة \(3 خيار\)/)).toBeInTheDocument();
            });

            expect(screen.getByText('ممتاز')).toBeInTheDocument();
            expect(screen.getByText('جيد جداً')).toBeInTheDocument();
            expect(screen.getByText('جيد')).toBeInTheDocument();
        });

        it('should trim whitespace from line-separated options', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            fireEvent.change(textarea, { target: { value: '  ممتاز  \n  جيد جداً  \n  جيد  ' } });

            await waitFor(() => {
                expect(screen.getByText(/معاينة \(3 خيار\)/)).toBeInTheDocument();
            });

            expect(screen.getByText('ممتاز')).toBeInTheDocument();
            expect(screen.getByText('جيد جداً')).toBeInTheDocument();
            expect(screen.getByText('جيد')).toBeInTheDocument();
        });

        it('should filter out empty lines from line-separated input', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            fireEvent.change(textarea, { target: { value: 'ممتاز\n\nجيد\n\n' } });

            await waitFor(() => {
                expect(screen.getByText(/معاينة \(2 خيار\)/)).toBeInTheDocument();
            });

            expect(screen.getByText('ممتاز')).toBeInTheDocument();
            expect(screen.getByText('جيد')).toBeInTheDocument();
        });
    });

    describe('Preview Display - Requirement 6.22', () => {
        it('should display preview of options to be added', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            fireEvent.change(textarea, { target: { value: 'ممتاز, جيد' } });

            await waitFor(() => {
                expect(screen.getByText(/معاينة \(2 خيار\)/)).toBeInTheDocument();
            });

            // Preview should show both options
            expect(screen.getByText('ممتاز')).toBeInTheDocument();
            expect(screen.getByText('جيد')).toBeInTheDocument();
        });

        it('should show option count in preview header', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            fireEvent.change(textarea, { target: { value: 'ممتاز, جيد, متوسط' } });

            await waitFor(() => {
                expect(screen.getByText(/معاينة \(3 خيار\)/)).toBeInTheDocument();
            });
        });

        it('should not show preview when input is empty', () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            expect(screen.queryByText(/معاينة/)).not.toBeInTheDocument();
        });

        it('should update preview when input changes', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);

            // First input
            fireEvent.change(textarea, { target: { value: 'ممتاز' } });
            await waitFor(() => {
                expect(screen.getByText(/معاينة \(1 خيار\)/)).toBeInTheDocument();
            });

            // Update input
            fireEvent.change(textarea, { target: { value: 'ممتاز, جيد' } });
            await waitFor(() => {
                expect(screen.getByText(/معاينة \(2 خيار\)/)).toBeInTheDocument();
            });
        });
    });

    describe('Validation - Requirement 6.21, 6.26', () => {
        it('should validate duplicate options', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            fireEvent.change(textarea, { target: { value: 'جديد, ممتاز' } });

            await waitFor(() => {
                expect(screen.getByText(/أخطاء في التحقق/)).toBeInTheDocument();
                expect(screen.getByText(/موجودة بالفعل/)).toBeInTheDocument();
            });
        });

        it('should show specific error messages for invalid options', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            fireEvent.change(textarea, { target: { value: 'جديد, مستعمل' } });

            await waitFor(() => {
                expect(screen.getByText(/أخطاء في التحقق/)).toBeInTheDocument();
            });
        });

        it('should disable add button when there are validation errors', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            fireEvent.change(textarea, { target: { value: 'جديد' } });

            await waitFor(() => {
                const addButton = screen.getByRole('button', { name: /إضافة الكل/ });
                expect(addButton).toBeDisabled();
            });
        });

        it('should enable add button when validation passes', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            fireEvent.change(textarea, { target: { value: 'ممتاز, جيد' } });

            await waitFor(() => {
                const addButton = screen.getByRole('button', { name: /إضافة الكل/ });
                expect(addButton).not.toBeDisabled();
            });
        });
    });

    describe('Bulk Add Functionality - Requirement 6.21, 6.23, 6.25', () => {
        it('should call onAdd with parsed options when button is clicked', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            fireEvent.change(textarea, { target: { value: 'ممتاز, جيد' } });

            await waitFor(() => {
                expect(screen.getByText(/معاينة \(2 خيار\)/)).toBeInTheDocument();
            });

            const addButton = screen.getByRole('button', { name: /إضافة الكل/ });
            fireEvent.click(addButton);

            expect(mockOnAdd).toHaveBeenCalledWith(['ممتاز', 'جيد']);
        });

        it('should clear input after successful add', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/) as HTMLTextAreaElement;
            fireEvent.change(textarea, { target: { value: 'ممتاز, جيد' } });

            await waitFor(() => {
                expect(screen.getByText(/معاينة \(2 خيار\)/)).toBeInTheDocument();
            });

            const addButton = screen.getByRole('button', { name: /إضافة الكل/ });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(textarea.value).toBe('');
            });
        });

        it('should clear preview after successful add', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            fireEvent.change(textarea, { target: { value: 'ممتاز, جيد' } });

            await waitFor(() => {
                expect(screen.getByText(/معاينة \(2 خيار\)/)).toBeInTheDocument();
            });

            const addButton = screen.getByRole('button', { name: /إضافة الكل/ });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.queryByText(/معاينة/)).not.toBeInTheDocument();
            });
        });

        it('should not call onAdd when there are validation errors', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            fireEvent.change(textarea, { target: { value: 'جديد' } });

            await waitFor(() => {
                expect(screen.getByText(/أخطاء في التحقق/)).toBeInTheDocument();
            });

            const addButton = screen.getByRole('button', { name: /إضافة الكل/ });
            // Button should be disabled, but try clicking anyway
            fireEvent.click(addButton);

            expect(mockOnAdd).not.toHaveBeenCalled();
        });

        it('should not call onAdd when input is empty', () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const addButton = screen.getByRole('button', { name: /إضافة الكل/ });
            fireEvent.click(addButton);

            expect(mockOnAdd).not.toHaveBeenCalled();
        });
    });

    describe('Clear Button', () => {
        it('should show clear button when input has value', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            fireEvent.change(textarea, { target: { value: 'ممتاز' } });

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /مسح/ })).toBeInTheDocument();
            });
        });

        it('should clear input when clear button is clicked', async () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/) as HTMLTextAreaElement;
            fireEvent.change(textarea, { target: { value: 'ممتاز' } });

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /مسح/ })).toBeInTheDocument();
            });

            const clearButton = screen.getByRole('button', { name: /مسح/ });
            fireEvent.click(clearButton);

            await waitFor(() => {
                expect(textarea.value).toBe('');
            });
        });
    });

    describe('Disabled State', () => {
        it('should disable textarea when disabled prop is true', () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                    disabled={true}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات مفصولة بفواصل/);
            expect(textarea).toBeDisabled();
        });

        it('should disable add button when disabled prop is true', () => {
            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                    disabled={true}
                />
            );

            const addButton = screen.getByRole('button', { name: /إضافة الكل/ });
            expect(addButton).toBeDisabled();
        });
    });
});
