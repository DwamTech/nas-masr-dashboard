import { AUTH_CONFIG } from '@/config/auth';
import { fetchDashboardMe } from '@/services/auth';
import type { ValidationResult } from '@/types/auth';

/**
 * Validates an authentication token with the backend API
 * @param token - The JWT bearer token to validate
 * @returns Promise<ValidationResult> - Validation result with status and error info
 */
export async function validateToken(token: string): Promise<ValidationResult> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
        const session = await Promise.race([
            fetchDashboardMe(token),
            new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('AbortError')), AUTH_CONFIG.VALIDATION_TIMEOUT);
            }),
        ]);
        if (timeoutId) clearTimeout(timeoutId);

        return {
            isValid: true,
            shouldRetry: false,
            statusCode: 200,
            session,
        };
    } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);

        // Handle timeout errors
        if (error instanceof Error && (error.name === 'AbortError' || error.message === 'AbortError')) {
            console.error('Token validation timeout');
            return {
                isValid: false,
                shouldRetry: true,
                error: 'Validation timeout'
            };
        }

        const status = typeof error === 'object' && error !== null && 'status' in error
            ? Number((error as { status?: number }).status)
            : undefined;

        if (status === 401 || status === 403) {
            return {
                isValid: false,
                shouldRetry: false,
                statusCode: status,
                error: 'Token invalid or expired'
            };
        }

        // Handle network errors - should retry
        console.error('Token validation network error:', error instanceof Error ? error.message : 'Unknown error');
        return {
            isValid: false,
            shouldRetry: true,
            error: error instanceof Error ? error.message : 'Network error'
        };
    }
}

/**
 * Validates token with retry logic for transient failures
 * @param token - The JWT bearer token to validate
 * @param context - Context of validation (initial or periodic)
 * @returns Promise<ValidationResult> - Final validation result after retries
 */
export async function validateWithRetry(
    token: string,
    context: 'initial' | 'periodic' | 'background'
): Promise<ValidationResult> {
    let attempt = 0;
    const maxAttempts = AUTH_CONFIG.MAX_RETRY_ATTEMPTS;

    while (attempt < maxAttempts) {
        attempt++;

        try {
            const result = await validateToken(token);

            // If validation succeeded, return immediately
            if (result.isValid) {
                return result;
            }

            // Don't retry authentication errors (401/403)
            if (!result.shouldRetry) {
                return result;
            }

            // If this was the last attempt, return the failure
            if (attempt >= maxAttempts) {
                return result;
            }

            // Log retry attempt (without exposing token)
            console.warn(`Token validation attempt ${attempt} failed (${context}), retrying...`);

        } catch (error) {
            // Unexpected error during validation
            console.error('Unexpected error during token validation:', error instanceof Error ? error.message : 'Unknown error');

            if (attempt >= maxAttempts) {
                return {
                    isValid: false,
                    shouldRetry: false,
                    error: error instanceof Error ? error.message : 'Validation failed'
                };
            }
        }
    }

    // Fallback (should not reach here)
    return {
        isValid: false,
        shouldRetry: false,
        error: 'Max retry attempts reached'
    };
}
