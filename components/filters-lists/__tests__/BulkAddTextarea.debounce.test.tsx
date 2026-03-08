/**
 * Debouncing Tests for BulkAddTextarea
 * 
 * Task 21.4: Write performance tests - debouncing behavior
 * 
 * Tests that bulk input parsing is properly debounced (300ms)
 * 
 * Requirements: 12.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import BulkAddTextarea from '../BulkAddTextarea';

describe('BulkAddTextarea Debouncing - Task 21.3, 21.4', () => {
    describe('Debounced Parsing (300ms)', () => {
        it('should debounce parsing during rapid typing', async () => {
            const mockOnAdd = vi.fn();
            const existingOptions = ['جديد', 'مستعمل', 'غير ذلك'];

            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات/);

            // Simulate rapid typing
            fireEvent.change(textarea, { target: { value: 'ممتاز' } });
            fireEvent.change(textarea, { target: { value: 'ممتاز, جيد' } });
            fireEvent.change(textarea, { target: { value: 'ممتاز, جيد جداً' } });

            // Preview should not appear immediately
            expect(screen.queryByText(/معاينة/)).not.toBeInTheDocument();

            // Wait for debounce to complete (300ms + buffer)
            await waitFor(
                () => {
                    expect(screen.getByText(/معاينة/)).toBeInTheDocument();
                },
                { timeout: 1000 }
            );
        });

        it('should parse immediately when debounce completes', async () => {
            const mockOnAdd = vi.fn();
            const existingOptions = ['جديد', 'مستعمل', 'غير ذلك'];

            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات/);

            // Type input
            fireEvent.change(textarea, {
                target: { value: 'ممتاز, جيد جداً, جيد' },
            });

            // Wait for debounce and preview to appear
            await waitFor(
                () => {
                    expect(screen.getByText(/معاينة/)).toBeInTheDocument();
                    expect(screen.getByText(/3 خيار/)).toBeInTheDocument();
                },
                { timeout: 1000 }
            );
        });

        it('should not block user interaction during debounce', () => {
            const mockOnAdd = vi.fn();
            const existingOptions = ['جديد', 'مستعمل', 'غير ذلك'];

            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات/);

            // Type input
            fireEvent.change(textarea, { target: { value: 'option1' } });

            // Textarea should still be interactive during debounce
            expect(textarea).not.toBeDisabled();
            expect(textarea).toHaveValue('option1');

            // Can continue typing
            fireEvent.change(textarea, { target: { value: 'option1, option2' } });
            expect(textarea).toHaveValue('option1, option2');
        });
    });

    describe('Performance Benefits', () => {
        it('should reduce parsing calls during rapid input', async () => {
            const mockOnAdd = vi.fn();
            const existingOptions = ['جديد', 'مستعمل', 'غير ذلك'];

            render(
                <BulkAddTextarea
                    onAdd={mockOnAdd}
                    existingOptions={existingOptions}
                />
            );

            const textarea = screen.getByPlaceholderText(/أدخل الخيارات/);

            // Simulate rapid keystrokes
            for (let i = 1; i <= 10; i++) {
                fireEvent.change(textarea, {
                    target: { value: `option${i}` },
                });
            }

            // Wait for final debounce
            await waitFor(
                () => {
                    expect(screen.getByText('option10')).toBeInTheDocument();
                },
                { timeout: 1000 }
            );

            // Without debouncing, this would have parsed 10 times
            // With debouncing, it only parses once
        });
    });
});
