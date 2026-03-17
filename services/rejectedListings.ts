import type { RejectedListingsResponse, ReopenListingResponse } from '@/models/rejected';
import { buildApiUrl } from '@/utils/api';

export async function fetchAdminRejectedListings(page?: number, token?: string): Promise<RejectedListingsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = new URL(buildApiUrl('/admin/rejected-listings'));
  if (typeof page === 'number' && Number.isFinite(page) && page > 0) {
    url.searchParams.set('page', String(page));
  }
  const res = await fetch(url.toString(), { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as RejectedListingsResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب الإعلانات المرفوضة';
    throw new Error(message);
  }
  return data;
}

export async function reopenRejectedListing(listingId: number | string, token?: string): Promise<ReopenListingResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const idNum = Number(String(listingId).trim());
  const id = Number.isFinite(idNum) && idNum > 0 ? String(idNum) : encodeURIComponent(String(listingId));
  const url = buildApiUrl(`/admin/listings/${id}/reopen`);
  const res = await fetch(url, { method: 'PATCH', headers });
  let raw: unknown = null;
  try { raw = await res.json(); } catch { }
  if (!res.ok || !raw || typeof raw !== 'object') {
    let message = 'تعذر إعادة فتح الإعلان للمراجعة';
    if (raw && typeof raw === 'object') {
      const err = raw as { error?: string; message?: string } | null;
      message = err?.error || err?.message || message;
    } else {
      try { message = await res.text(); } catch { }
    }
    throw new Error(message);
  }
  const obj = raw as Record<string, unknown>;
  const message = (obj['message'] as string | undefined) ?? undefined;
  return { message } as ReopenListingResponse;
}
