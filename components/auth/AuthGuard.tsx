'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AUTH_CONFIG, isPublicRoute } from '@/config/auth';
import { validateWithRetry } from '@/services/tokenValidator';
import { useSessionMonitor } from './useSessionMonitor';
import LoadingState from './LoadingState';
import type { AuthGuardProps } from '@/types/auth';
import { clearDashboardUser, getFirstAllowedPath, hasPageAccess, readDashboardUser, storeDashboardUser } from '@/utils/dashboardSession';

/**
 * Authentication guard component that protects routes by validating tokens
 * Shows loading only on first mount, relies on session monitor for ongoing validation
 */
export default function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isValidating, setIsValidating] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const hasValidatedRef = useRef(false);

    // Clear all authentication data from localStorage
    const clearAuthData = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.IS_AUTHENTICATED);
            localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER_EMAIL);
            localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER_PHONE);
            localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER_ROLE);
            localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.DASHBOARD_USER);
        }
    }, []);

    // Handle invalid token - clear data and redirect
    const handleInvalidToken = useCallback(() => {
        clearAuthData();
        clearDashboardUser();
        setIsAuthenticated(false);
        setAuthToken(null);
        hasValidatedRef.current = false;
        router.push('/auth/login');
    }, [clearAuthData, router]);

    const allowLocalSession = useCallback((token: string) => {
        hasValidatedRef.current = true;
        setIsAuthenticated(true);
        setAuthToken(token);
        setIsValidating(false);

        const storedUser = readDashboardUser();
        if (storedUser && !hasPageAccess(storedUser, pathname)) {
            router.push(getFirstAllowedPath(storedUser));
        }
    }, [pathname, router]);

    // Initial token validation on mount or route change
    useEffect(() => {
        // Check if current route is public
        if (isPublicRoute(pathname)) {
            setIsValidating(false);
            setIsAuthenticated(false);
            return;
        }

        // Get token from localStorage
        const token = typeof window !== 'undefined'
            ? localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_TOKEN)
            : null;

        // No token - redirect immediately
        if (!token) {
            clearAuthData();
            router.push('/auth/login');
            return;
        }

        // If already validated in this session, do quick background check
        if (hasValidatedRef.current && authToken === token) {
            setIsAuthenticated(true);
            setIsValidating(false);

            // Background validation without blocking UI
            validateWithRetry(token, 'background').then(result => {
                if (!result.isValid && !result.shouldRetry) {
                    console.warn('Background token validation failed');
                    handleInvalidToken();
                    return;
                }

                if (result.session?.user) {
                    storeDashboardUser(result.session.user);

                    if (!hasPageAccess(result.session.user, pathname)) {
                        router.push(getFirstAllowedPath(result.session.user));
                    }
                }
            }).catch(err => {
                console.error('Background validation error:', err);
            });

            return;
        }

        // Protected route - validate token with API (first time only)
        const validateAuth = async () => {
            setIsValidating(true);

            try {
                const result = await validateWithRetry(token, 'initial');

                if (result.isValid) {
                    // Token valid - mark as validated and allow access
                    hasValidatedRef.current = true;
                    setIsAuthenticated(true);
                    setAuthToken(token);
                    if (result.session?.user) {
                        storeDashboardUser(result.session.user);

                        if (!hasPageAccess(result.session.user, pathname)) {
                            router.push(getFirstAllowedPath(result.session.user));
                            return;
                        }
                    }
                    setIsValidating(false);
                } else if (result.shouldRetry) {
                    // Local/dev transient failure: keep current session unless backend explicitly rejects it.
                    console.warn('Transient token validation failure, keeping local session:', result.error);
                    allowLocalSession(token);
                } else {
                    // Token invalid - clear data and redirect
                    console.warn('Token validation failed:', result.error);
                    handleInvalidToken();
                }
            } catch (error) {
                // Unexpected error - treat as invalid token
                console.error('Unexpected error during authentication:', error);
                handleInvalidToken();
            }
        };

        validateAuth();
    }, [pathname, router, clearAuthData, handleInvalidToken, authToken, allowLocalSession]);

    // Start session monitoring after successful authentication
    useSessionMonitor({
        token: authToken || '',
        onInvalidToken: handleInvalidToken,
        enabled: isAuthenticated && !isPublicRoute(pathname)
    });

    // Show loading state during validation
    if (isValidating) {
        return <LoadingState />;
    }

    // Render children for public routes or authenticated users
    return <>{children}</>;
}
