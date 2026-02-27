/**
 * API Service for Option Ranks
 */

export interface RankUpdateRequest {
    field: string;
    ranks: {
        option: string;
        rank: number;
    }[];
}

export interface RankUpdateResponse {
    success: boolean;
    message: string;
    data?: {
        updated_count: number;
    };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://back.nasmasr.app/api';

/**
 * Update option ranks for a category field
 */
export async function updateOptionRanks(
    categorySlug: string,
    field: string,
    ranks: { option: string; rank: number }[]
): Promise<RankUpdateResponse> {
    const token = typeof window !== 'undefined'
        ? localStorage.getItem('authToken')
        : null;

    if (!token) {
        throw new Error('Authentication token not found');
    }

    const response = await fetch(
        `${API_BASE_URL}/admin/categories/${categorySlug}/options/ranks`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                field,
                ranks,
            }),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
            throw new Error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
        }

        if (response.status === 403) {
            throw new Error('ليس لديك صلاحية لتعديل الترتيب');
        }

        if (response.status === 422) {
            throw new Error(errorData.message || 'بيانات غير صالحة');
        }

        if (response.status === 404) {
            throw new Error('القسم غير موجود');
        }

        throw new Error(errorData.message || 'فشل تحديث الترتيب');
    }

    return response.json();
}

/**
 * Update option ranks with retry logic for network failures
 */
export async function updateOptionRanksWithRetry(
    categorySlug: string,
    field: string,
    ranks: { option: string; rank: number }[],
    maxRetries: number = 3
): Promise<RankUpdateResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await updateOptionRanks(categorySlug, field, ranks);
        } catch (error) {
            lastError = error as Error;

            // Don't retry on validation or auth errors
            if (
                error instanceof Error &&
                (error.message.includes('بيانات غير صالحة') ||
                    error.message.includes('صلاحية') ||
                    error.message.includes('غير موجود'))
            ) {
                throw error;
            }

            // Retry on network errors
            if (attempt < maxRetries) {
                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
        }
    }

    throw lastError || new Error('فشل تحديث الترتيب بعد عدة محاولات');
}
