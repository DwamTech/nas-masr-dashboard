import type { AdminStatsResponse, RecentActivitiesResponse } from '../models/stats';

export async function fetchAdminStats(token?: string): Promise<AdminStatsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch('https://api.nasmasr.app/api/admin/stats', { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as AdminStatsResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر جلب إحصائيات اللوحة');
    throw new Error(message);
  }
  return data;
}

export async function fetchRecentActivities(limit = 20, token?: string): Promise<RecentActivitiesResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://api.nasmasr.app/api/admin/recent-activities?limit=${encodeURIComponent(limit)}`;
  const res = await fetch(url, { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as RecentActivitiesResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر جلب النشاطات الأخيرة');
    throw new Error(message);
  }
  return data;
}
