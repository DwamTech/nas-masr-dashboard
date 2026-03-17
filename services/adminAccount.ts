import { API_ADMIN_BASE, getAuthHeaders } from '@/utils/api';
import type { DashboardSessionResponse } from '@/types/auth';

export type AdminPasswordFieldErrors = Record<string, string[] | string>;

export interface ChangeAdminPasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface UpdateDashboardProfilePayload {
  name: string;
  email?: string;
  phone: string;
  profileImageFile?: File | null;
  removeProfileImage?: boolean;
}

export interface ChangeAdminPasswordResponse {
  message: string;
  errors?: AdminPasswordFieldErrors;
}

export interface UpdateDashboardProfileResponse extends DashboardSessionResponse {
  message: string;
}

export class AdminAccountError extends Error {
  status?: number;
  fieldErrors?: AdminPasswordFieldErrors;

  constructor(message: string, status?: number, fieldErrors?: AdminPasswordFieldErrors) {
    super(message);
    this.name = 'AdminAccountError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function parseError(raw: unknown, fallback: string, status?: number): never {
  const data = raw && typeof raw === 'object' ? (raw as { message?: string; errors?: AdminPasswordFieldErrors }) : {};
  throw new AdminAccountError(data.message || fallback, status, data.errors);
}

export async function fetchDashboardAccount(): Promise<DashboardSessionResponse> {
  const res = await fetch(`${API_ADMIN_BASE}/api/admin/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw && typeof raw === 'object' ? (raw as DashboardSessionResponse) : null;

  if (!res.ok || !data?.user) {
    parseError(raw, 'تعذر جلب بيانات الحساب الشخصي', res.status);
  }

  return data;
}

export async function updateDashboardProfile(
  payload: UpdateDashboardProfilePayload
): Promise<UpdateDashboardProfileResponse> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('phone', payload.phone);
  if (payload.email) formData.append('email', payload.email);
  if (payload.profileImageFile) formData.append('profile_image', payload.profileImageFile);
  if (payload.removeProfileImage) formData.append('remove_profile_image', '1');

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_ADMIN_BASE}/api/admin/account/profile`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw && typeof raw === 'object' ? (raw as UpdateDashboardProfileResponse) : null;

  if (!res.ok || !data?.user) {
    parseError(raw, 'تعذر تحديث الحساب الشخصي', res.status);
  }

  return data;
}

export async function changeAdminPassword(
  payload: ChangeAdminPasswordPayload
): Promise<ChangeAdminPasswordResponse> {
  const res = await fetch(`${API_ADMIN_BASE}/api/admin/account/password`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const raw = (await res.json().catch(() => null)) as ChangeAdminPasswordResponse | null;
  const data = raw ?? { message: 'حدث خطأ أثناء تغيير كلمة المرور' };

  if (!res.ok) {
    throw new AdminAccountError(
      data.message || 'تعذر تغيير كلمة المرور',
      res.status,
      data.errors
    );
  }

  return data;
}
