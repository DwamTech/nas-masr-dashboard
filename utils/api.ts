/**
 * Shared API utilities — اعدادات API المشتركة
 *
 * Central place for API configuration and auth headers.
 * All API services should import from here instead of duplicating.
 */

export const API_BASE =
    (
        process.env.NEXT_PUBLIC_LARAVEL_API_URL ||
        process.env.LARAVEL_API_URL ||
        ''
    ).replace(/\/+$/, '');

/**
 * Returns the base URL for admin endpoints (without trailing /api).
 * Example: https://your-backend-host
 */
export const API_ADMIN_BASE = API_BASE.replace(/\/api$/, '');

export function buildApiUrl(path = ''): string {
    const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
    return `${API_BASE}${normalizedPath}`;
}

export function buildBackendUrl(path = ''): string {
    const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
    return `${API_ADMIN_BASE}${normalizedPath}`;
}

export function resolveBackendAssetUrl(raw: string | null | undefined): string | null {
    const value = String(raw || '').trim();
    if (!value) return null;

    if (value.startsWith('http://') || value.startsWith('https://')) {
        try {
            const absolute = new URL(value);
            const backend = API_ADMIN_BASE ? new URL(API_ADMIN_BASE) : null;
            const isLocalHost = absolute.hostname === 'localhost' || absolute.hostname === '127.0.0.1';

            if (backend && isLocalHost) {
                return `${backend.origin}${absolute.pathname}${absolute.search}${absolute.hash}`;
            }

            return value;
        } catch {
            return value;
        }
    }

    const normalized = value.startsWith('/') ? value : `/${value.replace(/^\.?\/?/, '')}`;
    if (normalized.startsWith('/defaults/')) {
        return buildBackendUrl(`/storage${normalized}`);
    }

    return buildBackendUrl(normalized);
}

/**
 * Builds authenticated request headers with JSON content type.
 * Reads the auth token from localStorage when available.
 *
 * @returns Record<string, string> — headers object for fetch()
 */
export function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
}
