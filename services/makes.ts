import type { CarMakesResponse, MakeItem, CategoryField, GovernorateItem, CityItem, CategorySlug, CategoryFieldMapBySlug, AdminCategoryFieldUpdateRequest, AdminCategoryFieldApiResponse, AdminMakeCreateResponse, AdminMakeModelsResponse, AdminMakeListItem, AdminMainSectionRecord, AdminSubSectionsResponse, AdminSubSectionRecord, AdminModelRecord, AdminCategoryListItem } from '@/models/makes';

function toArray(x: unknown): unknown[] {
  return Array.isArray(x) ? x : [];
}

function normalizeString(x: unknown): string | null {
  if (typeof x === 'string' || typeof x === 'number') {
    const s = String(x).trim();
    return s.length ? s : null;
  }
  return null;
}

function normalizeModels(val: unknown): string[] {
  const out: string[] = [];
  const pickName = (o: Record<string, unknown>): string | null => {
    return (
      normalizeString(o['name'])
      || normalizeString(o['ar_name'])
      || normalizeString(o['en_name'])
      || normalizeString(o['city_name'])
      || normalizeString(o['city'])
      || normalizeString(o['title'])
      || normalizeString(o['model'])
      || normalizeString(o['value'])
      || normalizeString(o['label'])
      || normalizeString(o['text'])
    );
  };
  const pushToken = (t: unknown) => {
    const s = normalizeString(t);
    if (s) out.push(s);
  };
  if (typeof val === 'string' || typeof val === 'number') {
    const raw = String(val);
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    for (const tok of tokens) pushToken(tok);
  } else if (Array.isArray(val)) {
    for (const it of val) {
      const s = normalizeString(it);
      if (s) { out.push(s); continue; }
      if (it && typeof it === 'object') {
        const o = it as Record<string, unknown>;
        const cand = normalizeString(o['name'])
          || normalizeString(o['model'])
          || normalizeString(o['title'])
          || normalizeString(o['value']);
        if (cand) out.push(cand);
      }
    }
  } else if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      const s = normalizeString(v);
      if (s) { out.push(s); continue; }
      if (Array.isArray(v)) {
        for (const it of v) {
          const si = normalizeString(it);
          if (si) { out.push(si); continue; }
          if (it && typeof it === 'object') {
            const o = it as Record<string, unknown>;
            const cand = pickName(o);
            if (cand) out.push(cand);
          }
        }
      } else if (v && typeof v === 'object') {
        const cand = pickName(v as Record<string, unknown>);
        if (cand) out.push(cand);
      }
      if (typeof k === 'string' && k.trim().length >= 2 && !/^\d+$/.test(k)) {
        out.push(k.trim());
      }
    }
  }
  return Array.from(new Set(out));
}

function canonicalizeFieldName(raw: unknown, slug: string): string | null {
  const s = normalizeString(raw);
  if (!s) return null;
  const name = s.toLowerCase();
  if (name.includes('main') || name.includes('primary')) return 'category';
  if (name.includes('sub') || name.includes('secondary')) return 'sub';
  if (name === 'main_sections' || name === 'main_categories') return 'category';
  if (name === 'sub_sections' || name === 'sub_categories') return 'sub';
  return s;
}

export async function fetchCarMakes(token?: string): Promise<CarMakesResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch('https://api.nasmasr.app/api/makes', { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = (err?.error || err?.message || 'تعذر جلب الماركات والموديلات');
    throw new Error(message);
  }
  let makes: MakeItem[] = [];
  let count: number | undefined = undefined;
  if (Array.isArray(raw)) {
    makes = raw
      .map((it) => {
        const obj = it as Record<string, unknown>;
        const name = (obj['name'] ?? obj['make'] ?? obj['brand']) as string | undefined;
        const models = normalizeModels(obj['models']);
        if (!name) return null;
        return { name, models } as MakeItem;
      })
      .filter(Boolean) as MakeItem[];
  } else if (typeof raw === 'object' && raw) {
    const obj = raw as Record<string, unknown>;
    const arr = (obj['makes'] ?? obj['data']) as unknown;
    if (Array.isArray(arr)) {
      makes = arr
        .map((it) => {
          const o = it as Record<string, unknown>;
          const name = (o['name'] ?? o['make'] ?? o['brand']) as string | undefined;
          const models = normalizeModels(o['models']);
          if (!name) return null;
          return { name, models } as MakeItem;
        })
        .filter(Boolean) as MakeItem[];
      const c = obj['count'];
      if (typeof c === 'number') count = c;
    } else {
      const keys = Object.keys(obj);
      const items: MakeItem[] = [];
      for (const k of keys) {
        const v = obj[k];
        const models = normalizeModels(v);
        if (models.length) items.push({ name: k, models });
      }
      makes = items;
    }
  }
  return { makes, count } as CarMakesResponse;
}

export async function fetchCategoryFields(categorySlug: CategorySlug | string, token?: string): Promise<CategoryField[]> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const urlAdmin = `https://api.nasmasr.app/api/category-fields?category_slug=${encodeURIComponent(categorySlug)}`;
  const urlOld = `https://api.nasmasr.app/api/category-fields?category_slug=${encodeURIComponent(categorySlug)}`;
  const urlNew = `https://api.nasmasr.app/api/category-fields?category_slug=${encodeURIComponent(categorySlug)}`;
  let res = await fetch(t ? urlAdmin : urlOld, { method: 'GET', headers });
  let raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const nextUrl = t ? urlOld : urlNew;
    res = await fetch(nextUrl, { method: 'GET', headers });
    raw = (await res.json().catch(() => null)) as unknown;
    if (!res.ok || !raw) {
      const finalUrl = t ? urlNew : urlOld;
      res = await fetch(finalUrl, { method: 'GET', headers });
      raw = (await res.json().catch(() => null)) as unknown;
    }
  }
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب حقول التصنيف';
    throw new Error(message);
  }
  const normalizeOptions = (val: unknown): string[] => normalizeModels(val);
  const out: CategoryField[] = [];
  if (Array.isArray(raw)) {
    for (const it of raw) {
      if (it && typeof it === 'object') {
        const o = it as Record<string, unknown>;
        const nameRaw = (o['field_name'] ?? o['name'] ?? o['title']) as unknown;
        const nameCanon = canonicalizeFieldName(nameRaw, String(categorySlug));
        const name = nameCanon ?? undefined;
        const options = normalizeOptions(o['options']);
        if (name) out.push({ field_name: name, options });
      }
    }
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr = obj['fields'] ?? obj['data'];
    if (Array.isArray(arr)) {
      for (const it of arr) {
        if (it && typeof it === 'object') {
          const o = it as Record<string, unknown>;
          const nameRaw = (o['field_name'] ?? o['name'] ?? o['title']) as unknown;
          const nameCanon = canonicalizeFieldName(nameRaw, String(categorySlug));
          const name = nameCanon ?? undefined;
          const options = normalizeOptions(o['options']);
          if (name) out.push({ field_name: name, options });
        }
      }
    } else {
      const keys = Object.keys(obj);
      for (const k of keys) {
        const v = obj[k];
        const options = normalizeOptions(v);
        const kCanon = canonicalizeFieldName(k, String(categorySlug)) ?? k;
        if (options.length) out.push({ field_name: kCanon, options });
      }
    }
  }
  return out;
}

export async function fetchCategoryFieldsBatch(slugs: (CategorySlug | string)[], token?: string): Promise<Record<string, CategoryField[]>> {
  const tasks = slugs.map(async (s) => {
    try {
      const fields = await fetchCategoryFields(s as CategorySlug, token);
      return [s, fields] as const;
    } catch {
      return [s, []] as const;
    }
  });
  const entries = await Promise.all(tasks);
  return Object.fromEntries(entries);
}

export function fieldsToMap(fields: CategoryField[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const f of fields) {
    const key = String(f.field_name || '').trim();
    const options = Array.isArray(f.options) ? f.options : [];
    if (key) out[key] = options;
  }
  return out;
}

export async function fetchCategoryFieldMaps(slugs: (CategorySlug | string)[], token?: string): Promise<CategoryFieldMapBySlug> {
  const batch = await fetchCategoryFieldsBatch(slugs, token);
  const out: CategoryFieldMapBySlug = {};
  for (const [slug, fields] of Object.entries(batch)) {
    out[slug as CategorySlug] = fieldsToMap(fields as CategoryField[]);
  }
  return out;
}

