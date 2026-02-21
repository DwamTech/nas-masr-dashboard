import type { SupportInboxResponse, SupportConversationResponse, AdminReplyResponse, MarkReadResponse, SupportStatsResponse } from '@/models/support-inbox';

export async function fetchSupportInbox(page?: number, perPage?: number, token?: string): Promise<SupportInboxResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = new URL('https://back.nasmasr.app/api/admin/support/inbox');
  if (typeof perPage === 'number' && perPage > 0) url.searchParams.set('per_page', String(perPage));
  if (typeof page === 'number' && page > 0) url.searchParams.set('page', String(page));
  const res = await fetch(url.toString(), { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as SupportInboxResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب قائمة محادثات الدعم';
    throw new Error(message);
  }
  return data;
}

export async function fetchSupportConversation(userId: number | string, page?: number, perPage?: number, token?: string): Promise<SupportConversationResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const base = `https://back.nasmasr.app/api/admin/support/${encodeURIComponent(String(userId))}`;
  const url = new URL(base);
  if (typeof perPage === 'number' && perPage > 0) url.searchParams.set('per_page', String(perPage));
  if (typeof page === 'number' && page > 0) url.searchParams.set('page', String(page));
  const res = await fetch(url.toString(), { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as SupportConversationResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب محادثة الدعم';
    throw new Error(message);
  }
  return data;
}

export async function replySupport(payload: { user_id: number | string; message: string }, token?: string): Promise<AdminReplyResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch('https://back.nasmasr.app/api/admin/support/reply', {
    method: 'POST',
    headers,
    body: JSON.stringify({ user_id: payload.user_id, message: payload.message }),
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as AdminReplyResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر إرسال الرد';
    throw new Error(message);
  }
  return data;
}

export async function markSupportConversationRead(userId: number | string, token?: string): Promise<MarkReadResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://back.nasmasr.app/api/admin/support/${encodeURIComponent(String(userId))}/read`, {
    method: 'PATCH',
    headers,
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as MarkReadResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر تحديد المحادثة كمقروءة';
    throw new Error(message);
  }
  return data;
}

export async function fetchSupportStats(token?: string): Promise<SupportStatsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch('https://back.nasmasr.app/api/admin/support/stats', { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as SupportStatsResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب إحصائيات الدعم';
    throw new Error(message);
  }
  return data;
}
