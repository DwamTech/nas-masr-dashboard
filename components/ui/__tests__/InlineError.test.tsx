import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InlineError from '../InlineError';

/**
 * Unit tests for InlineError component
 * 
 * Tests:
 * - Single error message display
 * - Multiple error messages display
 * - Accessibility attributes
 * - Custom styling
 * - Empty state handling
 * 
 * Requirements: 11.4, 14.10
 */

describe('InlineError Component', () => {
    describe('Basic Rendering', () => {
        it('should render single error message', () => {
            render(<InlineError message="هذا الحقل مطلوب" />);

            expect(screen.getByText('هذا الحقل مطلوب')).toBeInTheDocument();
        });

        it('should render multiple error messages', () => {
            const messages = [
                'هذا الحقل مطلوب',
                'يجب أن يكون الحد الأدنى 3 أحرف',
            ];
            render(<InlineError message={messages} />);

            expect(screen.getByText('هذا الحقل مطلوب')).toBeInTheDocument();
            expect(screen.getByText('يجب أن يكون الحد الأدنى 3 أحرف')).toBeInTheDocument();
        });

        it('should have alert role', () => {
            render(<InlineError message="خطأ" />);

            const container = screen.getByRole('alert');
            expect(container).toBeInTheDocument();
        });

        it('should have aria-live="polite"', () => {
            const { container } = render(<InlineError message="خطأ" />);

            const alertElement = container.querySelector('[aria-live="polite"]');
            expect(alertElement).toBeInTheDocument();
        });

        it('should display error icon for each message', () => {
            const messages = ['خطأ 1', 'خطأ 2'];
            const { container } = render(<InlineError message={messages} />);

            const icons = container.querySelectorAll('svg');
            expect(icons).toHaveLength(2);
        });
    });

    describe('Empty State', () => {
        it('should not render when message is empty string', () => {
            const { container } = render(<InlineError message="" />);

            expect(container.firstChild).toBeNull();
        });

        it('should not render when message array is empty', () => {
            const { container } = render(<InlineError message={[]} />);

            expect(container.firstChild).toBeNull();
        });

        it('should not render when message array contains only empty strings', () => {
            const { container } = render(<InlineError message={['', '', '']} />);

            // Component filters out empty strings, so it should render nothing
            expect(container.firstChild).toBeNull();
        });
    });

    describe('Custom Styling', () => {
        it('should apply custom className', () => {
            const { container } = render(
                <InlineError message="خطأ" className="custom-inline-error" />
            );

            const errorContainer = container.querySelector('.custom-inline-error');
            expect(errorContainer).toBeInTheDocument();
        });

        it('should maintain default classes with custom className', () => {
            const { container } = render(
                <InlineError message="خطأ" className="custom-inline-error" />
            );

            const errorContainer = container.querySelector('.inline-error-container');
            expect(errorContainer).toBeInTheDocument();
            expect(errorContainer).toHaveClass('custom-inline-error');
        });
    });

    describe('ID Attribute', () => {
        it('should apply custom id when provided', () => {
            const { container } = render(
                <InlineError message="خطأ" id="field-error" />
            );

            const errorContainer = container.querySelector('#field-error');
            expect(errorContainer).toBeInTheDocument();
        });

        it('should be linkable via aria-describedby', () => {
            const { container } = render(
                <div>
                    <input aria-describedby="email-error" />
                    <InlineError message="البريد الإلكتروني غير صالح" id="email-error" />
                </div>
            );

            const input = container.querySelector('input');
            const errorContainer = container.querySelector('#email-error');

            expect(input?.getAttribute('aria-describedby')).toBe('email-error');
            expect(errorContainer).toBeInTheDocument();
        });
    });

    describe('Validation Error Messages', () => {
        it('should display required field error', () => {
            render(<InlineError message="هذا الحقل مطلوب" />);

            expect(screen.getByText('هذا الحقل مطلوب')).toBeInTheDocument();
        });

        it('should display duplicate name error', () => {
            render(<InlineError message="هذا الاسم موجود بالفعل. يرجى اختيار اسم مختلف." />);

            expect(screen.getByText('هذا الاسم موجود بالفعل. يرجى اختيار اسم مختلف.')).toBeInTheDocument();
        });

        it('should display empty field error', () => {
            render(<InlineError message="لا يمكن ترك الحقل فارغاً." />);

            expect(screen.getByText('لا يمكن ترك الحقل فارغاً.')).toBeInTheDocument();
        });

        it('should display "غير ذلك" protection error', () => {
            render(<InlineError message="لا يمكن تعديل أو إخفاء خيار 'غير ذلك'." />);

            expect(screen.getByText("لا يمكن تعديل أو إخفاء خيار 'غير ذلك'.")).toBeInTheDocument();
        });

        it('should display multiple validation errors', () => {
            const errors = [
                'هذا الحقل مطلوب',
                'يجب أن يكون الحد الأدنى 3 أحرف',
                'يجب أن يكون الحد الأقصى 255 حرف',
            ];
            render(<InlineError message={errors} />);

            errors.forEach(error => {
                expect(screen.getByText(error)).toBeInTheDocument();
            });
        });
    });

    describe('Error Message Content', () => {
        it('should display long error messages', () => {
            const longMessage = 'هذا خطأ طويل جداً يحتوي على الكثير من التفاصيل حول ما حدث بالضبط في حقل الإدخال';
            render(<InlineError message={longMessage} />);

            expect(screen.getByText(longMessage)).toBeInTheDocument();
        });

        it('should display error messages with special characters', () => {
            const message = "الاسم يحتوي على أحرف غير مسموح بها: < >";
            render(<InlineError message={message} />);

            expect(screen.getByText(message)).toBeInTheDocument();
        });

        it('should handle Arabic text with numbers', () => {
            const message = 'يجب أن يكون الحد الأقصى 255 حرف';
            render(<InlineError message={message} />);

            expect(screen.getByText(message)).toBeInTheDocument();
        });
    });
});