export async function fetchCategoryMainSubs(slug: CategorySlug | string, token?: string): Promise<Record<string, string[]>> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  try {
    const list = await fetchAdminMainSections(slug, token);
    if (Array.isArray(list) && list.length > 0) {
      const out: Record<string, string[]> = {};
      for (const it of list) {
        const mainName = normalizeString(it.name);
        const subs = Array.isArray(it.sub_sections) ? it.sub_sections.map(s => normalizeString(s.name) ?? '').filter(Boolean) : [];
        if (mainName) out[mainName] = subs;
      }
      if (Object.keys(out).length) return out;
    }
  } catch { }
  const urlAdmin = `https://api.nasmasr.app/api/category-fields?category_slug=${encodeURIComponent(String(slug))}`;
  const urlOld = `https://api.nasmasr.app/api/category-fields?category_slug=${encodeURIComponent(String(slug))}`;
  const urlNew = `https://api.nasmasr.app/api/category-fields?category_slug=${encodeURIComponent(String(slug))}`;
  let res = await fetch(t ? urlAdmin : urlOld, { method: 'GET', headers });
  let raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const nextUrl = t ? urlOld : urlNew;
    res = await fetch(nextUrl, { method: 'GET', headers });
    raw = (await res.json().catch(() => null)) as unknown;
    if (!res.ok || !raw) {
      const finalUrl = t ? urlNew : urlOld;
      res = await fetch(finalUrl, { method: 'GET', headers });
      raw = (await res.json().catch(() => null)) as unknown;
    }
  }
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب حقول التصنيف';
    throw new Error(message);
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const mainSections = obj['main_sections'];
    if (Array.isArray(mainSections)) {
      const out: Record<string, string[]> = {};
      for (const it of mainSections) {
        if (!it || typeof it !== 'object') continue;
        const o = it as Record<string, unknown>;
        const mainName = normalizeString(o['name']) || normalizeString(o['title']) || normalizeString(o['value']) || undefined;
        const subsRaw = o['sub_sections'];
        const subs: string[] = Array.isArray(subsRaw)
          ? subsRaw.map((s) => {
            if (typeof s === 'string' || typeof s === 'number') return String(s).trim();
            if (s && typeof s === 'object') {
              const so = s as Record<string, unknown>;
              return normalizeString(so['name']) || normalizeString(so['title']) || normalizeString(so['value']) || '';
            }
            return '';
          }).filter((x) => x.length > 0)
          : [];
        if (mainName) out[mainName] = subs;
      }
      if (Object.keys(out).length) return out;
    }
  }
  const buildFlat = (fields: Record<string, string[]>) => {
    const mains = fields['category'] ?? fields['main'] ?? fields['main_sections'] ?? [];
    const subs = fields['sub'] ?? fields['sub_sections'] ?? [];
    const out: Record<string, string[]> = {};
    for (const m of mains) out[m] = subs;
    return out;
  };
  const parseOptsMap = (val: unknown): Record<string, string[]> => {
    const out: Record<string, string[]> = {};
    if (Array.isArray(val)) {
      for (const it of val) {
        if (typeof it === 'string' || typeof it === 'number') {
          const k = String(it).trim();
          if (k) out[k] = out[k] ?? [];
        } else if (it && typeof it === 'object') {
          const o = it as Record<string, unknown>;
          const kRaw = o['name'] ?? o['title'] ?? o['value'] ?? o['label'];
          const k = normalizeString(kRaw);
          const listVal = o['options'] ?? o['subs'] ?? o['children'] ?? o['models'];
          const list = normalizeModels(listVal);
          if (k) out[k] = list;
        }
      }
    } else if (val && typeof val === 'object') {
      const obj = val as Record<string, unknown>;
      for (const [kRaw, v] of Object.entries(obj)) {
        const k = normalizeString(kRaw);
        const list = normalizeModels(v);
        if (k) out[k] = list;
      }
    }
    return out;
  };
  const fieldsMap: Record<string, string[]> = {};
  if (Array.isArray(raw)) {
    for (const it of raw) {
      if (!it || typeof it !== 'object') continue;
      const o = it as Record<string, unknown>;
      const nameCanon = canonicalizeFieldName(o['field_name'] ?? o['name'] ?? o['title'], String(slug));
      if (!nameCanon) continue;
      const opts = o['options'];
      if (nameCanon === 'sub') {
        const m = parseOptsMap(opts);
        if (Object.keys(m).length) return m;
      }
      const options = normalizeModels(opts);
      fieldsMap[nameCanon] = options;
    }
    return buildFlat(fieldsMap);
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr = obj['fields'] ?? obj['data'];
    if (Array.isArray(arr)) {
      for (const it of arr) {
        if (!it || typeof it !== 'object') continue;
        const o = it as Record<string, unknown>;
        const nameCanon = canonicalizeFieldName(o['field_name'] ?? o['name'] ?? o['title'], String(slug));
        if (!nameCanon) continue;
        const opts = o['options'];
        if (nameCanon === 'sub') {
          const m = parseOptsMap(opts);
          if (Object.keys(m).length) return m;
        }
        const options = normalizeModels(opts);
        fieldsMap[nameCanon] = options;
      }
      return buildFlat(fieldsMap);
    } else {
      const keys = Object.keys(obj);
      let subMap: Record<string, string[]> | null = null;
      for (const k of keys) {
        const kCanon = canonicalizeFieldName(k, String(slug)) ?? k;
        const v = obj[k];
        if (kCanon === 'sub') {
          const m = parseOptsMap(v);
          if (Object.keys(m).length) subMap = m;
        }
        fieldsMap[kCanon] = normalizeModels(v);
      }
      if (subMap) return subMap;
      return buildFlat(fieldsMap);
    }
  }
  return {};
}

export async function fetchCategoryMainSubsBatch(slugs: (CategorySlug | string)[], token?: string): Promise<Record<string, Record<string, string[]>>> {
  const tasks = slugs.map(async (s) => {
    try {
      const m = await fetchCategoryMainSubs(s, token);
      return [s, m] as const;
    } catch {
      return [s, {}] as const;
    }
  });
  const entries = await Promise.all(tasks);
  return Object.fromEntries(entries);
}

export async function postAdminCategoryFieldOptions(slug: CategorySlug | string, payload: AdminCategoryFieldUpdateRequest, token?: string): Promise<AdminCategoryFieldApiResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://api.nasmasr.app/api/admin/category-fields/${encodeURIComponent(String(slug))}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== 'object') {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر تحديث الحقل';
    throw new Error(message);
  }
  const obj = raw as Record<string, unknown>;
  const data = obj['data'] as AdminCategoryFieldApiResponse['data'];
  const message = (obj['message'] as string) || 'تم تحديث الحقل بنجاح';
  return { message, data };
}

export async function updateCategoryFieldOptions(slug: CategorySlug | string, field_name: string, options: string[], token?: string): Promise<string[]> {
  const uniq = Array.from(new Set(options.map((x) => String(x).trim()).filter(Boolean)));
  const resp = await postAdminCategoryFieldOptions(slug, { field_name, options: uniq }, token);
  return Array.isArray(resp.data?.options) ? resp.data.options : uniq;
}

export async function fetchAdminMakesWithIds(token?: string): Promise<AdminMakeListItem[]> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = 'https://api.nasmasr.app/api/makes';
  const res = await fetch(url, { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب الماركات';
    throw new Error(message);
  }
  const out: AdminMakeListItem[] = [];
  const pushItem = (o: Record<string, unknown>) => {
    const id = typeof o['id'] === 'number' ? (o['id'] as number) : undefined;
    const nameRaw = o['name'] ?? o['make'] ?? o['brand'];
    const name = typeof nameRaw === 'string' || typeof nameRaw === 'number' ? String(nameRaw).trim() : '';
    const models = normalizeModels(o['models']);
    const model_objects: AdminModelRecord[] = [];
    const mRaw = o['models'];
    if (Array.isArray(mRaw)) {
      for (const m of mRaw) {
        if (m && typeof m === 'object') {
          const mo = m as Record<string, unknown>;
          const mid = typeof mo['id'] === 'number' ? mo['id'] as number : undefined;
          const mname = normalizeString(mo['name']);
          const mmake = typeof mo['make_id'] === 'number' ? mo['make_id'] as number : (typeof id === 'number' ? id : 0);
          if (mid && mname) {
            model_objects.push({ id: mid, name: mname, make_id: mmake });
          }
        }
      }
    }
    if (typeof id === 'number' && name) out.push({ id, name, models, model_objects });
  };
  if (Array.isArray(raw)) {
    for (const it of raw) {
      if (it && typeof it === 'object') pushItem(it as Record<string, unknown>);
    }
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr = obj['data'] ?? obj['makes'];
    if (Array.isArray(arr)) {
      for (const it of arr) {
        if (it && typeof it === 'object') pushItem(it as Record<string, unknown>);
      }
    } else {
      for (const [k, v] of Object.entries(obj)) {
        const id = Number.isFinite(Number(k)) ? Number(k) : undefined;
        if (v && typeof v === 'object') {
          const o = v as Record<string, unknown>;
          pushItem(o);
        }
      }
    }
  }
  return out;
}

export async function postAdminMake(name: string, token?: string): Promise<AdminMakeCreateResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = 'https://api.nasmasr.app/api/admin/makes';
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ name }) });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== 'object') {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر إضافة الماركة';
    throw new Error(message);
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o['id'] === 'number' ? (o['id'] as number) : 0;
  const nameOut = (o['name'] ?? name) as string;
  const models = normalizeModels(o['models']);
  const created_at = typeof o['created_at'] === 'string' ? (o['created_at'] as string) : undefined;
  const updated_at = typeof o['updated_at'] === 'string' ? (o['updated_at'] as string) : undefined;
  return { id, name: nameOut, models, created_at, updated_at } as AdminMakeCreateResponse;
}

