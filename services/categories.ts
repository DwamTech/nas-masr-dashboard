/**
 * Categories API Service
 * 
 * Handles API calls for fetching categories
 */

import { Category, CategoriesResponse } from '@/types/filters-lists';
import { API_BASE } from '@/utils/api';
import { retryWithBackoff } from '@/utils/retry';

/**
 * Fetch all categories
 * @param token - Optional authentication token
 * @returns Array of categories
 */
export async function fetchCategories(token?: string): Promise<Category[]> {
    const operation = async () => {
        const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (t) headers.Authorization = `Bearer ${t}`;

        const res = await fetch(`${API_BASE}/admin/categories`, {
            method: 'GET',
            headers,
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

        const data = await res.json() as CategoriesResponse;
        return data.data || [];
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
