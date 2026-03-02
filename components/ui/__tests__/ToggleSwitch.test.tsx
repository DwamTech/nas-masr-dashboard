import { render, screen, fireEvent } from '@testing-library/react';
import { ToggleSwitch } from '../ToggleSwitch';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

describe('ToggleSwitch', () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders as a button with role switch', () => {
            render(<ToggleSwitch checked={false} onChange={mockOnChange} />);

            const toggle = screen.getByRole('switch');
            expect(toggle).toBeInTheDocument();
            expect(toggle.tagName).toBe('BUTTON');
        });

        it('has correct aria-checked attribute when checked', () => {
            render(<ToggleSwitch checked={true} onChange={mockOnChange} />);

            const toggle = screen.getByRole('switch');
            expect(toggle).toHaveAttribute('aria-checked', 'true');
        });

        it('has correct aria-checked attribute when unchecked', () => {
            render(<ToggleSwitch checked={false} onChange={mockOnChange} />);

            const toggle = screen.getByRole('switch');
            expect(toggle).toHaveAttribute('aria-checked', 'false');
        });

        it('uses default aria-label when not provided', () => {
            render(<ToggleSwitch checked={false} onChange={mockOnChange} />);

            const toggle = screen.getByRole('switch');
            expect(toggle).toHaveAttribute('aria-label', 'Toggle switch');
        });

        it('uses custom aria-label when provided', () => {
            render(
                <ToggleSwitch
                    checked={false}
                    onChange={mockOnChange}
                    ariaLabel="Custom label"
                />
            );

            const toggle = screen.getByLabelText('Custom label');
            expect(toggle).toBeInTheDocument();
        });
    });

    describe('Functionality', () => {
        it('calls onChange with true when clicked while unchecked', () => {
            render(<ToggleSwitch checked={false} onChange={mockOnChange} />);

            const toggle = screen.getByRole('switch');
            fireEvent.click(toggle);

            expect(mockOnChange).toHaveBeenCalledWith(true);
            expect(mockOnChange).toHaveBeenCalledTimes(1);
        });

        it('calls onChange with false when clicked while checked', () => {
            render(<ToggleSwitch checked={true} onChange={mockOnChange} />);

            const toggle = screen.getByRole('switch');
            fireEvent.click(toggle);

            expect(mockOnChange).toHaveBeenCalledWith(false);
            expect(mockOnChange).toHaveBeenCalledTimes(1);
        });

        it('does not call onChange when disabled', () => {
            render(<ToggleSwitch checked={false} onChange={mockOnChange} disabled={true} />);

            const toggle = screen.getByRole('switch');
            fireEvent.click(toggle);

            expect(mockOnChange).not.toHaveBeenCalled();
        });

        it('handles multiple rapid clicks', () => {
            render(<ToggleSwitch checked={false} onChange={mockOnChange} />);

            const toggle = screen.getByRole('switch');

            fireEvent.click(toggle);
            fireEvent.click(toggle);
            fireEvent.click(toggle);

            // Each click calls onChange with the opposite of the current checked value
            // Since checked is always false (not controlled by component), all calls will be with true
            expect(mockOnChange).toHaveBeenCalledTimes(3);
            expect(mockOnChange).toHaveBeenNthCalledWith(1, true);
            expect(mockOnChange).toHaveBeenNthCalledWith(2, true);
            expect(mockOnChange).toHaveBeenNthCalledWith(3, true);
        });
    });

    describe('Styling', () => {
        it('applies checked background color when checked', () => {
            render(<ToggleSwitch checked={true} onChange={mockOnChange} />);

            const toggle = screen.getByRole('switch');
            expect(toggle).toHaveClass('bg-blue-600');
        });

        it('applies unchecked background color when unchecked', () => {
            render(<ToggleSwitch checked={false} onChange={mockOnChange} />);

            const toggle = screen.getByRole('switch');
            expect(toggle).toHaveClass('bg-gray-300');
        });

        it('applies disabled styling when disabled', () => {
            render(<ToggleSwitch checked={false} onChange={mockOnChange} disabled={true} />);

            const toggle = screen.getByRole('switch');
            expect(toggle).toHaveClass('opacity-50');
            expect(toggle).toHaveClass('cursor-not-allowed');
        });

        it('applies enabled styling when not disabled', () => {
            render(<ToggleSwitch checked={false} onChange={mockOnChange} />);

            const toggle = screen.getByRole('switch');
            expect(toggle).toHaveClass('cursor-pointer');
            expect(toggle).not.toHaveClass('opacity-50');
        });

        it('has focus ring styles', () => {
            render(<ToggleSwitch checked={false} onChange={mockOnChange} />);

            const toggle = screen.getByRole('switch');
            expect(toggle).toHaveClass('focus:ring-2');
            expect(toggle).toHaveClass('focus:ring-blue-500');
        });

        it('has transition classes', () => {
            render(<ToggleSwitch checked={false} onChange={mockOnChange} />);

            const toggle = screen.getByRole('switch');
            expect(toggle).toHaveClass('transition-colors');
        });
    });

    describe('Toggle Indicator', () => {
        it('positions indicator to the right when checked', () => {
            const { container } = render(<ToggleSwitch checked={true} onChange={mockOnChange} />);

            const indicator = container.querySelector('span');
            expect(indicator).toHaveClass('translate-x-6');
        });

        it('positions indicator to the left when unchecked', () => {
            const { container } = render(<ToggleSwitch checked={false} onChange={mockOnChange} />);

            const indicator = container.querySelector('span');
            expect(indicator).toHaveClass('translate-x-1');
        });

        it('has transition animation on indicator', () => {
            const { container } = render(<ToggleSwitch checked={false} onChange={mockOnChange} />);

            const indicator = container.querySelector('span');
            expect(indicator).toHaveClass('transition-transform');
        });
    });

    describe('Accessibility', () => {
        it('is keyboard accessible', () => {
            render(<ToggleSwitch checked={false} onChange={mockOnChange} />);

            const toggle = screen.getByRole('switch');
            expect(toggle).toHaveAttribute('type', 'button');
        });

        it('is disabled when disabled prop is true', () => {
            render(<ToggleSwitch checked={false} onChange={mockOnChange} disabled={true} />);

            const toggle = screen.getByRole('switch');
            expect(toggle).toBeDisabled();
        });

        it('is not disabled when disabled prop is false', () => {
            render(<ToggleSwitch checked={false} onChange={mockOnChange} disabled={false} />);

            const toggle = screen.getByRole('switch');
            expect(toggle).not.toBeDisabled();
        });

        it('is not disabled by default', () => {
            render(<ToggleSwitch checked={false} onChange={mockOnChange} />);

            const toggle = screen.getByRole('switch');
            expect(toggle).not.toBeDisabled();
        });
    });

    describe('Edge Cases', () => {
        it('handles onChange being called with no parameters', () => {
            const onChangeNoParams = vi.fn(() => { });
            render(<ToggleSwitch checked={false} onChange={onChangeNoParams} />);

            const toggle = screen.getByRole('switch');
            fireEvent.click(toggle);

            expect(onChangeNoParams).toHaveBeenCalled();
        });

        it('maintains state consistency across re-renders', () => {
            const { rerender } = render(<ToggleSwitch checked={false} onChange={mockOnChange} />);

            let toggle = screen.getByRole('switch');
            expect(toggle).toHaveAttribute('aria-checked', 'false');

            rerender(<ToggleSwitch checked={true} onChange={mockOnChange} />);

            toggle = screen.getByRole('switch');
            expect(toggle).toHaveAttribute('aria-checked', 'true');
        });

        it('handles very long aria-label', () => {
            const longLabel = 'A'.repeat(200);
            render(
                <ToggleSwitch
                    checked={false}
                    onChange={mockOnChange}
                    ariaLabel={longLabel}
                />
            );

            const toggle = screen.getByLabelText(longLabel);
            expect(toggle).toBeInTheDocument();
        });
    });
});