export async function postAdminMakeModels(makeId: number, models: string[], token?: string): Promise<AdminMakeModelsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (t) headers.Authorization = `Bearer ${t}`;
  const uniq = Array.from(new Set(models.map((x) => String(x).trim()).filter(Boolean)));
  const url = `https://api.nasmasr.app/api/admin/makes/${makeId}/models`;
  const body = JSON.stringify({ models: uniq });
  const res = await fetch(url, { method: 'POST', headers, body });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== 'object') {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر إضافة الموديلات';
    throw new Error(message);
  }
  const o = raw as Record<string, unknown>;
  const mid = typeof o['make_id'] === 'number' ? (o['make_id'] as number) : makeId;
  const list: { id: number; name: string; make_id: number; created_at?: string; updated_at?: string }[] = [];
  const arr = o['models'];
  if (Array.isArray(arr)) {
    for (const it of arr) {
      if (it && typeof it === 'object') {
        const mo = it as Record<string, unknown>;
        const id = typeof mo['id'] === 'number' ? (mo['id'] as number) : undefined;
        const name = normalizeString(mo['name']) ?? '';
        const mk = typeof mo['make_id'] === 'number' ? (mo['make_id'] as number) : mid;
        const created_at = typeof mo['created_at'] === 'string' ? (mo['created_at'] as string) : undefined;
        const updated_at = typeof mo['updated_at'] === 'string' ? (mo['updated_at'] as string) : undefined;
        if (name) list.push({ id: id ?? 0, name, make_id: mk, created_at, updated_at });
      }
    }
  }
  return { make_id: mid, models: list } as AdminMakeModelsResponse;
}

export async function updateAdminMake(makeId: number, name: string, token?: string): Promise<AdminMakeCreateResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://api.nasmasr.app/api/admin/makes/${makeId}`;
  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify({ name }) });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== 'object') {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر تعديل الماركة';
    throw new Error(message);
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o['id'] === 'number' ? (o['id'] as number) : makeId;
  const nameOut = normalizeString(o['name']) ?? name;
  const models = normalizeModels(o['models']);
  const created_at = typeof o['created_at'] === 'string' ? (o['created_at'] as string) : undefined;
  const updated_at = typeof o['updated_at'] === 'string' ? (o['updated_at'] as string) : undefined;
  return { id, name: String(nameOut), models, created_at, updated_at };
}

export async function deleteAdminMake(makeId: number, token?: string): Promise<void> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://api.nasmasr.app/api/admin/makes/${makeId}`;
  const res = await fetch(url, { method: 'DELETE', headers });
  if (!res.ok) {
    const raw = (await res.json().catch(() => null)) as unknown;
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر حذف الماركة';
    throw new Error(message);
  }
}

export async function updateAdminModel(modelId: number, name: string, make_id: number, token?: string): Promise<AdminModelRecord> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://api.nasmasr.app/api/admin/models/${modelId}`;
  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify({ name, make_id }) });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== 'object') {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر تعديل الموديل';
    throw new Error(message);
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o['id'] === 'number' ? (o['id'] as number) : modelId;
  const nameOut = normalizeString(o['name']) ?? name;
  const mk = typeof o['make_id'] === 'number' ? (o['make_id'] as number) : make_id;
  const created_at = typeof o['created_at'] === 'string' ? (o['created_at'] as string) : undefined;
  const updated_at = typeof o['updated_at'] === 'string' ? (o['updated_at'] as string) : undefined;
  return { id, name: String(nameOut), make_id: mk, created_at, updated_at };
}

export async function deleteAdminModel(modelId: number, token?: string): Promise<void> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://api.nasmasr.app/api/admin/models/${modelId}`;
  const res = await fetch(url, { method: 'DELETE', headers });
  if (!res.ok) {
    const raw = (await res.json().catch(() => null)) as unknown;
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر حذف الموديل';
    throw new Error(message);
  }
}

export async function fetchMakeModels(makeId: number | string, token?: string): Promise<AdminModelRecord[]> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://api.nasmasr.app/api/admin/makes/${makeId}`;
  const res = await fetch(url, { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب الموديلات';
    throw new Error(message);
  }
  const out: AdminModelRecord[] = [];
  const o = raw as Record<string, unknown>;
  let makeObj = o;
  if (!o['models'] && o['data']) {
    makeObj = o['data'] as Record<string, unknown>;
  }
  const modelsArr = makeObj['models'];
  if (Array.isArray(modelsArr)) {
    for (const m of modelsArr) {
      if (m && typeof m === 'object') {
        const mo = m as Record<string, unknown>;
        const id = typeof mo['id'] === 'number' ? (mo['id'] as number) : undefined;
        const name = normalizeString(mo['name']);
        const mk = typeof mo['make_id'] === 'number' ? (mo['make_id'] as number) : (typeof makeId === 'number' ? Number(makeId) : 0);
        if (id && name) out.push({ id, name, make_id: mk });
      }
    }
  }
  return out;
}

export function buildAdminMainSectionUrl(slug: string): string {
  return `https://api.nasmasr.app/api/admin/main-section/${encodeURIComponent(String(slug))}`;
}

export function buildMainSectionsListUrl(slug: string): string {
  const url = new URL('https://api.nasmasr.app/api/main-sections');
  url.searchParams.set('category_slug', String(slug));
  return url.toString();
}

export function buildAdminSubSectionUrl(mainSectionId: number | string): string {
  return `https://api.nasmasr.app/api/admin/sub-section/${mainSectionId}`;
}

export function buildPublicSubSectionsUrl(mainSectionId: number | string): string {
  return `https://api.nasmasr.app/api/sub-sections/${mainSectionId}`;
}

export function buildAdminMainSectionIdUrl(mainSectionId: number | string): string {
  return `https://api.nasmasr.app/api/admin/main-section/${mainSectionId}`;
}

export function buildAdminSubSectionIdUrl(subSectionId: number | string): string {
  return `https://api.nasmasr.app/api/admin/sub-section/${subSectionId}`;
}

export function buildAdminCategoryImageUrl(categoryId: number | string): string {
  return `https://api.nasmasr.app/api/admin/categories/${categoryId}/image`;
}

export async function postAdminMainSection(slug: CategorySlug | string, name: string, token?: string): Promise<AdminMainSectionRecord> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = buildAdminMainSectionUrl(String(slug));
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ name }) });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== 'object') {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر إضافة الرئيسي';
    throw new Error(message);
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o['id'] === 'number' ? (o['id'] as number) : 0;
  const category_id = typeof o['category_id'] === 'number' ? (o['category_id'] as number) : 0;
  const nameOut = normalizeString(o['name']) ?? name;
  const sort_order = typeof o['sort_order'] === 'number' ? (o['sort_order'] as number) : undefined;
  const is_active = typeof o['is_active'] === 'boolean' ? (o['is_active'] as boolean) : undefined;
  const created_at = typeof o['created_at'] === 'string' ? (o['created_at'] as string) : undefined;
  const updated_at = typeof o['updated_at'] === 'string' ? (o['updated_at'] as string) : undefined;
  const subRaw = o['sub_sections'];
  let sub_sections: AdminSubSectionRecord[] | undefined = undefined;
  if (Array.isArray(subRaw)) {
    const list: AdminSubSectionRecord[] = [];
    for (const it of subRaw) {
      if (it && typeof it === 'object') {
        const so = it as Record<string, unknown>;
        const sid = typeof so['id'] === 'number' ? (so['id'] as number) : 0;
        const scid = typeof so['category_id'] === 'number' ? (so['category_id'] as number) : category_id;
        const smid = typeof so['main_section_id'] === 'number' ? (so['main_section_id'] as number) : id;
        const sname = normalizeString(so['name']) ?? '';
        const ssort = typeof so['sort_order'] === 'number' ? (so['sort_order'] as number) : undefined;
        const sactive = typeof so['is_active'] === 'boolean' ? (so['is_active'] as boolean) : undefined;
        const screated = typeof so['created_at'] === 'string' ? (so['created_at'] as string) : undefined;
        const supdated = typeof so['updated_at'] === 'string' ? (so['updated_at'] as string) : undefined;
        if (sname) list.push({ id: sid, category_id: scid, main_section_id: smid, name: sname, sort_order: ssort, is_active: sactive, created_at: screated, updated_at: supdated });
      }
    }
    sub_sections = list;
  }
  return { id, category_id, name: String(nameOut), sort_order, is_active, created_at, updated_at, sub_sections } as AdminMainSectionRecord;
}

export async function postAdminSubSections(mainSectionId: number, subSections: string[], token?: string): Promise<AdminSubSectionsResponse> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (t) headers.Authorization = `Bearer ${t}`;
  const uniq = Array.from(new Set(subSections.map((x) => String(x).trim()).filter(Boolean)));
  const url = buildAdminSubSectionUrl(mainSectionId);
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ sub_sections: uniq }) });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== 'object') {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر إضافة الفرعيات';
    throw new Error(message);
  }
  const o = raw as Record<string, unknown>;
  const mid = typeof o['main_section_id'] === 'number' ? (o['main_section_id'] as number) : mainSectionId;
  const outList: AdminSubSectionRecord[] = [];
  const arr = o['sub_sections'];
  if (Array.isArray(arr)) {
    for (const it of arr) {
      if (it && typeof it === 'object') {
        const so = it as Record<string, unknown>;
        const id = typeof so['id'] === 'number' ? (so['id'] as number) : 0;
        const category_id = typeof so['category_id'] === 'number' ? (so['category_id'] as number) : undefined;
        const main_section_id = typeof so['main_section_id'] === 'number' ? (so['main_section_id'] as number) : mid;
        const name = normalizeString(so['name']) ?? '';
        const sort_order = typeof so['sort_order'] === 'number' ? (so['sort_order'] as number) : undefined;
        const is_active = typeof so['is_active'] === 'boolean' ? (so['is_active'] as boolean) : undefined;
        const created_at = typeof so['created_at'] === 'string' ? (so['created_at'] as string) : undefined;
        const updated_at = typeof so['updated_at'] === 'string' ? (so['updated_at'] as string) : undefined;
        if (name) outList.push({ id, category_id: category_id ?? 0, main_section_id, name, sort_order, is_active, created_at, updated_at });
      }
    }
  }
  return { main_section_id: mid, sub_sections: outList } as AdminSubSectionsResponse;
}

