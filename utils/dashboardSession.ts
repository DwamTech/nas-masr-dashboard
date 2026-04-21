import { AUTH_CONFIG } from '@/config/auth';
import { getPermissionKeyForPath } from '@/constants/dashboardPermissions';
import type { DashboardUser } from '@/types/auth';

export function storeDashboardUser(user: DashboardUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.DASHBOARD_USER, JSON.stringify(user));
  window.dispatchEvent(new Event('dashboard-user-updated'));
}

export function readDashboardUser(): DashboardUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.DASHBOARD_USER);
    return raw ? (JSON.parse(raw) as DashboardUser) : null;
  } catch {
    return null;
  }
}

export function clearDashboardUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.DASHBOARD_USER);
  window.dispatchEvent(new Event('dashboard-user-updated'));
}

export function hasPageAccess(user: DashboardUser | null, pathname: string): boolean {
  if (!user) return false;
  if (String(user.role || '').toLowerCase() === 'admin') return true;

  const requiredKey = getPermissionKeyForPath(pathname);
  if (!requiredKey) return true;

  return Array.isArray(user.allowed_dashboard_pages) && user.allowed_dashboard_pages.includes(requiredKey);
}

export function getFirstAllowedPath(user: DashboardUser | null): string {
  if (!user) return '/auth/login';
  if (String(user.role || '').toLowerCase() === 'admin') return '/dashboard';

  const pages = Array.isArray(user.allowed_dashboard_pages) ? user.allowed_dashboard_pages : [];
  if (pages.includes('dashboard.home')) return '/dashboard';

  const mapping = [
    ['ads.list', '/ads'],
    ['ads.create', '/ads/create'],
    ['ads.packages', '/ads/rules'],
    ['ads.moderation', '/moderation'],
    ['ads.unpaid', '/moderation/unpaid'],
    ['categories.index', '/categories'],
    ['categories.homepage', '/category-homepage-management'],
    ['categories.banners', '/app-banners'],
    ['categories.images', '/unified-images'],
    ['categories.filters', '/dashboard/filters-lists'],
    ['categories.featured_advertisers', '/dashboard/featured-advertisers-control'],
    ['users.index', '/users'],
    ['reports.index', '/reports'],
    ['notifications.index', '/notifications'],
    ['messages.index', '/messages'],
    ['customer-chats.index', '/customer-chats'],
    ['settings.index', '/settings'],
    ['account.self', '/admin-account'],
  ] as const;

  for (const [key, path] of mapping) {
    if (pages.includes(key)) return path;
  }

  return '/admin-account';
}
