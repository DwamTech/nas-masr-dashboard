'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 * 
 * Features:
 * - Catches component errors
 * - Displays user-friendly fallback UI in Arabic
 * - Provides reload button
 * - Logs errors for debugging
 * 
 * Requirements: 11.4, 14.10
 */

interface ErrorBoundaryProps {
    /** Child components to wrap */
    children: ReactNode;
    /** Optional custom fallback UI */
    fallback?: ReactNode;
    /** Optional callback when error occurs */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Call optional error callback
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    handleReload = () => {
        // Reset error state and reload the page
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    handleReset = () => {
        // Reset error state without reloading
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="error-boundary-container">
                    <div className="error-boundary-content">
                        <div className="error-icon" aria-hidden="true">
                            <svg
                                className="w-16 h-16"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h2 className="error-title">حدث خطأ غير متوقع</h2>
                        <p className="error-description">
                            عذراً، حدث خطأ أثناء عرض هذه الصفحة. يرجى المحاولة مرة أخرى.
                        </p>
                        {this.state.error && (
                            <details className="error-details">
                                <summary className="error-details-summary">
                                    تفاصيل الخطأ (للمطورين)
                                </summary>
                                <pre className="error-details-content">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                        <div className="error-actions">
                            <button
                                onClick={this.handleReset}
                                className="error-button error-button-secondary"
                                aria-label="محاولة مرة أخرى"
                            >
                                محاولة مرة أخرى
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="error-button error-button-primary"
                                aria-label="إعادة تحميل الصفحة"
                            >
                                إعادة تحميل الصفحة
                            </button>
                        </div>
                    </div>

                    <style jsx>{`
                        .error-boundary-container {
                            min-height: 400px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 2rem;
                            background: #f7fafc;
                        }

                        .error-boundary-content {
                            max-width: 500px;
                            width: 100%;
                            background: white;
                            border-radius: 12px;
                            padding: 2rem;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                            text-align: center;
                        }

                        .error-icon {
                            color: #f56565;
                            margin: 0 auto 1.5rem;
                            display: flex;
                            justify-content: center;
                        }

                        .error-title {
                            font-size: 1.5rem;
                            font-weight: 600;
                            color: #2d3748;
                            margin-bottom: 0.75rem;
                        }

                        .error-description {
                            color: #718096;
                            font-size: 1rem;
                            line-height: 1.6;
                            margin-bottom: 1.5rem;
                        }

                        .error-details {
                            text-align: right;
                            margin-bottom: 1.5rem;
                            background: #f7fafc;
                            border-radius: 6px;
                            padding: 1rem;
                        }

                        .error-details-summary {
                            cursor: pointer;
                            font-size: 0.875rem;
                            color: #4a5568;
                            font-weight: 500;
                            user-select: none;
                        }

                        .error-details-summary:hover {
                            color: #2d3748;
                        }

                        .error-details-content {
                            margin-top: 0.75rem;
                            padding: 0.75rem;
                            background: white;
                            border: 1px solid #e2e8f0;
                            border-radius: 4px;
                            font-size: 0.75rem;
                            color: #c53030;
                            overflow-x: auto;
                            white-space: pre-wrap;
                            word-break: break-word;
                            direction: ltr;
                            text-align: left;
                        }

                        .error-actions {
                            display: flex;
                            gap: 0.75rem;
                            justify-content: center;
                            flex-wrap: wrap;
                        }

                        .error-button {
                            padding: 0.75rem 1.5rem;
                            border-radius: 6px;
                            font-size: 0.875rem;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.2s;
                            border: none;
                            min-height: 44px;
                        }

                        .error-button-primary {
                            background: #3182ce;
                            color: white;
                        }

                        .error-button-primary:hover {
                            background: #2c5aa0;
                        }

                        .error-button-primary:active {
                            background: #2a4365;
                        }

                        .error-button-secondary {
                            background: #e2e8f0;
                            color: #2d3748;
                        }

                        .error-button-secondary:hover {
                            background: #cbd5e0;
                        }

                        .error-button-secondary:active {
                            background: #a0aec0;
                        }

                        .error-button:focus {
                            outline: 2px solid #3182ce;
                            outline-offset: 2px;
                        }

                        @media (max-width: 640px) {
                            .error-boundary-container {
                                padding: 1rem;
                            }

                            .error-boundary-content {
                                padding: 1.5rem;
                            }

                            .error-title {
                                font-size: 1.25rem;
                            }

                            .error-description {
                                font-size: 0.875rem;
                            }

                            .error-actions {
                                flex-direction: column;
                            }

                            .error-button {
                                width: 100%;
                            }
                        }
                    `}</style>
                </div>
            );
        }

        return this.props.children;
    }
}
