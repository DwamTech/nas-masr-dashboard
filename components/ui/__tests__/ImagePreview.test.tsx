import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImagePreview } from '../ImagePreview';

describe('ImagePreview', () => {
    const mockImageUrl = 'https://example.com/image.jpg';

    it('renders with image URL', () => {
        render(<ImagePreview imageUrl={mockImageUrl} />);

        const image = screen.getByAltText('Preview');
        expect(image).toBeDefined();
    });

    it('displays the current image label in Arabic', () => {
        render(<ImagePreview imageUrl={mockImageUrl} />);

        const label = screen.getByText('الصورة الحالية:');
        expect(label).toBeDefined();
    });

    it('renders clear button when onClear is provided', () => {
        const onClear = vi.fn();
        render(<ImagePreview imageUrl={mockImageUrl} onClear={onClear} />);

        const clearButton = screen.getByText('مسح');
        expect(clearButton).toBeDefined();
    });

    it('does not render clear button when onClear is not provided', () => {
        render(<ImagePreview imageUrl={mockImageUrl} />);

        const clearButton = screen.queryByText('مسح');
        expect(clearButton).toBeNull();
    });

    it('calls onClear when clear button is clicked', () => {
        const onClear = vi.fn();
        render(<ImagePreview imageUrl={mockImageUrl} onClear={onClear} />);

        const clearButton = screen.getByText('مسح');
        fireEvent.click(clearButton);

        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('uses default alt text when not provided', () => {
        render(<ImagePreview imageUrl={mockImageUrl} />);

        const image = screen.getByAltText('Preview');
        expect(image).toBeDefined();
    });

    it('uses custom alt text when provided', () => {
        const customAlt = 'Category Image';
        render(<ImagePreview imageUrl={mockImageUrl} alt={customAlt} />);

        const image = screen.getByAltText(customAlt);
        expect(image).toBeDefined();
    });

    it('applies cursor-pointer class to image', () => {
        render(<ImagePreview imageUrl={mockImageUrl} />);

        const image = screen.getByAltText('Preview');
        expect(image.className).toContain('cursor-pointer');
    });

    it('toggles zoom when image is clicked', () => {
        render(<ImagePreview imageUrl={mockImageUrl} />);

        const image = screen.getByAltText('Preview');

        // Initially no zoom dialog
        expect(screen.queryByRole('dialog')).toBeNull();

        // Click to zoom
        fireEvent.click(image);

        // Zoom dialog should appear
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeDefined();
    });

    it('closes zoom dialog when clicked', () => {
        render(<ImagePreview imageUrl={mockImageUrl} />);

        const image = screen.getByAltText('Preview');

        // Click to zoom
        fireEvent.click(image);

        // Zoom dialog should appear
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeDefined();

        // Click dialog to close
        fireEvent.click(dialog);

        // Dialog should be gone
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('has proper accessibility attributes for zoom dialog', () => {
        render(<ImagePreview imageUrl={mockImageUrl} />);

        const image = screen.getByAltText('Preview');
        fireEvent.click(image);

        const dialog = screen.getByRole('dialog');
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(dialog.getAttribute('aria-label')).toBe('Zoomed image view');
    });
});
