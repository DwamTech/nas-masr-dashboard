import {
    GovernoratesResponse,
    CitiesMappingsResponse,
    Governorate,
    CreateGovernorateResponse,
    CreateCityResponse
} from '@/models/governorates';

const API_BASE = process.env.LARAVEL_API_URL || 'https://back.nasmasr.app/api';

/**
 * Fetch all governorates with their cities
 */
export async function fetchGovernorates(token?: string): Promise<Governorate[]> {
    const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (t) headers.Authorization = `Bearer ${t}`;

    const res = await fetch(`${API_BASE}/governorates`, { method: 'GET', headers });
    const data = (await res.json().catch(() => null)) as Governorate[] | null;

    if (!res.ok || !data) {
        const err = data as any;
        const message = err?.error || err?.message || 'تعذر جلب المحافظات';
        throw new Error(message);
    }

    return Array.isArray(data) ? data : [];
}

/**
 * Fetch a specific governorate by ID
 */
export async function fetchGovernorateById(id: number, token?: string): Promise<Governorate> {
    const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (t) headers.Authorization = `Bearer ${t}`;

    const res = await fetch(`${API_BASE}/governorates/${id}`, { method: 'GET', headers });
    const data = (await res.json().catch(() => null)) as Governorate | null;

    if (!res.ok || !data) {
        const err = data as any;
        const message = err?.error || err?.message || 'تعذر جلب المحافظة';
        throw new Error(message);
    }

    return data;
}

/**
 * Fetch cities mappings (by governorate ID and name)
 */
export async function fetchCitiesMappings(token?: string): Promise<CitiesMappingsResponse> {
    const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (t) headers.Authorization = `Bearer ${t}`;

    const res = await fetch(`${API_BASE}/admin/cities/mappings`, { method: 'GET', headers });
    const data = (await res.json().catch(() => null)) as CitiesMappingsResponse | null;

    if (!res.ok || !data) {
        const err = data as any;
        const message = err?.error || err?.message || 'تعذر جلب خريطة المدن';
        throw new Error(message);
    }

    return data;
}

/**
 * Create a new governorate
 */
export async function createGovernorate(name: string, token?: string): Promise<CreateGovernorateResponse> {
    const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    };
    if (t) headers.Authorization = `Bearer ${t}`;

    const res = await fetch(`${API_BASE}/admin/governorates`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name })
    });

    const data = (await res.json().catch(() => null)) as CreateGovernorateResponse | null;

    if (!res.ok || !data) {
        const err = data as any;
        const message = err?.error || err?.message || 'تعذر إنشاء المحافظة';
        throw new Error(message);
    }

    return data;
}

/**
 * Update governorate name
 */
export async function updateGovernorate(id: number, name: string, token?: string): Promise<CreateGovernorateResponse> {
    const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    };
    if (t) headers.Authorization = `Bearer ${t}`;

    const res = await fetch(`${API_BASE}/admin/governorates/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name })
    });

    const data = (await res.json().catch(() => null)) as CreateGovernorateResponse | null;

    if (!res.ok || !data) {
        const err = data as any;
        const message = err?.error || err?.message || 'تعذر تحديث المحافظة';
        throw new Error(message);
    }

    return data;
}

/**
 * Delete a governorate
 */
export async function deleteGovernorate(id: number, token?: string): Promise<{ message: string }> {
    const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (t) headers.Authorization = `Bearer ${t}`;

    const res = await fetch(`${API_BASE}/admin/governorates/${id}`, {
        method: 'DELETE',
        headers
    });

    const data = (await res.json().catch(() => null)) as { message: string } | null;

    if (!res.ok) {
        const err = data as any;
        const message = err?.error || err?.message || 'تعذر حذف المحافظة';
        throw new Error(message);
    }

    return data || { message: 'تم الحذف بنجاح' };
}

/**
 * Create a new city
 */
export async function createCity(governorateId: number, name: string, token?: string): Promise<CreateCityResponse> {
    const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    };
    if (t) headers.Authorization = `Bearer ${t}`;

    const res = await fetch(`${API_BASE}/admin/city/${governorateId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name })
    });

    const data = (await res.json().catch(() => null)) as CreateCityResponse | null;

    if (!res.ok || !data) {
        const err = data as any;
        const message = err?.error || err?.message || 'تعذر إنشاء المدينة';
        throw new Error(message);
    }

    return data;
}

/**
 * Update city name
 */
export async function updateCity(id: number, name: string, token?: string): Promise<CreateCityResponse> {
    const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    };
    if (t) headers.Authorization = `Bearer ${t}`;

    const res = await fetch(`${API_BASE}/admin/cities/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name })
    });

    const data = (await res.json().catch(() => null)) as CreateCityResponse | null;

    if (!res.ok || !data) {
        const err = data as any;
        const message = err?.error || err?.message || 'تعذر تحديث المدينة';
        throw new Error(message);
    }

    return data;
}

/**
 * Delete a city
 */
export async function deleteCity(id: number, token?: string): Promise<{ message: string }> {
    const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (t) headers.Authorization = `Bearer ${t}`;

    const res = await fetch(`${API_BASE}/admin/cities/${id}`, {
        method: 'DELETE',
        headers
    });

    const data = (await res.json().catch(() => null)) as { message: string } | null;

    if (!res.ok) {
        const err = data as any;
        const message = err?.error || err?.message || 'تعذر حذف المدينة';
        throw new Error(message);
    }

    return data || { message: 'تم الحذف بنجاح' };
}
