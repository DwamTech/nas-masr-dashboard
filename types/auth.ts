// Authentication type definitions

export interface AuthToken {
    value: string;
    expiresAt?: Date;
}

export interface ValidationContext {
    type: 'initial' | 'periodic' | 'background';
    attempt: number;
    timestamp: Date;
}

export interface ValidationResult {
    isValid: boolean;
    shouldRetry: boolean;
    error?: string;
    statusCode?: number;
    session?: DashboardSessionResponse;
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

export interface DashboardUser {
    id: number;
    name: string | null;
    email?: string | null;
    phone?: string | null;
    role: string;
    status?: string;
    profile_image_url?: string | null;
    allowed_dashboard_pages?: string[];
}

export interface DashboardPageOption {
    key: string;
    label: string;
    path: string | null;
}

export interface DashboardSessionResponse {
    user: DashboardUser;
    available_dashboard_pages?: DashboardPageOption[];
    token?: string;
    message?: string;
}
