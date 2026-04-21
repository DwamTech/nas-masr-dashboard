import { buildApiUrl } from '@/utils/api';

export interface PublicSystemSettingsResponse {
  privacy_policy?: string;
  'terms_conditions-main_'?: string;
  [key: string]: unknown;
}

export async function fetchPublicSystemSettings(): Promise<PublicSystemSettingsResponse> {
  const res = await fetch(buildApiUrl('/api/system-settings'), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const raw = (await res.json().catch(() => null)) as PublicSystemSettingsResponse | null;

  if (!res.ok || !raw || typeof raw !== 'object') {
    throw new Error('تعذر جلب إعدادات النظام العامة');
  }

  return raw;
}
