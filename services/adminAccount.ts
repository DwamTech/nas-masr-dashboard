import { API_ADMIN_BASE, getAuthHeaders } from '@/utils/api';

export type AdminPasswordFieldErrors = Record<string, string[] | string>;

export interface ChangeAdminPasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface ChangeAdminPasswordResponse {
  message: string;
  errors?: AdminPasswordFieldErrors;
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

export async function changeAdminPassword(
  payload: ChangeAdminPasswordPayload
): Promise<ChangeAdminPasswordResponse> {
  const res = await fetch(`${API_ADMIN_BASE}/api/admin/account/change-password`, {
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

