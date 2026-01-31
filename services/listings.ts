import { PendingListingsResponse, SystemSettingsUpdateRequest } from "@/models/listings";

export async function fetchAdminPendingListings(page: number = 1, perPage: number = 50, token?: string): Promise<PendingListingsResponse> {
  const t = token ?? (typeof window !== "undefined" ? localStorage.getItem("authToken") ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://back.nasmasr.app/api/admin/pending-listings?page=${encodeURIComponent(String(page))}&per_page=${encodeURIComponent(String(perPage))}`;
  const res = await fetch(url, { method: "GET", headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== "object") {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || "تعذر جلب الإعلانات";
    throw new Error(message);
  }
  const obj = raw as Record<string, unknown>;
  const meta = (obj["meta"] ?? {}) as PendingListingsResponse["meta"];
  const listings = Array.isArray(obj["listings"]) ? (obj["listings"] as PendingListingsResponse["listings"]) : [];
  return { meta, listings };
}

export async function updateSystemSettings(payload: SystemSettingsUpdateRequest, token?: string): Promise<Record<string, unknown>> {
  const t = token ?? (typeof window !== "undefined" ? localStorage.getItem("authToken") ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://back.nasmasr.app/api/admin/system-settings`;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== "object") {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || "تعذر تحديث إعدادات النظام";
    throw new Error(message);
  }
  return raw as Record<string, unknown>;
}

export async function fetchSystemSettings(token?: string): Promise<Record<string, any>> {
  const t = token ?? (typeof window !== "undefined" ? localStorage.getItem("authToken") ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://back.nasmasr.app/api/system-settings`;
  const res = await fetch(url, { method: "GET", headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== "object") {
    throw new Error("تعذر جلب إعدادات النظام");
  }
  return raw as Record<string, any>;
}

export async function approveListing(listingId: number | string, token?: string): Promise<Record<string, unknown>> {
  const t = token ?? (typeof window !== "undefined" ? localStorage.getItem("authToken") ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  if (t) headers.Authorization = `Bearer ${t}`;
  const id = encodeURIComponent(String(listingId));
  const url = `https://back.nasmasr.app/api/admin/listings/${id}/approve`;
  const res = await fetch(url, { method: "PATCH", headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== "object") {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || "تعذر الموافقة على الإعلان";
    throw new Error(message);
  }
  return raw as Record<string, unknown>;
}

export async function rejectListing(listingId: number | string, reason: string, token?: string): Promise<Record<string, unknown>> {
  const t = token ?? (typeof window !== "undefined" ? localStorage.getItem("authToken") ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  if (t) headers.Authorization = `Bearer ${t}`;
  const id = encodeURIComponent(String(listingId));
  const url = `https://back.nasmasr.app/api/admin/listings/${id}/reject`;
  const body = JSON.stringify({ reason });
  const res = await fetch(url, { method: "PATCH", headers, body });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== "object") {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || "تعذر رفض الإعلان";
    throw new Error(message);
  }
  return raw as Record<string, unknown>;
}

export async function updateListing(listingId: number | string, payload: Record<string, unknown>, token?: string): Promise<Record<string, unknown>> {
  const t = token ?? (typeof window !== "undefined" ? localStorage.getItem("authToken") ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  if (t) headers.Authorization = `Bearer ${t}`;
  const id = encodeURIComponent(String(listingId));
  const url = `https://back.nasmasr.app/api/admin/listings/${id}`;
  const res = await fetch(url, { method: "PATCH", headers, body: JSON.stringify(payload || {}) });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== "object") {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || "تعذر تعديل الإعلان";
    throw new Error(message);
  }
  return raw as Record<string, unknown>;
}

export async function updateListingForm(categorySlug: string, listingId: number | string, formData: FormData, token?: string): Promise<Record<string, unknown>> {
  const t = token ?? (typeof window !== "undefined" ? localStorage.getItem("authToken") ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (t) headers.Authorization = `Bearer ${t}`;
  const id = encodeURIComponent(String(listingId));
  const slug = encodeURIComponent(String(categorySlug || ''));
  const url = `https://back.nasmasr.app/api/v1/${slug}/listings/${id}`;
  const res = await fetch(url, { method: "POST", headers, body: formData });
  let raw: unknown = null;
  try { raw = await res.json(); } catch { }
  if (!res.ok || !raw || typeof raw !== "object") {
    let message = "تعذر تعديل الإعلان";
    if (raw && typeof raw === 'object') {
      const err = raw as { error?: string; message?: string } | null;
      message = err?.error || err?.message || message;
    } else {
      try { message = await res.text(); } catch { }
    }
    throw new Error(message);
  }
  return raw as Record<string, unknown>;
}

export async function createListingForm(categorySlug: string, formData: FormData, token?: string): Promise<Record<string, unknown>> {
  const t = token ?? (typeof window !== "undefined" ? localStorage.getItem("authToken") ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (t) headers.Authorization = `Bearer ${t}`;
  const slug = encodeURIComponent(String(categorySlug || ''));
  const url = `https://back.nasmasr.app/api/v1/${slug}/listings`;
  const res = await fetch(url, { method: "POST", headers, body: formData });
  let raw: unknown = null;
  try { raw = await res.json(); } catch { }
  if (!res.ok || !raw || typeof raw !== "object") {
    let message = "تعذر إنشاء الإعلان";
    if (raw && typeof raw === 'object') {
      const err = raw as { error?: string; message?: string } | null;
      message = err?.error || err?.message || message;
    } else {
      try { message = await res.text(); } catch { }
    }
    throw new Error(message);
  }
  return raw as Record<string, unknown>;
}
