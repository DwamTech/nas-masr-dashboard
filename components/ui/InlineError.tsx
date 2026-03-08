'use client';

/**
 * InlineError Component
 * 
 * Displays inline validation error messages for form fields.
 * Used for showing validation errors next to input fields.
 * 
 * Features:
 * - Compact inline display
 * - Accessible with ARIA attributes
 * - Consistent styling
 * - Support for multiple error messages
 * 
 * Requirements: 11.4, 14.10
 */

interface InlineErrorProps {
    /** Error message(s) to display */
    message: string | string[];
    /** Optional className for custom styling */
    className?: string;
    /** Optional ID for aria-describedby linking */
    id?: string;
}

export default function InlineError({
    message,
    className = '',
    id,
}: InlineErrorProps) {
    const messages = Array.isArray(message) ? message : [message];

    // Filter out empty strings
    const validMessages = messages.filter(msg => msg && msg.trim().length > 0);

    if (validMessages.length === 0) {
        return null;
    }

    return (
        <div
            id={id}
            className={`inline-error-container ${className}`}
            role="alert"
            aria-live="polite"
        >
            {validMessages.map((msg, index) => (
                <div key={index} className="inline-error-item">
                    <svg
                        className="error-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span className="error-text">{msg}</span>
                </div>
            ))}

            <style jsx>{`
                .inline-error-container {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                    margin-top: 0.25rem;
                }

                .inline-error-item {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                }

                .error-icon {
                    width: 14px;
                    height: 14px;
                    color: #c53030;
                    flex-shrink: 0;
                }

                .error-text {
                    color: #c53030;
                    font-size: 0.75rem;
                    line-height: 1.4;
                }
            `}</style>
        </div>
    );
}
