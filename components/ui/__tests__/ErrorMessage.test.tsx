import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorMessage from '../ErrorMessage';

/**
 * Unit tests for ErrorMessage component
 * 
 * Tests:
 * - Error message display
 * - Retry button functionality
 * - Accessibility attributes
 * - Custom styling
 * 
 * Requirements: 11.4, 14.10
 */

describe('ErrorMessage Component', () => {
    describe('Basic Rendering', () => {
        it('should render error message', () => {
            render(<ErrorMessage message="حدث خطأ في الاتصال" />);

            expect(screen.getByText('حدث خطأ في الاتصال')).toBeInTheDocument();
        });

        it('should have alert role', () => {
            render(<ErrorMessage message="خطأ" />);

            const container = screen.getByRole('alert');
            expect(container).toBeInTheDocument();
        });

        it('should have aria-live="assertive"', () => {
            const { container } = render(<ErrorMessage message="خطأ" />);

            const alertElement = container.querySelector('[aria-live="assertive"]');
            expect(alertElement).toBeInTheDocument();
        });

        it('should display error icon', () => {
            const { container } = render(<ErrorMessage message="خطأ" />);

            const icon = container.querySelector('svg');
            expect(icon).toBeInTheDocument();
        });
    });

    describe('Retry Button', () => {
        it('should render retry button when onRetry is provided', () => {
            const onRetry = vi.fn();
            render(<ErrorMessage message="خطأ" onRetry={onRetry} />);

            expect(screen.getByText('إعادة المحاولة')).toBeInTheDocument();
        });

        it('should not render retry button when onRetry is not provided', () => {
            render(<ErrorMessage message="خطأ" />);

            expect(screen.queryByText('إعادة المحاولة')).not.toBeInTheDocument();
        });

        it('should call onRetry when retry button is clicked', async () => {
            const user = userEvent.setup();
            const onRetry = vi.fn();
            render(<ErrorMessage message="خطأ" onRetry={onRetry} />);

            const retryButton = screen.getByText('إعادة المحاولة');
            await user.click(retryButton);

            expect(onRetry).toHaveBeenCalledTimes(1);
        });

        it('should use custom retry text when provided', () => {
            const onRetry = vi.fn();
            render(
                <ErrorMessage
                    message="خطأ"
                    onRetry={onRetry}
                    retryText="حاول مرة أخرى"
                />
            );

            expect(screen.getByText('حاول مرة أخرى')).toBeInTheDocument();
            expect(screen.queryByText('إعادة المحاولة')).not.toBeInTheDocument();
        });

        it('should have accessible label on retry button', () => {
            const onRetry = vi.fn();
            render(<ErrorMessage message="فشل الاتصال" onRetry={onRetry} />);

            const retryButton = screen.getByLabelText('إعادة المحاولة - فشل الاتصال');
            expect(retryButton).toBeInTheDocument();
        });
    });

    describe('Custom Styling', () => {
        it('should apply custom className', () => {
            const { container } = render(
                <ErrorMessage message="خطأ" className="custom-error" />
            );

            const errorContainer = container.querySelector('.custom-error');
            expect(errorContainer).toBeInTheDocument();
        });

        it('should maintain default classes with custom className', () => {
            const { container } = render(
                <ErrorMessage message="خطأ" className="custom-error" />
            );

            const errorContainer = container.querySelector('.error-message-container');
            expect(errorContainer).toBeInTheDocument();
            expect(errorContainer).toHaveClass('custom-error');
        });
    });

    describe('Error Message Content', () => {
        it('should display long error messages', () => {
            const longMessage = 'هذا خطأ طويل جداً يحتوي على الكثير من التفاصيل حول ما حدث بالضبط في النظام';
            render(<ErrorMessage message={longMessage} />);

            expect(screen.getByText(longMessage)).toBeInTheDocument();
        });

        it('should display error messages with special characters', () => {
            const message = 'خطأ: فشل الاتصال (404) - الصفحة غير موجودة!';
            render(<ErrorMessage message={message} />);

            expect(screen.getByText(message)).toBeInTheDocument();
        });
    });

    describe('Network Error Scenarios', () => {
        it('should display network error message', () => {
            render(<ErrorMessage message="فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى." />);

            expect(screen.getByText('فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى.')).toBeInTheDocument();
        });

        it('should display authentication error message', () => {
            render(<ErrorMessage message="انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى." />);

            expect(screen.getByText('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.')).toBeInTheDocument();
        });

        it('should display validation error message', () => {
            render(<ErrorMessage message="بيانات غير صالحة. يرجى التحقق من المدخلات." />);

            expect(screen.getByText('بيانات غير صالحة. يرجى التحقق من المدخلات.')).toBeInTheDocument();
        });
    });
});
