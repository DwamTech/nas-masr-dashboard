/**
 * Governorate Admin API Service — خدمة إدارة المحافظات والمدن
 *
 * Handles all CRUD operations for governorates and cities.
 * Uses the dedicated admin endpoints from GovernorateController.
 *
 * API Endpoints:
 * - GET    /api/admin/filter-lists/governorates       → dashboard read model
 * - POST   /api/admin/governorates                     → create governorate
 * - PUT    /api/admin/governorates/{id}                → update governorate
 * - PATCH  /api/admin/governorates/{id}/visibility     → toggle governorate visibility
 * - POST   /api/admin/city/{governorateId}             → add city
 * - PUT    /api/admin/cities/{id}                      → update city
 * - PATCH  /api/admin/cities/{id}/visibility           → toggle city visibility
 */

import { API_BASE, API_ADMIN_BASE, getAuthHeaders } from '@/utils/api';
import { Governorate } from '@/models/governorates';
import { cache, CACHE_TIMES } from '@/utils/cache';

const adminGovernoratesRequests = new Map<string, Promise<Governorate[]>>();

function getAdminGovernoratesCacheKey(includeInactive: boolean): string {
    return includeInactive ? 'admin-governorates:all:with-inactive' : 'admin-governorates:all';
}

/**
 * Fetch all governorates with their cities
 * Filters out the virtual "غير ذلك" entry
 */
export async function fetchAllGovernorates(options?: { includeInactive?: boolean }): Promise<Governorate[]> {
    const includeInactive = options?.includeInactive === true;
    const cacheKey = getAdminGovernoratesCacheKey(includeInactive);
    const cached = cache.get<Governorate[]>(cacheKey);
    if (cached) {
        return cached;
    }

    const inFlight = adminGovernoratesRequests.get(cacheKey);
    if (inFlight) {
        return inFlight;
    }

    const request = (async () => {
        const search = includeInactive ? '?include_inactive=1' : '';
        const res = await fetch(`${API_BASE}/admin/filter-lists/governorates${search}`, {
            headers: getAuthHeaders(),
        });

        if (!res.ok) throw new Error('فشل تحميل المحافظات');

        const data: Governorate[] = await res.json();
        const normalized = data.filter(g => g.name !== 'غير ذلك' && g.id !== null);
        cache.set(cacheKey, normalized, CACHE_TIMES.GOVERNORATES);
        return normalized;
    })().finally(() => {
        adminGovernoratesRequests.delete(cacheKey);
    });

    adminGovernoratesRequests.set(cacheKey, request);
    return request;
}

export async function prefetchAllGovernorates(options?: { includeInactive?: boolean }): Promise<void> {
    try {
        await fetchAllGovernorates(options);
    } catch {
        // Best-effort prefetch only.
    }
}

/**
 * Create a new governorate (auto-creates "غير ذلك" city)
 */
export async function createGovernorate(name: string): Promise<Governorate> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/governorates`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل إضافة المحافظة');
    }

    const data = await res.json();
    cache.invalidate('governorates');
    cache.invalidate('admin-governorates');
    return data;
}

/**
 * Update a governorate name
 */
export async function updateGovernorate(id: number, name: string): Promise<Governorate> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/governorates/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل تعديل المحافظة');
    }

    const data = await res.json();
    cache.invalidate('governorates');
    cache.invalidate('admin-governorates');
    return data;
}

export async function setGovernorateVisibility(id: number, isActive: boolean): Promise<Governorate> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/governorates/${id}/visibility`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: isActive }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل تحديث حالة المحافظة');
    }

    const data = await res.json();
    cache.invalidate('governorates');
    cache.invalidate('admin-governorates');
    return data;
}

/**
 * Add a city to a governorate
 */
export async function createCity(governorateId: number, name: string): Promise<{ id: number; name: string }> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/city/${governorateId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل إضافة المدينة');
    }

    const data = await res.json();
    cache.invalidate('governorates');
    cache.invalidate('admin-governorates');
    return data;
}

/**
 * Update a city name
 */
export async function updateCity(id: number, name: string): Promise<{ id: number; name: string }> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/cities/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل تعديل المدينة');
    }

    const data = await res.json();
    cache.invalidate('governorates');
    cache.invalidate('admin-governorates');
    return data;
}

export async function setCityVisibility(id: number, isActive: boolean): Promise<{ id: number; name: string; governorate_id: number; is_active?: boolean }> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/cities/${id}/visibility`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: isActive }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل تحديث حالة المدينة');
    }

    const data = await res.json();
    cache.invalidate('governorates');
    cache.invalidate('admin-governorates');
    return data;
}

/**
 * Update governorate ranks (sort order)
 */
export async function updateGovernorateRanks(ranks: { id: number; rank: number }[]): Promise<void> {
    console.log('Calling updateGovernorateRanks with:', ranks);

    const url = `${API_ADMIN_BASE}/api/admin/governorates/ranks`;
    console.log('Request URL:', url);

    const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ranks }),
        cache: 'no-store',
    });

    console.log('Response status:', res.status, res.statusText);

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Error response:', data);
        throw new Error(data.message || `فشل حفظ ترتيب المحافظات (${res.status})`);
    }

    cache.invalidate('governorates');
    cache.invalidate('admin-governorates');
}

/**
 * Update city ranks (sort order) for a specific governorate
 */
export async function updateCityRanks(ranks: { id: number; rank: number }[]): Promise<void> {
    console.log('Calling updateCityRanks with:', ranks);

    const url = `${API_ADMIN_BASE}/api/admin/cities/ranks`;
    console.log('Request URL:', url);

    const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ranks }),
        cache: 'no-store',
    });

    console.log('Response status:', res.status, res.statusText);

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Error response:', data);
        throw new Error(data.message || `فشل حفظ ترتيب المدن (${res.status})`);
    }

    cache.invalidate('governorates');
    cache.invalidate('admin-governorates');
}
