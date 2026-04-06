export interface DashboardPermissionOption {
  key: string;
  label: string;
  path: string;
}

export const DASHBOARD_PERMISSION_OPTIONS: DashboardPermissionOption[] = [
  { key: 'dashboard.home', label: 'الرئيسية', path: '/dashboard' },
  { key: 'ads.list', label: 'إدارة الإعلانات', path: '/ads' },
  { key: 'ads.create', label: 'إنشاء إعلان', path: '/ads/create' },
  { key: 'ads.packages', label: 'إدارة الباقات', path: '/ads/rules' },
  { key: 'ads.moderation', label: 'الموافقات والمراجعة', path: '/moderation' },
  { key: 'ads.unpaid', label: 'مراجعة الإعلانات غير المدفوعة', path: '/moderation/unpaid' },
  { key: 'categories.index', label: 'الأقسام والتصنيفات', path: '/categories' },
  { key: 'categories.homepage', label: 'إدارة أقسام الصفحة الرئيسية', path: '/category-homepage-management' },
  { key: 'categories.banners', label: 'إدارة بنارات التطبيق', path: '/app-banners' },
  { key: 'categories.images', label: 'إدارة صور الأقسام', path: '/unified-images' },
  { key: 'categories.filters', label: 'إدارة الفلاتر والقوائم', path: '/dashboard/filters-lists' },
  { key: 'categories.featured_advertisers', label: 'إدارة ترتيب المعلنين المميزين', path: '/dashboard/featured-advertisers-order' },
  { key: 'users.index', label: 'المستخدمون والموظفون', path: '/users' },
  { key: 'reports.index', label: 'التقارير والإحصائيات', path: '/reports' },
  { key: 'notifications.index', label: 'الإشعارات', path: '/notifications' },
  { key: 'messages.index', label: 'الرسائل', path: '/messages' },
  { key: 'customer-chats.index', label: 'محادثات العملاء', path: '/customer-chats' },
  { key: 'settings.index', label: 'الضبط العام', path: '/settings' },
  { key: 'account.self', label: 'إدارة الحساب الشخصي', path: '/admin-account' },
];

const ROUTE_PERMISSION_MAP: Array<{ prefix: string; key: string }> = [
  { prefix: '/dashboard/featured-advertisers-order', key: 'categories.featured_advertisers' },
  { prefix: '/dashboard/filters-lists', key: 'categories.filters' },
  { prefix: '/dashboard', key: 'dashboard.home' },
  { prefix: '/ads/create', key: 'ads.create' },
  { prefix: '/ads/rules', key: 'ads.packages' },
  { prefix: '/ads/rejected', key: 'ads.moderation' },
  { prefix: '/ads/reports-review', key: 'ads.moderation' },
  { prefix: '/ads', key: 'ads.list' },
  { prefix: '/moderation/unpaid', key: 'ads.unpaid' },
  { prefix: '/moderation', key: 'ads.moderation' },
  { prefix: '/category-homepage-management', key: 'categories.homepage' },
  { prefix: '/app-banners', key: 'categories.banners' },
  { prefix: '/unified-images', key: 'categories.images' },
  { prefix: '/categories', key: 'categories.index' },
  { prefix: '/users', key: 'users.index' },
  { prefix: '/reports', key: 'reports.index' },
  { prefix: '/notifications', key: 'notifications.index' },
  { prefix: '/messages', key: 'messages.index' },
  { prefix: '/customer-chats', key: 'customer-chats.index' },
  { prefix: '/settings', key: 'settings.index' },
  { prefix: '/admin-account', key: 'account.self' },
];

export function getPermissionKeyForPath(pathname: string): string | null {
  const normalized = pathname.endsWith('/') && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;

  for (const item of ROUTE_PERMISSION_MAP) {
    if (normalized === item.prefix || normalized.startsWith(`${item.prefix}/`)) {
      return item.key;
    }
  }

  return null;
}
