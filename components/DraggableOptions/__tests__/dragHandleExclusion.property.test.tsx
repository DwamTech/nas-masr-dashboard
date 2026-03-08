/**
 * Property-Based Test for Drag Handle Exclusion
 * 
 * Feature: filters-lists-management
 * Task 8.3: Write property test for drag handle exclusion
 * 
 * **Property 3: Drag Handle Exclusion for "غير ذلك"**
 * **Validates: Requirements 4.20, 7.2**
 * 
 * For any list of options containing "غير ذلك", all options except "غير ذلك" 
 * should have drag handles enabled, and "غير ذلك" should have its drag handle 
 * disabled or hidden.
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { DraggableOptionsList } from '../DraggableOptionsList';

describe('Feature: filters-lists-management, Property 3: Drag Handle Exclusion for "غير ذلك"', () => {

    /**
     * Unit Test: Specific example with "غير ذلك" in the list
     */
    it('Example: List with "غير ذلك" should have drag handles for all except "غير ذلك"', () => {
        const options = ['Option 1', 'Option 2', 'غير ذلك', 'Option 3'];
        const mockOnReorder = vi.fn();
        const mockOnSave = vi.fn();
        const mockRenderOption = (option: string) => <div>{option}</div>;

        const { container } = render(
            <DraggableOptionsList
                options={options}
                onReorder={mockOnReorder}
                onSave={mockOnSave}
                renderOption={mockRenderOption}
            />
        );

        // Get all draggable option elements
        const draggableOptions = container.querySelectorAll('.draggable-option');

        expect(draggableOptions).toHaveLength(4);

        // Check each option
        draggableOptions.forEach((element, index) => {
            const option = options[index];
            const dragHandle = element.querySelector('.drag-handle');

            if (option === 'غير ذلك') {
                // "غير ذلك" should NOT have a drag handle
                expect(dragHandle).toBeNull();
                expect(element.classList.contains('disabled')).toBe(true);
            } else {
                // All other options SHOULD have a drag handle
                expect(dragHandle).not.toBeNull();
                expect(element.classList.contains('disabled')).toBe(false);
            }
        });
    });

    /**
     * Property-Based Test: For any list containing "غير ذلك"
     */
    it('Property: For any list with "غير ذلك", only "غير ذلك" lacks a drag handle', () => {
        // Generator for option names (excluding "غير ذلك")
        const optionNameArb = fc.string({ minLength: 1, maxLength: 20 })
            .filter(s => s.trim().length > 0 && s !== 'غير ذلك');

        // Generator for lists that include "غير ذلك"
        const optionsWithOtherArb = fc.array(optionNameArb, { minLength: 1, maxLength: 10 })
            .chain(options => {
                // Insert "غير ذلك" at a random position
                return fc.integer({ min: 0, max: options.length }).map(position => {
                    const result = [...options];
                    result.splice(position, 0, 'غير ذلك');
                    return result;
                });
            });

        fc.assert(
            fc.property(optionsWithOtherArb, (options) => {
                const mockOnReorder = vi.fn();
                const mockOnSave = vi.fn();
                const mockRenderOption = (option: string) => <div>{option}</div>;

                const { container } = render(
                    <DraggableOptionsList
                        options={options}
                        onReorder={mockOnReorder}
                        onSave={mockOnSave}
                        renderOption={mockRenderOption}
                    />
                );

                const draggableOptions = container.querySelectorAll('.draggable-option');

                // Verify we have the correct number of options
                expect(draggableOptions).toHaveLength(options.length);

                // Check each option
                let otherOptionFound = false;
                let otherOptionHasDragHandle = false;
                let nonOtherOptionsWithoutDragHandle = 0;

                draggableOptions.forEach((element, index) => {
                    const option = options[index];
                    const dragHandle = element.querySelector('.drag-handle');

                    if (option === 'غير ذلك') {
                        otherOptionFound = true;
                        if (dragHandle !== null) {
                            otherOptionHasDragHandle = true;
                        }
                        // "غير ذلك" should be marked as disabled
                        expect(element.classList.contains('disabled')).toBe(true);
                    } else {
                        // All other options should have drag handles
                        if (dragHandle === null) {
                            nonOtherOptionsWithoutDragHandle++;
                        }
                        expect(element.classList.contains('disabled')).toBe(false);
                    }
                });

                // Assertions for the property
                expect(otherOptionFound).toBe(true); // "غير ذلك" must be in the list
                expect(otherOptionHasDragHandle).toBe(false); // "غير ذلك" must NOT have drag handle
                expect(nonOtherOptionsWithoutDragHandle).toBe(0); // All other options MUST have drag handles

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Property-Based Test: Verify drag handle is functional for non-"غير ذلك" options
     */
    it('Property: Drag handles for non-"غير ذلك" options have proper attributes', () => {
        const optionNameArb = fc.string({ minLength: 1, maxLength: 20 })
            .filter(s => s.trim().length > 0 && s !== 'غير ذلك');

        const optionsWithOtherArb = fc.array(optionNameArb, { minLength: 2, maxLength: 10 })
            .map(options => [...options, 'غير ذلك']);

        fc.assert(
            fc.property(optionsWithOtherArb, (options) => {
                const mockOnReorder = vi.fn();
                const mockOnSave = vi.fn();
                const mockRenderOption = (option: string) => <div>{option}</div>;

                const { container } = render(
                    <DraggableOptionsList
                        options={options}
                        onReorder={mockOnReorder}
                        onSave={mockOnSave}
                        renderOption={mockRenderOption}
                    />
                );

                const draggableOptions = container.querySelectorAll('.draggable-option');

                draggableOptions.forEach((element, index) => {
                    const option = options[index];
                    const dragHandle = element.querySelector('.drag-handle');

                    if (option !== 'غير ذلك' && dragHandle) {
                        // Drag handle should have proper accessibility attributes
                        expect(dragHandle.getAttribute('role')).toBe('button');
                        expect(dragHandle.getAttribute('aria-label')).toContain('مقبض السحب');
                        expect(dragHandle.getAttribute('tabIndex')).toBe('0');
                    }
                });

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Edge Case: List with only "غير ذلك"
     */
    it('Edge Case: List with only "غير ذلك" has no drag handles', () => {
        const options = ['غير ذلك'];
        const mockOnReorder = vi.fn();
        const mockOnSave = vi.fn();
        const mockRenderOption = (option: string) => <div>{option}</div>;

        const { container } = render(
            <DraggableOptionsList
                options={options}
                onReorder={mockOnReorder}
                onSave={mockOnSave}
                renderOption={mockRenderOption}
            />
        );

        const dragHandles = container.querySelectorAll('.drag-handle');
        expect(dragHandles).toHaveLength(0);
    });

    /**
     * Edge Case: List with multiple "غير ذلك" (should not happen, but test defensive coding)
     */
    it('Edge Case: List with duplicate "غير ذلك" - none should have drag handles', () => {
        const options = ['Option 1', 'غير ذلك', 'Option 2', 'غير ذلك'];
        const mockOnReorder = vi.fn();
        const mockOnSave = vi.fn();
        const mockRenderOption = (option: string) => <div>{option}</div>;

        const { container } = render(
            <DraggableOptionsList
                options={options}
                onReorder={mockOnReorder}
                onSave={mockOnSave}
                renderOption={mockRenderOption}
            />
        );

        const draggableOptions = container.querySelectorAll('.draggable-option');

        draggableOptions.forEach((element, index) => {
            const option = options[index];
            const dragHandle = element.querySelector('.drag-handle');

            if (option === 'غير ذلك') {
                expect(dragHandle).toBeNull();
                expect(element.classList.contains('disabled')).toBe(true);
            }
        });
    });
});
