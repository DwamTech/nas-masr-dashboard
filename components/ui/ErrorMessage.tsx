'use client';

/**
 * ErrorMessage Component
 * 
 * Displays user-friendly error messages in Arabic with optional retry button.
 * Used for failed API operations and network errors.
 * 
 * Features:
 * - User-friendly error messages in Arabic
 * - Optional retry button for failed operations
 * - Accessible with ARIA attributes
 * - Consistent styling across the application
 * 
 * Requirements: 11.4, 14.10
 */

interface ErrorMessageProps {
    /** Error message to display in Arabic */
    message: string;
    /** Optional callback for retry button */
    onRetry?: () => void;
    /** Optional custom retry button text (default: "إعادة المحاولة") */
    retryText?: string;
    /** Optional className for custom styling */
    className?: string;
}

export default function ErrorMessage({
    message,
    onRetry,
    retryText = 'إعادة المحاولة',
    className = '',
}: ErrorMessageProps) {
    return (
        <div
            className={`error-message-container ${className}`}
            role="alert"
            aria-live="assertive"
        >
            <div className="error-icon" aria-hidden="true">
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            </div>
            <div className="error-content">
                <p className="error-text">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="retry-button"
                        aria-label={`${retryText} - ${message}`}
                    >
                        {retryText}
                    </button>
                )}
            </div>

            <style jsx>{`
                .error-message-container {
                    background: #fff5f5;
                    border: 1px solid #fc8181;
                    border-radius: 8px;
                    padding: 1rem;
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                }

                .error-icon {
                    color: #c53030;
                    flex-shrink: 0;
                    margin-top: 0.125rem;
                }

                .error-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .error-text {
                    color: #c53030;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    margin: 0;
                }

                .retry-button {
                    background: #3182ce;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: background 0.2s;
                    align-self: flex-start;
                    min-height: 36px;
                }

                .retry-button:hover {
                    background: #2c5aa0;
                }

                .retry-button:active {
                    background: #2a4365;
                }

                .retry-button:focus {
                    outline: 2px solid #3182ce;
                    outline-offset: 2px;
                }

                @media (max-width: 640px) {
                    .error-message-container {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .error-icon {
                        align-self: flex-start;
                    }

                    .retry-button {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
