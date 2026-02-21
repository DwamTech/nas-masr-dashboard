import type { CategoryPlanPrice, CategoryPlanPriceUpdateRequest } from '../models/category-plans';

export async function fetchCategoryPlanPrices(token?: string): Promise<CategoryPlanPrice[]> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch('https://back.nasmasr.app/api/admin/category-plan-prices', { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as CategoryPlanPrice[] | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر جلب أسعار الباقات');
    throw new Error(message);
  }
  return data;
}

export async function updateCategoryPlanPrices(payload: CategoryPlanPriceUpdateRequest, token?: string): Promise<{ message: string }> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };
  if (t) headers.Authorization = `Bearer ${t}`;

  const res = await fetch('https://back.nasmasr.app/api/admin/category-plan-prices', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const raw = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر تحديث أسعار الباقات');
    throw new Error(message);
  }

  return raw as { message: string };
}
