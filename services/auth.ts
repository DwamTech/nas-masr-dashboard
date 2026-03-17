import { API_ADMIN_BASE } from '@/utils/api';
import type { DashboardSessionResponse } from '@/types/auth';

export interface AuthUser {
  id: number;
  name: string | null;
  phone?: string | null;
  email?: string | null;
  role: string;
  status?: string;
  profile_image_url?: string | null;
  allowed_dashboard_pages?: string[];
}

export interface AuthResponse extends DashboardSessionResponse {
  user: AuthUser;
  access_token?: string;
  error?: string;
  errors?: Record<string, string[] | string>;
}

export type FieldErrors = Record<string, string[] | string>;

export class AuthError extends Error {
  fieldErrors?: FieldErrors;
  status?: number;
  constructor(message?: string, fieldErrors?: FieldErrors, status?: number) {
    super(message || 'حدث خطأ أثناء تسجيل الدخول');
    this.name = 'AuthError';
    this.fieldErrors = fieldErrors;
    this.status = status;
  }
}

function readJson<T>(raw: unknown): T | null {
  return raw && typeof raw === 'object' ? (raw as T) : null;
}

export async function login(identifier: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_ADMIN_BASE}/api/admin/auth/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identifier, password }),
  });

  const raw = (await res.json().catch(() => null)) as unknown;
  const data = readJson<AuthResponse>(raw);

  if (!res.ok || !data?.user) {
    const err = readJson<{ error?: string; message?: string; errors?: FieldErrors }>(raw) ?? {};
    const message = err.message || err.error || 'حدث خطأ أثناء تسجيل الدخول';
    throw new AuthError(message, err.errors, res.status);
  }

  return data;
}

export async function fetchDashboardMe(token?: string): Promise<DashboardSessionResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;

  const res = await fetch(`${API_ADMIN_BASE}/api/admin/me`, {
    method: 'GET',
    headers,
  });

  const raw = (await res.json().catch(() => null)) as unknown;
  const data = readJson<DashboardSessionResponse>(raw);

  if (!res.ok || !data?.user) {
    const err = readJson<{ message?: string }>(raw);
    throw new AuthError(err?.message || 'تعذر جلب بيانات الجلسة', undefined, res.status);
  }

  return data;
}

export async function logoutDashboard(token?: string): Promise<void> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;

  await fetch(`${API_ADMIN_BASE}/api/admin/auth/logout`, {
    method: 'POST',
    headers,
  }).catch(() => undefined);
}
