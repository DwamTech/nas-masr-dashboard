import type { ConversationsResponse, SingleConversationResponse, SearchResponse, ConversationsStatsResponse } from '@/models/customer-chats';
import { buildApiUrl } from '@/utils/api';

export async function fetchAdminConversations(page?: number, perPage?: number, token?: string): Promise<ConversationsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = new URL(buildApiUrl('/admin/monitoring/conversations'));
  if (typeof perPage === 'number' && perPage > 0) url.searchParams.set('per_page', String(perPage));
  if (typeof page === 'number' && page > 0) url.searchParams.set('page', String(page));
  const res = await fetch(url.toString(), { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as ConversationsResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب المحادثات';
    throw new Error(message);
  }
  return data;
}

export async function fetchAdminConversation(conversationId: string, page?: number, perPage?: number, token?: string): Promise<SingleConversationResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const base = buildApiUrl(`/admin/monitoring/conversations/${encodeURIComponent(conversationId)}`);
  const url = new URL(base);
  if (typeof perPage === 'number' && perPage > 0) url.searchParams.set('per_page', String(perPage));
  if (typeof page === 'number' && page > 0) url.searchParams.set('page', String(page));
  const res = await fetch(url.toString(), { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as SingleConversationResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب تفاصيل المحادثة';
    throw new Error(message);
  }
  return data;
}

export async function searchAdminConversations(q: string, token?: string): Promise<SearchResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = new URL(buildApiUrl('/admin/monitoring/search'));
  url.searchParams.set('q', q || '');
  const res = await fetch(url.toString(), { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as SearchResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب نتائج البحث';
    throw new Error(message);
  }
  return data;
}

export async function fetchAdminConversationsStats(token?: string): Promise<ConversationsStatsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = new URL(buildApiUrl('/admin/monitoring/stats'));
  const res = await fetch(url.toString(), { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as ConversationsStatsResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب الإحصائيات';
    throw new Error(message);
  }
  return data;
}
