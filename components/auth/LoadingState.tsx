'use client';

import { AUTH_CONFIG } from '@/config/auth';
import type { LoadingStateProps } from '@/types/auth';

/**
 * Loading state component displayed during token validation
 * Shows minimal, professional loading indicator
 */
export default function LoadingState({ message }: LoadingStateProps) {
    const displayMessage = message || AUTH_CONFIG.LOADING_MESSAGE;

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
            role="status"
            aria-live="polite"
        >
            <div className="text-center">
                {/* Minimal loading spinner with fade-in animation */}
                <div className="inline-block mb-6 animate-fade-in">
                    <div className="relative">
                        {/* Outer ring */}
                        <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                        {/* Spinning ring */}
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                </div>

                {/* Loading message with fade-in delay */}
                <p className="text-base text-gray-600 font-medium animate-fade-in-delay">
                    {displayMessage}
                </p>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fade-in-delay {
                    0%, 30% {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.4s ease-out;
                }

                .animate-fade-in-delay {
                    animation: fade-in-delay 0.6s ease-out;
                }
            `}</style>
        </div>
    );
}
