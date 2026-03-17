import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUploadModal } from '../ImageUploadModal';
import { uploadCategoryGlobalImage } from '@/services/makes';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { AdminCategoryListItem } from '@/models/makes';
import '@testing-library/jest-dom';

const BACKEND_BASE = (process.env.LARAVEL_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');

// Mock the service
vi.mock('@/services/makes', () => ({
    uploadCategoryGlobalImage: vi.fn(),
}));

describe('ImageUploadModal', () => {
    const mockCategory: AdminCategoryListItem = {
        id: 1,
        name: 'السيارات',
        icon: '🚙',
        is_global_image_active: true,
        global_image_url: null,
        global_image_full_url: null,
    };

    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders modal with category name', () => {
        render(
            <ImageUploadModal
                category={mockCategory}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.getByText(/رفع صورة موحدة - السيارات/)).toBeInTheDocument();
    });

    it('displays drag and drop area', () => {
        render(
            <ImageUploadModal
                category={mockCategory}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(
            screen.getByText(/اسحب وأفلت صورة هنا، أو انقر للاختيار/)
        ).toBeInTheDocument();
    });

    it('displays file size and format requirements', () => {
        render(
            <ImageUploadModal
                category={mockCategory}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(
            screen.getByText(/الحد الأقصى: 5MB \| الصيغ المدعومة: JPEG, PNG, WebP/)
        ).toBeInTheDocument();
    });

    it('disables upload button when no file is selected', () => {
        render(
            <ImageUploadModal
                category={mockCategory}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        const uploadButton = screen.getByText('حفظ وتعميم');
        expect(uploadButton).toBeDisabled();
    });

    it('calls onClose when cancel button is clicked', () => {
        render(
            <ImageUploadModal
                category={mockCategory}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        const cancelButton = screen.getByText('إلغاء');
        fireEvent.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('validates file type and shows error for invalid format', async () => {
        render(
            <ImageUploadModal
                category={mockCategory}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const invalidFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

        fireEvent.change(fileInput, { target: { files: [invalidFile] } });

        await waitFor(() => {
            expect(
                screen.getByText(/صيغة الصورة غير مدعومة/)
            ).toBeInTheDocument();
        });
    });

    it('validates file size and shows error for oversized file', async () => {
        render(
            <ImageUploadModal
                category={mockCategory}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        // Create a file larger than 5MB
        const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
            type: 'image/jpeg',
        });

        fireEvent.change(fileInput, { target: { files: [largeFile] } });

        await waitFor(() => {
            expect(
                screen.getByText(/حجم الصورة يتجاوز 5 ميجابايت/)
            ).toBeInTheDocument();
        });
    });

    it('displays current image if category has global_image_full_url', () => {
        const categoryWithImage: AdminCategoryListItem = {
            ...mockCategory,
            global_image_full_url: 'https://example.com/image.jpg',
        };

        render(
            <ImageUploadModal
                category={categoryWithImage}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.getByText('الصورة الحالية:')).toBeInTheDocument();
    });

    it('shows loading state during upload', async () => {
        (uploadCategoryGlobalImage as ReturnType<typeof vi.fn>).mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        );

        render(
            <ImageUploadModal
                category={mockCategory}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

        fireEvent.change(fileInput, { target: { files: [validFile] } });

        await waitFor(() => {
            const uploadButton = screen.getByText('حفظ وتعميم');
            expect(uploadButton).not.toBeDisabled();
        });

        const uploadButton = screen.getByText('حفظ وتعميم');
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(screen.getByText('جاري الرفع...')).toBeInTheDocument();
        });
    });

    describe('File Upload Flow', () => {
        it('accepts valid JPEG file', async () => {
            render(
                <ImageUploadModal
                    category={mockCategory}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            );

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

            fireEvent.change(fileInput, { target: { files: [validFile] } });

            await waitFor(() => {
                const uploadButton = screen.getByText('حفظ وتعميم');
                expect(uploadButton).not.toBeDisabled();
            });
        });

        it('accepts valid PNG file', async () => {
            render(
                <ImageUploadModal
                    category={mockCategory}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            );

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            const validFile = new File(['content'], 'test.png', { type: 'image/png' });

            fireEvent.change(fileInput, { target: { files: [validFile] } });

            await waitFor(() => {
                const uploadButton = screen.getByText('حفظ وتعميم');
                expect(uploadButton).not.toBeDisabled();
            });
        });

        it('accepts valid WebP file', async () => {
            render(
                <ImageUploadModal
                    category={mockCategory}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            );

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            const validFile = new File(['content'], 'test.webp', { type: 'image/webp' });

            fireEvent.change(fileInput, { target: { files: [validFile] } });

            await waitFor(() => {
                const uploadButton = screen.getByText('حفظ وتعميم');
                expect(uploadButton).not.toBeDisabled();
            });
        });

        it('successfully uploads file and calls onSuccess', async () => {
            const updatedCategory: AdminCategoryListItem = {
                ...mockCategory,
                global_image_url: 'uploads/categories/global/1_1234567890.webp',
                global_image_full_url: `${BACKEND_BASE}/storage/uploads/categories/global/1_1234567890.webp`,
                is_global_image_active: true,
            };

            (uploadCategoryGlobalImage as ReturnType<typeof vi.fn>).mockResolvedValue(updatedCategory);

            render(
                <ImageUploadModal
                    category={mockCategory}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            );

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

            fireEvent.change(fileInput, { target: { files: [validFile] } });

            await waitFor(() => {
                const uploadButton = screen.getByText('حفظ وتعميم');
                expect(uploadButton).not.toBeDisabled();
            });

            const uploadButton = screen.getByText('حفظ وتعميم');
            fireEvent.click(uploadButton);

            await waitFor(() => {
                expect(mockOnSuccess).toHaveBeenCalledWith(updatedCategory);
            });
        });

        it('displays error message when upload fails', async () => {
            (uploadCategoryGlobalImage as ReturnType<typeof vi.fn>).mockRejectedValue(
                new Error('فشل رفع الصورة')
            );

            render(
                <ImageUploadModal
                    category={mockCategory}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            );

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

            fireEvent.change(fileInput, { target: { files: [validFile] } });

            await waitFor(() => {
                const uploadButton = screen.getByText('حفظ وتعميم');
                expect(uploadButton).not.toBeDisabled();
            });

            const uploadButton = screen.getByText('حفظ وتعميم');
            fireEvent.click(uploadButton);

            await waitFor(() => {
                expect(screen.getByText('فشل رفع الصورة')).toBeInTheDocument();
            });
        });
    });

    describe('Drag and Drop', () => {
        it('shows active state when dragging over', () => {
            render(
                <ImageUploadModal
                    category={mockCategory}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            );

            const dropZone = screen.getByText(/اسحب وأفلت صورة هنا/).closest('div');

            fireEvent.dragEnter(dropZone!);

            expect(screen.getByText('أفلت الصورة هنا...')).toBeInTheDocument();
        });

        it('removes active state when drag leaves', () => {
            render(
                <ImageUploadModal
                    category={mockCategory}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            );

            const dropZone = screen.getByText(/اسحب وأفلت صورة هنا/).closest('div');

            fireEvent.dragEnter(dropZone!);
            expect(screen.getByText('أفلت الصورة هنا...')).toBeInTheDocument();

            fireEvent.dragLeave(dropZone!);
            expect(screen.getByText(/اسحب وأفلت صورة هنا، أو انقر للاختيار/)).toBeInTheDocument();
        });

        it('handles file drop', async () => {
            render(
                <ImageUploadModal
                    category={mockCategory}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            );

            const dropZone = screen.getByText(/اسحب وأفلت صورة هنا/).closest('div');
            const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

            fireEvent.drop(dropZone!, {
                dataTransfer: { files: [file] },
            });

            await waitFor(() => {
                const uploadButton = screen.getByText('حفظ وتعميم');
                expect(uploadButton).not.toBeDisabled();
            });
        });
    });

    describe('Error Handling', () => {
        it('clears error when valid file is selected after invalid one', async () => {
            render(
                <ImageUploadModal
                    category={mockCategory}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            );

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

            // First, select invalid file
            const invalidFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
            fireEvent.change(fileInput, { target: { files: [invalidFile] } });

            await waitFor(() => {
                expect(screen.getByText(/صيغة الصورة غير مدعومة/)).toBeInTheDocument();
            });

            // Then, select valid file
            const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
            fireEvent.change(fileInput, { target: { files: [validFile] } });

            await waitFor(() => {
                expect(screen.queryByText(/صيغة الصورة غير مدعومة/)).not.toBeInTheDocument();
            });
        });

        it('disables buttons during upload', async () => {
            (uploadCategoryGlobalImage as ReturnType<typeof vi.fn>).mockImplementation(
                () => new Promise((resolve) => setTimeout(resolve, 100))
            );

            render(
                <ImageUploadModal
                    category={mockCategory}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            );

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

            fireEvent.change(fileInput, { target: { files: [validFile] } });

            await waitFor(() => {
                const uploadButton = screen.getByText('حفظ وتعميم');
                expect(uploadButton).not.toBeDisabled();
            });

            const uploadButton = screen.getByText('حفظ وتعميم');
            fireEvent.click(uploadButton);

            await waitFor(() => {
                const cancelButton = screen.getByText('إلغاء');
                expect(cancelButton).toBeDisabled();
            });
        });
    });

    describe('Preview Functionality', () => {
        it('allows clearing preview for newly selected file', async () => {
            render(
                <ImageUploadModal
                    category={mockCategory}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            );

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

            fireEvent.change(fileInput, { target: { files: [validFile] } });

            await waitFor(() => {
                expect(screen.getByText('الصورة الحالية:')).toBeInTheDocument();
            });

            const clearButton = screen.getByText('مسح');
            fireEvent.click(clearButton);

            await waitFor(() => {
                expect(screen.queryByText('الصورة الحالية:')).not.toBeInTheDocument();
            });
        });

        it('does not show clear button for existing category image', () => {
            const categoryWithImage: AdminCategoryListItem = {
                ...mockCategory,
                global_image_full_url: 'https://example.com/image.jpg',
            };

            render(
                <ImageUploadModal
                    category={categoryWithImage}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            );

            expect(screen.getByText('الصورة الحالية:')).toBeInTheDocument();
            expect(screen.queryByText('مسح')).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has proper file input attributes', () => {
            render(
                <ImageUploadModal
                    category={mockCategory}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            );

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
        });

        it('has proper modal structure', () => {
            const { container } = render(
                <ImageUploadModal
                    category={mockCategory}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            );

            const modal = container.querySelector('.fixed.inset-0');
            expect(modal).toBeInTheDocument();
        });
    });
});
