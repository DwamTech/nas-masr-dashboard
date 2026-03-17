// Authentication configuration constants
export const AUTH_CONFIG = {
    // Validation interval for periodic token checks (60 seconds)
    VALIDATION_INTERVAL: 60000,

    // Timeout for token validation requests (5 seconds)
    VALIDATION_TIMEOUT: 5000,

    // Maximum retry attempts (initial + 1 retry = 2 total)
    MAX_RETRY_ATTEMPTS: 2,

    // Number of consecutive failures before redirecting to login
    CONSECUTIVE_FAILURE_THRESHOLD: 2,

    // Routes that don't require authentication
    PUBLIC_ROUTES: [
        '/auth/login',
        '/landing',
        '/terms',
        '/privacy',
        '/'
    ],

    // localStorage keys for authentication data
    STORAGE_KEYS: {
        AUTH_TOKEN: 'authToken',
        IS_AUTHENTICATED: 'isAuthenticated',
        USER_EMAIL: 'userEmail',
        USER_PHONE: 'userPhone',
        USER_ROLE: 'userRole',
        DASHBOARD_USER: 'dashboardUser',
        REMEMBER_ME: 'rememberMe'
    },

    // Loading message displayed during validation (Arabic)
    LOADING_MESSAGE: 'جاري التحقق من صلاحية المستخدم'
} as const;


/**
 * Checks if a given pathname is a public route that doesn't require authentication
 * @param pathname - The current route pathname
 * @returns boolean - True if route is public, false if protected
 */
export function isPublicRoute(pathname: string): boolean {
    // Normalize pathname (remove trailing slash for comparison)
    const normalizedPath = pathname.endsWith('/') && pathname.length > 1
        ? pathname.slice(0, -1)
        : pathname;

    return AUTH_CONFIG.PUBLIC_ROUTES.some(route => {
        // Exact match or starts with route path
        return normalizedPath === route || normalizedPath.startsWith(route + '/');
    });
}
