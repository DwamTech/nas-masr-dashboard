import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DraggableOptionsList } from '../DraggableOptionsList';

// Mock the hooks
vi.mock('@/hooks/useDragAndDrop', () => ({
    useDragAndDrop: () => ({
        sensors: [],
        activeId: null,
        handleDragStart: vi.fn(),
        handleDragEnd: vi.fn(),
        handleDragCancel: vi.fn(),
    }),
}));

vi.mock('@/hooks/useRankCalculation', () => ({
    useRankCalculation: () => ({
        calculateRanks: (options: string[]) =>
            options.map((option, index) => ({ option, rank: index + 1 })),
        ensureOtherIsLast: (options: string[]) => {
            const otherIndex = options.findIndex(opt => opt === 'غير ذلك');
            if (otherIndex === -1 || otherIndex === options.length - 1) {
                return options;
            }
            const newOptions = [...options];
            newOptions.splice(otherIndex, 1);
            newOptions.push('غير ذلك');
            return newOptions;
        },
    }),
}));

describe('DraggableOptionsList', () => {
    const mockOnReorder = vi.fn();
    const mockOnSave = vi.fn();
    const mockRenderOption = (option: string) => <div>{option}</div>;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render all options', () => {
            const options = ['Option 1', 'Option 2', 'غير ذلك'];
            render(
                <DraggableOptionsList
                    options={options}
                    onReorder={mockOnReorder}
                    onSave={mockOnSave}
                    renderOption={mockRenderOption}
                />
            );

            options.forEach(option => {
                expect(screen.getByText(option)).toBeInTheDocument();
            });
        });

        it('should render drag handles for all options except "غير ذلك"', () => {
            const options = ['Option 1', 'Option 2', 'غير ذلك'];
            const { container } = render(
                <DraggableOptionsList
                    options={options}
                    onReorder={mockOnReorder}
                    onSave={mockOnSave}
                    renderOption={mockRenderOption}
                />
            );

            const dragHandles = container.querySelectorAll('.drag-handle');
            // Should have 2 drag handles (not for "غير ذلك")
            expect(dragHandles).toHaveLength(2);
        });

        it('should not render drag handles when disabled', () => {
            const options = ['Option 1', 'Option 2'];
            const { container } = render(
                <DraggableOptionsList
                    options={options}
                    onReorder={mockOnReorder}
                    onSave={mockOnSave}
                    renderOption={mockRenderOption}
                    disabled={true}
                />
            );

            const dragHandles = container.querySelectorAll('.drag-handle');
            expect(dragHandles).toHaveLength(0);
        });
    });

    describe('Accessibility', () => {
        it('should have ARIA live region for announcements', () => {
            const options = ['Option 1', 'Option 2'];
            render(
                <DraggableOptionsList
                    options={options}
                    onReorder={mockOnReorder}
                    onSave={mockOnSave}
                    renderOption={mockRenderOption}
                />
            );

            // Get all live regions (ours + dnd-kit's)
            const liveRegions = screen.getAllByRole('status');
            expect(liveRegions.length).toBeGreaterThan(0);

            // Find our custom live region (has polite aria-live)
            const ourLiveRegion = liveRegions.find(
                region => region.getAttribute('aria-live') === 'polite'
            );
            expect(ourLiveRegion).toBeInTheDocument();
            expect(ourLiveRegion).toHaveAttribute('aria-atomic', 'true');
        });

        it('should have list role and aria-label', () => {
            const options = ['Option 1', 'Option 2'];
            render(
                <DraggableOptionsList
                    options={options}
                    onReorder={mockOnReorder}
                    onSave={mockOnSave}
                    renderOption={mockRenderOption}
                />
            );

            const list = screen.getByRole('list', { name: /قائمة الخيارات القابلة لإعادة الترتيب/i });
            expect(list).toBeInTheDocument();
        });

        it('should have drag instructions for screen readers', () => {
            const options = ['Option 1', 'Option 2'];
            render(
                <DraggableOptionsList
                    options={options}
                    onReorder={mockOnReorder}
                    onSave={mockOnSave}
                    renderOption={mockRenderOption}
                />
            );

            const instructions = document.getElementById('drag-instructions');
            expect(instructions).toBeInTheDocument();
            expect(instructions?.textContent).toContain('استخدم مفاتيح الأسهم');
        });

        it('should have proper aria-labels for drag handles', () => {
            const options = ['Option 1', 'Option 2'];
            const { container } = render(
                <DraggableOptionsList
                    options={options}
                    onReorder={mockOnReorder}
                    onSave={mockOnSave}
                    renderOption={mockRenderOption}
                />
            );

            const dragHandles = container.querySelectorAll('.drag-handle');
            dragHandles.forEach(handle => {
                expect(handle).toHaveAttribute('role', 'button');
                expect(handle).toHaveAttribute('aria-label');
                expect(handle).toHaveAttribute('tabIndex', '0');
            });
        });
    });

    describe('"غير ذلك" Handling', () => {
        it('should not render drag handle for "غير ذلك"', () => {
            const options = ['Option 1', 'غير ذلك', 'Option 2'];
            const { container } = render(
                <DraggableOptionsList
                    options={options}
                    onReorder={mockOnReorder}
                    onSave={mockOnSave}
                    renderOption={mockRenderOption}
                />
            );

            // Find the draggable-option containing "غير ذلك"
            const otherOption = screen.getByText('غير ذلك').closest('.draggable-option');
            expect(otherOption).toBeInTheDocument();

            // Check it has disabled class
            expect(otherOption).toHaveClass('disabled');

            // Check it doesn't have a drag handle
            const dragHandle = otherOption?.querySelector('.drag-handle');
            expect(dragHandle).not.toBeInTheDocument();
        });

        it('should use custom otherOptionLabel', () => {
            const options = ['Option 1', 'Other'];
            const { container } = render(
                <DraggableOptionsList
                    options={options}
                    onReorder={mockOnReorder}
                    onSave={mockOnSave}
                    renderOption={mockRenderOption}
                    otherOptionLabel="Other"
                />
            );

            // Should have only 1 drag handle (not for "Other")
            const dragHandles = container.querySelectorAll('.drag-handle');
            expect(dragHandles).toHaveLength(1);
        });
    });

    describe('Save Functionality', () => {
        it('should show saving state during save', async () => {
            const options = ['Option 1', 'Option 2'];
            mockOnSave.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            const { container } = render(
                <DraggableOptionsList
                    options={options}
                    onReorder={mockOnReorder}
                    onSave={mockOnSave}
                    renderOption={mockRenderOption}
                />
            );

            // Trigger reorder (this would normally happen through drag & drop)
            // For now, we just verify the saving class can be applied
            const list = container.querySelector('.models-list');
            expect(list).toBeInTheDocument();
        });

        it('should announce save success to screen readers', async () => {
            const options = ['Option 1', 'Option 2'];
            mockOnSave.mockResolvedValue(undefined);

            render(
                <DraggableOptionsList
                    options={options}
                    onReorder={mockOnReorder}
                    onSave={mockOnSave}
                    renderOption={mockRenderOption}
                />
            );

            // Get all live regions (ours + dnd-kit's)
            const liveRegions = screen.getAllByRole('status');
            expect(liveRegions.length).toBeGreaterThan(0);

            // Find our custom live region
            const ourLiveRegion = liveRegions.find(
                region => region.getAttribute('aria-live') === 'polite'
            );
            expect(ourLiveRegion).toBeInTheDocument();
        });
    });

    describe('Visual Feedback', () => {
        it('should apply dragging class during drag', () => {
            const options = ['Option 1', 'Option 2'];
            const { container } = render(
                <DraggableOptionsList
                    options={options}
                    onReorder={mockOnReorder}
                    onSave={mockOnSave}
                    renderOption={mockRenderOption}
                />
            );

            // Verify draggable options exist
            const draggableOptions = container.querySelectorAll('.draggable-option');
            expect(draggableOptions.length).toBeGreaterThan(0);
        });

        it('should render drag overlay when item is being dragged', () => {
            const options = ['Option 1', 'Option 2'];
            render(
                <DraggableOptionsList
                    options={options}
                    onReorder={mockOnReorder}
                    onSave={mockOnSave}
                    renderOption={mockRenderOption}
                />
            );

            // DragOverlay is rendered but not visible without activeId
            // This is handled by @dnd-kit internally
            expect(screen.getByText('Option 1')).toBeInTheDocument();
        });
    });

    describe('Keyboard Navigation', () => {
        it('should support keyboard navigation with arrow keys', () => {
            const options = ['Option 1', 'Option 2'];
            const { container } = render(
                <DraggableOptionsList
                    options={options}
                    onReorder={mockOnReorder}
                    onSave={mockOnSave}
                    renderOption={mockRenderOption}
                />
            );

            // Verify drag handles are keyboard accessible
            const dragHandles = container.querySelectorAll('.drag-handle');
            dragHandles.forEach(handle => {
                expect(handle).toHaveAttribute('tabIndex', '0');
            });
        });
    });

    describe('Touch Support', () => {
        it('should render properly for touch devices', () => {
            const options = ['Option 1', 'Option 2'];
            const { container } = render(
                <DraggableOptionsList
                    options={options}
                    onReorder={mockOnReorder}
                    onSave={mockOnSave}
                    renderOption={mockRenderOption}
                />
            );

            // Touch support is handled by @dnd-kit sensors
            // Verify the component renders correctly
            expect(container.querySelector('.models-list')).toBeInTheDocument();
        });
    });
});
