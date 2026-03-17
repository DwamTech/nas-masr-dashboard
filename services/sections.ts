'use client';

/**
 * Sections API Service
 * 
 * Handles API calls for unified categories that use main_sections → sub_sections
 * structure (e.g., car-services, home-services, animals, tools, etc.)
 * 
 * API Endpoints:
 * - GET    /api/admin/filter-lists/sections?category_slug=X → dashboard read model
 * - GET    /api/admin/filter-lists/sections/{mainSection}/sub-sections → dashboard read model
 * - POST   /api/admin/main-section/{categorySlug}    → create main section
 * - POST   /api/admin/sub-section/{mainSection}      → add sub sections
 * - PUT    /api/admin/main-section/{mainSection}      → update main section
 * - PUT    /api/admin/sub-section/{subSection}        → update sub section
 * - DELETE /api/admin/main-section/{mainSection}      → delete main section
 * - DELETE /api/admin/sub-section/{subSection}         → delete sub section
 */

import { MainSection, MainSectionsResponse, SubSection } from '@/types/filters-lists';
import { API_BASE, API_ADMIN_BASE, getAuthHeaders } from '@/utils/api';
import { cache, CACHE_TIMES } from '@/utils/cache';

const mainSectionsRequests = new Map<string, Promise<MainSectionsResponse>>();
const subSectionsRequests = new Map<string, Promise<SubSection[]>>();

function getMainSectionsCacheKey(categorySlug: string, includeInactive: boolean): string {
    return includeInactive ? `sections:${categorySlug}:main:with-inactive` : `sections:${categorySlug}:main`;
}

function getSubSectionsCacheKey(mainSectionId: number, includeInactive: boolean): string {
    return includeInactive ? `sections:sub:${mainSectionId}:with-inactive` : `sections:sub:${mainSectionId}`;
}

/**
 * Fetch main sections with their sub sections for a category
 */
export async function fetchMainSections(categorySlug: string, options?: { includeInactive?: boolean }): Promise<MainSectionsResponse> {
    const includeInactive = options?.includeInactive === true;
    const cacheKey = getMainSectionsCacheKey(categorySlug, includeInactive);
    const cached = cache.get<MainSectionsResponse>(cacheKey);
    if (cached) {
        return cached;
    }

    const inFlight = mainSectionsRequests.get(cacheKey);
    if (inFlight) {
        return inFlight;
    }

    const request = (async () => {
        const search = new URLSearchParams({ category_slug: categorySlug });
        if (includeInactive) {
            search.set('include_inactive', '1');
        }

        const res = await fetch(`${API_BASE}/admin/filter-lists/sections?${search.toString()}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!res.ok) {
            throw new Error('فشل تحميل الأقسام الرئيسية');
        }

        const data = await res.json();
        cache.set(cacheKey, data, CACHE_TIMES.CATEGORY_FIELDS);
        return data;
    })().finally(() => {
        mainSectionsRequests.delete(cacheKey);
    });

    mainSectionsRequests.set(cacheKey, request);
    return request;
}

export async function prefetchMainSections(categorySlug: string, options?: { includeInactive?: boolean }): Promise<void> {
    try {
        await fetchMainSections(categorySlug, options);
    } catch {
        // Best-effort prefetch only.
    }
}

/**
 * Fetch sub sections for a specific main section
 */
export async function fetchSubSections(mainSectionId: number, options?: { includeInactive?: boolean }): Promise<SubSection[]> {
    const includeInactive = options?.includeInactive === true;
    const cacheKey = getSubSectionsCacheKey(mainSectionId, includeInactive);
    const cached = cache.get<SubSection[]>(cacheKey);
    if (cached) {
        return cached;
    }

    const inFlight = subSectionsRequests.get(cacheKey);
    if (inFlight) {
        return inFlight;
    }

    const request = (async () => {
        const suffix = includeInactive ? '?include_inactive=1' : '';
        const res = await fetch(`${API_BASE}/admin/filter-lists/sections/${mainSectionId}/sub-sections${suffix}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!res.ok) {
            throw new Error('فشل تحميل الأقسام الفرعية');
        }

        const data = await res.json();
        cache.set(cacheKey, data, CACHE_TIMES.CATEGORY_FIELDS);
        return data;
    })().finally(() => {
        subSectionsRequests.delete(cacheKey);
    });

    subSectionsRequests.set(cacheKey, request);
    return request;
}

/**
 * Create a new main section for a category
 */
export async function createMainSection(categorySlug: string, name: string, title?: string): Promise<MainSection> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/main-section/${categorySlug}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, title }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل إنشاء القسم الرئيسي');
    }

    const data = await res.json();
    cache.invalidate(`sections:${categorySlug}`);
    return data;
}

/**
 * Add sub sections to a main section
 */
export async function addSubSections(mainSectionId: number, subSectionNames: string[]): Promise<{ main_section_id: number; sub_sections: SubSection[] }> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/sub-section/${mainSectionId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sub_sections: subSectionNames }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل إضافة الأقسام الفرعية');
    }

    const data = await res.json();
    cache.invalidate('sections:');
    return data;
}

/**
 * Update a main section name/title
 */
export async function updateMainSection(mainSectionId: number, data: { name?: string; title?: string }): Promise<MainSection> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/main-section/${mainSectionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل تعديل القسم الرئيسي');
    }

    const response = await res.json();
    cache.invalidate('sections:');
    return response;
}

/**
 * Update a sub section name/title
 */
export async function updateSubSection(subSectionId: number, data: { name?: string; title?: string }): Promise<SubSection> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/sub-section/${subSectionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل تعديل القسم الفرعي');
    }

    const response = await res.json();
    cache.invalidate('sections:');
    return response;
}

export async function setMainSectionVisibility(mainSectionId: number, isActive: boolean): Promise<MainSection> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/main-section/${mainSectionId}/visibility`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: isActive }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل تحديث حالة القسم الرئيسي');
    }

    const response = await res.json();
    cache.invalidate('sections:');
    return response;
}

export async function setSubSectionVisibility(subSectionId: number, isActive: boolean): Promise<SubSection> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/sub-section/${subSectionId}/visibility`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: isActive }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل تحديث حالة القسم الفرعي');
    }

    const response = await res.json();
    cache.invalidate('sections:');
    return response;
}

/**
 * Delete a main section (fails if used by listings)
 */
export async function deleteMainSection(mainSectionId: number): Promise<void> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/main-section/${mainSectionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل حذف القسم الرئيسي');
    }

    cache.invalidate('sections:');
}

/**
 * Delete a sub section (fails if used by listings)
 */
export async function deleteSubSection(subSectionId: number): Promise<void> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/sub-section/${subSectionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل حذف القسم الفرعي');
    }

    cache.invalidate('sections:');
}

/**
 * Update the rank (sort_order) of main sections
 */
export async function updateMainSectionRanks(ranks: { id: number; rank: number }[]): Promise<void> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/category-sections/main/ranks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ranks }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل تحديث ترتيب الأقسام الرئيسية');
    }

    cache.invalidate('sections:');
}

/**
 * Update the rank (sort_order) of sub sections
 */
export async function updateSubSectionRanks(ranks: { id: number; rank: number }[]): Promise<void> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/category-sections/sub/ranks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ranks }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل تحديث ترتيب الأقسام الفرعية');
    }

    cache.invalidate('sections:');
}
