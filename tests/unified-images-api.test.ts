/**
 * Unit Tests for Unified Category Images API Service Functions
 * Task 4.5: إنشاء API Service Functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    fetchAdminCategories,
    toggleCategoryGlobalImage,
    uploadCategoryGlobalImage,
    deleteCategoryGlobalImage,
} from '@/services/makes';

// Mock fetch globally
global.fetch = vi.fn();

describe('Unified Category Images API Service Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset fetch mock completely
        (global.fetch as any).mockReset();

        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(() => 'mock-token'),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn(),
            },
            writable: true,
        });
    });

    describe('fetchAdminCategories', () => {
        it('should fetch categories with unified image fields', async () => {
            const mockCategories = [
                {
                    id: 1,
                    name: 'السيارات',
                    slug: 'cars',
                    icon: '🚙',
                    is_active: true,
                    is_global_image_active: false,
                    global_image_url: null,
                    global_image_full_url: null,
                },
                {
                    id: 2,
                    name: 'عقارات',
                    slug: 'real_estate',
                    icon: '🏠',
                    is_active: true,
                    is_global_image_active: true,
                    global_image_url: 'uploads/categories/global/2_1234567890.webp',
                    global_image_full_url: 'https://back.nasmasr.app/storage/uploads/categories/global/2_1234567890.webp',
                },
            ];

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockCategories,
            });

            const result = await fetchAdminCategories('test-token');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://back.nasmasr.app/api/admin/categories',
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        Accept: 'application/json',
                        Authorization: 'Bearer test-token',
                    }),
                })
            );

            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('is_global_image_active', false);
            expect(result[1]).toHaveProperty('is_global_image_active', true);
            expect(result[1]).toHaveProperty('global_image_url');
        });

        it('should handle network errors', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Network error' }),
            });

            await expect(fetchAdminCategories()).rejects.toThrow();
        });
    });

    describe('toggleCategoryGlobalImage', () => {
        it('should toggle unified image status to true', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 1,
                    is_global_image_active: true,
                    message: 'تم تحديث حالة الصورة الموحدة بنجاح',
                }),
            });

            await toggleCategoryGlobalImage(1, true, 'test-token');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://back.nasmasr.app/api/admin/categories/1/toggle-global-image',
                expect.objectContaining({
                    method: 'PUT',
                    headers: expect.objectContaining({
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer test-token',
                    }),
                    body: JSON.stringify({ is_global_image_active: true }),
                })
            );
        });

        it('should toggle unified image status to false', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 1,
                    is_global_image_active: false,
                    message: 'تم تحديث حالة الصورة الموحدة بنجاح',
                }),
            });

            await toggleCategoryGlobalImage(1, false, 'test-token');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://back.nasmasr.app/api/admin/categories/1/toggle-global-image',
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({ is_global_image_active: false }),
                })
            );
        });

        it('should handle authentication errors', async () => {
            // Mock all retry attempts to return the same error
            (global.fetch as any)
                .mockResolvedValueOnce({
                    ok: false,
                    status: 401,
                    json: async () => ({ error: 'غير مصرح' }),
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 401,
                    json: async () => ({ error: 'غير مصرح' }),
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 401,
                    json: async () => ({ error: 'غير مصرح' }),
                });

            await expect(toggleCategoryGlobalImage(1, true)).rejects.toThrow('غير مصرح');
        });
    });

    describe('uploadCategoryGlobalImage', () => {
        it('should upload image with FormData', async () => {
            const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            const mockResponse = {
                id: 1,
                global_image_url: 'uploads/categories/global/1_1234567890.webp',
                global_image_full_url: 'https://back.nasmasr.app/storage/uploads/categories/global/1_1234567890.webp',
                is_global_image_active: true,
                message: 'تم رفع الصورة الموحدة بنجاح',
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await uploadCategoryGlobalImage(1, mockFile, 'test-token');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://back.nasmasr.app/api/admin/categories/1/upload-global-image',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        Accept: 'application/json',
                        Authorization: 'Bearer test-token',
                    }),
                })
            );

            expect(result).toHaveProperty('id', 1);
            expect(result).toHaveProperty('global_image_url');
            expect(result).toHaveProperty('is_global_image_active', true);
        });

        it('should handle upload errors', async () => {
            const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            // Mock retry attempts (upload only retries once on network errors, not on 4xx errors)
            (global.fetch as any)
                .mockResolvedValueOnce({
                    ok: false,
                    status: 413,
                    json: async () => ({ error: 'حجم الصورة كبير جداً' }),
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 413,
                    json: async () => ({ error: 'حجم الصورة كبير جداً' }),
                });

            await expect(uploadCategoryGlobalImage(1, mockFile)).rejects.toThrow('حجم الصورة كبير جداً');
        });

        it('should handle invalid response', async () => {
            const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            // Mock retry attempts
            (global.fetch as any)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => null,
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => null,
                });

            await expect(uploadCategoryGlobalImage(1, mockFile)).rejects.toThrow('استجابة غير صالحة من الخادم');
        });
    });

    describe('deleteCategoryGlobalImage', () => {
        it('should delete unified image', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 1,
                    global_image_url: null,
                    message: 'تم حذف الصورة الموحدة بنجاح',
                }),
            });

            await deleteCategoryGlobalImage(1, 'test-token');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://back.nasmasr.app/api/admin/categories/1/global-image',
                expect.objectContaining({
                    method: 'DELETE',
                    headers: expect.objectContaining({
                        Accept: 'application/json',
                        Authorization: 'Bearer test-token',
                    }),
                })
            );
        });

        it('should handle delete errors', async () => {
            // Mock all retry attempts to return the same error
            (global.fetch as any)
                .mockResolvedValueOnce({
                    ok: false,
                    status: 404,
                    json: async () => ({ error: 'الصورة غير موجودة' }),
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 404,
                    json: async () => ({ error: 'الصورة غير موجودة' }),
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 404,
                    json: async () => ({ error: 'الصورة غير موجودة' }),
                });

            await expect(deleteCategoryGlobalImage(1)).rejects.toThrow('الصورة غير موجودة');
        });
    });

    describe('Authentication Header Handling', () => {
        it('should use provided token', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            });

            await fetchAdminCategories('custom-token');

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer custom-token',
                    }),
                })
            );
        });

        it('should use localStorage token when no token provided', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            });

            await fetchAdminCategories();

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer mock-token',
                    }),
                })
            );
        });
    });
});
