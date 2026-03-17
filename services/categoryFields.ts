/**
 * Category Fields API Service
 * 
 * Handles API calls for fetching category fields
 */

import { CategoryField, CategoryFieldsResponse } from '@/types/filters-lists';
import { API_BASE } from '@/utils/api';
import { cache, CACHE_TIMES } from '@/utils/cache';
import { retryWithBackoff } from '@/utils/retry';

const categoryFieldsRequests = new Map<string, Promise<CategoryFieldsResponse>>();

interface FetchCategoryFieldsOptions {
    includeHidden?: boolean;
}

function getCategoryFieldsCacheKey(categorySlug: string, includeHidden: boolean): string {
    return includeHidden ? `fields:${categorySlug}:with-hidden` : `fields:${categorySlug}`;
}

export function clearCategoryFieldsCache(categorySlug?: string): void {
    if (categorySlug) {
        const visibleCacheKey = getCategoryFieldsCacheKey(categorySlug, false);
        const hiddenCacheKey = getCategoryFieldsCacheKey(categorySlug, true);
        categoryFieldsRequests.delete(visibleCacheKey);
        categoryFieldsRequests.delete(hiddenCacheKey);
        cache.invalidate(visibleCacheKey);
        cache.invalidate(hiddenCacheKey);
        return;
    }

    categoryFieldsRequests.clear();
    cache.invalidate('fields:');
}

/**
 * Fetch category fields for a specific category
 * @param categorySlug - Category slug
 * @param token - Optional authentication token
 * @returns Category fields response with fields and related data
 */
export async function fetchCategoryFields(
    categorySlug: string,
    token?: string,
    options?: FetchCategoryFieldsOptions
): Promise<CategoryFieldsResponse> {
    const includeHidden = options?.includeHidden === true;
    const cacheKey = getCategoryFieldsCacheKey(categorySlug, includeHidden);
    const cached = cache.get<CategoryFieldsResponse>(cacheKey);
    if (cached) {
        return cached;
    }

    const inFlight = categoryFieldsRequests.get(cacheKey);
    if (inFlight) {
        return inFlight;
    }

    const request = retryWithBackoff(async () => {
        const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (t) headers.Authorization = `Bearer ${t}`;

        const search = new URLSearchParams({ category_slug: categorySlug });
        if (includeHidden) {
            search.set('include_hidden', '1');
        }

        const res = await fetch(`${API_BASE}/admin/filter-lists/field-category?${search.toString()}`, {
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

        const data = await res.json() as CategoryFieldsResponse;
        const normalized = normalizeCategoryFieldsResponse(categorySlug, data);
        cache.set(cacheKey, normalized, CACHE_TIMES.CATEGORY_FIELDS);
        return normalized;
    }, {
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
    }).finally(() => {
        categoryFieldsRequests.delete(cacheKey);
    });

    categoryFieldsRequests.set(cacheKey, request);
    return request;
}

export async function prefetchCategoryFields(categorySlug: string, token?: string, options?: FetchCategoryFieldsOptions): Promise<void> {
    try {
        await fetchCategoryFields(categorySlug, token, options);
    } catch {
        // Best-effort prefetch only.
    }
}

function normalizeCategoryFieldsResponse(
    categorySlug: string,
    response: CategoryFieldsResponse
): CategoryFieldsResponse {
    const fields = Array.isArray(response.data) ? [...response.data] : [];

    // Spare-parts requires both make/model and main/sub sections in the same modal UI.
    // Backend returns main_sections separately, so we synthesize 2 virtual fields.
    if (categorySlug === 'spare-parts') {
        const sections = Array.isArray(response.main_sections)
            ? response.main_sections
            : [];

        const mainNames = sections
            .map((s: any) => (s?.name ?? '').toString().trim())
            .filter((v: string) => v.length > 0);

        const allSubNames = sections.flatMap((s: any) => {
            const subs = Array.isArray(s?.sub_sections) ? s.sub_sections : [];
            return subs
                .map((sub: any) => (sub?.name ?? '').toString().trim())
                .filter((v: string) => v.length > 0);
        });

        const uniqueMainNames = Array.from(new Set(mainNames));
        const uniqueSubNames = Array.from(new Set(allSubNames));

        upsertVirtualField(
            fields,
            buildVirtualField(categorySlug, 'main_section', 'الرئيسي', uniqueMainNames)
        );
        upsertVirtualField(
            fields,
            buildVirtualField(categorySlug, 'sub_section', 'الفرعي', uniqueSubNames)
        );

        // Keep automotive dependent fields grouped for better UX.
        const preferredOrder = ['brand', 'model', 'main_section', 'sub_section'];
        fields.sort((a, b) => {
            const ai = preferredOrder.indexOf(a.field_name);
            const bi = preferredOrder.indexOf(b.field_name);
            const wa = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
            const wb = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
            if (wa !== wb) return wa - wb;
            return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        });
    }

    return {
        ...response,
        data: fields,
    };
}

function buildVirtualField(
    categorySlug: string,
    fieldName: string,
    displayName: string,
    options: string[]
): CategoryField {
    return {
        id: -1,
        category_slug: categorySlug,
        field_name: fieldName,
        display_name: displayName,
        type: 'select',
        required: false,
        filterable: true,
        options,
        rules_json: {},
        is_active: true,
        sort_order: 9999,
        created_at: '',
        updated_at: '',
    };
}

function upsertVirtualField(fields: CategoryField[], virtualField: CategoryField): void {
    const idx = fields.findIndex(f => f.field_name === virtualField.field_name);
    if (idx >= 0) {
        fields[idx] = {
            ...fields[idx],
            display_name: virtualField.display_name,
            options: virtualField.options,
        };
        return;
    }
    fields.push(virtualField);
}
