import { UnpaidListingsResponse, ApproveResponse } from '@/models/unpaid';
import { PendingListing, PendingListingsMeta } from '@/models/listings';

const normalizeString = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v);
  const t = s.trim();
  return t.length ? t : null;
};

const toPendingListing = (o: unknown): PendingListing | null => {
  if (!o || typeof o !== 'object') return null;
  const it = o as Record<string, unknown>;
  const id = typeof it['id'] === 'number' ? it['id'] as number : Number(it['id']) || 0;
  const category_id = typeof it['category_id'] === 'number' ? it['category_id'] as number : Number(it['category_id']) || 0;
  const category = normalizeString(it['category']) ?? '';
  const category_name = normalizeString(it['category_name']) ?? category ?? '';
  const title = normalizeString(it['title']);
  const priceRaw = it['price'];
  const price = typeof priceRaw === 'number' ? priceRaw : normalizeString(priceRaw);
  const currency = normalizeString(it['currency']);
  const description = normalizeString(it['description']);
  const governorate = normalizeString(it['governorate']);
  const city = normalizeString(it['city']);
  const lat = normalizeString(it['lat']);
  const lng = normalizeString(it['lng']);
  const address = normalizeString(it['address']);
  const status = normalizeString(it['status']);
  const published_at = normalizeString(it['published_at']);
  const plan_type = normalizeString(it['plan_type']);
  const contact_phone = normalizeString(it['contact_phone']);
  const whatsapp_phone = normalizeString(it['whatsapp_phone']);
  const make_id = typeof it['make_id'] === 'number' ? it['make_id'] as number : undefined;
  const make = normalizeString(it['make']);
  const model_id = typeof it['model_id'] === 'number' ? it['model_id'] as number : undefined;
  const model = normalizeString(it['model']);
  const main_image_url = normalizeString(it['main_image_url']) ?? normalizeString(it['main_image']) ?? null;
  const images_urls = Array.isArray(it['images_urls']) ? (it['images_urls'] as unknown[]).map(x => String(x)).filter(Boolean) : Array.isArray(it['images']) ? (it['images'] as unknown[]).map(x => String(x)).filter(Boolean) : [];
  const attributes = (typeof it['attributes'] === 'object' && it['attributes']) ? (it['attributes'] as Record<string, string>) : undefined;
  const views = typeof it['views'] === 'number' ? it['views'] as number : undefined;
  const rank = typeof it['rank'] === 'number' ? it['rank'] as number : undefined;
  const country_code = normalizeString(it['country_code']);
  const created_at = normalizeString(it['created_at']) ?? new Date().toISOString();
  const updated_at = normalizeString(it['updated_at']);
  const expire_at = normalizeString(it['expire_at']);
  const isPayment = typeof it['isPayment'] === 'boolean' ? (it['isPayment'] as boolean) : false;
  const publish_via = normalizeString(it['publish_via']);
  const admin_comment = normalizeString(it['admin_comment']);
  const user = typeof it['user'] === 'object' && it['user'] ? (it['user'] as { id?: number; name?: string; phone?: string }) : null;
  return {
    id,
    category_id,
    category: category ?? '',
    category_name: category_name ?? '',
    title,
    price: (price as number | string | null),
    currency,
    description,
    governorate,
    city,
    lat,
    lng,
    address,
    status,
    published_at,
    plan_type,
    contact_phone,
    whatsapp_phone,
    make_id,
    make,
    model_id,
    model,
    main_image_url,
    images_urls,
    attributes: attributes ?? null,
    views,
    rank,
    country_code,
    created_at,
    updated_at,
    expire_at,
    isPayment,
    publish_via,
    admin_comment,
    user: user ? { id: typeof user.id === 'number' ? user.id : Number(user.id) || 0, name: user.name ?? null, phone: user.phone ?? null } : null,
  } as PendingListing;
};

export async function fetchAdminUnpaidListings(token?: string): Promise<UnpaidListingsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://back.nasmasr.app/api/admin/ads-not-payment`;
  const res = await fetch(url, { method: 'GET', headers });
  let raw: unknown = null;
  try { raw = await res.json(); } catch { }
  if (!res.ok || !raw) {
    let message = 'تعذر جلب الإعلانات غير المدفوعة';
    if (raw && typeof raw === 'object') {
      const err = raw as { error?: string; message?: string };
      message = err?.error || err?.message || message;
    } else {
      try { message = await res.text(); } catch { }
    }
    throw new Error(message);
  }
  const listings: PendingListing[] = [];
  if (Array.isArray(raw)) {
    for (const it of raw) {
      const pl = toPendingListing(it);
      if (pl) listings.push(pl);
    }
  } else if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr = Array.isArray(obj['listings']) ? (obj['listings'] as unknown[]) : Array.isArray(obj['data']) ? (obj['data'] as unknown[]) : [];
    if (arr.length) {
      for (const it of arr) {
        const pl = toPendingListing(it);
        if (pl) listings.push(pl);
      }
    } else {
      const pl = toPendingListing(obj);
      if (pl) listings.push(pl);
    }
  }
  const meta: PendingListingsMeta = { page: 1, per_page: listings.length, total: listings.length, last_page: 1 };
  return { meta, listings };
}

export async function approveListing(listingId: number | string, token?: string): Promise<ApproveResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const id = encodeURIComponent(String(listingId));
  const url = `https://back.nasmasr.app/api/admin/listings/${id}/approve`;
  const res = await fetch(url, { method: 'PATCH', headers });
  let raw: unknown = null;
  try { raw = await res.json(); } catch { }
  if (!res.ok || !raw || typeof raw !== 'object') {
    let message = 'تعذر الموافقة على الإعلان';
    if (raw && typeof raw === 'object') {
      const err = raw as { error?: string; message?: string } | null;
      message = err?.error || err?.message || message;
    } else {
      try { message = await res.text(); } catch { }
    }
    throw new Error(message);
  }
  const obj = raw as Record<string, unknown>;
  const success = obj['success'] as boolean | undefined;
  const message = (obj['message'] as string | undefined) ?? undefined;
  return { success, message, ...obj } as ApproveResponse;
}
