import { ListingReportsResponse, ListingReport } from '@/models/reports';
import type { ListingReportAcceptResponse, ListingReportDismissResponse, ListingReportReadResponse, ListingDetailsData, ListingDetailsUserInline, ListingDetailsUser } from '@/models/reports';

const normalizeString = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v);
  const t = s.trim();
  return t.length ? t : null;
};

const toListingReport = (o: unknown): ListingReport | null => {
  if (!o || typeof o !== 'object') return null;
  const it = o as Record<string, unknown>;
  const id = typeof it['id'] === 'number' ? (it['id'] as number) : Number(it['id']) || 0;
  const title = normalizeString(it['title']) ?? '';
  const category_name = normalizeString(it['category_name']) ?? '';
  const status = normalizeString(it['status']) ?? '';
  const advertiser_code = normalizeString(it['advertiser_code']) ?? '';
  const report_date = normalizeString(it['report_date']) ?? '';
  const reasons = Array.isArray(it['reasons']) ? (it['reasons'] as unknown[]).map((x) => String(x)).filter(Boolean) : [];
  const reports_count = typeof it['reports_count'] === 'number' ? (it['reports_count'] as number) : Number(it['reports_count']) || 0;
  const report_status = normalizeString(it['report_status']) ?? '';
  return { id, title, category_name, status, advertiser_code, report_date, reasons, reports_count, report_status };
};

const toListingDetails = (o: unknown): ListingDetailsData | null => {
  if (!o || typeof o !== 'object') return null;
  const it = o as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);
  const bool = (v: unknown) => (typeof v === 'boolean' ? v : String(v).toLowerCase() === 'true');
  const str = (v: unknown) => normalizeString(v);
  const arrStr = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).map((x) => String(x)).filter(Boolean) : []);
  const attrs = (v: unknown) => {
    if (!v || typeof v !== 'object') return {} as Record<string, string>;
    const r: Record<string, string> = {};
    Object.entries(v as Record<string, unknown>).forEach(([k, val]) => { r[k] = String(val ?? ''); });
    return r;
  };
  const userInlineObj = typeof it['user'] === 'object' && it['user'] !== null ? (it['user'] as Record<string, unknown>) : {};
  const userInline: ListingDetailsUserInline = {
    id: num(userInlineObj['id']),
    name: str(userInlineObj['name']),
    phone: str(userInlineObj['phone']),
  };
  return {
    id: num(it['id']),
    category_id: num(it['category_id']),
    category: str(it['category']),
    category_name: str(it['category_name']),
    title: str(it['title']),
    price: str(it['price']),
    currency: str(it['currency']),
    description: str(it['description']),
    governorate: str(it['governorate']),
    city: str(it['city']),
    lat: str(it['lat']),
    lng: str(it['lng']),
    address: str(it['address']),
    status: str(it['status']),
    published_at: str(it['published_at']),
    plan_type: str(it['plan_type']),
    contact_phone: str(it['contact_phone']),
    whatsapp_phone: str(it['whatsapp_phone']),
    make_id: num(it['make_id']) || null,
    make: str(it['make']),
    model_id: num(it['model_id']) || null,
    model: str(it['model']),
    main_image: str(it['main_image']),
    main_image_url: str(it['main_image_url']),
    images: (it['images'] as unknown) ?? null,
    images_urls: arrStr(it['images_urls']),
    attributes: attrs(it['attributes']),
    views: num(it['views']),
    rank: num(it['rank']),
    country_code: str(it['country_code']),
    created_at: str(it['created_at']),
    updated_at: str(it['updated_at']),
    expire_at: str(it['expire_at']),
    isPayment: bool(it['isPayment']),
    publish_via: str(it['publish_via']),
    admin_comment: str(it['admin_comment']),
    user: userInline,
  } as ListingDetailsData;
};

