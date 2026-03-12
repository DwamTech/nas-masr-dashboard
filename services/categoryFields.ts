/**
 * Category Fields API Service
 * 
 * Handles API calls for fetching category fields
 */

import { CategoryField, CategoryFieldsResponse } from '@/types/filters-lists';
import { retryWithBackoff } from '@/utils/retry';

const API_BASE = process.env.LARAVEL_API_URL || 'https://back.nasmasr.app/api';

/**
 * Fetch category fields for a specific category
 * @param categorySlug - Category slug
 * @param token - Optional authentication token
 * @returns Category fields response with fields and related data
 */
export async function fetchCategoryFields(
    categorySlug: string,
    token?: string
): Promise<CategoryFieldsResponse> {
    const operation = async () => {
        const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (t) headers.Authorization = `Bearer ${t}`;

        const res = await fetch(`${API_BASE}/admin/category-fields?category_slug=${categorySlug}`, {
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
        return normalizeCategoryFieldsResponse(categorySlug, data);
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
