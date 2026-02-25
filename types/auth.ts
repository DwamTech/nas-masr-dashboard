// Authentication type definitions

export interface AuthToken {
    value: string;
    expiresAt?: Date;
}

export interface ValidationContext {
    type: 'initial' | 'periodic';
    attempt: number;
    timestamp: Date;
}

export interface ValidationResult {
    isValid: boolean;
    shouldRetry: boolean;
    error?: string;
    statusCode?: number;
}

export interface SessionState {
    isValidating: boolean;
    isAuthenticated: boolean;
    lastValidation?: Date;
    consecutiveFailures: number;
}

export interface AuthGuardProps {
    children: React.ReactNode;
}

export interface LoadingStateProps {
    message?: string;
}

export interface UseSessionMonitorOptions {
    token: string;
    onInvalidToken: () => void;
    enabled: boolean;
    interval?: number;
}