export async function fetchAdminSubSections(mainSectionId: number | string, token?: string): Promise<AdminSubSectionRecord[]> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  let url = buildAdminSubSectionUrl(mainSectionId);
  let res = await fetch(url, { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    url = buildPublicSubSectionsUrl(mainSectionId);
    res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  }
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب الفرعيات';
    throw new Error(message);
  }
  const out: AdminSubSectionRecord[] = [];
  const pushParsed = (it: unknown) => {
    if (it && typeof it === 'object') {
      const o = it as Record<string, unknown>;
      const id = typeof o['id'] === 'number' ? (o['id'] as number) : 0;
      const category_id = typeof o['category_id'] === 'number' ? (o['category_id'] as number) : 0;
      const main_section_id = typeof o['main_section_id'] === 'number' ? (o['main_section_id'] as number) : (typeof mainSectionId === 'number' ? mainSectionId : 0);
      const name = normalizeString(o['name']) ?? '';
      const sort_order = typeof o['sort_order'] === 'number' ? (o['sort_order'] as number) : undefined;
      const is_active = typeof o['is_active'] === 'boolean' ? (o['is_active'] as boolean) : undefined;
      const created_at = typeof o['created_at'] === 'string' ? (o['created_at'] as string) : undefined;
      const updated_at = typeof o['updated_at'] === 'string' ? (o['updated_at'] as string) : undefined;
      if (name) out.push({ id, category_id, main_section_id, name, sort_order, is_active, created_at, updated_at });
    }
  };
  if (Array.isArray(raw)) {
    for (const it of raw) pushParsed(it);
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr = obj['sub_sections'] ?? obj['data'];
    if (Array.isArray(arr)) {
      for (const it of arr) pushParsed(it);
    } else {
      pushParsed(raw);
    }
  }
  return out;
}

export async function fetchPublicSubSections(mainSectionId: number | string): Promise<AdminSubSectionRecord[]> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const url = buildPublicSubSectionsUrl(mainSectionId);
  const res = await fetch(url, { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب الفرعيات';
    throw new Error(message);
  }
  const out: AdminSubSectionRecord[] = [];
  const pushParsed = (it: unknown) => {
    if (it && typeof it === 'object') {
      const o = it as Record<string, unknown>;
      const id = typeof o['id'] === 'number' ? (o['id'] as number) : 0;
      const category_id = typeof o['category_id'] === 'number' ? (o['category_id'] as number) : 0;
      const main_section_id = typeof o['main_section_id'] === 'number' ? (o['main_section_id'] as number) : (typeof mainSectionId === 'number' ? mainSectionId : 0);
      const name = normalizeString(o['name']) ?? '';
      const sort_order = typeof o['sort_order'] === 'number' ? (o['sort_order'] as number) : undefined;
      const is_active = typeof o['is_active'] === 'boolean' ? (o['is_active'] as boolean) : undefined;
      const created_at = typeof o['created_at'] === 'string' ? (o['created_at'] as string) : undefined;
      const updated_at = typeof o['updated_at'] === 'string' ? (o['updated_at'] as string) : undefined;
      if (name) out.push({ id, category_id, main_section_id, name, sort_order, is_active, created_at, updated_at });
    }
  };
  if (Array.isArray(raw)) {
    for (const it of raw) pushParsed(it);
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr = obj['sub_sections'] ?? obj['data'];
    if (Array.isArray(arr)) {
      for (const it of arr) pushParsed(it);
    } else {
      pushParsed(raw);
    }
  }
  return out;
}

export async function deleteAdminMainSection(mainSectionId: number, token?: string): Promise<void> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = buildAdminMainSectionIdUrl(mainSectionId);
  const res = await fetch(url, { method: 'DELETE', headers });
  if (!res.ok) {
    const raw = (await res.json().catch(() => null)) as unknown;
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر حذف الرئيسي';
    throw new Error(message);
  }
}

export async function deleteAdminSubSection(subSectionId: number, token?: string): Promise<void> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = buildAdminSubSectionIdUrl(subSectionId);
  const res = await fetch(url, { method: 'DELETE', headers });
  if (!res.ok) {
    const raw = (await res.json().catch(() => null)) as unknown;
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر حذف الفرعي';
    throw new Error(message);
  }
}

export async function fetchAdminMainSections(slug: CategorySlug | string, token?: string): Promise<AdminMainSectionRecord[]> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = buildMainSectionsListUrl(String(slug));
  const res = await fetch(url, { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب الرئيسي والفرعي';
    throw new Error(message);
  }
  const out: AdminMainSectionRecord[] = [];
  const pushParsed = (it: unknown) => {
    if (it && typeof it === 'object') {
      const o = it as Record<string, unknown>;
      const id = typeof o['id'] === 'number' ? (o['id'] as number) : 0;
      const category_id = typeof o['category_id'] === 'number' ? (o['category_id'] as number) : 0;
      const name = normalizeString(o['name']) ?? '';
      const sort_order = typeof o['sort_order'] === 'number' ? (o['sort_order'] as number) : undefined;
      const is_active = typeof o['is_active'] === 'boolean' ? (o['is_active'] as boolean) : undefined;
      const created_at = typeof o['created_at'] === 'string' ? (o['created_at'] as string) : undefined;
      const updated_at = typeof o['updated_at'] === 'string' ? (o['updated_at'] as string) : undefined;
      let sub_sections: AdminSubSectionRecord[] | undefined = undefined;
      const subsRaw = o['sub_sections'];
      if (Array.isArray(subsRaw)) {
        const list: AdminSubSectionRecord[] = [];
        for (const s of subsRaw) {
          if (s && typeof s === 'object') {
            const so = s as Record<string, unknown>;
            const sid = typeof so['id'] === 'number' ? (so['id'] as number) : 0;
            const scid = typeof so['category_id'] === 'number' ? (so['category_id'] as number) : category_id;
            const smid = typeof so['main_section_id'] === 'number' ? (so['main_section_id'] as number) : id;
            const sname = normalizeString(so['name']) ?? '';
            const ssort = typeof so['sort_order'] === 'number' ? (so['sort_order'] as number) : undefined;
            const sactive = typeof so['is_active'] === 'boolean' ? (so['is_active'] as boolean) : undefined;
            const screated = typeof so['created_at'] === 'string' ? (so['created_at'] as string) : undefined;
            const supdated = typeof so['updated_at'] === 'string' ? (so['updated_at'] as string) : undefined;
            if (sname) list.push({ id: sid, category_id: scid, main_section_id: smid, name: sname, sort_order: ssort, is_active: sactive, created_at: screated, updated_at: supdated });
          }
        }
        sub_sections = list;
      }
      if (name) out.push({ id, category_id, name, sort_order, is_active, created_at, updated_at, sub_sections });
    }
  };
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr1 = obj['main_sections'];
    const arr2 = Array.isArray(obj) ? (raw as unknown[]) : undefined;
    if (Array.isArray(arr1)) {
      for (const it of arr1) pushParsed(it);
    } else if (Array.isArray(arr2)) {
      for (const it of arr2) pushParsed(it);
    } else {
      pushParsed(raw);
    }
  }
  return out;
}

export async function fetchAdminMainSectionsBatch(slugs: (CategorySlug | string)[], token?: string): Promise<Record<string, AdminMainSectionRecord[]>> {
  const tasks = slugs.map(async (s) => {
    try {
      const arr = await fetchAdminMainSections(s, token);
      return [s, arr] as const;
    } catch {
      return [s, []] as const;
    }
  });
  const entries = await Promise.all(tasks);
  return Object.fromEntries(entries);
}