export async function fetchListingReports(page: number = 1, perPage: number = 20, token?: string): Promise<ListingReportsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://back.nasmasr.app/api/admin/listing-reports?page=${encodeURIComponent(String(page))}&per_page=${encodeURIComponent(String(perPage))}`;
  const res = await fetch(url, { method: 'GET', headers });
  let raw: unknown = null;
  try { raw = await res.json(); } catch { }
  if (!res.ok || !raw || typeof raw !== 'object') {
    let message = 'تعذر جلب البلاغات';
    if (raw && typeof raw === 'object') {
      const err = raw as { error?: string; message?: string } | null;
      message = err?.error || err?.message || message;
    } else {
      try { message = await res.text(); } catch { }
    }
    throw new Error(message);
  }
  const obj = raw as Record<string, unknown>;
  const metaObj = (obj['meta'] ?? {}) as { page?: number; per_page?: number; total?: number; last_page?: number };
  const meta = {
    page: typeof metaObj.page === 'number' ? metaObj.page : Number(metaObj.page) || 1,
    per_page: typeof metaObj.per_page === 'number' ? metaObj.per_page : Number(metaObj.per_page) || perPage,
    total: typeof metaObj.total === 'number' ? metaObj.total : Number(metaObj.total) || 0,
    last_page: typeof metaObj.last_page === 'number' ? metaObj.last_page : Number(metaObj.last_page) || 1,
  };
  const arr = Array.isArray(obj['data']) ? (obj['data'] as unknown[]) : [];
  const data: ListingReport[] = arr.map((it) => toListingReport(it)).filter(Boolean) as ListingReport[];
  return { meta, data };
}

export async function acceptListingReport(reportId: number | string, token?: string): Promise<ListingReportAcceptResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const id = encodeURIComponent(String(reportId));
  const url = `https://back.nasmasr.app/api/admin/listing-reports/${id}/accept`;
  const res = await fetch(url, { method: 'POST', headers });
  let raw: unknown = null;
  try { raw = await res.json(); } catch { }
  if (!res.ok || !raw || typeof raw !== 'object') {
    let message = 'تعذر قبول البلاغ';
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
  return { message } as ListingReportAcceptResponse;
}

export async function dismissListingReport(reportId: number | string, token?: string): Promise<ListingReportDismissResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const id = encodeURIComponent(String(reportId));
  const url = `https://back.nasmasr.app/api/admin/listing-reports/${id}/dismiss`;
  const res = await fetch(url, { method: 'POST', headers });
  let raw: unknown = null;
  try { raw = await res.json(); } catch { }
  if (!res.ok || !raw || typeof raw !== 'object') {
    let message = 'تعذر رفض البلاغ';
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
  return { message } as ListingReportDismissResponse;
}

export async function markListingReportsReadAndFetch(listingId: number | string, token?: string): Promise<ListingReportReadResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const id = encodeURIComponent(String(listingId));
  const url = `https://back.nasmasr.app/api/admin/listing-reports/${id}/read`;
  const res = await fetch(url, { method: 'PATCH', headers });
  let raw: unknown = null;
  try { raw = await res.json(); } catch { }
  if (!res.ok || !raw || typeof raw !== 'object') {
    let message = 'تعذر جلب تفاصيل الإعلان';
    if (raw && typeof raw === 'object') {
      const err = raw as { error?: string; message?: string } | null;
      message = err?.error || err?.message || message;
    } else {
      try { message = await res.text(); } catch { }
    }
    throw new Error(message);
  }
  const obj = raw as Record<string, unknown>;
  const data = toListingDetails(obj['data']) as ListingDetailsData;
  const usrRaw = (obj['user'] ?? {}) as Record<string, unknown>;
  const user: ListingDetailsUser = {
    id: typeof usrRaw['id'] === 'number' ? (usrRaw['id'] as number) : Number(usrRaw['id']) || 0,
    name: normalizeString(usrRaw['name']),
    joined_at: normalizeString(usrRaw['joined_at']),
    joined_at_human: normalizeString(usrRaw['joined_at_human']),
  };
  const message = (obj['message'] as string | undefined) ?? undefined;
  return { data, user, message } as ListingReportReadResponse;
}
