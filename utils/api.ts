/**
 * Shared API utilities — اعدادات API المشتركة
 *
 * Central place for API configuration and auth headers.
 * All API services should import from here instead of duplicating.
 */

export const API_BASE =
    process.env.NEXT_PUBLIC_LARAVEL_API_URL ||
    process.env.LARAVEL_API_URL ||
    'https://back.nasmasr.app/api';

/**
 * Returns the base URL for admin endpoints (without trailing /api).
 * Example: https://back.nasmasr.app
 */
export const API_ADMIN_BASE = API_BASE.replace('/api', '');

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
