/**
 * Option Ranks API Service
 * 
 * Handles API calls for updating option ranks
 */

import { RankData, RankUpdateResponse } from '@/types/filters-lists';
import { retryWithBackoff } from '@/utils/retry';

const API_BASE = process.env.LARAVEL_API_URL || 'https://back.nasmasr.app/api';

/**
 * Update option ranks for a category field
 * @param categorySlug - Category slug
 * @param field - Field name
 * @param ranks - Array of rank data
 * @param parentId - Optional parent ID for hierarchical lists
 * @param token - Optional authentication token
 * @returns Rank update response
 */
export async function updateOptionRanks(
    categorySlug: string,
    field: string,
    ranks: RankData[],
    parentId?: string,
    token?: string
): Promise<RankUpdateResponse> {
    const operation = async () => {
        const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
        const headers: Record<string, string> = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        };
        if (t) headers.Authorization = `Bearer ${t}`;

        const payload: any = {
            field,
            ranks,
        };

        // Include parent context for hierarchical lists
        if (parentId) {
            payload.parentId = parentId;
        }

        const res = await fetch(`${API_BASE}/admin/categories/${categorySlug}/options/ranks`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));

            // Handle specific status codes
            switch (res.status) {
                case 401:
                    throw new Error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
                case 403:
                    throw new Error('ليس لديك صلاحية لتنفيذ هذا الإجراء');
                case 404:
                    throw new Error('المورد المطلوب غير موجود');
                case 422:
                    throw new Error(errorData.message || 'بيانات غير صالحة');
                default:
                    throw new Error(errorData.message || 'حدث خطأ غير متوقع');
            }
        }

        const data = await res.json() as RankUpdateResponse;
        return data;
    };

    return retryWithBackoff(operation, {
        maxAttempts: 3,
        shouldRetry: (error: Error) => {
            // Don't retry on validation or auth errors
            const message = error.message;
            return !(
                message.includes('بيانات غير صالحة') ||
                message.includes('صلاحية') ||
                message.includes('غير موجود')
            );
        },
    });
}

/**
 * Update option ranks with retry logic (legacy export for backward compatibility)
 * @deprecated Use updateOptionRanks instead
 */
export const updateOptionRanksWithRetry = updateOptionRanks;

