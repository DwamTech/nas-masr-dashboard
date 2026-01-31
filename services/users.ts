import { UsersSummaryResponse, UpdateUserPayload, UpdateUserResponse, BlockUserResponse, DeleteUserResponse, CreateUserPayload, CreateUserResponse, ChangePasswordResponse, CreateOtpResponse, SingleUserListingsResponse, CategoriesResponse, AssignUserPackagePayload, AssignUserPackageResponse, SetFeaturedPayload, SetFeaturedResponse, DisableFeaturedResponse, DelegateClientsResponse, GetUserPackageResponse } from '@/models/users';


export async function fetchUsersSummary(token?: string): Promise<UsersSummaryResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch('https://back.nasmasr.app/api/admin/users-summary', { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as UsersSummaryResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر جلب قائمة المستخدمين');
    throw new Error(message);
  }
  return data;
}

export async function fetchUsersSummaryPage(page?: number, token?: string): Promise<UsersSummaryResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = new URL('https://back.nasmasr.app/api/admin/users-summary');
  if (typeof page === 'number' && Number.isFinite(page) && page > 0) {
    url.searchParams.set('page', String(page));
  }
  const res = await fetch(url.toString(), { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as UsersSummaryResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر جلب قائمة المستخدمين');
    throw new Error(message);
  }
  return data;
}

export async function updateUser(userId: number | string, payload: UpdateUserPayload, token?: string): Promise<UpdateUserResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://back.nasmasr.app/api/admin/users/${userId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as UpdateUserResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر تحديث بيانات المستخدم');
    throw new Error(message);
  }
  return data;
}

export async function toggleUserBlock(userId: number | string, token?: string): Promise<BlockUserResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://back.nasmasr.app/api/admin/users/${userId}/block`, {
    method: 'PATCH',
    headers,
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as BlockUserResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر تغيير حالة الحظر للمستخدم');
    throw new Error(message);
  }
  return data;
}

export async function deleteUser(userId: number | string, token?: string): Promise<DeleteUserResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://back.nasmasr.app/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers,
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as DeleteUserResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر حذف المستخدم');
    throw new Error(message);
  }
  return data;
}

export async function createUser(payload: CreateUserPayload, token?: string): Promise<CreateUserResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch('https://back.nasmasr.app/api/admin/users', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as CreateUserResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر إضافة المستخدم');
    throw new Error(message);
  }
  return data;
}

export async function changeUserPassword(userId: number | string, token?: string): Promise<ChangePasswordResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://back.nasmasr.app/api/admin/change-password/${userId}`, {
    method: 'PUT',
    headers,
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as ChangePasswordResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر تغيير كلمة السر للمستخدم');
    throw new Error(message);
  }
  return data;
}

export async function createUserOtp(userId: number | string, token?: string): Promise<CreateOtpResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://back.nasmasr.app/api/admin/create-otp/${userId}`, {
    method: 'POST',
    headers,
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as CreateOtpResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر إنشاء كود التحقق');
    throw new Error(message);
  }
  return data;
}

export async function fetchUserListings(
  userId: number | string,
  params?: { per_page?: number; status?: string; all?: boolean; category_slugs?: string | string[] },
  token?: string
): Promise<SingleUserListingsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const baseUrl = `https://back.nasmasr.app/api/admin/users/${userId}`;
  const url = new URL(baseUrl);
  const perPage = params?.per_page ?? 20;
  const status = params?.status ?? 'Valid';
  const all = params?.all ?? false;
  if (all) {
    url.searchParams.set('all', 'true');
  } else {
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('all', 'false');
  }
  if (status) url.searchParams.set('status', status);
  const cats = params?.category_slugs;
  if (typeof cats === 'string' && cats) {
    url.searchParams.set('category_slugs', cats);
  } else if (Array.isArray(cats) && cats.length > 0) {
    url.searchParams.set('category_slugs', cats.join(','));
  }
  const res = await fetch(url.toString(), { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as SingleUserListingsResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر جلب إعلانات المستخدم');
    throw new Error(message);
  }
  return data;
}

export async function fetchCategories(token?: string): Promise<CategoriesResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch('https://back.nasmasr.app/api/categories', { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as CategoriesResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر جلب الأقسام');
    throw new Error(message);
  }
  return data;
}

export async function setUserFeaturedCategories(payload: SetFeaturedPayload, token?: string): Promise<SetFeaturedResponse & { record_id?: number }> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch('https://back.nasmasr.app/api/admin/featured', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as SetFeaturedResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر حفظ تفضيل المعلن');
    throw new Error(message);
  }
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const recordIdCandidates: (unknown)[] = [
    obj['id'],
    obj['best_advertiser_id'],
    (obj['data'] && typeof obj['data'] === 'object') ? (obj['data'] as Record<string, unknown>)['id'] : undefined,
    (obj['data'] && typeof obj['data'] === 'object') ? (obj['data'] as Record<string, unknown>)['best_advertiser_id'] : undefined,
  ];
  let record_id: number | undefined = undefined;
  for (const cand of recordIdCandidates) {
    if (typeof cand === 'number' && Number.isFinite(cand)) { record_id = cand; break; }
    if (typeof cand === 'string' && cand.trim() && Number.isFinite(Number(cand))) { record_id = Number(cand); break; }
  }
  return { ...(data || {}), record_id };
}

export async function disableUserFeatured(recordId: number | string, token?: string): Promise<DisableFeaturedResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://back.nasmasr.app/api/admin/disable/${recordId}`, {
    method: 'PUT',
    headers,
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as DisableFeaturedResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر إلغاء تفضيل المعلن');
    throw new Error(message);
  }
  return data;
}

export async function assignUserPackage(payload: AssignUserPackagePayload, token?: string): Promise<AssignUserPackageResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch('https://back.nasmasr.app/api/admin/user-packages', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as AssignUserPackageResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر حفظ الباقة للمستخدم');
    throw new Error(message);
  }
  return data;
}
export async function fetchDelegateClients(userId: number | string, token?: string): Promise<DelegateClientsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://back.nasmasr.app/api/admin/delegates/${userId}/clients`, {
    method: 'GET',
    headers,
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as DelegateClientsResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر جلب عملاء المندوب');
    throw new Error(message);
  }
  return data;
}

export async function fetchUserPackage(userId: number | string, token?: string): Promise<GetUserPackageResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://back.nasmasr.app/api/admin/users/${userId}/package`, {
    method: 'GET',
    headers,
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  const data = raw as GetUserPackageResponse | null;
  if (!res.ok || !data) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر جلب بيانات الباقة');
    throw new Error(message);
  }
  return data;
}

