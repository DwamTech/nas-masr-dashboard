import type { SystemSettingsPayload, SystemSettingsResponse } from '@/models/system-settings';
import { buildApiUrl } from '@/utils/api';

export async function fetchSystemSettings(token?: string): Promise<SystemSettingsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(buildApiUrl('/admin/system-settings'), { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب إعدادات النظام';
    throw new Error(message);
  }
  return raw as SystemSettingsResponse;
}

export async function updateSystemSettings(payload: SystemSettingsPayload, token?: string): Promise<SystemSettingsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(buildApiUrl('/admin/system-settings'), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as SystemSettingsResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر حفظ إعدادات النظام';
    throw new Error(message);
  }
  return data;
}

export async function updateSystemSettingsImage(key: string, file: File, token?: string): Promise<SystemSettingsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;

  const formData = new FormData();
  formData.append('key', key);
  formData.append('image', file);

  const res = await fetch(buildApiUrl('/admin/system-settings'), {
    method: 'POST',
    headers,
    body: formData,
  });

  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as SystemSettingsResponse | null;

  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر تحديث صورة القسم';
    throw new Error(message);
  }
  return data;
}

export async function updatePublicSystemSettingsImage(key: string, file: File, token?: string): Promise<SystemSettingsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;

  const formData = new FormData();
  formData.append('key', key);
  formData.append('image', file);
  formData.append('_method', 'PUT');

  const res = await fetch(buildApiUrl('/admin/system-settings/upload-image'), {
    method: 'POST',
    headers,
    body: formData,
  });

  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as SystemSettingsResponse | null;

  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر تحديث إعدادات النظام';
    throw new Error(message);
  }

  return data;
}
