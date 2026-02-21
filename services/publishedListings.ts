import { PublishedListingsResponse, PublishedListing } from '@/models/published';

export async function fetchAdminPublishedListings(page: number = 1, perPage: number = 20, token?: string): Promise<PublishedListingsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://back.nasmasr.app/api/admin/published-listings?page=${encodeURIComponent(String(page))}&per_page=${encodeURIComponent(String(perPage))}`;
  const res = await fetch(url, { method: 'GET', headers });
  let raw: unknown = null;
  try { raw = await res.json(); } catch { }
  if (!res.ok || !raw || typeof raw !== 'object') {
    let message = 'تعذر جلب الإعلانات المنشورة';
    if (raw && typeof raw === 'object') {
      const err = raw as { error?: string; message?: string };
      message = err?.error || err?.message || message;
    } else {
      try { message = await res.text(); } catch { }
    }
    throw new Error(message);
  }
  const obj = raw as Record<string, unknown>;
  const meta = (obj['meta'] ?? { page: page, per_page: perPage, total: 0, last_page: 1 }) as PublishedListingsResponse['meta'];
  const listings = Array.isArray(obj['listings']) ? (obj['listings'] as PublishedListingsResponse['listings']) : [];
  return { meta, listings };
}

export async function deletePublishedListing(categorySlug: string, listingId: number | string, token?: string): Promise<{ success: boolean; message?: string }> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const slug = String(categorySlug).trim();
  const id = String(listingId).trim();
  const url = `https://back.nasmasr.app/api/v1/${encodeURIComponent(slug)}/listings/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: 'DELETE', headers });
  let raw: unknown = null;
  try { raw = await res.json(); } catch { }
  if (!res.ok) {
    let message = 'تعذر حذف الإعلان';
    if (raw && typeof raw === 'object') {
      const err = raw as { error?: string; message?: string };
      message = err?.error || err?.message || message;
    } else {
      try { message = await res.text(); } catch { }
    }
    throw new Error(message);
  }
  let msg: string | undefined = undefined;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const m = obj['message'];
    if (typeof m === 'string') msg = m;
  }
  return { success: true, message: msg };
}

export async function fetchListingDetails(slug: string, listingId: number | string, token?: string): Promise<PublishedListing> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;

  const id = encodeURIComponent(String(listingId));
  const raw = String(slug || '').trim();
  const kebab = encodeURIComponent(raw.replace(/_/g, '-'));
  const snake = encodeURIComponent(raw.replace(/-/g, '_'));

  const urls: string[] = [
    `https://back.nasmasr.app/api/v1/${kebab}/listings/${id}`,
    `https://back.nasmasr.app/api/v1/${snake}/listings/${id}`,
    `https://back.nasmasr.app/api/admin/listings/${id}`,
    `https://back.nasmasr.app/api/v1/listings/${id}`,
  ];

  let lastError: string | null = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'GET', headers, cache: 'no-store' });
      let raw: unknown = null;
      try { raw = await res.json(); } catch { }
      if (!res.ok || !raw) {
        let message = 'تعذر جلب تفاصيل الإعلان';
        if (raw && typeof raw === 'object') {
          const err = raw as { error?: string; message?: string } | null;
          message = err?.error || err?.message || message;
        } else {
          try { message = await res.text(); } catch { }
        }
        lastError = message;
        continue;
      }
      const obj = raw as Record<string, unknown>;
      const base = (obj['data'] ?? obj) as PublishedListing;
      if (typeof base.main_image_url === 'string') base.main_image_url = base.main_image_url.replace(/`/g, '').trim();
      if (Array.isArray(base.images_urls)) base.images_urls = base.images_urls.map((u) => typeof u === 'string' ? u.trim() : String(u)).filter((u) => typeof u === 'string' && u.length);
      const extraUser = obj['user'] as Record<string, unknown> | undefined;
      if (extraUser && typeof extraUser === 'object') {
        base.user_ext = {
          id: typeof extraUser['id'] === 'number' ? extraUser['id'] as number : Number(extraUser['id'] ?? 0) || 0,
          name: (extraUser['name'] as string | null | undefined) ?? null,
          phone: (extraUser['phone'] as string | null | undefined) ?? null,
          joined_at: (extraUser['joined_at'] as string | null | undefined) ?? null,
          joined_at_human: (extraUser['joined_at_human'] as string | null | undefined) ?? null,
          listings_count: typeof extraUser['listings_count'] === 'number' ? extraUser['listings_count'] as number : Number(extraUser['listings_count'] ?? 0) || null,
          banner: (extraUser['banner'] as string | null | undefined) ?? null,
        };
      }
      return base;
    } catch (e) {
      const msg = (e && typeof e === 'object' && 'message' in e) ? String((e as { message?: string }).message || '') : '';
      lastError = msg || lastError;
      continue;
    }
  }
  throw new Error(lastError || 'تعذر جلب تفاصيل الإعلان');
}
