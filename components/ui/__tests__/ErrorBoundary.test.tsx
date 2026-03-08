import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../ErrorBoundary';

/**
 * Unit tests for ErrorBoundary component
 * 
 * Tests:
 * - Error catching and display
 * - Fallback UI rendering
 * - Reload and reset functionality
 * - Custom fallback UI
 * - Error callback
 * 
 * Requirements: 11.4, 14.10
 */

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>Normal content</div>;
}

describe('ErrorBoundary Component', () => {
    // Suppress console.error for these tests
    const originalError = console.error;
    beforeEach(() => {
        console.error = vi.fn();
    });

    afterEach(() => {
        console.error = originalError;
    });

    describe('Normal Rendering', () => {
        it('should render children when no error occurs', () => {
            render(
                <ErrorBoundary>
                    <div>Test content</div>
                </ErrorBoundary>
            );

            expect(screen.getByText('Test content')).toBeInTheDocument();
        });

        it('should not display error UI when no error occurs', () => {
            render(
                <ErrorBoundary>
                    <div>Test content</div>
                </ErrorBoundary>
            );

            expect(screen.queryByText('حدث خطأ غير متوقع')).not.toBeInTheDocument();
        });
    });

    describe('Error Catching', () => {
        it('should catch errors from child components', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.getByText('حدث خطأ غير متوقع')).toBeInTheDocument();
        });

        it('should display fallback UI when error occurs', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.getByText('حدث خطأ غير متوقع')).toBeInTheDocument();
            expect(screen.getByText('عذراً، حدث خطأ أثناء عرض هذه الصفحة. يرجى المحاولة مرة أخرى.')).toBeInTheDocument();
        });

        it('should not render child content when error occurs', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.queryByText('Normal content')).not.toBeInTheDocument();
        });

        it('should display error icon', () => {
            const { container } = render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            const icon = container.querySelector('svg');
            expect(icon).toBeInTheDocument();
        });
    });

    describe('Error Details', () => {
        it('should display error details in expandable section', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.getByText('تفاصيل الخطأ (للمطورين)')).toBeInTheDocument();
        });

        it('should show error message in details', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            const details = screen.getByText(/Test error/);
            expect(details).toBeInTheDocument();
        });
    });

    describe('Reset Functionality', () => {
        it('should display reset button', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.getByText('محاولة مرة أخرى')).toBeInTheDocument();
        });
    });

    describe('Reload Functionality', () => {
        it('should display reload button', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.getByText('إعادة تحميل الصفحة')).toBeInTheDocument();
        });

        it('should call window.location.reload when reload button is clicked', async () => {
            const user = userEvent.setup();
            const reloadMock = vi.fn();

            // Mock window.location.reload
            Object.defineProperty(window, 'location', {
                value: { reload: reloadMock },
                writable: true,
            });

            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            const reloadButton = screen.getByText('إعادة تحميل الصفحة');
            await user.click(reloadButton);

            expect(reloadMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('Custom Fallback UI', () => {
        it('should render custom fallback when provided', () => {
            const customFallback = <div>Custom error message</div>;

            render(
                <ErrorBoundary fallback={customFallback}>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.getByText('Custom error message')).toBeInTheDocument();
            expect(screen.queryByText('حدث خطأ غير متوقع')).not.toBeInTheDocument();
        });

        it('should not render default fallback when custom fallback is provided', () => {
            const customFallback = <div>Custom error</div>;

            render(
                <ErrorBoundary fallback={customFallback}>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.queryByText('إعادة تحميل الصفحة')).not.toBeInTheDocument();
        });
    });

    describe('Error Callback', () => {
        it('should call onError callback when error occurs', () => {
            const onError = vi.fn();

            render(
                <ErrorBoundary onError={onError}>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(
                expect.any(Error),
                expect.objectContaining({
                    componentStack: expect.any(String),
                })
            );
        });

        it('should pass error object to callback', () => {
            const onError = vi.fn();

            render(
                <ErrorBoundary onError={onError}>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            const [error] = onError.mock.calls[0];
            expect(error.message).toBe('Test error');
        });
    });

    describe('Accessibility', () => {
        it('should have accessible labels on buttons', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(screen.getByLabelText('محاولة مرة أخرى')).toBeInTheDocument();
            expect(screen.getByLabelText('إعادة تحميل الصفحة')).toBeInTheDocument();
        });

        it('should hide decorative icon from screen readers', () => {
            const { container } = render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            const icon = container.querySelector('[aria-hidden="true"]');
            expect(icon).toBeInTheDocument();
        });
    });

    describe('Multiple Errors', () => {
        it('should handle multiple errors from different components', () => {
            render(
                <ErrorBoundary>
                    <div>
                        <ThrowError shouldThrow={true} />
                        <ThrowError shouldThrow={true} />
                    </div>
                </ErrorBoundary>
            );

            // Should only show error UI once
            expect(screen.getByText('حدث خطأ غير متوقع')).toBeInTheDocument();
        });
    });
});
