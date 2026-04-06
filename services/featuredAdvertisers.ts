import type {
  FeaturedAdvertiserListItem,
  FeaturedAdvertiserSection,
  FeaturedAdvertiserSectionsResponse,
  FeaturedAdvertisersBySectionResponse,
  ReorderFeaturedAdvertisersResponse,
} from '@/models/featuredAdvertisers';
import { buildApiUrl } from '@/utils/api';

function normalizeString(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  return null;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

function normalizeSection(input: unknown): FeaturedAdvertiserSection | null {
  if (!input || typeof input !== 'object') return null;

  const record = input as Record<string, unknown>;
  const id = typeof record.id === 'number' ? record.id : 0;
  const slug = normalizeString(record.slug) || '';
  const name = normalizeString(record.name) || '';

  if (!id || !slug || !name) return null;

  return {
    id,
    slug,
    name,
    icon: normalizeString(record.icon),
    icon_url: normalizeString(record.icon_url),
    global_image_url: normalizeString(record.global_image_url),
    global_image_full_url: normalizeString(record.global_image_full_url),
    featured_advertisers_count:
      typeof record.featured_advertisers_count === 'number'
        ? record.featured_advertisers_count
        : Number(record.featured_advertisers_count || 0),
  };
}

function normalizeAdvertiser(input: unknown): FeaturedAdvertiserListItem | null {
  if (!input || typeof input !== 'object') return null;

  const record = input as Record<string, unknown>;
  const id = typeof record.id === 'number' ? record.id : 0;
  const userId = typeof record.user_id === 'number' ? record.user_id : 0;
  const name = normalizeString(record.name) || '';

  if (!id || !userId || !name) return null;

  const categories = (Array.isArray(record.categories) ? record.categories : [])
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const category = item as Record<string, unknown>;
      const categoryId = typeof category.id === 'number' ? category.id : 0;
      const categoryName = normalizeString(category.name) || '';
      const categorySlug = normalizeString(category.slug) || '';

      if (!categoryId || !categoryName || !categorySlug) return null;

      return {
        id: categoryId,
        name: categoryName,
        slug: categorySlug,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    id,
    user_id: userId,
    name,
    phone: normalizeString(record.phone) || '',
    profile_image_url: normalizeString(record.profile_image_url),
    rank: typeof record.rank === 'number' ? record.rank : Number(record.rank || 0),
    max_listings:
      typeof record.max_listings === 'number'
        ? record.max_listings
        : Number(record.max_listings || 0),
    current_section_visible_listings_count:
      typeof record.current_section_visible_listings_count === 'number'
        ? record.current_section_visible_listings_count
        : Number(record.current_section_visible_listings_count || 0),
    has_visible_listings_in_section: Boolean(record.has_visible_listings_in_section),
    categories_count:
      typeof record.categories_count === 'number'
        ? record.categories_count
        : Number(record.categories_count || categories.length),
    categories,
  };
}

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const raw = (await response.json().catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok || !raw) {
    const message = normalizeString(raw?.error) || normalizeString(raw?.message) || fallbackMessage;
    throw new Error(message);
  }

  return raw as unknown as T;
}

export async function fetchFeaturedAdvertiserSections(): Promise<FeaturedAdvertiserSection[]> {
  const response = await fetch(buildApiUrl('/admin/featured/sections'), {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await parseResponse<FeaturedAdvertiserSectionsResponse>(
    response,
    'تعذر جلب أقسام المعلنين المميزين'
  );

  return Array.isArray(data.sections)
    ? data.sections
        .map((item) => normalizeSection(item))
        .filter((item): item is FeaturedAdvertiserSection => Boolean(item))
    : [];
}

export async function fetchFeaturedAdvertisersBySection(
  slug: string
): Promise<FeaturedAdvertisersBySectionResponse> {
  const response = await fetch(buildApiUrl(`/admin/featured/sections/${encodeURIComponent(slug)}/advertisers`), {
    method: 'GET',
    headers: getHeaders(),
  });

  const data = await parseResponse<Record<string, unknown>>(response, 'تعذر جلب معلني القسم');
  const section = normalizeSection(data.section);

  if (!section) {
    throw new Error('تعذر قراءة بيانات القسم');
  }

  return {
    section,
    advertisers: Array.isArray(data.advertisers)
      ? data.advertisers
          .map((item) => normalizeAdvertiser(item))
          .filter((item): item is FeaturedAdvertiserListItem => Boolean(item))
      : [],
  };
}

export async function reorderFeaturedAdvertisersInSection(
  slug: string,
  advertiserIds: number[]
): Promise<ReorderFeaturedAdvertisersResponse> {
  const response = await fetch(buildApiUrl(`/admin/featured/sections/${encodeURIComponent(slug)}/reorder`), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ advertiser_ids: advertiserIds }),
  });

  return parseResponse<ReorderFeaturedAdvertisersResponse>(
    response,
    'تعذر حفظ ترتيب المعلنين المميزين'
  );
}
