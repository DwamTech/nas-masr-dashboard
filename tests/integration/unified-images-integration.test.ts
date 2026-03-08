/**
 * Integration Tests for Unified Category Images Management (Dashboard)
 * 
 * These tests validate the complete end-to-end workflow of the unified category
 * images management feature in the dashboard, including:
 * - Complete workflow: toggle → upload → display
 * - Backward compatibility with existing listings
 * - Toggle reversion (disable → revert to original images)
 * 
 * Validates: Requirements 12.1, 12.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Import services after mocking
import {
    fetchAdminCategories,
    toggleCategoryGlobalImage,
    uploadCategoryGlobalImage,
} from '@/services/makes';

interface Category {
    id: number;
    slug: string;
    name: string;
    icon?: string;
    is_active: boolean;
    is_global_image_active: boolean;
    global_image_url?: string;
    global_image_full_url?: string;
    sort_order?: number;
}

describe('Unified Images Integration Tests - Dashboard', () => {
    const mockAuthToken = 'test-auth-token-123';
    const baseUrl = 'https://back.nasmasr.app/api';

    beforeEach(() => {
        // Reset mocks
        mockFetch.mockReset();
        localStorageMock.clear();

        // Set auth token
        localStorageMock.setItem('authToken', mockAuthToken);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Test complete workflow: toggle enable → upload image → verify display
     * 
     * This test validates the entire user journey from enabling unified images
     * to uploading an image and verifying it's properly reflected in the UI.
     */
    it('should complete full workflow: toggle → upload → display', async () => {
        const mockCategory: Category = {
            id: 1,
            slug: 'cars',
            name: 'السيارات',
            icon: '🚙',
            is_active: true,
            is_global_image_active: false,
            global_image_url: undefined,
            sort_order: 1,
        };

        // Step 1: Fetch categories (initial state)
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [mockCategory],
        });

        const initialCategories = await fetchAdminCategories();
        expect(initialCategories).toHaveLength(1);
        expect(initialCategories[0].is_global_image_active).toBe(false);
        expect(initialCategories[0].global_image_url).toBeUndefined();

        // Step 2: Toggle unified image to enabled
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 1,
                is_global_image_active: true,
                global_image_url: null,
                message: 'تم تحديث حالة الصورة الموحدة بنجاح',
            }),
        });

        await toggleCategoryGlobalImage(1, true);

        // Verify toggle request was made correctly
        expect(mockFetch).toHaveBeenCalledWith(
            `${baseUrl}/admin/categories/1/toggle-global-image`,
            expect.objectContaining({
                method: 'PUT',
                headers: expect.objectContaining({
                    Authorization: `Bearer ${mockAuthToken}`,
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify({ is_global_image_active: true }),
            })
        );

        // Step 3: Upload unified image
        const mockFile = new File(['image content'], 'test-image.jpg', {
            type: 'image/jpeg',
        });

        const uploadedCategory: Category = {
            ...mockCategory,
            is_global_image_active: true,
            global_image_url: 'uploads/categories/global/1_1704123456.webp',
            global_image_full_url:
                'https://back.nasmasr.app/storage/uploads/categories/global/1_1704123456.webp',
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => uploadedCategory,
        });

        const result = await uploadCategoryGlobalImage(1, mockFile);

        // Verify upload request
        expect(mockFetch).toHaveBeenCalledWith(
            `${baseUrl}/admin/categories/1/upload-global-image`,
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: `Bearer ${mockAuthToken}`,
                }),
            })
        );

        // Verify upload result
        expect(result.is_global_image_active).toBe(true);
        expect(result.global_image_url).toBe(
            'uploads/categories/global/1_1704123456.webp'
        );
        expect(result.global_image_full_url).toContain('1_1704123456.webp');

        // Step 4: Fetch categories again to verify state
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [uploadedCategory],
        });

        const updatedCategories = await fetchAdminCategories();
        expect(updatedCategories[0].is_global_image_active).toBe(true);
        expect(updatedCategories[0].global_image_url).toBeDefined();
        expect(updatedCategories[0].global_image_full_url).toContain('.webp');
    });

    /**
     * Test backward compatibility with existing listings
     * 
     * This test ensures that enabling unified images doesn't break
     * existing functionality and that the system handles categories
     * with and without unified images correctly.
     */
    it('should maintain backward compatibility with existing listings', async () => {
        // Mock multiple categories with different states
        const mockCategories: Category[] = [
            {
                id: 1,
                slug: 'cars',
                name: 'السيارات',
                icon: '🚙',
                is_active: true,
                is_global_image_active: true,
                global_image_url: 'uploads/categories/global/1_1704123456.webp',
                global_image_full_url:
                    'https://back.nasmasr.app/storage/uploads/categories/global/1_1704123456.webp',
                sort_order: 1,
            },
            {
                id: 2,
                slug: 'real-estate',
                name: 'عقارات',
                icon: '🏠',
                is_active: true,
                is_global_image_active: false, // No unified image
                global_image_url: undefined,
                sort_order: 2,
            },
            {
                id: 3,
                slug: 'electronics',
                name: 'إلكترونيات',
                icon: '📱',
                is_active: true,
                is_global_image_active: false,
                global_image_url: undefined,
                sort_order: 3,
            },
        ];

        // Fetch categories
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockCategories,
        });

        const categories = await fetchAdminCategories();

        // Verify all categories are returned
        expect(categories).toHaveLength(3);

        // Verify category with unified image
        const categoryWithUnifiedImage = categories.find((c) => c.id === 1);
        expect(categoryWithUnifiedImage).toBeDefined();
        expect(categoryWithUnifiedImage!.is_global_image_active).toBe(true);
        expect(categoryWithUnifiedImage!.global_image_url).toBeDefined();

        // Verify categories without unified images
        const categoriesWithoutUnifiedImage = categories.filter(
            (c) => c.id === 2 || c.id === 3
        );
        expect(categoriesWithoutUnifiedImage).toHaveLength(2);
        categoriesWithoutUnifiedImage.forEach((category) => {
            expect(category.is_global_image_active).toBe(false);
            expect(category.global_image_url).toBeUndefined();
        });

        // Enable unified image for one of the categories without it
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 2,
                is_global_image_active: true,
                global_image_url: null,
                message: 'تم تحديث حالة الصورة الموحدة بنجاح',
            }),
        });

        await toggleCategoryGlobalImage(2, true);

        // Verify other categories are not affected
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                mockCategories[0], // Category 1 unchanged
                { ...mockCategories[1], is_global_image_active: true }, // Category 2 updated
                mockCategories[2], // Category 3 unchanged
            ],
        });

        const updatedCategories = await fetchAdminCategories();

        expect(updatedCategories[0].is_global_image_active).toBe(true); // Still enabled
        expect(updatedCategories[1].is_global_image_active).toBe(true); // Now enabled
        expect(updatedCategories[2].is_global_image_active).toBe(false); // Still disabled
    });

    /**
     * Test toggle reversion: disable → revert to original images
     * 
     * This test validates that disabling unified images properly reverts
     * the system state while preserving the uploaded image for potential re-enabling.
     */
    it('should handle toggle reversion correctly', async () => {
        const mockCategory: Category = {
            id: 1,
            slug: 'cars',
            name: 'السيارات',
            icon: '🚙',
            is_active: true,
            is_global_image_active: true,
            global_image_url: 'uploads/categories/global/1_1704123456.webp',
            global_image_full_url:
                'https://back.nasmasr.app/storage/uploads/categories/global/1_1704123456.webp',
            sort_order: 1,
        };

        // Initial state: unified image is enabled
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [mockCategory],
        });

        const initialCategories = await fetchAdminCategories();
        expect(initialCategories[0].is_global_image_active).toBe(true);
        expect(initialCategories[0].global_image_url).toBeDefined();

        const originalImageUrl = initialCategories[0].global_image_url;

        // Disable unified image
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 1,
                is_global_image_active: false,
                global_image_url: originalImageUrl, // Image URL preserved
                message: 'تم تحديث حالة الصورة الموحدة بنجاح',
            }),
        });

        await toggleCategoryGlobalImage(1, false);

        // Verify disable request
        expect(mockFetch).toHaveBeenCalledWith(
            `${baseUrl}/admin/categories/1/toggle-global-image`,
            expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify({ is_global_image_active: false }),
            })
        );

        // Fetch categories after disabling
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                {
                    ...mockCategory,
                    is_global_image_active: false,
                    // Image URL is preserved
                    global_image_url: originalImageUrl,
                },
            ],
        });

        const disabledCategories = await fetchAdminCategories();
        expect(disabledCategories[0].is_global_image_active).toBe(false);
        expect(disabledCategories[0].global_image_url).toBe(originalImageUrl);

        // Re-enable unified image
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 1,
                is_global_image_active: true,
                global_image_url: originalImageUrl,
                message: 'تم تحديث حالة الصورة الموحدة بنجاح',
            }),
        });

        await toggleCategoryGlobalImage(1, true);

        // Verify re-enable request
        expect(mockFetch).toHaveBeenCalledWith(
            `${baseUrl}/admin/categories/1/toggle-global-image`,
            expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify({ is_global_image_active: true }),
            })
        );

        // Fetch categories after re-enabling
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                {
                    ...mockCategory,
                    is_global_image_active: true,
                    global_image_url: originalImageUrl,
                },
            ],
        });

        const reEnabledCategories = await fetchAdminCategories();
        expect(reEnabledCategories[0].is_global_image_active).toBe(true);
        expect(reEnabledCategories[0].global_image_url).toBe(originalImageUrl);
    });

    /**
     * Test error handling in integration workflow
     * 
     * This test validates that errors at any step are handled gracefully
     * and don't leave the system in an inconsistent state.
     */
    it('should handle errors gracefully in workflow', async () => {
        // Step 1: Successful toggle
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 1,
                is_global_image_active: true,
                global_image_url: null,
                message: 'تم تحديث حالة الصورة الموحدة بنجاح',
            }),
        });

        await toggleCategoryGlobalImage(1, true);

        // Step 2: Failed upload (validation error)
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 422,
            json: async () => ({
                error: 'صيغة الصورة غير مدعومة',
            }),
        });

        const mockFile = new File(['invalid content'], 'test.pdf', {
            type: 'application/pdf',
        });

        await expect(uploadCategoryGlobalImage(1, mockFile)).rejects.toThrow();

        // Step 3: Successful upload after fixing the error
        const validFile = new File(['image content'], 'test.jpg', {
            type: 'image/jpeg',
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 1,
                is_global_image_active: true,
                global_image_url: 'uploads/categories/global/1_1704123456.webp',
                global_image_full_url:
                    'https://back.nasmasr.app/storage/uploads/categories/global/1_1704123456.webp',
                message: 'تم رفع الصورة الموحدة بنجاح',
            }),
        });

        const result = await uploadCategoryGlobalImage(1, validFile);
        expect(result.global_image_url).toBeDefined();
    });

    /**
     * Test network error handling
     * 
     * This test validates that network errors are properly caught and handled.
     */
    it('should handle network errors', async () => {
        // Simulate network error
        mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        await expect(fetchAdminCategories()).rejects.toThrow();

        // Verify error doesn't break subsequent requests
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        const categories = await fetchAdminCategories();
        expect(categories).toEqual([]);
    });

    /**
     * Test authentication handling
     * 
     * This test validates that authentication is properly handled in all requests.
     */
    it('should include authentication token in all requests', async () => {
        // Test fetchAdminCategories
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        await fetchAdminCategories();

        expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: `Bearer ${mockAuthToken}`,
                }),
            })
        );

        // Test toggleCategoryGlobalImage
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        });

        await toggleCategoryGlobalImage(1, true);

        expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: `Bearer ${mockAuthToken}`,
                }),
            })
        );

        // Test uploadCategoryGlobalImage
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        });

        const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
        await uploadCategoryGlobalImage(1, mockFile);

        expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: `Bearer ${mockAuthToken}`,
                }),
            })
        );
    });
});