export async function fetchAdminCategories(token?: string): Promise<AdminCategoryListItem[]> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = 'https://api.nasmasr.app/api/admin/categories';
  const res = await fetch(url, { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب الأقسام';
    throw new Error(message);
  }
  const iconMap: Record<string, string> = {
    'cars': '🚙',
    'real_estate': '🏠',
    'spare-parts': '🔧',
    'animals': '🐾',
    'teachers': '👨‍🏫',
    'doctors': '👨‍⚕️',
    'jobs': '💼',
    'food-products': '🍎',
    'restaurants': '🍕',
    'stores': '🏬',
    'groceries': '🍎',
    'home-services': '🔨',
    'furniture': '🚛',
    'home-tools': '🏠',
    'home-appliances': '📺',
    'electronics': '💻',
    'health': '⚕️',
    'education': '📚',
    'shipping': '🚚',
    'mens-clothes': '👔',
    'heavy-transport': '🚛',
    'kids-toys': '🎈',
    'free-professions': '💼',
    'watches-jewelry': '⌚',
    'car-services': '🔧',
    'maintenance': '⚙️',
    'construction': '⚒️',
    'gym': '💪',
    'light-vehicles': '🚲',
    'production-lines': '🏭',
    'farm-products': '🌾',
    'lighting-decor': '💡',
    'missing': '🔍',
    'tools': '🔨',
    'wholesale': '📦',
  };
  const pickName = (o: Record<string, unknown>): string => {
    return (
      normalizeString(o['display_name'])
      || normalizeString(o['name_ar'])
      || normalizeString(o['name'])
      || normalizeString(o['ar_name'])
      || normalizeString(o['en_name'])
      || ''
    ) as string;
  };
  const pickSlug = (o: Record<string, unknown>): string | undefined => {
    const s = normalizeString(o['slug']) || normalizeString(o['category_slug']) || null;
    return s || undefined;
  };
  const pickIcon = (o: Record<string, unknown>, slug?: string): string | undefined => {
    const v = normalizeString(o['icon']) || normalizeString(o['emoji']) || null;
    if (v) return v as string;
    if (slug && iconMap[slug]) return iconMap[slug];
    return undefined;
  };
  const pickImage = (o: Record<string, unknown>): string | undefined => {
    const keys = ['homepage_image', 'image', 'image_url', 'icon_url', 'photo', 'banner'];
    for (const k of keys) {
      const val = normalizeString(o[k]);
      if (val) return val as string;
    }
    const iconVal = normalizeString(o['icon']);
    if (iconVal && (String(iconVal).includes('.png') || String(iconVal).includes('.jpg') || String(iconVal).includes('.jpeg') || String(iconVal).includes('.webp'))) {
      return iconVal as string;
    }
    return undefined;
  };
  const pickFields = (o: Record<string, unknown>): CategoryField[] | undefined => {
    const arr = (o['fields'] ?? o['custom_fields'] ?? o['category_fields']) as unknown;
    const out: CategoryField[] = [];
    if (Array.isArray(arr)) {
      for (const it of arr) {
        if (it && typeof it === 'object') {
          const fo = it as Record<string, unknown>;
          const field_name = normalizeString(fo['field_name']);
          const optionsRaw = fo['options'];
          const options = Array.isArray(optionsRaw) ? optionsRaw.map(x => String(x)).filter(Boolean) : [];
          if (field_name) out.push({ field_name, options });
        }
      }
    }
    return out.length ? out : undefined;
  };
  const normalize = (it: unknown): AdminCategoryListItem | null => {
    if (!it || typeof it !== 'object') return null;
    const o = it as Record<string, unknown>;
    const id = typeof o['id'] === 'number' ? (o['id'] as number) : 0;
    const slug = pickSlug(o);
    const name = pickName(o);
    if (!id || !name) return null;
    const icon = pickIcon(o, slug);
    const is_active = typeof o['is_active'] === 'boolean' ? (o['is_active'] as boolean) : (normalizeString(o['status']) ? String(o['status']).toLowerCase() === 'active' : undefined);
    const sort_order = typeof o['sort_order'] === 'number' ? (o['sort_order'] as number) : (typeof o['order'] === 'number' ? (o['order'] as number) : undefined);
    const show_on_homepage = typeof o['show_on_homepage'] === 'boolean' ? (o['show_on_homepage'] as boolean) : undefined;
    const homepage_image = pickImage(o);
    const cards_count = typeof o['cards_count'] === 'number' ? (o['cards_count'] as number) : undefined;
    const fields = pickFields(o);
    return { id, slug, name, icon, is_active, sort_order, show_on_homepage, homepage_image, cards_count, fields };
  };
  const out: AdminCategoryListItem[] = [];
  if (Array.isArray(raw)) {
    for (const it of raw) {
      const c = normalize(it);
      if (c) out.push(c);
    }
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr1 = obj['categories'];
    const arr2 = obj['data'];
    const arr = Array.isArray(arr1) ? arr1 : (Array.isArray(arr2) ? arr2 : []);
    if (Array.isArray(arr)) {
      for (const it of arr) {
        const c = normalize(it);
        if (c) out.push(c);
      }
    } else {
      const c = normalize(raw);
      if (c) out.push(c);
    }
  }
  return out;
}

export async function updateAdminCategoryActive(categoryId: number | string, is_active: boolean, token?: string): Promise<AdminCategoryListItem> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://api.nasmasr.app/api/admin/categories/${categoryId}`;
  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify({ is_active }) });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== 'object') {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر تحديث القسم';
    throw new Error(message);
  }
  const obj = raw as Record<string, unknown>;
  const data = (obj['data'] ?? obj) as Record<string, unknown>;
  const id = typeof data['id'] === 'number' ? (data['id'] as number) : (typeof categoryId === 'number' ? (categoryId as number) : 0);
  const slugVal = data['slug'] ?? data['category_slug'];
  const slug = typeof slugVal === 'string' ? String(slugVal).trim() : undefined;
  const nameRaw = data['name'] ?? data['display_name'] ?? data['name_ar'];
  const name = typeof nameRaw === 'string' || typeof nameRaw === 'number' ? String(nameRaw).trim() : '';
  const iconRaw = data['icon'] ?? data['emoji'];
  const icon = typeof iconRaw === 'string' ? String(iconRaw).trim() : undefined;
  const sort_order = typeof data['sort_order'] === 'number' ? (data['sort_order'] as number) : (typeof data['order'] === 'number' ? (data['order'] as number) : undefined);
  const is_active_out = typeof data['is_active'] === 'boolean' ? (data['is_active'] as boolean) : undefined;
  const imageRaw = data['homepage_image'] ?? data['image'] ?? data['image_url'] ?? data['icon_url'];
  const homepage_image = typeof imageRaw === 'string' ? String(imageRaw).trim() : undefined;
  const cards_count = typeof data['cards_count'] === 'number' ? (data['cards_count'] as number) : undefined;
  return { id, slug, name, icon, is_active: is_active_out, sort_order, homepage_image, cards_count } as AdminCategoryListItem;
}

export async function updateAdminCategoryImage(categoryId: number | string, file: File, token?: string): Promise<AdminCategoryListItem> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const fd = new FormData();
  fd.append('image', file);
  const url = buildAdminCategoryImageUrl(categoryId);
  const res = await fetch(url, { method: 'PUT', headers, body: fd });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== 'object') {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر رفع الصورة';
    throw new Error(message);
  }
  const obj = raw as Record<string, unknown>;
  const data = (obj['data'] ?? obj) as Record<string, unknown>;
  const id = typeof data['id'] === 'number' ? (data['id'] as number) : (typeof categoryId === 'number' ? Number(categoryId) : 0);
  const slugVal = data['slug'] ?? data['category_slug'];
  const slug = typeof slugVal === 'string' ? String(slugVal).trim() : undefined;
  const nameRaw = data['name'] ?? data['display_name'] ?? data['name_ar'];
  const name = typeof nameRaw === 'string' || typeof nameRaw === 'number' ? String(nameRaw).trim() : '';
  const iconRaw = data['icon'] ?? data['emoji'];
  const icon = typeof iconRaw === 'string' ? String(iconRaw).trim() : undefined;
  const sort_order = typeof data['sort_order'] === 'number' ? (data['sort_order'] as number) : (typeof data['order'] === 'number' ? (data['order'] as number) : undefined);
  const is_active_out = typeof data['is_active'] === 'boolean' ? (data['is_active'] as boolean) : undefined;
  const imageRaw = data['homepage_image'] ?? data['image'] ?? data['image_url'] ?? data['icon_url'];
  const homepage_image = typeof imageRaw === 'string' ? String(imageRaw).trim() : undefined;
  const cards_count = typeof data['cards_count'] === 'number' ? (data['cards_count'] as number) : undefined;
  return { id, slug, name, icon, is_active: is_active_out, sort_order, homepage_image, cards_count } as AdminCategoryListItem;
}

export async function deleteAdminCategoryImage(categoryId: number | string, token?: string): Promise<AdminCategoryListItem> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = buildAdminCategoryImageUrl(categoryId);
  const res = await fetch(url, { method: 'DELETE', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== 'object') {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر حذف الصورة';
    throw new Error(message);
  }
  const obj = raw as Record<string, unknown>;
  const data = (obj['data'] ?? obj) as Record<string, unknown>;
  const id = typeof data['id'] === 'number' ? (data['id'] as number) : (typeof categoryId === 'number' ? Number(categoryId) : 0);
  const slugVal = data['slug'] ?? data['category_slug'];
  const slug = typeof slugVal === 'string' ? String(slugVal).trim() : undefined;
  const nameRaw = data['name'] ?? data['display_name'] ?? data['name_ar'];
  const name = typeof nameRaw === 'string' || typeof nameRaw === 'number' ? String(nameRaw).trim() : '';
  const iconRaw = data['icon'] ?? data['emoji'];
  const icon = typeof iconRaw === 'string' ? String(iconRaw).trim() : undefined;
  const sort_order = typeof data['sort_order'] === 'number' ? (data['sort_order'] as number) : (typeof data['order'] === 'number' ? (data['order'] as number) : undefined);
  const is_active_out = typeof data['is_active'] === 'boolean' ? (data['is_active'] as boolean) : undefined;
  const imageRaw = data['homepage_image'] ?? data['image'] ?? data['image_url'] ?? data['icon_url'];
  const homepage_image = typeof imageRaw === 'string' ? String(imageRaw).trim() : undefined;
  const cards_count = typeof data['cards_count'] === 'number' ? (data['cards_count'] as number) : undefined;
  return { id, slug, name, icon, is_active: is_active_out, sort_order, homepage_image, cards_count } as AdminCategoryListItem;
}
export async function updateAdminMainSection(mainSectionId: number, name: string, token?: string): Promise<AdminMainSectionRecord> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = buildAdminMainSectionIdUrl(mainSectionId);
  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify({ name }) });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== 'object') {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر تعديل الرئيسي';
    throw new Error(message);
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o['id'] === 'number' ? (o['id'] as number) : mainSectionId;
  const category_id = typeof o['category_id'] === 'number' ? (o['category_id'] as number) : undefined;
  const nameOut = normalizeString(o['name']) ?? name;
  const sort_order = typeof o['sort_order'] === 'number' ? (o['sort_order'] as number) : undefined;
  const is_active = typeof o['is_active'] === 'boolean' ? (o['is_active'] as boolean) : undefined;
  const created_at = typeof o['created_at'] === 'string' ? (o['created_at'] as string) : undefined;
  const updated_at = typeof o['updated_at'] === 'string' ? (o['updated_at'] as string) : undefined;
  return { id, category_id: category_id ?? 0, name: String(nameOut), sort_order, is_active, created_at, updated_at } as AdminMainSectionRecord;
}

