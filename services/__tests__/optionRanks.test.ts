import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateOptionRanks } from '../optionRanks';
import * as retryModule from '@/utils/retry';

// Mock the retry utility
vi.mock('@/utils/retry', () => ({
    retryWithBackoff: vi.fn((operation) => operation()),
}));

describe('Option Ranks API Service', () => {
    const mockToken = 'test-token-123';
    const mockCategorySlug = 'cars';
    const mockField = 'condition';
    const mockRanks = [
        { option: 'جديد', rank: 1 },
        { option: 'مستعمل', rank: 2 },
        { option: 'غير ذلك', rank: 3 },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('successful requests - independent lists', () => {
        it('should update option ranks successfully with token', async () => {
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({
                    success: true,
                    message: 'تم تحديث الترتيب بنجاح',
                    data: { updated_count: 3 },
                }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            const result = await updateOptionRanks(
                mockCategorySlug,
                mockField,
                mockRanks,
                undefined,
                mockToken
            );

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`/admin/categories/${mockCategorySlug}/options/ranks`),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${mockToken}`,
                    }),
                    body: JSON.stringify({
                        field: mockField,
                        ranks: mockRanks,
                    }),
                })
            );
            expect(result.success).toBe(true);
            expect(result.data?.updated_count).toBe(3);
        });

        it('should update option ranks without token', async () => {
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({
                    success: true,
                    message: 'تم تحديث الترتيب بنجاح',
                }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await updateOptionRanks(mockCategorySlug, mockField, mockRanks);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.not.objectContaining({
                        Authorization: expect.any(String),
                    }),
                })
            );
        });

        it('should format payload correctly for independent lists', async () => {
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({ success: true, message: 'Success' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await updateOptionRanks(mockCategorySlug, mockField, mockRanks, undefined, mockToken);

            const callArgs = (global.fetch as any).mock.calls[0];
            const body = JSON.parse(callArgs[1].body);

            expect(body).toEqual({
                field: mockField,
                ranks: mockRanks,
            });
            expect(body.parentId).toBeUndefined();
        });
    });

    describe('successful requests - hierarchical lists', () => {
        it('should include parent context for hierarchical lists', async () => {
            const parentId = 'cairo';
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({
                    success: true,
                    message: 'تم تحديث الترتيب بنجاح',
                }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await updateOptionRanks(
                mockCategorySlug,
                'city',
                mockRanks,
                parentId,
                mockToken
            );

            const callArgs = (global.fetch as any).mock.calls[0];
            const body = JSON.parse(callArgs[1].body);

            expect(body).toEqual({
                field: 'city',
                ranks: mockRanks,
                parentId: parentId,
            });
        });

        it('should handle different parent IDs', async () => {
            const parentIds = ['cairo', 'giza', 'alexandria'];
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({ success: true, message: 'Success' }),
            };

            for (const parentId of parentIds) {
                (global.fetch as any).mockResolvedValue(mockResponse);

                await updateOptionRanks(
                    mockCategorySlug,
                    'city',
                    mockRanks,
                    parentId,
                    mockToken
                );

                const callArgs = (global.fetch as any).mock.calls[
                    (global.fetch as any).mock.calls.length - 1
                ];
                const body = JSON.parse(callArgs[1].body);

                expect(body.parentId).toBe(parentId);
            }
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

            await expect(
                updateOptionRanks(mockCategorySlug, mockField, mockRanks, undefined, mockToken)
            ).rejects.toThrow('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
        });

        it('should handle 403 Forbidden error', async () => {
            const mockResponse = {
                ok: false,
                status: 403,
                json: vi.fn().mockResolvedValue({ message: 'Forbidden' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(
                updateOptionRanks(mockCategorySlug, mockField, mockRanks, undefined, mockToken)
            ).rejects.toThrow('ليس لديك صلاحية لتنفيذ هذا الإجراء');
        });

        it('should handle 404 Not Found error', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                json: vi.fn().mockResolvedValue({ message: 'Category not found' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(
                updateOptionRanks(mockCategorySlug, mockField, mockRanks, undefined, mockToken)
            ).rejects.toThrow('المورد المطلوب غير موجود');
        });

        it('should handle 422 Validation error with custom message', async () => {
            const mockResponse = {
                ok: false,
                status: 422,
                json: vi.fn().mockResolvedValue({
                    message: 'Ranks must be sequential starting from 1',
                }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(
                updateOptionRanks(mockCategorySlug, mockField, mockRanks, undefined, mockToken)
            ).rejects.toThrow('Ranks must be sequential starting from 1');
        });

        it('should handle 422 Validation error with default message', async () => {
            const mockResponse = {
                ok: false,
                status: 422,
                json: vi.fn().mockResolvedValue({}),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(
                updateOptionRanks(mockCategorySlug, mockField, mockRanks, undefined, mockToken)
            ).rejects.toThrow('بيانات غير صالحة');
        });

        it('should handle 500 Server error with custom message', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                json: vi.fn().mockResolvedValue({ message: 'Failed to update ranks in database' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(
                updateOptionRanks(mockCategorySlug, mockField, mockRanks, undefined, mockToken)
            ).rejects.toThrow('Failed to update ranks in database');
        });

        it('should handle 500 Server error with default message', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                json: vi.fn().mockResolvedValue({}),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(
                updateOptionRanks(mockCategorySlug, mockField, mockRanks, undefined, mockToken)
            ).rejects.toThrow('حدث خطأ غير متوقع');
        });

        it('should handle malformed JSON response', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await expect(
                updateOptionRanks(mockCategorySlug, mockField, mockRanks, undefined, mockToken)
            ).rejects.toThrow('حدث خطأ غير متوقع');
        });
    });

    describe('retry logic', () => {
        it('should use retryWithBackoff wrapper', async () => {
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({ success: true, message: 'Success' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await updateOptionRanks(mockCategorySlug, mockField, mockRanks, undefined, mockToken);

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

            await expect(
                updateOptionRanks(mockCategorySlug, mockField, mockRanks, undefined, mockToken)
            ).rejects.toThrow();
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

            await expect(
                updateOptionRanks(mockCategorySlug, mockField, mockRanks, undefined, mockToken)
            ).rejects.toThrow();
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

            await expect(
                updateOptionRanks(mockCategorySlug, mockField, mockRanks, undefined, mockToken)
            ).rejects.toThrow();
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

            await expect(
                updateOptionRanks(mockCategorySlug, mockField, mockRanks, undefined, mockToken)
            ).rejects.toThrow('Network request failed');
        });
    });

    describe('payload formatting', () => {
        beforeEach(() => {
            // Reset the mock to default behavior for these tests
            vi.mocked(retryModule.retryWithBackoff).mockImplementation((operation) => operation());
        });

        it('should handle empty ranks array', async () => {
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({ success: true, message: 'Success' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await updateOptionRanks(mockCategorySlug, mockField, [], undefined, mockToken);

            const callArgs = (global.fetch as any).mock.calls[0];
            const body = JSON.parse(callArgs[1].body);

            expect(body.ranks).toEqual([]);
        });

        it('should handle single rank', async () => {
            const singleRank = [{ option: 'جديد', rank: 1 }];
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({ success: true, message: 'Success' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await updateOptionRanks(mockCategorySlug, mockField, singleRank, undefined, mockToken);

            const callArgs = (global.fetch as any).mock.calls[0];
            const body = JSON.parse(callArgs[1].body);

            expect(body.ranks).toEqual(singleRank);
        });

        it('should handle large ranks array', async () => {
            const largeRanks = Array.from({ length: 100 }, (_, i) => ({
                option: `option-${i + 1}`,
                rank: i + 1,
            }));
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({ success: true, message: 'Success' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await updateOptionRanks(mockCategorySlug, mockField, largeRanks, undefined, mockToken);

            const callArgs = (global.fetch as any).mock.calls[0];
            const body = JSON.parse(callArgs[1].body);

            expect(body.ranks).toHaveLength(100);
            expect(body.ranks[0]).toEqual({ option: 'option-1', rank: 1 });
            expect(body.ranks[99]).toEqual({ option: 'option-100', rank: 100 });
        });

        it('should preserve rank order in payload', async () => {
            const unorderedRanks = [
                { option: 'مستعمل', rank: 2 },
                { option: 'غير ذلك', rank: 3 },
                { option: 'جديد', rank: 1 },
            ];
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({ success: true, message: 'Success' }),
            };
            (global.fetch as any).mockResolvedValue(mockResponse);

            await updateOptionRanks(
                mockCategorySlug,
                mockField,
                unorderedRanks,
                undefined,
                mockToken
            );

            const callArgs = (global.fetch as any).mock.calls[0];
            const body = JSON.parse(callArgs[1].body);

            expect(body.ranks).toEqual(unorderedRanks);
        });
    });
});
