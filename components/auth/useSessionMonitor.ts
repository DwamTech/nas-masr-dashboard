'use client';

import { useEffect, useRef } from 'react';
import { AUTH_CONFIG } from '@/config/auth';
import { validateWithRetry } from '@/services/tokenValidator';
import type { UseSessionMonitorOptions } from '@/types/auth';

/**
 * Custom hook for periodic token validation during active sessions
 * Monitors token validity every 60 seconds and triggers callback on failure
 */
export function useSessionMonitor({
    token,
    onInvalidToken,
    enabled,
    interval = AUTH_CONFIG.VALIDATION_INTERVAL
}: UseSessionMonitorOptions) {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const consecutiveFailuresRef = useRef<number>(0);

    useEffect(() => {
        // Only start monitoring if enabled and token exists
        if (!enabled || !token) {
            return;
        }

        // Clear any existing timer to prevent duplicates
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // Start periodic validation
        timerRef.current = setInterval(async () => {
            try {
                const result = await validateWithRetry(token, 'periodic');

                if (result.isValid) {
                    // Reset failure count on success
                    consecutiveFailuresRef.current = 0;
                } else {
                    // Check if this is an authentication error (not network error)
                    if (!result.shouldRetry) {
                        // Authentication error - increment failure count
                        consecutiveFailuresRef.current += 1;

                        // Redirect after consecutive failure threshold
                        if (consecutiveFailuresRef.current >= AUTH_CONFIG.CONSECUTIVE_FAILURE_THRESHOLD) {
                            console.warn('Token validation failed consecutively, redirecting to login');
                            onInvalidToken();
                        }
                    } else {
                        // Network error - skip this cycle without incrementing failures
                        console.warn('Network error during periodic validation, skipping cycle');
                    }
                }
            } catch (error) {
                // Unexpected error - skip cycle
                console.error('Unexpected error during periodic validation:', error);
            }
        }, interval);

        // Cleanup function
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [token, enabled, interval, onInvalidToken]);
}
