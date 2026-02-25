import { AUTH_CONFIG } from '@/config/auth';
import type { ValidationResult } from '@/types/auth';

/**
 * Validates an authentication token with the backend API
 * @param token - The JWT bearer token to validate
 * @returns Promise<ValidationResult> - Validation result with status and error info
 */
export async function validateToken(token: string): Promise<ValidationResult> {
    // Use admin/stats endpoint to validate admin token (same as dashboard page)
    const url = 'https://back.nasmasr.app/api/admin/stats';

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AUTH_CONFIG.VALIDATION_TIMEOUT);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle success response (200)
        if (response.ok && response.status === 200) {
            return {
                isValid: true,
                shouldRetry: false,
                statusCode: 200
            };
        }

        // Handle authentication errors (401/403)
        if (response.status === 401 || response.status === 403) {
            return {
                isValid: false,
                shouldRetry: false,
                statusCode: response.status,
                error: 'Token invalid or expired'
            };
        }

        // Handle server errors (500) - should retry
        if (response.status === 500) {
            return {
                isValid: false,
                shouldRetry: true,
                statusCode: 500,
                error: 'Server error'
            };
        }

        // Handle other error responses
        return {
            isValid: false,
            shouldRetry: false,
            statusCode: response.status,
            error: `Unexpected status code: ${response.status}`
        };

    } catch (error) {
        clearTimeout(timeoutId);

        // Handle timeout errors
        if (error instanceof Error && error.name === 'AbortError') {
            console.error('Token validation timeout');
            return {
                isValid: false,
                shouldRetry: true,
                error: 'Validation timeout'
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
    context: 'initial' | 'periodic'
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
