/**
 * Governorate Admin API Service — خدمة إدارة المحافظات والمدن
 *
 * Handles all CRUD operations for governorates and cities.
 * Uses the dedicated admin endpoints from GovernorateController.
 *
 * API Endpoints:
 * - GET    /api/governorates                           → list all (with cities)
 * - POST   /api/admin/governorates                     → create governorate
 * - PUT    /api/admin/governorates/{id}                → update governorate
 * - DELETE /api/admin/governorates/{id}                → delete governorate
 * - POST   /api/admin/city/{governorateId}             → add city
 * - PUT    /api/admin/cities/{id}                      → update city
 * - DELETE /api/admin/cities/{id}                      → delete city
 */

import { API_BASE, API_ADMIN_BASE, getAuthHeaders } from '@/utils/api';
import { Governorate } from '@/models/governorates';

/**
 * Fetch all governorates with their cities
 * Filters out the virtual "غير ذلك" entry
 */
export async function fetchAllGovernorates(): Promise<Governorate[]> {
    const res = await fetch(`${API_BASE}/governorates`, {
        headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error('فشل تحميل المحافظات');

    const data: Governorate[] = await res.json();
    return data.filter(g => g.name !== 'غير ذلك' && g.id !== null);
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

    return res.json();
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

    return res.json();
}

/**
 * Delete a governorate (fails if used by listings)
 */
export async function deleteGovernorate(id: number): Promise<void> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/governorates/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل حذف المحافظة');
    }
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

    return res.json();
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

    return res.json();
}

/**
 * Delete a city (fails if used by listings)
 */
export async function deleteCity(id: number): Promise<void> {
    const res = await fetch(`${API_ADMIN_BASE}/api/admin/cities/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل حذف المدينة');
    }
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
}
