import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCategories } from '../categories';
import * as retryModule from '@/utils/retry';

// Mock the retry utility
vi.mock('@/utils/retry', () => ({
    retryWithBackoff: vi.fn((operation) => operation()),
}));

describe('Categories API Service', () => {
    const mockToken = 'test-token-123';
    const mockCategories = [
        {
            id: 1,
            slug: 'cars',
            name: 'سيارات',
            icon: 'car.png',
            is_active: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
        },
        {
            id: 2,
            slug: 'real-estate',
            name: 'عقارات',
            icon: 'home.png',
            is_active: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('successful requests', () => {
        it('should fetch categories successfully with token', async () => {
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({ data: mockCategories }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            const result = await fetchCategories(mockToken);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/admin/categories'),
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        Accept: 'application/json',
                        Authorization: `Bearer ${mockToken}`,
                    }),
                })
            );
            expect(result).toEqual(mockCategories);
        });

        it('should fetch categories without token', async () => {
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({ data: mockCategories }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            const result = await fetchCategories();

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/admin/categories'),
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        Accept: 'application/json',
                    }),
                })
            );
            expect(result).toEqual(mockCategories);
        });

        it('should return empty array when data is missing', async () => {
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            const result = await fetchCategories(mockToken);

            expect(result).toEqual([]);
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

            await expect(fetchCategories(mockToken)).rejects.toThrow(
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

            await expect(fetchCategories(mockToken)).rejects.toThrow(
                'ليس لديك صلاحية لتنفيذ هذا الإجراء'
            );
        });

        it('should handle 404 Not Found error', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                json: vi.fn().mockResolvedValue({ message: 'Not Found' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(fetchCategories(mockToken)).rejects.toThrow(
                'المورد المطلوب غير موجود'
            );
        });

        it('should handle 422 Validation error with custom message', async () => {
            const mockResponse = {
                ok: false,
                status: 422,
                json: vi.fn().mockResolvedValue({ message: 'Invalid category slug' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(fetchCategories(mockToken)).rejects.toThrow('Invalid category slug');
        });

        it('should handle 422 Validation error with default message', async () => {
            const mockResponse = {
                ok: false,
                status: 422,
                json: vi.fn().mockResolvedValue({}),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(fetchCategories(mockToken)).rejects.toThrow('بيانات غير صالحة');
        });

        it('should handle 500 Server error with custom message', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                json: vi.fn().mockResolvedValue({ message: 'Database connection failed' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(fetchCategories(mockToken)).rejects.toThrow('Database connection failed');
        });

        it('should handle 500 Server error with default message', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                json: vi.fn().mockResolvedValue({}),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(fetchCategories(mockToken)).rejects.toThrow('حدث خطأ غير متوقع');
        });

        it('should handle malformed JSON response', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(fetchCategories(mockToken)).rejects.toThrow('حدث خطأ غير متوقع');
        });
    });

    describe('retry logic', () => {
        it('should use retryWithBackoff wrapper', async () => {
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({ data: mockCategories }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await fetchCategories(mockToken);

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

            // Get the shouldRetry function from the call
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

            await expect(fetchCategories(mockToken)).rejects.toThrow();
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

            await expect(fetchCategories(mockToken)).rejects.toThrow();
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

            await expect(fetchCategories(mockToken)).rejects.toThrow();
        });
    });
});