export async function updateAdminSubSection(subSectionId: number, name: string, token?: string): Promise<AdminSubSectionRecord> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = buildAdminSubSectionIdUrl(subSectionId);
  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify({ name }) });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw || typeof raw !== 'object') {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر تعديل الفرعي';
    throw new Error(message);
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o['id'] === 'number' ? (o['id'] as number) : subSectionId;
  const category_id = typeof o['category_id'] === 'number' ? (o['category_id'] as number) : undefined;
  const main_section_id = typeof o['main_section_id'] === 'number' ? (o['main_section_id'] as number) : undefined;
  const nameOut = normalizeString(o['name']) ?? name;
  const sort_order = typeof o['sort_order'] === 'number' ? (o['sort_order'] as number) : undefined;
  const is_active = typeof o['is_active'] === 'boolean' ? (o['is_active'] as boolean) : undefined;
  const created_at = typeof o['created_at'] === 'string' ? (o['created_at'] as string) : undefined;
  const updated_at = typeof o['updated_at'] === 'string' ? (o['updated_at'] as string) : undefined;
  return { id, category_id: category_id ?? 0, main_section_id: main_section_id ?? 0, name: String(nameOut), sort_order, is_active, created_at, updated_at } as AdminSubSectionRecord;
}

export async function addOptionRemote(slug: CategorySlug | string, field_name: string, option: string, currentOptions: string[], token?: string): Promise<string[]> {
  const next = Array.from(new Set([...currentOptions, option].map((x) => String(x).trim()).filter(Boolean)));
  return updateCategoryFieldOptions(slug, field_name, next, token);
}

export async function removeOptionRemote(slug: CategorySlug | string, field_name: string, option: string, currentOptions: string[], token?: string): Promise<string[]> {
  const next = currentOptions.filter((x) => String(x).trim() !== String(option).trim());
  return updateCategoryFieldOptions(slug, field_name, next, token);
}

export async function renameOptionRemote(slug: CategorySlug | string, field_name: string, prevOption: string, nextOption: string, currentOptions: string[], token?: string): Promise<string[]> {
  const trimmedPrev = String(prevOption).trim();
  const trimmedNext = String(nextOption).trim();
  const next = currentOptions.map((x) => (String(x).trim() === trimmedPrev ? trimmedNext : x));
  return updateCategoryFieldOptions(slug, field_name, next, token);
}

export async function fetchGovernorates(token?: string): Promise<GovernorateItem[]> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const adminUrl = 'https://api.nasmasr.app/api/governorates';
  const publicUrl = 'https://api.nasmasr.app/api/governorates';
  let res = await fetch(t ? adminUrl : publicUrl, { method: 'GET', headers });
  let raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    if (t) {
      res = await fetch(publicUrl, { method: 'GET', headers: { Accept: 'application/json' } });
      raw = (await res.json().catch(() => null)) as unknown;
    }
    if (!res.ok || !raw) {
      const err = raw as { error?: string; message?: string } | null;
      const message = err?.error || err?.message || 'تعذر جلب المحافظات والمدن';
      throw new Error(message);
    }
  }
  const out: GovernorateItem[] = [];
  const cityIdsByGov: Record<number, Record<string, number>> = {};
  const pushGov = (o: Record<string, unknown>) => {
    const nameRaw = o['name'] ?? o['governorate'] ?? o['title'];
    const name = typeof nameRaw === 'string' || typeof nameRaw === 'number' ? String(nameRaw).trim() : '';
    const citiesVal =
      o['cities']
      ?? o['city']
      ?? o['children']
      ?? o['items']
      ?? o['models']
      ?? o['data']
      ?? o['list']
      ?? o['cities_list']
      ?? o['cities_names'];
    const cities = normalizeModels(citiesVal);
    const id = typeof o['id'] === 'number' ? (o['id'] as number) : undefined;
    if (id && Array.isArray((citiesVal as unknown))) {
      const rec: Record<string, number> = cityIdsByGov[id] ?? {};
      for (const it of (citiesVal as unknown[])) {
        if (it && typeof it === 'object') {
          const ci = it as Record<string, unknown>;
          const cnameRaw = ci['name'] ?? ci['city_name'] ?? ci['title'];
          const cname = typeof cnameRaw === 'string' || typeof cnameRaw === 'number' ? String(cnameRaw).trim() : '';
          const cid = typeof ci['id'] === 'number' ? (ci['id'] as number) : (typeof ci['city_id'] === 'number' ? (ci['city_id'] as number) : undefined);
          if (cname && typeof cid === 'number') rec[cname] = cid;
        }
      }
      if (Object.keys(rec).length) cityIdsByGov[id] = rec;
    }
    if (name) out.push({ id, name, cities } as GovernorateItem);
  };
  if (Array.isArray(raw)) {
    for (const it of raw) {
      if (it && typeof it === 'object') pushGov(it as Record<string, unknown>);
    }
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr = obj['governorates'] ?? obj['data'];
    if (Array.isArray(arr)) {
      for (const it of arr) {
        if (it && typeof it === 'object') pushGov(it as Record<string, unknown>);
      }
    } else {
      const keys = Object.keys(obj);
      for (const k of keys) {
        const v = obj[k];
        const cities = normalizeModels(v);
        if (cities.length) out.push({ name: k, cities });
      }
    }
  }
  try {
    const pubRes = await fetch(publicUrl, { method: 'GET', headers: { Accept: 'application/json' } });
    const pubRaw = (await pubRes.json().catch(() => null)) as unknown;
    const pubOut: GovernorateItem[] = [];
    const pushPub = (o: Record<string, unknown>) => {
      const nameRaw = o['name'] ?? o['governorate'] ?? o['title'];
      const name = typeof nameRaw === 'string' || typeof nameRaw === 'number' ? String(nameRaw).trim() : '';
      const citiesVal =
        o['cities']
        ?? o['city']
        ?? o['children']
        ?? o['items']
        ?? o['models']
        ?? o['data']
        ?? o['list']
        ?? o['cities_list']
        ?? o['cities_names'];
      const cities = normalizeModels(citiesVal);
      if (name) pubOut.push({ name, cities } as GovernorateItem);
    };
    if (Array.isArray(pubRaw)) {
      for (const it of pubRaw) {
        if (it && typeof it === 'object') pushPub(it as Record<string, unknown>);
      }
    } else if (pubRaw && typeof pubRaw === 'object') {
      const obj = pubRaw as Record<string, unknown>;
      const arr = obj['governorates'] ?? obj['data'];
      if (Array.isArray(arr)) {
        for (const it of arr) {
          if (it && typeof it === 'object') pushPub(it as Record<string, unknown>);
        }
      } else {
        const keys = Object.keys(obj);
        for (const k of keys) {
          const v = obj[k];
          const cities = normalizeModels(v);
          if (cities.length) pubOut.push({ name: k, cities } as GovernorateItem);
        }
      }
    }
    const pubMap: Record<string, string[]> = Object.fromEntries(pubOut.map(g => [g.name, g.cities]));
    if (out.length === 0) return pubOut;
    for (const g of out) {
      const extra = pubMap[g.name] ?? [];
      if (extra.length) g.cities = Array.from(new Set([...(g.cities ?? []), ...extra]));
    }
    try {
      if (typeof window !== 'undefined') {
        const rawMap = localStorage.getItem('admin:cityIds');
        const existing: Record<number, Record<string, number>> = rawMap ? JSON.parse(rawMap) : {};
        const merged: Record<number, Record<string, number>> = { ...existing };
        for (const [gidStr, rec] of Object.entries(cityIdsByGov)) {
          const gid = Number(gidStr);
          const prev = merged[gid] ?? {};
          merged[gid] = { ...prev, ...rec };
        }
        localStorage.setItem('admin:cityIds', JSON.stringify(merged));
      }
    } catch { }
    return out;
  } catch {
    try {
      if (typeof window !== 'undefined') {
        const rawMap = localStorage.getItem('admin:cityIds');
        const existing: Record<number, Record<string, number>> = rawMap ? JSON.parse(rawMap) : {};
        const merged: Record<number, Record<string, number>> = { ...existing };
        for (const [gidStr, rec] of Object.entries(cityIdsByGov)) {
          const gid = Number(gidStr);
          const prev = merged[gid] ?? {};
          merged[gid] = { ...prev, ...rec };
        }
        localStorage.setItem('admin:cityIds', JSON.stringify(merged));
      }
    } catch { }
    return out;
  }
}

