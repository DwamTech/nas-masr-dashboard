import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCategoryFields } from '../categoryFields';
import * as retryModule from '@/utils/retry';

// Mock the retry utility
vi.mock('@/utils/retry', () => ({
    retryWithBackoff: vi.fn((operation) => operation()),
}));

describe('Category Fields API Service', () => {
    const mockToken = 'test-token-123';
    const mockCategorySlug = 'cars';
    const mockCategoryFields = {
        data: [
            {
                id: 1,
                category_slug: 'cars',
                field_name: 'condition',
                display_name: 'الحالة',
                type: 'select' as const,
                required: true,
                filterable: true,
                options: ['جديد', 'مستعمل', 'غير ذلك'],
                is_active: true,
                sort_order: 1,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            },
        ],
        governorates: [],
        makes: [],
        supports_make_model: false,
        supports_sections: false,
        main_sections: [],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('successful requests', () => {
        it('should fetch category fields successfully with token', async () => {
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue(mockCategoryFields),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            const result = await fetchCategoryFields(mockCategorySlug, mockToken);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/admin/category-fields?category_slug=${mockCategorySlug}`),
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        Accept: 'application/json',
                        Authorization: `Bearer ${mockToken}`,
                    }),
                })
            );
            expect(result).toEqual(mockCategoryFields);
        });

        it('should fetch category fields without token', async () => {
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue(mockCategoryFields),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            const result = await fetchCategoryFields(mockCategorySlug);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/admin/category-fields?category_slug=${mockCategorySlug}`),
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        Accept: 'application/json',
                    }),
                })
            );
            expect(result).toEqual(mockCategoryFields);
        });

        it('should handle different category slugs', async () => {
            const realEstateSlug = 'real-estate';
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue(mockCategoryFields),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await fetchCategoryFields(realEstateSlug, mockToken);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`category_slug=${realEstateSlug}`),
                expect.any(Object)
            );
        });
    });

    describe('error handling - status codes', () => {
        it('should handle 401 Unauthorized error', async () => {
            const mockResponse = {
                ok: false,
                status: 401,
                json: vi.fn().mockResolvedValue({ message: 'Unauthorized' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(fetchCategoryFields(mockCategorySlug, mockToken)).rejects.toThrow(
                'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
            );
        });

        it('should handle 403 Forbidden error', async () => {
            const mockResponse = {
                ok: false,
                status: 403,
                json: vi.fn().mockResolvedValue({ message: 'Forbidden' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(fetchCategoryFields(mockCategorySlug, mockToken)).rejects.toThrow(
                'ليس لديك صلاحية لتنفيذ هذا الإجراء'
            );
        });

        it('should handle 404 Not Found error', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                json: vi.fn().mockResolvedValue({ message: 'Category not found' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(fetchCategoryFields(mockCategorySlug, mockToken)).rejects.toThrow(
                'المورد المطلوب غير موجود'
            );
        });

        it('should handle 422 Validation error with custom message', async () => {
            const mockResponse = {
                ok: false,
                status: 422,
                json: vi.fn().mockResolvedValue({ message: 'Invalid category slug format' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(fetchCategoryFields(mockCategorySlug, mockToken)).rejects.toThrow(
                'Invalid category slug format'
            );
        });

        it('should handle 422 Validation error with default message', async () => {
            const mockResponse = {
                ok: false,
                status: 422,
                json: vi.fn().mockResolvedValue({}),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(fetchCategoryFields(mockCategorySlug, mockToken)).rejects.toThrow(
                'بيانات غير صالحة'
            );
        });

        it('should handle 500 Server error with custom message', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                json: vi.fn().mockResolvedValue({ message: 'Database query failed' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(fetchCategoryFields(mockCategorySlug, mockToken)).rejects.toThrow(
                'Database query failed'
            );
        });

        it('should handle 500 Server error with default message', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                json: vi.fn().mockResolvedValue({}),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(fetchCategoryFields(mockCategorySlug, mockToken)).rejects.toThrow(
                'حدث خطأ غير متوقع'
            );
        });

        it('should handle malformed JSON response', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(fetchCategoryFields(mockCategorySlug, mockToken)).rejects.toThrow(
                'حدث خطأ غير متوقع'
            );
        });
    });

    describe('retry logic', () => {
        it('should use retryWithBackoff wrapper', async () => {
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue(mockCategoryFields),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await fetchCategoryFields(mockCategorySlug, mockToken);

            expect(retryModule.retryWithBackoff).toHaveBeenCalledWith(
                expect.any(Function),
                expect.objectContaining({
                    maxAttempts: 3,
                    shouldRetry: expect.any(Function),
                })
            );
        });

        it('should not retry on validation errors', async () => {
            const mockResponse = {
                ok: false,
                status: 422,
                json: vi.fn().mockResolvedValue({ message: 'بيانات غير صالحة' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            vi.mocked(retryModule.retryWithBackoff).mockImplementation(async (operation, options) => {
                try {
                    return await operation();
                } catch (error) {
                    const shouldRetry = options?.shouldRetry;
                    if (shouldRetry && error instanceof Error) {
                        expect(shouldRetry(error, 1)).toBe(false);
                    }
                    throw error;
                }
            });

            await expect(fetchCategoryFields(mockCategorySlug, mockToken)).rejects.toThrow();
        });

        it('should not retry on auth errors', async () => {
            const mockResponse = {
                ok: false,
                status: 401,
                json: vi.fn().mockResolvedValue({}),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            vi.mocked(retryModule.retryWithBackoff).mockImplementation(async (operation, options) => {
                try {
                    return await operation();
                } catch (error) {
                    const shouldRetry = options?.shouldRetry;
                    if (shouldRetry && error instanceof Error) {
                        expect(shouldRetry(error, 1)).toBe(false);
                    }
                    throw error;
                }
            });

            await expect(fetchCategoryFields(mockCategorySlug, mockToken)).rejects.toThrow();
        });

        it('should not retry on not found errors', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                json: vi.fn().mockResolvedValue({}),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            vi.mocked(retryModule.retryWithBackoff).mockImplementation(async (operation, options) => {
                try {
                    return await operation();
                } catch (error) {
                    const shouldRetry = options?.shouldRetry;
                    if (shouldRetry && error instanceof Error) {
                        expect(shouldRetry(error, 1)).toBe(false);
                    }
                    throw error;
                }
            });

            await expect(fetchCategoryFields(mockCategorySlug, mockToken)).rejects.toThrow();
        });

        it('should retry on network failures', async () => {
            const networkError = new Error('Network request failed');

            vi.mocked(retryModule.retryWithBackoff).mockImplementation(async (operation, options) => {
                const shouldRetry = options?.shouldRetry;
                if (shouldRetry) {
                    expect(shouldRetry(networkError, 1)).toBe(true);
                }
                throw networkError;
            });

            await expect(fetchCategoryFields(mockCategorySlug, mockToken)).rejects.toThrow(
                'Network request failed'
            );
        });
    });
});
