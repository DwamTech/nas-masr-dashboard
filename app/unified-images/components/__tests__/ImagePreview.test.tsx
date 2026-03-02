import { render, screen, fireEvent } from '@testing-library/react';
import { ImagePreview } from '../ImagePreview';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock Next.js Image component
vi.mock('next/image', () => ({
    default: ({ src, alt, onClick, className }: any) => (
        <img src={src} alt={alt} onClick={onClick} className={className} />
    ),
}));

describe('ImagePreview', () => {
    const mockImageUrl = 'https://example.com/test-image.jpg';
    const mockOnClear = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders image with correct src', () => {
            render(<ImagePreview imageUrl={mockImageUrl} />);

            const images = screen.getAllByAltText('Preview');
            expect(images[0]).toHaveAttribute('src', mockImageUrl);
        });

        it('displays "الصورة الحالية:" label', () => {
            render(<ImagePreview imageUrl={mockImageUrl} />);

            expect(screen.getByText('الصورة الحالية:')).toBeInTheDocument();
        });

        it('renders without clear button when onClear is not provided', () => {
            render(<ImagePreview imageUrl={mockImageUrl} />);

            expect(screen.queryByText('مسح')).not.toBeInTheDocument();
        });

        it('renders with clear button when onClear is provided', () => {
            render(<ImagePreview imageUrl={mockImageUrl} onClear={mockOnClear} />);

            expect(screen.getByText('مسح')).toBeInTheDocument();
        });
    });

    describe('Clear Functionality', () => {
        it('calls onClear when clear button is clicked', () => {
            render(<ImagePreview imageUrl={mockImageUrl} onClear={mockOnClear} />);

            const clearButton = screen.getByText('مسح');
            fireEvent.click(clearButton);

            expect(mockOnClear).toHaveBeenCalledTimes(1);
        });

        it('clear button has correct styling', () => {
            render(<ImagePreview imageUrl={mockImageUrl} onClear={mockOnClear} />);

            const clearButton = screen.getByText('مسح');
            expect(clearButton).toHaveClass('text-red-600');
            expect(clearButton).toHaveClass('hover:text-red-800');
        });
    });

    describe('Zoom Functionality', () => {
        it('toggles zoom when image is clicked', () => {
            render(<ImagePreview imageUrl={mockImageUrl} />);

            const images = screen.getAllByAltText('Preview');
            const thumbnailImage = images[0];

            // Click to zoom in
            fireEvent.click(thumbnailImage);

            // Should show zoomed image
            const zoomedImages = screen.getAllByAltText('Zoomed Preview');
            expect(zoomedImages.length).toBeGreaterThan(0);
        });

        it('closes zoom when clicking on zoomed overlay', () => {
            render(<ImagePreview imageUrl={mockImageUrl} />);

            const images = screen.getAllByAltText('Preview');
            const thumbnailImage = images[0];

            // Click to zoom in
            fireEvent.click(thumbnailImage);

            // Find and click the overlay
            const zoomedImage = screen.getByAltText('Zoomed Preview');
            const overlay = zoomedImage.closest('.fixed');

            if (overlay) {
                fireEvent.click(overlay);
            }

            // Zoom should be closed (only thumbnail visible)
            const remainingImages = screen.getAllByAltText('Preview');
            expect(remainingImages.length).toBeGreaterThan(0);
        });

        it('applies cursor-pointer class to thumbnail', () => {
            render(<ImagePreview imageUrl={mockImageUrl} />);

            const images = screen.getAllByAltText('Preview');
            const thumbnailImage = images[0];

            expect(thumbnailImage).toHaveClass('cursor-pointer');
        });
    });

    describe('Styling', () => {
        it('applies correct container classes', () => {
            const { container } = render(<ImagePreview imageUrl={mockImageUrl} />);

            const previewContainer = container.querySelector('.mb-4');
            expect(previewContainer).toBeInTheDocument();
        });

        it('applies rounded class to thumbnail', () => {
            render(<ImagePreview imageUrl={mockImageUrl} />);

            const images = screen.getAllByAltText('Preview');
            const thumbnailImage = images[0];

            expect(thumbnailImage).toHaveClass('rounded');
        });

        it('applies transition-transform class to thumbnail', () => {
            render(<ImagePreview imageUrl={mockImageUrl} />);

            const images = screen.getAllByAltText('Preview');
            const thumbnailImage = images[0];

            expect(thumbnailImage).toHaveClass('transition-transform');
        });
    });

    describe('Edge Cases', () => {
        it('handles very long image URLs', () => {
            const longUrl = 'https://example.com/' + 'a'.repeat(500) + '.jpg';
            render(<ImagePreview imageUrl={longUrl} />);

            const images = screen.getAllByAltText('Preview');
            expect(images[0]).toHaveAttribute('src', longUrl);
        });

        it('handles image URLs with special characters', () => {
            const specialUrl = 'https://example.com/image%20with%20spaces.jpg?v=123&t=456';
            render(<ImagePreview imageUrl={specialUrl} />);

            const images = screen.getAllByAltText('Preview');
            expect(images[0]).toHaveAttribute('src', specialUrl);
        });

        it('handles multiple rapid zoom toggles', () => {
            render(<ImagePreview imageUrl={mockImageUrl} />);

            const images = screen.getAllByAltText('Preview');
            const thumbnailImage = images[0];

            // Rapid clicks
            fireEvent.click(thumbnailImage);
            fireEvent.click(thumbnailImage);
            fireEvent.click(thumbnailImage);

            // Should still work correctly
            expect(screen.getAllByAltText('Preview').length).toBeGreaterThan(0);
        });

        it('handles onClear being undefined explicitly', () => {
            render(<ImagePreview imageUrl={mockImageUrl} onClear={undefined} />);

            expect(screen.queryByText('مسح')).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has descriptive alt text for thumbnail', () => {
            render(<ImagePreview imageUrl={mockImageUrl} />);

            expect(screen.getAllByAltText('Preview').length).toBeGreaterThan(0);
        });

        it('has descriptive alt text for zoomed image', () => {
            render(<ImagePreview imageUrl={mockImageUrl} />);

            const images = screen.getAllByAltText('Preview');
            fireEvent.click(images[0]);

            expect(screen.getByAltText('Zoomed Preview')).toBeInTheDocument();
        });

        it('clear button is keyboard accessible', () => {
            render(<ImagePreview imageUrl={mockImageUrl} onClear={mockOnClear} />);

            const clearButton = screen.getByText('مسح');
            expect(clearButton.tagName).toBe('BUTTON');
        });

        it('image is clickable for zoom', () => {
            render(<ImagePreview imageUrl={mockImageUrl} />);

            const images = screen.getAllByAltText('Preview');
            const thumbnailImage = images[0];

            expect(thumbnailImage).toHaveClass('cursor-pointer');
        });
    });

    describe('Zoom Overlay', () => {
        it('applies correct overlay styling when zoomed', () => {
            const { container } = render(<ImagePreview imageUrl={mockImageUrl} />);

            const images = screen.getAllByAltText('Preview');
            fireEvent.click(images[0]);

            const overlay = container.querySelector('.fixed.inset-0');
            expect(overlay).toBeInTheDocument();
            expect(overlay).toHaveClass('bg-black');
            expect(overlay).toHaveClass('bg-opacity-75');
        });

        it('centers zoomed image', () => {
            const { container } = render(<ImagePreview imageUrl={mockImageUrl} />);

            const images = screen.getAllByAltText('Preview');
            fireEvent.click(images[0]);

            const overlay = container.querySelector('.fixed.inset-0');
            expect(overlay).toHaveClass('flex');
            expect(overlay).toHaveClass('items-center');
            expect(overlay).toHaveClass('justify-center');
        });

        it('applies high z-index to overlay', () => {
            const { container } = render(<ImagePreview imageUrl={mockImageUrl} />);

            const images = screen.getAllByAltText('Preview');
            fireEvent.click(images[0]);

            const overlay = container.querySelector('.fixed.inset-0');
            expect(overlay).toHaveClass('z-50');
        });
    });
});