export async function postAdminGovernorates(payload: { name: string; cities: unknown[] }, token?: string): Promise<GovernorateItem[]> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const body = JSON.stringify({ name: payload.name, cities: payload.cities });
  const res = await fetch('https://api.nasmasr.app/api/admin/governorates', { method: 'POST', headers, body });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر حفظ المحافظات والمدن';
    throw new Error(message);
  }
  const out: GovernorateItem[] = [];
  const pushGov = (o: Record<string, unknown>) => {
    const nameRaw = o['name'] ?? o['governorate'] ?? o['title'];
    const name = typeof nameRaw === 'string' || typeof nameRaw === 'number' ? String(nameRaw).trim() : '';
    const citiesVal =
      o['cities']
      ?? o['city']
      ?? o['children']
      ?? o['items']
      ?? o['models']
      ?? o['data']
      ?? o['list'];
    const cities = normalizeModels(citiesVal);
    const id = typeof o['id'] === 'number' ? (o['id'] as number) : undefined;
    if (name) out.push({ id, name, cities } as GovernorateItem);
  };
  if (Array.isArray(raw)) {
    for (const it of raw) {
      if (it && typeof it === 'object') pushGov(it as Record<string, unknown>);
    }
  } else if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const arr = obj['governorates'] ?? obj['data'];
    if (Array.isArray(arr)) {
      for (const it of arr) {
        if (it && typeof it === 'object') pushGov(it as Record<string, unknown>);
      }
    } else if (obj['id'] || obj['name'] || obj['cities']) {
      pushGov(obj);
    } else {
      const keys = Object.keys(obj);
      for (const k of keys) {
        const v = obj[k];
        const cities = normalizeModels(v);
        if (cities.length) out.push({ name: k, cities });
      }
    }
  }
  return out;
}

export async function createGovernorate(name: string, token?: string): Promise<GovernorateItem> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch('https://api.nasmasr.app/api/admin/governorates', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name }),
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر إضافة المحافظة';
    throw new Error(message);
  }
  if (Array.isArray(raw)) {
    const firstObj = raw.find((x) => {
      if (!x || typeof x !== 'object') return false;
      const r = x as Record<string, unknown>;
      return typeof r['name'] === 'string' || typeof r['name'] === 'number';
    });
    const o = (firstObj ?? {}) as Record<string, unknown>;
    const id = typeof o['id'] === 'number' ? o['id'] : undefined;
    const nameOut = (o['name'] ?? o['governorate'] ?? '') as string;
    const cities = normalizeModels(o['cities']);
    return { id, name: nameOut, cities } as GovernorateItem;
  } else if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const id = typeof o['id'] === 'number' ? o['id'] : undefined;
    const nameOut = (o['name'] ?? o['governorate'] ?? '') as string;
    const cities = normalizeModels(o['cities']);
    return { id, name: nameOut, cities } as GovernorateItem;
  }
  return { name, cities: [] } as GovernorateItem;
}

export async function createCity(governorateId: number | string, name: string, token?: string): Promise<CityItem> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://api.nasmasr.app/api/admin/city/${governorateId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name }),
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر إضافة المدينة';
    throw new Error(message);
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const id = typeof o['id'] === 'number' ? o['id'] : undefined;
    const nameOut = (o['name'] ?? '') as string;
    const govId = typeof o['governorate_id'] === 'number' ? o['governorate_id'] : undefined;
    return { id, name: nameOut, governorate_id: govId } as CityItem;
  }
  return { name } as CityItem;
}

export async function fetchGovernorateById(governorateId: number | string, token?: string): Promise<GovernorateItem> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://api.nasmasr.app/api/admin/governorates/${governorateId}`, { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب المحافظة';
    throw new Error(message);
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const id = typeof o['id'] === 'number' ? o['id'] : (typeof governorateId === 'number' ? governorateId : undefined);
    const nameOut = (o['name'] ?? o['governorate'] ?? '') as string;
    const citiesVal = o['cities'] ?? o['data'] ?? o['list'] ?? o['children'];
    const cities = normalizeModels(citiesVal);
    try {
      if (typeof window !== 'undefined' && typeof id === 'number' && Array.isArray(citiesVal)) {
        const rawMap = localStorage.getItem('admin:cityIds');
        const existing: Record<number, Record<string, number>> = rawMap ? JSON.parse(rawMap) : {};
        const prev = existing[id] ?? {};
        for (const it of (citiesVal as unknown[])) {
          if (it && typeof it === 'object') {
            const ci = it as Record<string, unknown>;
            const cnameRaw = ci['name'] ?? ci['city_name'] ?? ci['title'];
            const cname = typeof cnameRaw === 'string' || typeof cnameRaw === 'number' ? String(cnameRaw).trim() : '';
            const cid = typeof ci['id'] === 'number' ? (ci['id'] as number) : (typeof ci['city_id'] === 'number' ? (ci['city_id'] as number) : undefined);
            if (cname && typeof cid === 'number') prev[cname] = cid;
          }
        }
        existing[id] = prev;
        localStorage.setItem('admin:cityIds', JSON.stringify(existing));
      }
    } catch { }
    return { id, name: nameOut, cities } as GovernorateItem;
  }
  return { name: String(governorateId), cities: [] } as GovernorateItem;
}

export async function updateCity(cityId: number | string, name: string, token?: string): Promise<CityItem> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://api.nasmasr.app/api/admin/cities/${cityId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name }),
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر تعديل المدينة';
    throw new Error(message);
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const id = typeof o['id'] === 'number' ? o['id'] : (typeof cityId === 'number' ? cityId : undefined);
    const nameOut = (o['name'] ?? name) as string;
    const govId = typeof o['governorate_id'] === 'number' ? o['governorate_id'] : undefined;
    return { id, name: nameOut, governorate_id: govId } as CityItem;
  }
  return { name } as CityItem;
}

export async function deleteCity(cityId: number | string, token?: string): Promise<{ success: boolean; message?: string }> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://api.nasmasr.app/api/admin/cities/${cityId}`;
  const res = await fetch(url, { method: 'DELETE', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر حذف المدينة';
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

export async function updateGovernorate(governorateId: number | string, name: string, token?: string): Promise<GovernorateItem> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://api.nasmasr.app/api/admin/governorates/${governorateId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name }),
  });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر تعديل المحافظة';
    throw new Error(message);
  }
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const id = typeof o['id'] === 'number' ? o['id'] : (typeof governorateId === 'number' ? governorateId : undefined);
    const nameOut = (o['name'] ?? name) as string;
    const cities = normalizeModels(o['cities']);
    return { id, name: nameOut, cities } as GovernorateItem;
  }
  return { name, cities: [] } as GovernorateItem;
}

export async function deleteGovernorate(governorateId: number | string, token?: string): Promise<{ success: boolean; message?: string }> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;
  const url = `https://api.nasmasr.app/api/admin/governorates/${governorateId}`;
  const res = await fetch(url, { method: 'DELETE', headers });
  const raw = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر حذف المحافظة';
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

// ===========================
// Category Homepage Management API
// ===========================

export async function fetchCategoryHomepage(categoryId: number, token?: string): Promise<import('@/models/makes').CategoryHomepageItem> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;

  const url = `https://api.nasmasr.app/api/admin/categories/${categoryId}`;
  const res = await fetch(url, { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;

  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب بيانات القسم';
    throw new Error(message);
  }

  const obj = raw as Record<string, unknown>;
  const data = (obj['data'] ?? obj) as Record<string, unknown>;

  const id = typeof data['id'] === 'number' ? data['id'] : categoryId;
  const name = String(data['name'] || '');
  const slugVal = data['slug'];
  const slug = typeof slugVal === 'string' ? slugVal : undefined;
  const icon_url = typeof data['icon_url'] === 'string' ? data['icon_url'] : undefined;
  const is_active = typeof data['is_active'] === 'number' ? data['is_active'] : (typeof data['is_active'] === 'boolean' ? (data['is_active'] ? 1 : 0) : undefined);
  const sort_order = typeof data['sort_order'] === 'number' ? data['sort_order'] : undefined;

  return { id, name, slug, icon_url, is_active, sort_order };
}

export async function updateCategoryHomepage(
  categoryId: number,
  updateData: { name?: string; icon?: File | null; is_active?: number | boolean },
  token?: string
): Promise<import('@/models/makes').CategoryHomepageItem> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;

  const formData = new FormData();
  formData.append('_method', 'PUT');

  if (updateData.name !== undefined) {
    formData.append('name', updateData.name);
  }

  if (updateData.icon instanceof File) {
    formData.append('icon', updateData.icon);
  }

  if (updateData.is_active !== undefined) {
    const activeValue = typeof updateData.is_active === 'boolean' ? (updateData.is_active ? '1' : '0') : String(updateData.is_active);
    formData.append('is_active', activeValue);
  }

  const url = `https://api.nasmasr.app/api/admin/categories/${categoryId}`;
  const res = await fetch(url, { method: 'POST', headers, body: formData });
  const raw = (await res.json().catch(() => null)) as unknown;

  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر تحديث بيانات القسم';
    throw new Error(message);
  }

  const obj = raw as Record<string, unknown>;
  const data = (obj['data'] ?? obj) as Record<string, unknown>;

  const id = typeof data['id'] === 'number' ? data['id'] : categoryId;
  const name = String(data['name'] || '');
  const slugVal = data['slug'];
  const slug = typeof slugVal === 'string' ? slugVal : undefined;
  const icon_url = typeof data['icon_url'] === 'string' ? data['icon_url'] : undefined;
  const is_active = typeof data['is_active'] === 'number' ? data['is_active'] : (typeof data['is_active'] === 'boolean' ? (data['is_active'] ? 1 : 0) : undefined);
  const sort_order = typeof data['sort_order'] === 'number' ? data['sort_order'] : undefined;

  return { id, name, slug, icon_url, is_active, sort_order };
}

export async function fetchCategoriesUsageReport(token?: string): Promise<import('@/models/makes').CategoryHomepageItem[]> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;

  const url = 'https://api.nasmasr.app/api/admin/categories/usage-report';
  const res = await fetch(url, { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;

  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب تقرير الاستخدام';
    throw new Error(message);
  }

  const out: import('@/models/makes').CategoryHomepageItem[] = [];
  const obj = raw as Record<string, unknown>;
  const dataArray = Array.isArray(obj['data']) ? obj['data'] : (Array.isArray(raw) ? raw : []);

  for (const item of dataArray) {
    if (item && typeof item === 'object') {
      const data = item as Record<string, unknown>;
      const id = typeof data['id'] === 'number' ? data['id'] : 0;
      const name = String(data['name'] || '');
      const slugVal = data['slug'];
      const slug = typeof slugVal === 'string' ? slugVal : undefined;
      const icon_url = typeof data['icon_url'] === 'string' ? data['icon_url'] : undefined;
      const is_active = typeof data['is_active'] === 'number' ? data['is_active'] : (typeof data['is_active'] === 'boolean' ? (data['is_active'] ? 1 : 0) : undefined);
      const sort_order = typeof data['sort_order'] === 'number' ? data['sort_order'] : undefined;

      if (id && name) {
        out.push({ id, name, slug, icon_url, is_active, sort_order });
      }
    }
  }

  return out;
}

// ===========================
// Category Banners API
// ===========================

/**
 * جلب جميع البنرات (للأدمن)
 */
export async function fetchCategoryBanners(token?: string): Promise<import('@/models/makes').CategoryBanner[]> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;

  const url = 'https://api.nasmasr.app/api/admin/category-banners';
  const res = await fetch(url, { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;

  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب البنرات';
    throw new Error(message);
  }

  const out: import('@/models/makes').CategoryBanner[] = [];
  const obj = raw as Record<string, unknown>;
  const dataArray = Array.isArray(obj['data']) ? obj['data'] : (Array.isArray(raw) ? raw : []);

  for (const item of dataArray) {
    if (item && typeof item === 'object') {
      const data = item as Record<string, unknown>;
      const id = typeof data['id'] === 'number' ? data['id'] : 0;
      const category_id = typeof data['category_id'] === 'number' ? data['category_id'] : 0;
      const category_name = typeof data['category_name'] === 'string' ? data['category_name'] : undefined;
      const category_slug = typeof data['category_slug'] === 'string' ? data['category_slug'] : undefined;
      const banner_url = typeof data['banner_url'] === 'string' ? data['banner_url'] : '';
      const is_active = typeof data['is_active'] === 'boolean' ? data['is_active'] : (typeof data['is_active'] === 'number' ? data['is_active'] : undefined);
      const display_order = typeof data['display_order'] === 'number' ? data['display_order'] : undefined;
      const created_at = typeof data['created_at'] === 'string' ? data['created_at'] : undefined;
      const updated_at = typeof data['updated_at'] === 'string' ? data['updated_at'] : undefined;

      if (id && category_id && banner_url) {
        out.push({ id, category_id, category_name, category_slug, banner_url, is_active, display_order, created_at, updated_at });
      }
    }
  }

  return out;
}

/**
 * جلب بانر محدد
 */
export async function fetchCategoryBanner(bannerId: number, token?: string): Promise<import('@/models/makes').CategoryBanner> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;

  const url = `https://api.nasmasr.app/api/admin/category-banners/${bannerId}`;
  const res = await fetch(url, { method: 'GET', headers });
  const raw = (await res.json().catch(() => null)) as unknown;

  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر جلب البانر';
    throw new Error(message);
  }

  const obj = raw as Record<string, unknown>;
  const data = (obj['data'] ?? obj) as Record<string, unknown>;

  const id = typeof data['id'] === 'number' ? data['id'] : bannerId;
  const category_id = typeof data['category_id'] === 'number' ? data['category_id'] : 0;
  const category_name = typeof data['category_name'] === 'string' ? data['category_name'] : undefined;
  const category_slug = typeof data['category_slug'] === 'string' ? data['category_slug'] : undefined;
  const banner_url = typeof data['banner_url'] === 'string' ? data['banner_url'] : '';
  const is_active = typeof data['is_active'] === 'boolean' ? data['is_active'] : (typeof data['is_active'] === 'number' ? data['is_active'] : undefined);
  const display_order = typeof data['display_order'] === 'number' ? data['display_order'] : undefined;
  const created_at = typeof data['created_at'] === 'string' ? data['created_at'] : undefined;
  const updated_at = typeof data['updated_at'] === 'string' ? data['updated_at'] : undefined;

  return { id, category_id, category_name, category_slug, banner_url, is_active, display_order, created_at, updated_at };
}

/**
 * إنشاء بانر جديد
 */
export async function createCategoryBanner(
  createData: import('@/models/makes').CategoryBannerCreateRequest,
  token?: string
): Promise<import('@/models/makes').CategoryBanner> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;

  const formData = new FormData();
  formData.append('category_id', String(createData.category_id));
  formData.append('banner_image', createData.banner_image);

  if (createData.is_active !== undefined) {
    const activeValue = typeof createData.is_active === 'boolean' ? (createData.is_active ? '1' : '0') : String(createData.is_active);
    formData.append('is_active', activeValue);
  }

  if (createData.display_order !== undefined) {
    formData.append('display_order', String(createData.display_order));
  }

  const url = 'https://api.nasmasr.app/api/admin/category-banners';
  const res = await fetch(url, { method: 'POST', headers, body: formData });
  const raw = (await res.json().catch(() => null)) as unknown;

  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر إضافة البانر';
    throw new Error(message);
  }

  const obj = raw as Record<string, unknown>;
  const data = (obj['data'] ?? obj) as Record<string, unknown>;

  const id = typeof data['id'] === 'number' ? data['id'] : 0;
  const category_id = typeof data['category_id'] === 'number' ? data['category_id'] : createData.category_id;
  const category_name = typeof data['category_name'] === 'string' ? data['category_name'] : undefined;
  const category_slug = typeof data['category_slug'] === 'string' ? data['category_slug'] : undefined;
  const banner_url = typeof data['banner_url'] === 'string' ? data['banner_url'] : '';
  const is_active = typeof data['is_active'] === 'boolean' ? data['is_active'] : (typeof data['is_active'] === 'number' ? data['is_active'] : undefined);
  const display_order = typeof data['display_order'] === 'number' ? data['display_order'] : undefined;
  const created_at = typeof data['created_at'] === 'string' ? data['created_at'] : undefined;
  const updated_at = typeof data['updated_at'] === 'string' ? data['updated_at'] : undefined;

  return { id, category_id, category_name, category_slug, banner_url, is_active, display_order, created_at, updated_at };
}

/**
 * تحديث بانر
 */
export async function updateCategoryBanner(
  bannerId: number,
  updateData: import('@/models/makes').CategoryBannerUpdateRequest,
  token?: string
): Promise<import('@/models/makes').CategoryBanner> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;

  const formData = new FormData();
  formData.append('_method', 'PUT');

  if (updateData.category_id !== undefined) {
    formData.append('category_id', String(updateData.category_id));
  }

  if (updateData.banner_image) {
    formData.append('banner_image', updateData.banner_image);
  }

  if (updateData.is_active !== undefined) {
    const activeValue = typeof updateData.is_active === 'boolean' ? (updateData.is_active ? '1' : '0') : String(updateData.is_active);
    formData.append('is_active', activeValue);
  }

  if (updateData.display_order !== undefined) {
    formData.append('display_order', String(updateData.display_order));
  }

  const url = `https://api.nasmasr.app/api/admin/category-banners/${bannerId}`;
  const res = await fetch(url, { method: 'POST', headers, body: formData });
  const raw = (await res.json().catch(() => null)) as unknown;

  if (!res.ok || !raw) {
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر تحديث البانر';
    throw new Error(message);
  }

  const obj = raw as Record<string, unknown>;
  const data = (obj['data'] ?? obj) as Record<string, unknown>;

  const id = typeof data['id'] === 'number' ? data['id'] : bannerId;
  const category_id = typeof data['category_id'] === 'number' ? data['category_id'] : 0;
  const category_name = typeof data['category_name'] === 'string' ? data['category_name'] : undefined;
  const category_slug = typeof data['category_slug'] === 'string' ? data['category_slug'] : undefined;
  const banner_url = typeof data['banner_url'] === 'string' ? data['banner_url'] : '';
  const is_active = typeof data['is_active'] === 'boolean' ? data['is_active'] : (typeof data['is_active'] === 'number' ? data['is_active'] : undefined);
  const display_order = typeof data['display_order'] === 'number' ? data['display_order'] : undefined;
  const created_at = typeof data['created_at'] === 'string' ? data['created_at'] : undefined;
  const updated_at = typeof data['updated_at'] === 'string' ? data['updated_at'] : undefined;

  return { id, category_id, category_name, category_slug, banner_url, is_active, display_order, created_at, updated_at };
}

/**
 * حذف بانر
 */
export async function deleteCategoryBanner(bannerId: number, token?: string): Promise<void> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (t) headers.Authorization = `Bearer ${t}`;

  const url = `https://api.nasmasr.app/api/admin/category-banners/${bannerId}`;
  const res = await fetch(url, { method: 'DELETE', headers });

  if (!res.ok) {
    const raw = (await res.json().catch(() => null)) as unknown;
    const err = raw as { error?: string; message?: string } | null;
    const message = err?.error || err?.message || 'تعذر حذف البانر';
    throw new Error(message);
  }
}
