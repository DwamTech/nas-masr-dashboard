'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ManagedSelect from '@/components/ManagedSelect';
import { CATEGORY_LABELS_AR } from '@/constants/categories';
import { DASHBOARD_PERMISSION_OPTIONS } from '@/constants/dashboardPermissions';
import { User as UserIcon, Phone, MapPin, ExternalLink, Users, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import { fetchUsersSummaryPage, updateUser, toggleUserBlock, toggleUserAdUpdateButton, deleteUser, createUser, changeUserPassword, createUserOtp, fetchUserListings, assignUserPackage, setUserFeaturedCategories, disableUserFeatured, fetchDelegateClients, fetchUserPackage, fetchUserFeaturedCategories } from '@/services/users';
import { fetchAdminCategories } from '@/services/makes';
import { CATEGORY_SLUGS, CategorySlug } from '@/models/makes';
import { UsersMeta, AssignUserPackagePayload, DelegateClient, UserSummary } from '@/models/users';
import { buildBackendUrl } from '@/utils/api';
import { readDashboardUser } from '@/utils/dashboardSession';

interface User {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  userCode: string;
  delegateCode?: string | null;
  status: 'active' | 'banned';
  registrationDate: string;
  adsCount: number;
  role: string;
  lastLogin: string;
  phoneVerified?: boolean;
  package?: UserPackage;
  allowedDashboardPages?: string[];
  profileImageUrl?: string | null;
  showAdUpdateButton?: boolean;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  actions?: { label: string; variant?: 'primary' | 'secondary'; onClick?: () => void }[];
  duration?: number; // milliseconds; if 0 or actions provided, stays until closed
}

interface UserPackage {
  featuredAds: number;
  featuredDays: number;
  startFeaturedNow: boolean;
  featuredStartDate?: string | null;
  featuredExpiryDate?: string | null;
  standardAds: number;
  standardDays: number;
  startStandardNow: boolean;
  standardStartDate?: string | null;
  standardExpiryDate?: string | null;
  categories?: number[] | null;
}

// New interfaces for enhanced packages modal
interface PackageHistoryItem {
  id: string;
  type: 'featured' | 'standard';
  totalAds: number;
  consumedAds: number;
  remainingAds: number;
  days?: number; // إضافة عدد الأيام للمقارنة
  startDate: string;
  expiryDate: string;
  status: 'active' | 'expired';
  isCurrent: boolean;
}

interface Category {
  id: number;
  slug: string;
  name: string;
  nameAr: string;
  showFeaturedAdvertisers: boolean;
}

interface PackageError {
  type: 'network' | 'server' | 'permission' | 'unknown';
  message: string;
  canRetry: boolean;
}

const mapUserSummaryToUi = (u: UserSummary): User => ({
  id: String(u.id),
  name: u.name ?? '',
  email: u.email ?? null,
  phone: u.phone,
  address: u.address,
  userCode: u.user_code,
  delegateCode: u.delegate_code,
  status: u.status === 'active' ? 'active' : 'banned',
  registrationDate: u.registered_at,
  adsCount: typeof u.listings_count === 'number' ? u.listings_count : 0,
  role: u.role,
  lastLogin: u.registered_at,
  phoneVerified: u.phone_verified,
  allowedDashboardPages: Array.isArray(u.allowed_dashboard_pages) ? u.allowed_dashboard_pages : [],
  profileImageUrl: u.profile_image_url ?? null,
  showAdUpdateButton: u.show_ad_update_button !== false,
});

const mapUsersRoleFilterToApi = (role: UserPageRoleFilter): string | undefined => {
  if (role === 'all') return undefined;
  return role;
};

type UserPageRoleFilter = 'all' | 'users' | 'advertisers' | 'delegates' | 'employees';

interface PackageCacheData {
  userId: string;
  timestamp: number;
  data: {
    featured: {
      ads_total: number;
      ads_remaining: number;
      days: number;
      start_date: string | null;
      expire_date: string | null;
      active: boolean;
    };
    standard: {
      ads_total: number;
      ads_remaining: number;
      days: number;
      start_date: string | null;
      expire_date: string | null;
      active: boolean;
    };
    categories: number[];
  };
  // إضافة تاريخ الباقات المحلي
  localHistory?: PackageHistoryItem[];
}

interface CategoriesCacheData {
  timestamp: number;
  categories: Category[];
}

type ModalState =
  | 'idle'
  | 'loading'
  | 'loaded'
  | 'error'
  | 'retrying'
  | 'saving'
  | 'save-error';

interface AdItem {
  id: string;
  title: string;
  status: string;
  publishDate: string;
  category: string;
  image: string;
  categorySlug?: string;
  price?: string | null;
  contactPhone?: string | null;
  whatsappPhone?: string | null;
  planType?: string;
  views?: number;
  rank?: number;
  governorate?: string | null;
  city?: string | null;
  lat?: string;
  lng?: string;
  attributes?: Record<string, string | undefined | null>;
}

const toImageUrl = (src: string | null | undefined): string => {
  if (!src || src === 'NULL') return '/file.svg';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  const trimmed = src.startsWith('/') ? src.slice(1) : src;
  return buildBackendUrl(`/${trimmed}`);
};

const mapCategoryRecordToUi = (input: {
  id?: number;
  slug?: string;
  name?: string;
  show_featured_advertisers?: boolean;
}): Category | null => {
  const slug = String(input.slug || '').trim();
  if (!slug) return null;

  const name = String(input.name || slug).trim() || slug;

  return {
    id: Number(input.id) || 0,
    slug,
    name,
    nameAr: CATEGORY_LABELS_AR[slug as keyof typeof CATEGORY_LABELS_AR] || name,
    showFeaturedAdvertisers: input.show_featured_advertisers !== false,
  };
};

// Cache management functions
const savePackageToCache = (userId: string, data: any, localHistory?: PackageHistoryItem[]): void => {
  try {
    const cacheData: PackageCacheData = {
      userId,
      timestamp: Date.now(),
      data,
      localHistory
    };
    localStorage.setItem(
      `userPackageData:${userId}`,
      JSON.stringify(cacheData)
    );
  } catch (error) {
    console.error('Failed to save to cache:', error);
  }
};

const loadPackageFromCache = (userId: string): PackageCacheData | null => {
  try {
    const raw = localStorage.getItem(`userPackageData:${userId}`);
    if (!raw) return null;

    const cached = JSON.parse(raw) as PackageCacheData;

    // التحقق من صلاحية Cache (24 ساعة)
    const MAX_CACHE_AGE = 24 * 60 * 60 * 1000;
    if (Date.now() - cached.timestamp > MAX_CACHE_AGE) {
      return null;
    }

    return cached;
  } catch (error) {
    console.error('Failed to load from cache:', error);
    return null;
  }
};

  const saveCategoriesToCache = (categories: Category[]): void => {
  try {
    const cacheData: CategoriesCacheData = {
      timestamp: Date.now(),
      categories
    };
    localStorage.setItem('categoriesCache', JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to save categories to cache:', error);
  }
};

  const loadCategoriesFromCache = (): Category[] | null => {
  try {
    const raw = localStorage.getItem('categoriesCache');
    if (!raw) return null;

    const cached = JSON.parse(raw) as CategoriesCacheData;

    // الأقسام صالحة لمدة أسبوع
    const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - cached.timestamp > MAX_CACHE_AGE) {
      return null;
    }

    return cached.categories;
  } catch (error) {
    console.error('Failed to load categories from cache:', error);
    return null;
  }
};

// Error handling functions
const getErrorMessage = (error: any): PackageError => {
  // خطأ الشبكة
  if (!error.response) {
    return {
      type: 'network',
      message: 'تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت',
      canRetry: true
    };
  }

  // خطأ الصلاحيات
  if (error.response.status === 401 || error.response.status === 403) {
    return {
      type: 'permission',
      message: 'ليس لديك صلاحية للوصول إلى هذه البيانات',
      canRetry: false
    };
  }

  // خطأ الخادم
  if (error.response.status >= 500) {
    return {
      type: 'server',
      message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً',
      canRetry: true
    };
  }

  // خطأ غير معروف
  return {
    type: 'unknown',
    message: error.response?.data?.message || 'حدث خطأ غير متوقع',
    canRetry: true
  };
};

async function retryWithDelay<T>(
  fn: () => Promise<T>,
  delay: number = 2000
): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, delay));
  return fn();
};

async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 1, retryDelay = 2000, onRetry } = options;
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error;
      
      // إذا كان هذا آخر محاولة، نرمي الخطأ
      if (attempt === maxRetries) {
        throw error;
      }
      
      // إعلام المستدعي بالمحاولة
      if (onRetry) {
        onRetry(attempt + 1);
      }
      
      // الانتظار قبل المحاولة التالية
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw lastError;
};

// Package history functions
const parsePackageHistory = (
  featuredData: any,
  standardData: any
): PackageHistoryItem[] => {
  console.log('parsePackageHistory called with:', { featuredData, standardData });
  const history: PackageHistoryItem[] = [];
  
  // إضافة الباقة المميزة إذا كانت موجودة
  if (featuredData && featuredData.ads_total > 0) {
    const consumedAds = featuredData.ads_total - (featuredData.ads_remaining || 0);
    history.push({
      id: `featured-${featuredData.start_date || Date.now()}`,
      type: 'featured',
      totalAds: featuredData.ads_total,
      consumedAds,
      remainingAds: featuredData.ads_remaining || 0,
      days: featuredData.days,
      startDate: featuredData.start_date,
      expiryDate: featuredData.expire_date,
      status: featuredData.active ? 'active' : 'expired',
      isCurrent: featuredData.active
    });
  }
  
  // إضافة الباقة الستاندرد إذا كانت موجودة
  if (standardData && standardData.ads_total > 0) {
    const consumedAds = standardData.ads_total - (standardData.ads_remaining || 0);
    history.push({
      id: `standard-${standardData.start_date || Date.now()}`,
      type: 'standard',
      totalAds: standardData.ads_total,
      consumedAds,
      remainingAds: standardData.ads_remaining || 0,
      days: standardData.days,
      startDate: standardData.start_date,
      expiryDate: standardData.expire_date,
      status: standardData.active ? 'active' : 'expired',
      isCurrent: standardData.active
    });
  }
  
  console.log('Parsed history:', history);
  
  // ترتيب حسب تاريخ البدء (الأحدث أولاً)
  return history.sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
};

// دالة جديدة لدمج التاريخ المحلي مع البيانات الجديدة
const mergePackageHistory = (
  currentHistory: PackageHistoryItem[],
  localHistory: PackageHistoryItem[] = []
): PackageHistoryItem[] => {
  console.log('=== MERGE START ===');
  console.log('Current history (from API):', JSON.stringify(currentHistory, null, 2));
  console.log('Local history (from cache):', JSON.stringify(localHistory, null, 2));
  
  const merged: PackageHistoryItem[] = [];
  const processedIds = new Set<string>();
  
  // معالجة كل نوع باقة على حدة
  ['featured', 'standard'].forEach(packageType => {
    // البحث عن السجل الحالي لهذا النوع
    const currentItem = currentHistory.find(item => item.type === packageType);
    
    if (!currentItem) {
      console.log(`No current ${packageType} package found`);
      return;
    }
    
    // البحث عن آخر سجل نشط من نفس النوع في التاريخ المحلي
    const lastLocalActive = localHistory
      .filter(item => item.type === packageType && item.isCurrent)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
    
    console.log(`\n--- Processing ${packageType} ---`);
    console.log('Current item:', currentItem);
    console.log('Last local active:', lastLocalActive);
    
    if (lastLocalActive) {
      // التحقق من وجود تغييرات جوهرية
      const hasChanged = 
        currentItem.totalAds !== lastLocalActive.totalAds ||
        currentItem.days !== lastLocalActive.days ||
        (currentItem.startDate && lastLocalActive.startDate && 
         currentItem.startDate !== lastLocalActive.startDate);
      
      console.log('Has changed?', hasChanged);
      console.log('Comparison:', {
        totalAds: { current: currentItem.totalAds, local: lastLocalActive.totalAds },
        days: { current: currentItem.days, local: lastLocalActive.days },
        startDate: { current: currentItem.startDate, local: lastLocalActive.startDate }
      });
      
      if (hasChanged) {
        // إنشاء سجل جديد للباقة القديمة
        const archivedRecord: PackageHistoryItem = {
          ...lastLocalActive,
          id: `${packageType}-archived-${Date.now()}`,
          isCurrent: false,
          status: 'expired'
        };
        merged.push(archivedRecord);
        processedIds.add(lastLocalActive.id);
        
        console.log('✅ Change detected! Created archived record:', archivedRecord);
      } else {
        console.log('⚠️ No significant changes detected');
      }
    } else {
      console.log('ℹ️ No previous local record found - this is the first package');
    }
    
    // إضافة السجل الحالي دائماً
    merged.push(currentItem);
    processedIds.add(currentItem.id);
    console.log('Added current record:', currentItem);
  });
  
  // إضافة جميع السجلات القديمة غير النشطة من التاريخ المحلي
  localHistory.forEach(localItem => {
    if (!processedIds.has(localItem.id) && !localItem.isCurrent) {
      merged.push(localItem);
      console.log('Added old archived record:', localItem);
    }
  });
  
  // ترتيب حسب تاريخ البدء (الأحدث أولاً)
  const sorted = merged.sort((a, b) => {
    const dateA = new Date(a.startDate || 0).getTime();
    const dateB = new Date(b.startDate || 0).getTime();
    return dateB - dateA;
  });
  
  console.log('\n=== MERGE RESULT ===');
  console.log('Final merged history:', JSON.stringify(sorted, null, 2));
  console.log('Total records:', sorted.length);
  console.log('===================\n');
  
  return sorted;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

  export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserPageRoleFilter>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('data');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersMeta, setUsersMeta] = useState<UsersMeta | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const usersPerPage = 10;
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<User | null>(null);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [adInModal, setAdInModal] = useState<AdItem | null>(null);
  type UserSubscriptionForm = { title: string; annualFee: number; paidAmount: number };
  const SUB_LS_PREFIX = 'userSubscription:';
  const [subscriptionForm, setSubscriptionForm] = useState<UserSubscriptionForm>({ title: '', annualFee: 0, paidAmount: 0 });
  type TransactionItem = { title: string; annualFee: number; paidAmount: number; date: string };
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [viewerRole, setViewerRole] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const formatDateDDMMYYYY = (s?: string | null) => {
    const t = String(s || '').trim();
    if (!t) return '-';
    const m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return t;
    return `${m[3]}-${m[2]}-${m[1]}`;
  };

  const normalizeRole = (role?: string | null) =>
    String(role || '').toLowerCase().trim();

  const isEmployeeRole = (role?: string | null) =>
    normalizeRole(role) === 'employee';

  const isPrivilegedDashboardRole = (role?: string | null) =>
    ['employee', 'admin', 'reviewer'].includes(normalizeRole(role));

  const isCurrentAdmin = normalizeRole(viewerRole) === 'admin';

  const isAdvertiserRole = (role?: string | null) =>
    ['advertiser', 'معلن'].includes(normalizeRole(role));

  const isDelegateRole = (role?: string | null) =>
    ['delegate', 'representative', 'مندوب'].includes(normalizeRole(role));

  const mapRoleToApi = (role?: string | null) => {
    const value = String(role || '').trim();
    if (value === 'معلن') return 'advertiser';
    if (value === 'مستخدم') return 'user';
    if (value === 'موظف') return 'employee';
    if (value === 'مشرف') return 'admin';
    if (value === 'مراجع') return 'reviewer';
    return value || undefined;
  };

  const mapRoleToLabel = (role?: string | null) => {
    const value = normalizeRole(role);
    if (value === 'advertiser') return 'معلن';
    if (value === 'user') return 'مستخدم';
    if (value === 'employee') return 'موظف';
    if (value === 'admin') return 'مشرف';
    if (value === 'reviewer') return 'مراجع';
    return String(role || '');
  };

  const hasDelegateCode = (user?: User | null) =>
    Boolean(String(user?.delegateCode || '').trim());

  const canShowAdsTab = (user?: User | null) =>
    Boolean(user) &&
    (isAdvertiserRole(user?.role) || Number(user?.adsCount || 0) > 0);

  const canShowDelegateClientsTab = (user?: User | null) =>
    Boolean(user) &&
    (isDelegateRole(user?.role) || hasDelegateCode(user));

  const canManageEmployeeRecord = (user?: User | null) =>
    Boolean(user) && isCurrentAdmin && isEmployeeRole(user?.role);

  const editableRoleOptions = isCurrentAdmin
    ? ['معلن', 'مستخدم', 'موظف', 'مشرف', 'مراجع']
    : ['معلن', 'مستخدم'];

  const generateUserPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%';
    const allChars = `${upper}${lower}${numbers}${symbols}`;

    const pick = (source: string) => source[Math.floor(Math.random() * source.length)];
    const passwordChars = [
      pick(upper),
      pick(lower),
      pick(numbers),
      pick(symbols),
    ];

    while (passwordChars.length < 10) {
      passwordChars.push(pick(allChars));
    }

    const generatedPassword = passwordChars
      .map((char) => ({ char, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((item) => item.char)
      .join('');

    setNewUserForm((prev) => ({ ...prev, password: generatedPassword }));
  };

  const copyGeneratedPassword = async () => {
    const password = String(newUserForm.password || '').trim();
    if (!password) {
      showToast('لا توجد كلمة مرور لنسخها', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(password);
      showToast('تم نسخ كلمة المرور', 'success');
    } catch {
      showToast('تعذر نسخ كلمة المرور', 'error');
    }
  };

  useEffect(() => {
    const syncViewerRole = () => {
      setViewerRole(String(readDashboardUser()?.role || ''));
    };

    syncViewerRole();
    window.addEventListener('dashboard-user-updated', syncViewerRole);

    return () => {
      window.removeEventListener('dashboard-user-updated', syncViewerRole);
    };
  }, []);

  // Sub-components for enhanced packages modal
  const PackageLoadingSkeleton = () => (
    <div className="space-y-4">
      {/* Skeleton للبطاقات */}
      <div className="grid grid-cols-2 gap-4">
        <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />
        <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />
      </div>
      {/* Skeleton للأقسام */}
      <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
      {/* Skeleton للجدول */}
      <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
    </div>
  );

  const PackageErrorDisplay = ({ error, onRetry }: { error: PackageError; onRetry: () => void }) => (
    <div className="text-center py-8">
      <div className="text-red-500 mb-4">{error.message}</div>
      {error.canRetry && (
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );

  const PackageHistoryTable = ({ history }: { history: PackageHistoryItem[] }) => {
    if (history.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '2px dashed #e5e7eb'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#f3f4f6',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '32px'
          }}>📦</div>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '15px',
            fontWeight: '600',
            margin: 0
          }}>
            لا يوجد تاريخ باقات لهذا المستخدم
          </p>
        </div>
      );
    }

    return (
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ 
                backgroundColor: '#1c6b74',
                color: 'white'
              }}>
                <th style={{ 
                  padding: '14px 16px', 
                  textAlign: 'right',
                  fontWeight: '700',
                  fontSize: '13px',
                  letterSpacing: '0.3px',
                  borderBottom: '2px solid #155e66'
                }}>نوع الباقة</th>
                <th style={{ 
                  padding: '14px 16px', 
                  textAlign: 'right',
                  fontWeight: '700',
                  fontSize: '13px',
                  letterSpacing: '0.3px',
                  borderBottom: '2px solid #155e66'
                }}>إجمالي الإعلانات</th>
                <th style={{ 
                  padding: '14px 16px', 
                  textAlign: 'right',
                  fontWeight: '700',
                  fontSize: '13px',
                  letterSpacing: '0.3px',
                  borderBottom: '2px solid #155e66'
                }}>المستهلك</th>
                <th style={{ 
                  padding: '14px 16px', 
                  textAlign: 'right',
                  fontWeight: '700',
                  fontSize: '13px',
                  letterSpacing: '0.3px',
                  borderBottom: '2px solid #155e66'
                }}>تاريخ البدء</th>
                <th style={{ 
                  padding: '14px 16px', 
                  textAlign: 'right',
                  fontWeight: '700',
                  fontSize: '13px',
                  letterSpacing: '0.3px',
                  borderBottom: '2px solid #155e66'
                }}>تاريخ الانتهاء</th>
                <th style={{ 
                  padding: '14px 16px', 
                  textAlign: 'center',
                  fontWeight: '700',
                  fontSize: '13px',
                  letterSpacing: '0.3px',
                  borderBottom: '2px solid #155e66'
                }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr 
                  key={item.id}
                  style={{
                    backgroundColor: item.isCurrent 
                      ? '#ecfdf5' 
                      : index % 2 === 0 ? '#ffffff' : '#f9fafb',
                    borderLeft: item.isCurrent ? '4px solid #10b981' : 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!item.isCurrent) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.isCurrent) {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
                    }
                  }}
                >
                  <td style={{ 
                    padding: '14px 16px',
                    color: '#111827',
                    fontWeight: item.isCurrent ? '700' : '600',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: item.type === 'featured' ? '#f59e0b' : '#6366f1'
                      }} />
                      {item.type === 'featured' ? 'مميزة' : 'ستاندرد'}
                      {item.isCurrent && (
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          borderRadius: '12px',
                          fontWeight: '700'
                        }}>الحالية</span>
                      )}
                    </div>
                  </td>
                  <td style={{ 
                    padding: '14px 16px',
                    color: '#374151',
                    fontWeight: '600',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <span style={{
                      backgroundColor: '#eff6ff',
                      color: '#1e40af',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '13px'
                    }}>{item.totalAds}</span>
                  </td>
                  <td style={{ 
                    padding: '14px 16px',
                    color: '#374151',
                    fontWeight: '600',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <span style={{
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '13px'
                    }}>{item.consumedAds}</span>
                  </td>
                  <td style={{ 
                    padding: '14px 16px',
                    color: '#6b7280',
                    fontWeight: '500',
                    fontSize: '13px',
                    borderBottom: '1px solid #f3f4f6'
                  }}>{formatDate(item.startDate)}</td>
                  <td style={{ 
                    padding: '14px 16px',
                    color: '#6b7280',
                    fontWeight: '500',
                    fontSize: '13px',
                    borderBottom: '1px solid #f3f4f6'
                  }}>{formatDate(item.expiryDate)}</td>
                  <td style={{ 
                    padding: '14px 16px',
                    textAlign: 'center',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      backgroundColor: item.status === 'active' ? '#d1fae5' : '#f3f4f6',
                      color: item.status === 'active' ? '#065f46' : '#6b7280',
                      border: `1px solid ${item.status === 'active' ? '#10b981' : '#d1d5db'}`
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: item.status === 'active' ? '#10b981' : '#9ca3af'
                      }} />
                      {item.status === 'active' ? 'نشطة' : 'منتهية'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const DynamicCategoriesSection = ({
    categories,
    selectedCategories,
    onToggle,
    loadState
  }: {
    categories: Category[];
    selectedCategories: string[];
    onToggle: (slug: string, checked: boolean) => void;
    loadState: 'loading' | 'loaded' | 'error';
  }) => {
    if (loadState === 'loading') {
      return (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i}
              style={{
                height: '48px',
                backgroundColor: '#f3f4f6',
                borderRadius: '10px',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {categories.map((cat) => {
          const isSelected = selectedCategories.includes(cat.slug);
          return (
            <label 
              key={cat.slug}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: isSelected ? '#ecfdf5' : 'white',
                border: `2px solid ${isSelected ? '#10b981' : '#e5e7eb'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                userSelect: 'none',
                boxShadow: isSelected ? '0 4px 6px -1px rgba(16, 185, 129, 0.1)' : '0 1px 2px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onToggle(cat.slug, e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: '#10b981'
                  }}
                />
              </div>
              <span style={{
                fontSize: '14px',
                fontWeight: isSelected ? '700' : '600',
                color: isSelected ? '#065f46' : '#374151',
                flex: 1
              }}>
                {cat.nameAr}
              </span>
              {isSelected && (
                <span style={{
                  fontSize: '16px',
                  color: '#10b981'
                }}>✓</span>
              )}
            </label>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetchUsersSummaryPage({
          page: currentPage,
          perPage: usersPerPage,
          q: debouncedSearchTerm,
          role: mapUsersRoleFilterToApi(roleFilter),
        });
        const mapped = resp.users.map(mapUserSummaryToUi);
        setUsers(mapped);
        setUsersMeta(resp.meta);
        if (resp.meta?.page && resp.meta.page !== currentPage) setCurrentPage(resp.meta.page);
      } catch (e) {
        showToast('تعذر تحميل المستخدمين', 'error');
      }
    };
    load();
  }, [currentPage, debouncedSearchTerm, roleFilter]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('openPackagesForUserId');
      if (!raw || !users.length) return;
      const target = users.find(u => String(u.id) === String(raw));
      if (target) {
        openPackagesModal(target);
        localStorage.removeItem('openPackagesForUserId');
      }
    } catch { }
  }, [users]);

  useEffect(() => {
    if (!selectedUser) return;
    try {
      const raw = localStorage.getItem(SUB_LS_PREFIX + selectedUser.id);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserSubscriptionForm>;
        setSubscriptionForm({
          title: typeof parsed.title === 'string' ? parsed.title : String(parsed.title ?? ''),
          annualFee: typeof parsed.annualFee === 'number' ? parsed.annualFee : Number(parsed.annualFee) || 0,
          paidAmount: typeof parsed.paidAmount === 'number' ? parsed.paidAmount : Number(parsed.paidAmount) || 0,
        });
      } else {
        setSubscriptionForm({ title: '', annualFee: 0, paidAmount: 0 });
      }
    } catch {
      setSubscriptionForm({ title: '', annualFee: 0, paidAmount: 0 });
    }
  }, [selectedUser]);

  const handleSubscriptionChange = (field: keyof UserSubscriptionForm, value: number | string) => {
    setSubscriptionForm(prev => ({ ...prev, [field]: value }));
  };

  const saveSubscriptionForUser = () => {
    if (!selectedUser) return;
    try {
      const payload = { ...subscriptionForm, updatedAt: new Date().toISOString() };
      localStorage.setItem(SUB_LS_PREFIX + selectedUser.id, JSON.stringify(payload));
      const txKey = SUB_LS_PREFIX + selectedUser.id + ':tx';
      const now = new Date().toISOString().split('T')[0];
      const newTx: TransactionItem = {
        title: String(subscriptionForm.title || ''),
        annualFee: Number(subscriptionForm.annualFee) || 0,
        paidAmount: Number(subscriptionForm.paidAmount) || 0,
        date: now,
      };
      const raw = localStorage.getItem(txKey);
      const arr = raw ? JSON.parse(raw) as TransactionItem[] : [];
      const next = Array.isArray(arr) ? [...arr, newTx] : [newTx];
      localStorage.setItem(txKey, JSON.stringify(next));
      setTransactions(next);
      showToast('تم حفظ بيانات الاشتراك السنوي لهذا المستخدم', 'success');
    } catch {
      showToast('تعذر حفظ بيانات الاشتراك السنوي', 'error');
    }
  };

  useEffect(() => {
    const loadCats = async () => {
      try {
        setCategoriesLoadState('loading');
        const resp = await fetchAdminCategories();
        if (Array.isArray(resp)) {
          const slugs = resp.map((c: any) => c.slug).filter(Boolean);
          setCategories(['all', ...slugs]);
          
          const cats = resp
            .map((c: any) => mapCategoryRecordToUi(c))
            .filter((c): c is Category => Boolean(c));
          setDynamicCategories(cats);
          setCategoriesLoadState('loaded');
          saveCategoriesToCache(cats);
        } else {
          setCategories(['all']);
          setCategoriesLoadState('error');
        }
      } catch (e) {
        setCategories(['all']);
        setCategoriesLoadState('error');
        
        // استخدام الأقسام الاحتياطية في حالة الفشل
        const fallbackCategories = Object.entries(CATEGORY_LABELS_AR).map(
          ([slug, nameAr], index) => ({
            id: index + 1,
            slug,
            name: slug,
            nameAr,
            showFeaturedAdvertisers: true,
          })
        );
        setDynamicCategories(fallbackCategories);
        setCategoriesLoadState('loaded');
      }
    };
    loadCats();
  }, []);



  // Packages modal state
  const [isPackagesModalOpen, setIsPackagesModalOpen] = useState(false);
  const [selectedUserForPackages, setSelectedUserForPackages] = useState<User | null>(null);
  const [selectedPackageCategories, setSelectedPackageCategories] = useState<string[]>([]); // New state for package categories
  const [packagesForm, setPackagesForm] = useState<UserPackage>({
    featuredAds: 0,
    featuredDays: 0,
    startFeaturedNow: true,
    featuredStartDate: null,
    featuredExpiryDate: null,
    standardAds: 0,
    standardDays: 0,
    startStandardNow: true,
    standardStartDate: null,
    standardExpiryDate: null,
    categories: [],
  });

  // Enhanced packages modal state
  const [packagesModalState, setPackagesModalState] = useState<ModalState>('idle');
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [packageHistory, setPackageHistory] = useState<PackageHistoryItem[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<Category[]>([]);
  const [categoriesLoadState, setCategoriesLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const featuredEnabledCategories = dynamicCategories.filter((category) => category.showFeaturedAdvertisers !== false);

  // Verify modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [userForVerify, setUserForVerify] = useState<User | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const FAV_LS_PREFIX = 'userFavorites:';
  const FAV_RECORD_PREFIX = 'userFeaturedRecordId:';
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [selectedUserForFavorites, setSelectedUserForFavorites] = useState<User | null>(null);
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);

  // Delegate Clients modal state
  const [isDelegateClientsModalOpen, setIsDelegateClientsModalOpen] = useState(false);
  const [delegateClients, setDelegateClients] = useState<DelegateClient[]>([]);
  const [isFetchingClients, setIsFetchingClients] = useState(false);
  const [selectedDelegateForClients, setSelectedDelegateForClients] = useState<User | null>(null);
  const [delegateFilterStartDate, setDelegateFilterStartDate] = useState<string>('');
  const [delegateFilterEndDate, setDelegateFilterEndDate] = useState<string>('');

  const openAdDetailsModal = (ad: AdItem) => {
    setAdInModal(ad);
    setIsAdModalOpen(true);
  };
  const closeAdDetailsModal = () => {
    setIsAdModalOpen(false);
    setAdInModal(null);
  };

  const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();
  const openVerifyModal = async (user: User) => {
    setUserForVerify(user);
    try {
      const resp = await createUserOtp(Number(user.id));
      setVerificationCode(String(resp.otp));
      setIsVerifyModalOpen(true);
    } catch (e) {
      showToast('تعذر إنشاء كود التحقق', 'error');
    }
  };
  const closeVerifyModal = () => {
    setIsVerifyModalOpen(false);
    setUserForVerify(null);
    setVerificationCode('');
  };
  const copyVerificationCode = async () => {
    if (!verificationCode) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(verificationCode);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = verificationCode;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      showToast('تم نسخ كود التحقق بنجاح', 'success');
    } catch (e) {
      showToast('تعذر النسخ تلقائيًا، يرجى النسخ يدويًا', 'warning');
    }
  };
  const openWhatsAppWithCode = async (user: User) => {
    try {
      const resp = await createUserOtp(Number(user.id));
      const code = String(resp.otp);
      setVerificationCode(code);
      setUserForVerify(user);
      const phoneNormalized = user.phone.replace(/[^+\d]/g, '').replace('+', '');
      const message = encodeURIComponent(`كود التحقق: ${code}`);
      const waUrl = `https://wa.me/${phoneNormalized}?text=${message}`;
      try {
        window.open(waUrl, '_blank');
        showToast(`تم فتح واتساب وإدراج الكود: ${code}`, 'success');
      } catch (e) {
        showToast('تعذر فتح واتساب، تحقق من الإعدادات', 'error');
      }
    } catch (e) {
      showToast('تعذر إنشاء كود التحقق', 'error');
    }
  };

  const openWhatsAppContact = (user: User) => {
    const phoneNormalized = user.phone.replace(/[^+\d]/g, '').replace('+', '');
    const waUrl = `https://wa.me/${phoneNormalized}`;
    try {
      window.open(waUrl, '_blank');
      showToast('تم فتح واتساب', 'success');
    } catch (e) {
      showToast('تعذر فتح واتساب، تحقق من الإعدادات', 'error');
    }
  };

  const openFavoritesModal = async (user: User) => {
    setSelectedUserForFavorites(user);
    setIsFavoritesModalOpen(true);
    setIsLoadingFavorites(true);
    setFavoritesError(null);
    let availableCategories = dynamicCategories;
    
    // التأكد من تحميل الأقسام إذا لم تكن محملة
    if (dynamicCategories.length === 0) {
      try {
        const resp = await fetchAdminCategories();
        if (Array.isArray(resp)) {
          const cats = resp
            .map((c: any) => mapCategoryRecordToUi(c))
            .filter((c): c is Category => Boolean(c));
          availableCategories = cats;
          setDynamicCategories(cats);
          setCategoriesLoadState('loaded');
        }
      } catch (e) {
        console.error('فشل تحميل الأقسام في نافذة المفضل:', e);
      }
    }

    try {
      // جلب البيانات من API
      const response = await fetchUserFeaturedCategories(user.id);
      const hasLoadedCategories = availableCategories.length > 0;
      const enabledSlugSet = new Set(
        availableCategories
          .filter((category) => category.showFeaturedAdvertisers !== false)
          .map((category) => category.slug)
      );
      
      if (response.data && response.data.categories) {
        // تحويل الأقسام إلى slugs
        const slugs = response.data.categories
          .map(cat => cat.slug)
          .filter((slug) => !hasLoadedCategories || enabledSlugSet.has(slug));
        setFavoriteSlugs(slugs);
        
        // تحديث localStorage ليتطابق مع البيانات من API
        localStorage.setItem(FAV_LS_PREFIX + user.id, JSON.stringify(slugs));
        if (response.data.id) {
          localStorage.setItem(FAV_RECORD_PREFIX + user.id, String(response.data.id));
        }
      } else {
        // المستخدم ليس معلناً مميزاً
        setFavoriteSlugs([]);
        localStorage.setItem(FAV_LS_PREFIX + user.id, JSON.stringify([]));
      }
    } catch (error) {
      // في حالة فشل API، استخدم localStorage كـ fallback
      console.error('فشل جلب بيانات المعلن المميز من API:', error);
      setFavoritesError('تعذر جلب البيانات من الخادم، يتم عرض البيانات المحلية');
      
      try {
        const raw = localStorage.getItem(FAV_LS_PREFIX + user.id);
        const arr = raw ? JSON.parse(raw) as string[] : [];
        const hasLoadedCategories = featuredEnabledCategories.length > 0 || dynamicCategories.length > 0;
        const enabledSlugSet = new Set(featuredEnabledCategories.map((category) => category.slug));
        setFavoriteSlugs(
          Array.isArray(arr)
            ? arr.filter((slug) => Boolean(slug) && (!hasLoadedCategories || enabledSlugSet.has(slug)))
            : []
        );
      } catch {
        setFavoriteSlugs([]);
      }
    } finally {
      setIsLoadingFavorites(false);
    }
  };
  const closeFavoritesModal = () => {
    setIsFavoritesModalOpen(false);
    setSelectedUserForFavorites(null);
    setFavoriteSlugs([]);
  };
  const toggleFavoriteSlug = (slug: string, v: boolean) => {
    setFavoriteSlugs(prev => {
      const set = new Set(prev);
      if (v) set.add(slug); else set.delete(slug);
      return Array.from(set);
    });
  };
  const saveFavoritesForUser = async () => {
    if (!selectedUserForFavorites) return;
    const uid = Number(selectedUserForFavorites.id);
    
    // إذا كانت القائمة فارغة، استخدم clearFavoritesForUser بدلاً من إرسال قائمة فارغة
    if (favoriteSlugs.length === 0) {
      await clearFavoritesForUser();
      return;
    }
    
    const ids = Array.from(new Set(favoriteSlugs))
      .map((slug) => dynamicCategories.find((category) => category.slug === slug)?.id || 0)
      .filter((id) => id > 0);
    try {
      const resp = await setUserFeaturedCategories({ user_id: uid, category_ids: ids });
      const rid = typeof resp.record_id === 'number' ? resp.record_id : (typeof resp?.data?.id === 'number' ? resp.data.id : undefined);
      if (typeof rid === 'number') {
        localStorage.setItem(FAV_RECORD_PREFIX + selectedUserForFavorites.id, String(rid));
      }
      localStorage.setItem(FAV_LS_PREFIX + selectedUserForFavorites.id, JSON.stringify(Array.from(new Set(favoriteSlugs))));
      showToast('تم حفظ المفضلة للمعلن', 'success');
      closeFavoritesModal();
    } catch (e) {
      const m = e as unknown;
      const msg = m && typeof m === 'object' && 'message' in m ? String((m as { message?: string }).message || '') : '';
      showToast(msg || 'تعذر حفظ المفضلة', 'error');
    }
  };
  const clearFavoritesForUser = async () => {
    if (!selectedUserForFavorites) return;
    const uid = String(selectedUserForFavorites.id);
    const ridRaw = localStorage.getItem(FAV_RECORD_PREFIX + uid);
    const rid = ridRaw && ridRaw.trim() ? ridRaw.trim() : '';
    try {
      if (rid) {
        await disableUserFeatured(rid);
        localStorage.removeItem(FAV_RECORD_PREFIX + uid);
      }
      localStorage.setItem(FAV_LS_PREFIX + selectedUserForFavorites.id, JSON.stringify([]));
      setFavoriteSlugs([]);
      showToast(rid ? 'تم إلغاء التفضيل في جميع الأقسام' : 'لا توجد تفضيلات محفوظة، تم الإلغاء محليًا', 'success');
    } catch (e) {
      const m = e as unknown;
      const msg = m && typeof m === 'object' && 'message' in m ? String((m as { message?: string }).message || '') : '';
      showToast(msg || 'تعذر الإلغاء', 'error');
    }
  };

  // Add User modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'مستخدم',
    status: 'active' as User['status'],
    allowedDashboardPages: [] as string[],
    adsCount: 0,
    registrationDate: new Date().toISOString().split('T')[0],
    lastLogin: new Date().toISOString().split('T')[0],
  });

  const openAddUserModal = () => {
    setNewUserForm((prev) => ({
      ...prev,
      role: editableRoleOptions.includes(prev.role) ? prev.role : 'مستخدم',
      allowedDashboardPages: isCurrentAdmin && prev.role === 'موظف' ? prev.allowedDashboardPages : [],
    }));
    setIsAddModalOpen(true);
  };
  const closeAddUserModal = () => setIsAddModalOpen(false);
  const handleNewUserChange = (field: keyof typeof newUserForm, value: string | number | string[]) => {
    setNewUserForm(prev => ({ ...prev, [field]: value }));
  };
  const saveNewUser = async () => {
    if (!newUserForm.phone.trim()) {
      showToast('يرجى إدخال رقم الهاتف', 'warning');
      return;
    }
    try {
      const roleMapped = mapRoleToApi(newUserForm.role);
      const payload = {
        name: newUserForm.name?.trim() || undefined,
        email: newUserForm.email?.trim() || undefined,
        phone: newUserForm.phone.trim(),
        password: newUserForm.password?.trim() || undefined,
        role: roleMapped,
        status: newUserForm.status === 'banned' ? 'blocked' : 'active',
        allowed_dashboard_pages: roleMapped === 'employee' ? newUserForm.allowedDashboardPages : [],
      };
      const resp = await createUser(payload);
      const created: User = mapUserSummaryToUi(resp.user);
      setUsers(prev => [created, ...prev]);
      setCurrentPage(1);
      setIsAddModalOpen(false);
      setNewUserForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'مستخدم',
        status: 'active',
        allowedDashboardPages: [],
        adsCount: 0,
        registrationDate: new Date().toISOString().split('T')[0],
        lastLogin: new Date().toISOString().split('T')[0],
      });
      showToast(resp?.message || 'تم إضافة المستخدم بنجاح', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'تعذر إضافة المستخدم', 'error');
    }
  };

  useEffect(() => {
    const loadUserAds = async () => {
      if (!selectedUser) {
        setAds([]);
        return;
      }
      try {
        const params = selectedCategory !== 'all'
          ? { per_page: 20, status: 'Valid', all: false, category_slugs: selectedCategory }
          : { per_page: 20, status: 'Valid', all: false };
        const resp = await fetchUserListings(Number(selectedUser.id), params);
        const mapped = resp.listings.map(l => {
          const title = l.attributes?.property_type && l.attributes?.contract_type
            ? `${l.attributes.property_type} | ${l.attributes.contract_type}`
            : (l.attributes?.main_category && l.attributes?.sub_category
              ? `${l.attributes.main_category} | ${l.attributes.sub_category}`
              : (l.category_name || l.category || `#${l.id}`));
          return {
            id: String(l.id),
            title,
            status: 'منشور',
            publishDate: l.created_at,
            category: l.category_name || l.category,
            image: toImageUrl(l.main_image_url),
            categorySlug: l.category,
            price: l.price,
            contactPhone: l.contact_phone,
            whatsappPhone: l.whatsapp_phone,
            planType: l.plan_type,
            views: l.views,
            rank: l.rank,
            governorate: l.governorate,
            city: l.city,
            lat: l.lat,
            lng: l.lng,
            attributes: l.attributes as Record<string, string | undefined | null>,
          } as AdItem;
        });
        setAds(mapped);
      } catch (e) {
        setAds([]);
      }
    };
    loadUserAds();
  }, [selectedUser, selectedCategory]);

  const filteredAds = selectedCategory === 'all'
    ? ads
    : ads.filter(
      (ad) =>
        ad.categorySlug === selectedCategory ||
        ad.category === (CATEGORY_LABELS_AR[selectedCategory] ?? selectedCategory)
    );
  const filteredUsers = users;

  // Pagination calculations
  const totalPages = usersMeta ? Math.max(1, usersMeta.last_page) : Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = usersMeta ? filteredUsers : filteredUsers.slice(startIndex, endIndex);
  const serverPage = usersMeta ? usersMeta.page : currentPage;
  const serverPerPage = usersMeta ? usersMeta.per_page : usersPerPage;
  const serverTotal = usersMeta ? usersMeta.total : filteredUsers.length;
  const displayStart = serverTotal > 0 ? ((serverPage - 1) * serverPerPage + 1) : 0;
  const displayEnd = serverTotal > 0 ? Math.min(serverPage * serverPerPage, serverTotal) : 0;

  // Toast functions
  const showToast = (
    message: string,
    type: Toast['type'] = 'info',
    options?: { actions?: Toast['actions']; duration?: number }
  ) => {
    const id = Date.now().toString();
    const newToast: Toast = {
      id,
      message,
      type,
      actions: options?.actions,
      duration: options?.duration,
    };
    setToasts(prev => [...prev, newToast]);

    const autoDuration = options?.duration ?? 4000;
    if (!newToast.actions && autoDuration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, autoDuration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    if (!isCurrentAdmin && roleFilter === 'employees') {
      setRoleFilter('all');
    }
  }, [isCurrentAdmin, roleFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  // Reset edit mode when switching selected user
  useEffect(() => {
    setIsEditing(false);
    setEditForm(null);
  }, [selectedUser]);
  useEffect(() => {
    if (!selectedUser) return;
    try {
      const raw = localStorage.getItem(SUB_LS_PREFIX + selectedUser.id);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserSubscriptionForm> & { updatedAt?: string };
        setSubscriptionForm({
          title: typeof parsed.title === 'string' ? parsed.title : String(parsed.title ?? ''),
          annualFee: typeof parsed.annualFee === 'number' ? parsed.annualFee : Number(parsed.annualFee) || 0,
          paidAmount: typeof parsed.paidAmount === 'number' ? parsed.paidAmount : Number(parsed.paidAmount) || 0,
        });
      } else {
        setSubscriptionForm({ title: '', annualFee: 0, paidAmount: 0 });
      }
      const txRaw = localStorage.getItem(SUB_LS_PREFIX + selectedUser.id + ':tx');
      const txArr = txRaw ? JSON.parse(txRaw) as TransactionItem[] : [];
      setTransactions(Array.isArray(txArr) ? txArr : []);
    } catch {
      setSubscriptionForm({ title: '', annualFee: 0, paidAmount: 0 });
      setTransactions([]);
    }
  }, [selectedUser]);

  const handleBanUser = async (userId: string) => {
    const u = users.find(x => x.id === userId);
    if (!u) return;
    try {
      const resp = await toggleUserBlock(Number(userId));
      const msg = (resp.message || '').toLowerCase();
      const newStatus: User['status'] = msg.includes('unblocked') ? 'active' : 'banned';
      setUsers(prev => prev.map(x => (x.id === userId ? { ...x, status: newStatus } as User : x)));
      showToast(newStatus === 'banned' ? `تم حظر المستخدم ${u.name} بنجاح` : `تم إلغاء حظر المستخدم ${u.name} بنجاح`, 'success');
    } catch (e) {
      showToast('تعذر تغيير حالة المستخدم', 'error');
    }
  };

  const handleToggleAdUpdateButton = async (user: User) => {
    const nextValue = user.showAdUpdateButton === false;
    try {
      const resp = await toggleUserAdUpdateButton(Number(user.id), nextValue);
      const updated = mapUserSummaryToUi(resp.user);
      setUsers(prev => prev.map(x => (x.id === user.id ? updated : x)));
      if (selectedUser?.id === user.id) {
        setSelectedUser(updated);
      }
      showToast(resp.message || (nextValue ? 'تم إظهار زر تحديث الإعلان' : 'تم إخفاء زر تحديث الإعلان'), 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'تعذر تغيير ظهور زر تحديث الإعلان', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    try {
      const resp = await deleteUser(Number(userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) {
        setShowUserProfile(false);
        setSelectedUser(null);
      }
      showToast(resp?.message || 'تم حذف المستخدم بنجاح', 'success');
    } catch (e) {
      showToast('تعذر حذف المستخدم', 'error');
    }
  };

  const handleVerifyPhone = (userId: string) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, phoneVerified: true } : u)));
    const user = users.find(u => u.id === userId);
    showToast(`تم توثيق رقم هاتف المستخدم ${user?.name} بنجاح`, 'success');
  };

  const openPackagesModal = async (user: User) => {
    console.log('Opening packages modal for user:', user.id);
    setSelectedUserForPackages(user);
    setIsPackagesModalOpen(true);
    setPackagesModalState('loading');
    setPackagesError(null);
    setRetryCount(0);

    // إظهار loading state
    setPackagesForm({
      featuredAds: 0,
      featuredDays: 0,
      startFeaturedNow: false,
      featuredStartDate: null,
      featuredExpiryDate: null,
      standardAds: 0,
      standardDays: 0,
      startStandardNow: false,
      standardStartDate: null,
      standardExpiryDate: null,
      categories: [],
    });
    setSelectedPackageCategories([]);

    try {
      // محاولة قراءة البيانات من Cache وعرضها فوراً (stale-while-revalidate)
      const cached = loadPackageFromCache(user.id);
      console.log('Cached data:', cached);
      
      if (cached && cached.data) {
        const packageData = cached.data;
        
        // التحقق من أن البيانات بالبنية الصحيحة
        if (packageData.featured && packageData.standard) {
          const isFeatured = Boolean(packageData.featured.active);
          const isStandard = Boolean(packageData.standard.active);
          const finalStandard = isFeatured && isStandard ? false : isStandard;

          setPackagesForm({
            featuredAds: packageData.featured.ads_total || 0,
            featuredDays: packageData.featured.days || 0,
            startFeaturedNow: isFeatured,
            featuredStartDate: packageData.featured.start_date ? String(packageData.featured.start_date).split('T')[0] : null,
            featuredExpiryDate: packageData.featured.expire_date ? String(packageData.featured.expire_date).split('T')[0] : null,
            standardAds: packageData.standard.ads_total || 0,
            standardDays: packageData.standard.days || 0,
            startStandardNow: finalStandard,
            standardStartDate: packageData.standard.start_date ? String(packageData.standard.start_date).split('T')[0] : null,
            standardExpiryDate: packageData.standard.expire_date ? String(packageData.standard.expire_date).split('T')[0] : null,
            categories: Array.isArray(packageData.categories) ? packageData.categories : [],
          });

          if (Array.isArray(packageData.categories)) {
            const slugs = (packageData.categories as number[]).map(id => CATEGORY_SLUGS[id - 1]).filter(Boolean);
            setSelectedPackageCategories(slugs);
          }

          // تحليل تاريخ الباقات من Cache
          const currentHistory = parsePackageHistory(packageData.featured, packageData.standard);
          const mergedHistory = mergePackageHistory(currentHistory, cached.localHistory);
          setPackageHistory(mergedHistory);
        } else {
          console.warn('Cached data has invalid structure, ignoring cache');
        }
      }

      // جلب الأقسام الديناميكية إذا لم تكن محملة
      if (dynamicCategories.length === 0) {
        const cachedCategories = loadCategoriesFromCache();
        if (cachedCategories) {
          setDynamicCategories(cachedCategories);
          setCategoriesLoadState('loaded');
        } else {
          setCategoriesLoadState('loading');
          try {
            const categoriesResp = await fetchAdminCategories();
            if (Array.isArray(categoriesResp)) {
              const cats = categoriesResp
                .map((c: any) => mapCategoryRecordToUi(c))
                .filter((c): c is Category => Boolean(c));
              setDynamicCategories(cats);
              saveCategoriesToCache(cats);
              setCategoriesLoadState('loaded');
            }
          } catch (error) {
            console.error('Failed to fetch categories:', error);
            setCategoriesLoadState('error');
            
            const fallbackCategories = Object.entries(CATEGORY_LABELS_AR).map(
              ([slug, nameAr], index) => ({
                id: index + 1,
                slug,
                name: slug,
                nameAr,
                showFeaturedAdvertisers: true,
              })
            );
            setDynamicCategories(fallbackCategories);
            setCategoriesLoadState('loaded');
          }
        }
      }

      // جلب البيانات من API مع إعادة المحاولة التلقائية
      console.log('Fetching package data from API...');
      const response = await fetchWithRetry(
        () => fetchUserPackage(user.id),
        {
          maxRetries: 1,
          retryDelay: 2000,
          onRetry: (attempt) => {
            console.log('Retrying fetch, attempt:', attempt);
            setPackagesModalState('retrying');
            setRetryCount(attempt);
          }
        }
      );

      console.log('API response:', response);
      
      // التحقق من بنية البيانات
      let packageData = response.data;
      
      // إذا كانت البيانات داخل data.data (بعض APIs تُرجع { data: { data: {...} } })
      if (packageData && packageData.data && !packageData.featured && !packageData.standard) {
        packageData = packageData.data;
      }
      
      console.log('Package data after normalization:', packageData);

      if (packageData && packageData.featured && packageData.standard) {
        const isFeatured = Boolean(packageData.featured.active);
        const isStandard = Boolean(packageData.standard.active);
        const finalStandard = isFeatured && isStandard ? false : isStandard;

        setPackagesForm({
          featuredAds: packageData.featured.ads_total || 0,
          featuredDays: packageData.featured.days || 0,
          startFeaturedNow: isFeatured,
          featuredStartDate: packageData.featured.start_date ? String(packageData.featured.start_date).split('T')[0] : null,
          featuredExpiryDate: packageData.featured.expire_date ? String(packageData.featured.expire_date).split('T')[0] : null,
          standardAds: packageData.standard.ads_total || 0,
          standardDays: packageData.standard.days || 0,
          startStandardNow: finalStandard,
          standardStartDate: packageData.standard.start_date ? String(packageData.standard.start_date).split('T')[0] : null,
          standardExpiryDate: packageData.standard.expire_date ? String(packageData.standard.expire_date).split('T')[0] : null,
          categories: Array.isArray(packageData.categories) ? packageData.categories : [],
        });

        if (Array.isArray(packageData.categories)) {
          const slugs = (packageData.categories as number[]).map(id => CATEGORY_SLUGS[id - 1]).filter(Boolean);
          setSelectedPackageCategories(slugs);
        } else {
          setSelectedPackageCategories([]);
        }

        // تحليل تاريخ الباقات
        const currentHistory = parsePackageHistory(packageData.featured, packageData.standard);
        
        // دمج مع التاريخ المحلي من Cache (استخدام cached من البداية)
        const existingCache = loadPackageFromCache(user.id);
        console.log('Existing cache for merge:', existingCache);
        const mergedHistory = mergePackageHistory(currentHistory, existingCache?.localHistory || []);
        setPackageHistory(mergedHistory);

        // حفظ البيانات في Cache مع التاريخ المدمج
        savePackageToCache(user.id, {
          featured: {
            ads_total: packageData.featured.ads_total || 0,
            ads_remaining: packageData.featured.ads_remaining || 0,
            days: packageData.featured.days || 0,
            start_date: packageData.featured.start_date,
            expire_date: packageData.featured.expire_date,
            active: packageData.featured.active
          },
          standard: {
            ads_total: packageData.standard.ads_total || 0,
            ads_remaining: packageData.standard.ads_remaining || 0,
            days: packageData.standard.days || 0,
            start_date: packageData.standard.start_date,
            expire_date: packageData.standard.expire_date,
            active: packageData.standard.active
          },
          categories: packageData.categories || []
        }, mergedHistory);

        console.log('Setting state to loaded');
        setPackagesModalState('loaded');
      } else {
        console.error('Package data is missing featured or standard fields:', packageData);
        setPackagesError('بيانات الباقة غير مكتملة');
        setPackagesModalState('error');
      }
    } catch (error) {
      console.error('Failed to fetch package data from API:', error);
      const packageError = getErrorMessage(error);
      setPackagesError(packageError.message);
      
      // إذا كان لدينا بيانات من Cache، نعرضها مع رسالة خطأ
      const cached = loadPackageFromCache(user.id);
      if (cached) {
        console.log('Using cached data after error');
        setPackagesModalState('loaded');
      } else {
        console.log('No cached data, showing error');
        setPackagesModalState('error');
      }
    }
  };

  const retryFetchPackages = () => {
    if (selectedUserForPackages) {
      openPackagesModal(selectedUserForPackages);
    }
  };

  const persistPackagesLocal = (uid?: number | string) => {
    try {
      const id = uid ?? selectedUserForPackages?.id;
      if (!id) return;
      const payload = {
        featured_ads: Number(packagesForm.featuredAds) || 0,
        featured_days: Number(packagesForm.featuredDays) || 0,
        featured_start_date: packagesForm.featuredStartDate ? new Date(packagesForm.featuredStartDate).toISOString() : null,
        featured_expire_date: packagesForm.featuredExpiryDate ? new Date(packagesForm.featuredExpiryDate).toISOString() : null,
        standard_ads: Number(packagesForm.standardAds) || 0,
        standard_days: Number(packagesForm.standardDays) || 0,
        standard_start_date: packagesForm.standardStartDate ? new Date(packagesForm.standardStartDate).toISOString() : null,
        standard_expire_date: packagesForm.standardExpiryDate ? new Date(packagesForm.standardExpiryDate).toISOString() : null,
        featured_active: Boolean(packagesForm.startFeaturedNow),
        standard_active: Boolean(packagesForm.startStandardNow),
      };
      localStorage.setItem('userPackageData:' + id, JSON.stringify(payload));
    } catch { }
  };

  const closePackagesModal = () => {
    setIsPackagesModalOpen(false);
    setSelectedUserForPackages(null);
  };

  const handlePackagesChange = (field: keyof UserPackage, value: string | number | boolean) => {
    setPackagesForm(prev => ({ ...prev, [field]: value } as UserPackage));
  };
  const handlePackageCategoryToggle = (slug: string, checked: boolean) => {
    setSelectedPackageCategories(prev => {
      const set = new Set(prev);
      if (checked) set.add(slug); else set.delete(slug);
      return Array.from(set);
    });
  };

  const savePackages = async () => {
    if (!selectedUserForPackages) return;
    
    setPackagesModalState('saving');
    
    try {
      const categoryIds = selectedPackageCategories.map(slug => {
        const idx = CATEGORY_SLUGS.indexOf(slug as CategorySlug);
        return idx >= 0 ? idx + 1 : 0;
      }).filter(id => id > 0);

      const payload: AssignUserPackagePayload = {
        user_id: Number(selectedUserForPackages.id),
        featured_ads: Number(packagesForm.featuredAds) || 0,
        featured_days: Number(packagesForm.featuredDays) || 0,
        standard_ads: Number(packagesForm.standardAds) || 0,
        standard_days: Number(packagesForm.standardDays) || 0,
        categories: categoryIds.length > 0 ? categoryIds : [], // Send empty array to signify "all"
      };

      // Force start_now even if not explicitly checked, or rely on form
      if (packagesForm.startFeaturedNow) payload.start_featured_now = true;
      if (packagesForm.startStandardNow) payload.start_standard_now = true;

      const resp = await assignUserPackage(payload);
      const d = resp.data;
      
      // تحليل التاريخ الجديد
      const newHistory = parsePackageHistory(
        {
          ads_total: d.featured_ads || 0,
          ads_remaining: d.featured_ads || 0,
          days: d.featured_days || 0,
          start_date: d.featured_start_date,
          expire_date: d.featured_expire_date,
          active: Boolean(d.featured_active)
        },
        {
          ads_total: d.standard_ads || 0,
          ads_remaining: d.standard_ads || 0,
          days: d.standard_days || 0,
          start_date: d.standard_start_date,
          expire_date: d.standard_expire_date,
          active: Boolean(d.standard_active)
        }
      );
      
      // قراءة التاريخ المحلي مباشرة من localStorage للحصول على أحدث نسخة
      console.log('=== SAVE PACKAGES - MERGE ===');
      console.log('New history from API:', newHistory);
      const existingCache = loadPackageFromCache(selectedUserForPackages.id);
      const localHistoryFromCache = existingCache?.localHistory || [];
      console.log('Local history from cache:', localHistoryFromCache);
      
      // دمج مع التاريخ المحلي
      const mergedHistory = mergePackageHistory(newHistory, localHistoryFromCache);
      console.log('Merged result:', mergedHistory);
      setPackageHistory(mergedHistory);
      
      // حفظ البيانات في Cache مع التاريخ المُحدّث
      savePackageToCache(selectedUserForPackages.id, {
        featured: {
          ads_total: d.featured_ads || 0,
          ads_remaining: d.featured_ads || 0,
          days: d.featured_days || 0,
          start_date: d.featured_start_date,
          expire_date: d.featured_expire_date,
          active: Boolean(d.featured_active)
        },
        standard: {
          ads_total: d.standard_ads || 0,
          ads_remaining: d.standard_ads || 0,
          days: d.standard_days || 0,
          start_date: d.standard_start_date,
          expire_date: d.standard_expire_date,
          active: Boolean(d.standard_active)
        },
        categories: categoryIds
      }, mergedHistory);
      
      const updatedUser = {
        ...selectedUserForPackages,
        package: {
          featuredAds: d.featured_ads,
          featuredDays: d.featured_days,
          startFeaturedNow: Boolean(d.featured_active),
          featuredStartDate: d.featured_start_date ? String(d.featured_start_date).split('T')[0] : null,
          featuredExpiryDate: d.featured_expire_date ? String(d.featured_expire_date).split('T')[0] : null,
          standardAds: d.standard_ads,
          standardDays: d.standard_days,
          startStandardNow: Boolean(d.standard_active),
          standardStartDate: d.standard_start_date ? String(d.standard_start_date).split('T')[0] : null,
          standardExpiryDate: d.standard_expire_date ? String(d.standard_expire_date).split('T')[0] : null,
        },
      } as User;
      
      setUsers(prev => prev.map(u => (u.id === selectedUserForPackages.id ? updatedUser : u)));
      if (selectedUser?.id === selectedUserForPackages.id) {
        setSelectedUser(updatedUser);
      }
      
      setPackagesModalState('loaded');
      setIsPackagesModalOpen(false);
      setSelectedUserForPackages(null);
      
      const daysText = `${d.featured_days || 0} مميزة | ${d.standard_days || 0} ستاندرد`;
      showToast((resp.message || 'تم تحديث الباقة بنجاح') + ` | ${daysText}`, 'success');
    } catch (e) {
      setPackagesModalState('loaded');
      showToast('تعذر حفظ الباقة للمستخدم', 'error');
    }
  };

  useEffect(() => {
    if (!isPackagesModalOpen || !selectedUserForPackages) return;
    persistPackagesLocal(selectedUserForPackages.id);
  }, [packagesForm.featuredAds, packagesForm.featuredDays, packagesForm.featuredStartDate, packagesForm.featuredExpiryDate, packagesForm.startFeaturedNow, packagesForm.standardAds, packagesForm.standardDays, packagesForm.standardStartDate, packagesForm.standardExpiryDate, packagesForm.startStandardNow, isPackagesModalOpen, selectedUserForPackages]);

  const getRemainingByDates = (startDate?: string | null, expireDate?: string | null): number => {
    if (!expireDate) return 0;
    const dayMs = 24 * 60 * 60 * 1000;
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(expireDate);
    const now = new Date();
    const base = Math.max(start.getTime(), now.getTime());
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / dayMs);
    const elapsedDays = Math.floor((now.getTime() - start.getTime()) / dayMs);
    const remaining = totalDays - elapsedDays;
    return remaining > 0 ? remaining : 0;
  };

  const getProgressPercent = (startDate?: string | null, expireDate?: string | null): number => {
    if (!startDate || !expireDate) return 0;
    const dayMs = 24 * 60 * 60 * 1000;
    const start = new Date(startDate);
    const end = new Date(expireDate);
    const now = new Date();
    if (end.getTime() <= start.getTime()) return 100;
    const total = end.getTime() - start.getTime();
    const elapsed = Math.max(0, Math.min(total, now.getTime() - start.getTime()));
    const pct = Math.round((elapsed / total) * 100);
    return pct < 0 ? 0 : pct > 100 ? 100 : pct;
  };

  // moved below countdownTick declaration

  // Calculate package duration days based on acceptance, ad start, expiry
  const calculatePackageDays = (user: User | null, expiryDate: string): number => {
    if (!user || !expiryDate) return 0;
    const dayMs = 24 * 60 * 60 * 1000;
    const acceptance = new Date(user.registrationDate);
    // Use earliest publishDate from mockAds as a proxy for ad start
    const earliestAdStr = ads
      .map(a => a.publishDate)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
    const adStart = earliestAdStr ? new Date(earliestAdStr) : acceptance;
    const start = adStart.getTime() > acceptance.getTime() ? adStart : acceptance;
    const end = new Date(expiryDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / dayMs);
    return diff > 0 ? diff : 0;
  };

  // Remaining days (countdown) that decreases over time
  const getRemainingDays = (user: User | null, expiryDate: string): number => {
    if (!user || !expiryDate) return 0;
    const dayMs = 24 * 60 * 60 * 1000;
    const acceptance = new Date(user.registrationDate);
    const earliestAdStr = ads
      .map(a => a.publishDate)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
    const adStart = earliestAdStr ? new Date(earliestAdStr) : acceptance;
    const start = adStart.getTime() > acceptance.getTime() ? adStart : acceptance;
    const end = new Date(expiryDate);
    const now = new Date();
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / dayMs);
    const elapsedDays = Math.floor((now.getTime() - start.getTime()) / dayMs);
    const remaining = totalDays - elapsedDays;
    return remaining > 0 ? remaining : 0;
  };

  // Ticker to update countdown periodically
  const [countdownTick, setCountdownTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setCountdownTick(t => t + 1), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const remF = getRemainingByDates(packagesForm.featuredStartDate, packagesForm.featuredExpiryDate);
    if (packagesForm.startFeaturedNow && packagesForm.featuredExpiryDate && remF <= 0) {
      showToast('انتهت الباقة المتميزة', 'warning');
    }
    const remS = getRemainingByDates(packagesForm.standardStartDate, packagesForm.standardExpiryDate);
    if (packagesForm.startStandardNow && packagesForm.standardExpiryDate && remS <= 0) {
      showToast('انتهت الباقة الستاندر', 'warning');
    }
  }, [countdownTick, packagesForm.startFeaturedNow, packagesForm.featuredExpiryDate, packagesForm.featuredStartDate, packagesForm.startStandardNow, packagesForm.standardExpiryDate, packagesForm.standardStartDate]);

  const handleViewProfile = (user: User, initialTab: string = 'data') => {
    setSelectedUser(user);
    setShowUserProfile(true);
    setActiveTab(initialTab);
    if (initialTab === 'employee' && canManageEmployeeRecord(user)) {
      setIsEditing(true);
      setEditForm({ ...user });
      return;
    }
    setIsEditing(false);
    setEditForm(null);
  };

  const openEmployeePermissionsEditor = (user: User) => {
    if (!canManageEmployeeRecord(user)) return;
    handleViewProfile(user, 'employee');
  };

  // Fetch delegate clients when activeTab is 'clients'
  useEffect(() => {
    const role = String(selectedUser?.role || '').toLowerCase().trim();
    const isDelegate =
      role === 'delegate' || role === 'representative' || role === 'مندوب';
    const hasCode = Boolean(String(selectedUser?.delegateCode || '').trim());
    const canLoadClients = activeTab === 'clients' && selectedUser && (isDelegate || hasCode);

    if (canLoadClients) {
      setIsFetchingClients(true);
      fetchDelegateClients(selectedUser.id)
        .then(response => {
          setDelegateClients(response.data || []);
        })
        .catch(e => {
          showToast(e.message || 'تعذر جلب قائمة عملاء المندوب', 'error');
        })
        .finally(() => {
          setIsFetchingClients(false);
        });
    } else if (activeTab === 'clients') {
      setDelegateClients([]);
    }
  }, [activeTab, selectedUser]);

  useEffect(() => {
    if (!selectedUser) return;

    const role = String(selectedUser.role || '').toLowerCase().trim();
    const isAdvertiser = role === 'advertiser' || role === 'معلن';
    const isDelegate =
      role === 'delegate' || role === 'representative' || role === 'مندوب';
    const isManagedEmployee = isCurrentAdmin && role === 'employee';
    const hasCode = Boolean(String(selectedUser.delegateCode || '').trim());
    const hasAds = Number(selectedUser.adsCount || 0) > 0;
    const canOpenAdsTab = isAdvertiser || hasAds;
    const canOpenClientsTab = isDelegate || hasCode;

    if (activeTab === 'ads' && !canOpenAdsTab) {
      setActiveTab('data');
      return;
    }
    if (activeTab === 'clients' && !canOpenClientsTab) {
      setActiveTab('data');
    }
    if (activeTab === 'employee' && !isManagedEmployee) {
      setActiveTab('data');
    }
  }, [activeTab, selectedUser, isCurrentAdmin]);

  const enableEdit = () => {
    if (!selectedUser) return;
    if (!isCurrentAdmin && isPrivilegedDashboardRole(selectedUser.role)) {
      showToast('لا يمكنك تعديل حسابات فريق الداشبورد.', 'warning');
      return;
    }
    setIsEditing(true);
    setEditForm({ ...selectedUser });
  };

  const saveEdit = async () => {
    if (!selectedUser || !editForm) return;
    try {
      const roleMapped = mapRoleToApi(editForm.role);
      const payload = {
        name: editForm.name?.trim() || undefined,
        email: editForm.email?.trim() || undefined,
        phone: editForm.phone?.trim() || undefined,
        role: roleMapped,
        status: editForm.status === 'banned' ? 'blocked' : 'active',
        delegate_code: editForm.delegateCode?.trim() || undefined,
        allowed_dashboard_pages: roleMapped === 'employee' ? (editForm.allowedDashboardPages || []) : [],
      };
      const resp = await updateUser(Number(selectedUser.id), payload);
      const updated: User = {
        ...mapUserSummaryToUi(resp.user),
        phoneVerified: selectedUser.phoneVerified,
      };
      setUsers(prev => prev.map(x => (x.id === selectedUser.id ? updated : x)));
      setSelectedUser(updated);
      setIsEditing(false);
      setEditForm(null);
      showToast('تم حفظ التعديلات بنجاح', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'تعذر حفظ التعديلات', 'error');
    }
  };

  const handleResetPassword = (userId: string) => {
    const user = users.find(u => u.id === userId);
    showToast(`تم إرسال رابط إعادة تعيين كلمة السر للمستخدم ${user?.name}`, 'success');
  };

  const handleChangePassword = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      showToast('تعذر العثور على المستخدم', 'error');
      return;
    }

    const newPassword = '123456';

    // 1. Copy password to clipboard IMMEDIATELY to preserve user gesture context
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(newPassword);
      } else {
        // Fallback for non-secure context (HTTP)
        const textArea = document.createElement("textarea");
        textArea.value = newPassword;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
    } catch (err) {
      console.warn('Initial clipboard copy failed:', err);
    }

    try {
      // 2. Call Backend API to reset password to '123456'
      const response = await changeUserPassword(userId);

      // 3. Update local state
      setUsers(users.map(u =>
        u.id === userId
          ? { ...u, lastLogin: new Date().toISOString().split('T')[0] }
          : u
      ));

      // 4. Prepare WhatsApp Message
      const phoneNormalized = user.phone.replace(/[^+\d]/g, '').replace('+', '');
      if (!phoneNormalized) {
        showToast('تم تغيير كلمة السر ونسخها، لكن رقم الهاتف غير صالح لإرسال واتساب', 'warning');
        return;
      }

      // Use the exact message from the backend
      const messageContent = response.message || `مرحبًا ${user.name}، تم تغيير كلمة السر الخاصة بحسابك إلى: ${newPassword}.\nيرجى تسجيل الدخول وتغييرها بعد أول دخول.\nفريق ناس مصر`;
      const waUrl = `https://wa.me/${phoneNormalized}?text=${encodeURIComponent(messageContent)}`;

      // 5. Open WhatsApp
      window.open(waUrl, '_blank');
      showToast(`تم تغيير كلمة السر ونسخها (123456) وإرسالها عبر واتساب للمستخدم ${user.name}`, 'success');

    } catch (e: any) {
      console.error('Change password failed:', e);
      showToast(e.message || 'تعذر تغيير كلمة السر للمستخدم، يرجى المحاولة لاحقاً', 'error');
    }
  };

  const handleOpenDelegateClients = async (user: User) => {
    setSelectedDelegateForClients(user);
    setIsDelegateClientsModalOpen(true);
    setIsFetchingClients(true);
    setDelegateClients([]);
    try {
      const response = await fetchDelegateClients(user.id);
      setDelegateClients(response.data || []);
    } catch (e: any) {
      showToast(e.message || 'تعذر جلب قائمة عملاء المندوب', 'error');
    } finally {
      setIsFetchingClients(false);
    }
  };

  const handleViewClientProfile = (client: DelegateClient) => {
    const userToView: User = {
      id: String(client.id),
      name: client.name || 'مستخدِم بدون اسم',
      phone: client.phone,
      address: client.address,
      userCode: client.user_code,
      delegateCode: null,
      status: client.status === 'banned' || client.status === 'blocked' ? 'banned' : 'active',
      registrationDate: client.registered_at,
      adsCount: client.listings_count,
      role: client.role,
      lastLogin: '',
      phoneVerified: client.phone_verified,
    };
    setIsDelegateClientsModalOpen(false);
    handleViewProfile(userToView);
  };

  const handleViewDelegateProfile = async (delegateCode: string) => {
    // البحث عن المندوب في القائمة الحالية
    let delegate = users.find(u => u.userCode === delegateCode);

    // إذا لم يكن موجود في القائمة الحالية، نبحث في كل المستخدمين
    if (!delegate) {
      // عرض رسالة البحث
      const searchToastId = Date.now().toString();
      setToasts(prev => [...prev, {
        id: searchToastId,
        message: '🔍 جاري البحث عن المندوب...',
        type: 'info',
        duration: 0 // تبقى حتى نزيلها يدوياً
      }]);

      try {
        const response = await fetchUsersSummaryPage({ page: 1, perPage: 10, q: delegateCode });
        const matches = response.users.map(mapUserSummaryToUi);
        delegate = matches.find(u => u.userCode === delegateCode || u.delegateCode === delegateCode);

        // إزالة رسالة البحث
        setToasts(prev => prev.filter(t => t.id !== searchToastId));

      } catch (e) {
        // إزالة رسالة البحث وعرض رسالة خطأ
        setToasts(prev => prev.filter(t => t.id !== searchToastId));
        showToast('❌ تعذر البحث عن المندوب', 'error', { duration: 4000 });
        return;
      }
    }

    if (!delegate) {
      showToast(`⚠️ لم يتم العثور على مندوب بكود ${delegateCode}`, 'warning', { duration: 5000 });
      return;
    }

    // فتح الملف الشخصي للمندوب
    handleViewProfile(delegate);
  };

  const handleSetPIN = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      showToast('تعذر العثور على المستخدم', 'error');
      return;
    }
    try {
      const resp = await changeUserPassword(Number(userId));
      const msg = resp.message;
      try {
        await navigator.clipboard.writeText(msg);
        showToast('تم نسخ الرسالة بنجاح', 'success');
      } catch (e) {
        showToast('تعذر النسخ تلقائيًا، يرجى النسخ يدويًا', 'warning');
      }
    } catch (e) {
      showToast('تعذر تغيير كلمة السر', 'error');
    }
  };

  // Pagination functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Export filtered users to Excel with Arabic headers and values
  const exportToExcel = async (data: User[], filename: string) => {
    if (!data || data.length === 0) {
      showToast('لا توجد بيانات للتصدير', 'warning');
      return;
    }

    const rows = data.map(u => ({
      'الاسم': u.name,
      'رقم الهاتف': u.phone,
      'كود المستخدم': u.userCode,
      'كود المندوب': u.delegateCode || '-',
      'الحالة': u.status === 'active' ? 'نشط' : 'محظور',
      'تاريخ التسجيل': u.registrationDate,
      // 'عدد الإعلانات': u.adsCount,
      'الدور': u.role,
      // 'آخر تسجيل دخول': u.lastLogin,
    }));

    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'المستخدمون');
      XLSX.writeFile(wb, `${filename}.xlsx`);
      showToast('تم إنشاء ملف Excel بنجاح', 'success');
    } catch (e) {
      console.error('Excel export failed', e);
      showToast('تعذر إنشاء ملف Excel، حاول لاحقًا', 'error');
    }
  };

  if (showUserProfile && selectedUser) {
    return (
      <div className="users-page">
        <div className="users-header">
          <div className="header-content">
            <button
              className="back-btn"
              onClick={() => setShowUserProfile(false)}
            >
              ← العودة للقائمة
            </button>
            <h1>ملف المستخدم: {selectedUser.name}</h1>
            <p>كود المستخدم: {selectedUser.userCode}</p>
          </div>
        </div>

        <div className="user-profile-container">
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              البيانات
            </button>
            {canManageEmployeeRecord(selectedUser) && (
              <button
                className={`tab-btn ${activeTab === 'employee' ? 'active' : ''}`}
                onClick={() => setActiveTab('employee')}
              >
                صلاحيات الموظف
              </button>
            )}
            {canShowAdsTab(selectedUser) && (
              <button
                className={`tab-btn ${activeTab === 'ads' ? 'active' : ''}`}
                onClick={() => setActiveTab('ads')}
              >
                الإعلانات
              </button>
            )}
            {/* <button 
              className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              المعاملات
            </button> */}
            {canShowDelegateClientsTab(selectedUser) && (
              <button
                className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
                onClick={() => setActiveTab('clients')}
              >
                عملاء المندوب
              </button>
            )}
            {/*}
            <button 
              className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              السجل
            </button>
            <button 
              className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('permissions')}
            >
              الأذونات
            </button>*/}
          </div>

          <div className="tab-content">
            {activeTab === 'data' && (
              <div className={`user-data-tab ${isEditing ? 'edit-mode' : ''}`}>
                <div className="tab-actions">
                  {!isEditing ? (
                    <button className="btn-edit" onClick={enableEdit}>
                      تفعيل التعديل
                    </button>
                  ) : (
                    <button className="btn-save" onClick={saveEdit}>
                      حفظ التعديلات
                    </button>
                  )}
                </div>
                <div className="data-grid">
                  <div className="data-item">
                    <label>الاسم الكامل:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm?.name ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                        }
                        className="input"
                      />
                    ) : (
                      <span>
                        {selectedUser.name}
                        {selectedUser.phoneVerified && (
                          <span className="verified-badge" title="موثّق" style={{ marginRight: 8 }}>
                            ✓
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="data-item">
                    <label>رقم الهاتف:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm?.phone ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) => (prev ? { ...prev, phone: e.target.value } : prev))
                        }
                        className="input"
                      />
                    ) : (
                      <span>{selectedUser.phone}</span>
                    )}
                  </div>
                  <div className="data-item">
                    <label>العنوان:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm?.address ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) => (prev ? { ...prev, address: e.target.value } : prev))
                        }
                        className="input"
                      />
                    ) : (
                      <span>{selectedUser.address || 'موقع غير محدد'}</span>
                    )}
                  </div>
                  <div className="data-item">
                    <label>كود المستخدم:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm?.userCode ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) => (prev ? { ...prev, userCode: e.target.value } : prev))
                        }
                        className="input"
                      />
                    ) : (
                      <span>{selectedUser.userCode}</span>
                    )}
                  </div>
                  <div className="data-item">
                    <label>كود المندوب:</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm?.delegateCode ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) => (prev ? { ...prev, delegateCode: e.target.value } : prev))
                        }
                        className="input"
                        placeholder="-"
                      />
                    ) : (
                      <span>{selectedUser.delegateCode || '-'}</span>
                    )}
                  </div>
                  <div className="data-item">
                    <label>الحالة:</label>
                    {isEditing ? (
                      <select
                        value={editForm?.status ?? 'active'}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, status: e.target.value as User['status'] } : prev
                          )
                        }
                        className="input"
                      >
                        <option value="active">نشط</option>
                        <option value="banned">محظور</option>
                      </select>
                    ) : (
                      <span className={`status-badge ${selectedUser.status}`}>
                        {selectedUser.status === 'active' ? 'نشط' : 'محظور'}
                      </span>
                    )}
                  </div>
                  <div className="data-item">
                    <label>تاريخ التسجيل:</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm?.registrationDate ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, registrationDate: e.target.value } : prev
                          )
                        }
                        className="input"
                      />
                    ) : (
                      <span>{formatDateDDMMYYYY(selectedUser.registrationDate)}</span>
                    )}
                  </div>
                  {/* <div className="data-item">
                    <label>آخر تسجيل دخول:</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm?.lastLogin ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) => (prev ? { ...prev, lastLogin: e.target.value } : prev))
                        }
                        className="input"
                      />
                    ) : (
                      <span>{selectedUser.lastLogin}</span>
                    )}
                  </div> */}
                  <div className="data-item">
                    <label>البريد الإلكتروني:</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm?.email ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) => (prev ? { ...prev, email: e.target.value } : prev))
                        }
                        className="input"
                      />
                    ) : (
                      <span>{selectedUser.email || '-'}</span>
                    )}
                  </div>
                  <div className="data-item">
                    <label>الدور:</label>
                    {isEditing ? (
                      <select
                        value={mapRoleToLabel(editForm?.role)}
                        onChange={(e) =>
                          setEditForm((prev) => (prev ? { ...prev, role: e.target.value } : prev))
                        }
                        className="input"
                      >
                        {editableRoleOptions.map((roleOption) => (
                          <option key={roleOption} value={roleOption}>{roleOption}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{mapRoleToLabel(selectedUser.role)}</span>
                    )}
                  </div>
                  {isEditing && mapRoleToApi(editForm?.role) === 'employee' && (
                    <div className="data-item" style={{ gridColumn: '1 / -1' }}>
                      <label>صلاحيات الصفحات:</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        {DASHBOARD_PERMISSION_OPTIONS.map((option) => {
                          const selected = Boolean(editForm?.allowedDashboardPages?.includes(option.key));
                          return (
                            <label key={option.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: selected ? '1px solid #14b8a6' : '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 12px', background: selected ? '#f0fdfa' : '#fff' }}>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(e) =>
                                  setEditForm((prev) => {
                                    if (!prev) return prev;
                                    const current = prev.allowedDashboardPages || [];
                                    const next = e.target.checked
                                      ? [...current, option.key]
                                      : current.filter((item) => item !== option.key);
                                    return { ...prev, allowedDashboardPages: Array.from(new Set(next)) };
                                  })
                                }
                              />
                              <span>{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="data-item">
                    <label>عدد الإعلانات:</label>
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        value={editForm?.adsCount ?? 0}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, adsCount: Number(e.target.value) } : prev
                          )
                        }
                        className="input"
                      />
                    ) : (
                      <span>{selectedUser.adsCount}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'employee' && canManageEmployeeRecord(selectedUser) && (
              <div className={`user-data-tab ${isEditing ? 'edit-mode' : ''}`}>
                <div className="tab-actions">
                  {!isEditing ? (
                    <button className="btn-edit" onClick={enableEdit}>
                      تعديل صلاحيات الموظف
                    </button>
                  ) : (
                    <button className="btn-save" onClick={saveEdit}>
                      حفظ صلاحيات الموظف
                    </button>
                  )}
                </div>

                <div
                  style={{
                    marginBottom: '20px',
                    padding: '18px 20px',
                    borderRadius: '16px',
                    border: '1px solid #dbeafe',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '6px' }}>الحساب الموظف</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{selectedUser.name}</div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>{selectedUser.phone}</div>
                    </div>
                    <div style={{ minWidth: '180px' }}>
                      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '6px' }}>إجمالي الصفحات المسموح بها</div>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f766e' }}>
                        {editForm?.allowedDashboardPages?.length ?? selectedUser.allowedDashboardPages?.length ?? 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="data-item" style={{ gridColumn: '1 / -1' }}>
                  <label>قائمة الصفحات المسموح بها للموظف</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                    {DASHBOARD_PERMISSION_OPTIONS.map((option) => {
                      const source = isEditing ? editForm?.allowedDashboardPages : selectedUser.allowedDashboardPages;
                      const selected = Boolean(source?.includes(option.key));
                      return (
                        <label
                          key={option.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: selected ? '1px solid #14b8a6' : '1px solid #e5e7eb',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            background: selected ? '#f0fdfa' : '#fff',
                            opacity: !isEditing ? 0.92 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={!isEditing}
                            onChange={(e) =>
                              setEditForm((prev) => {
                                if (!prev) return prev;
                                const current = prev.allowedDashboardPages || [];
                                const next = e.target.checked
                                  ? [...current, option.key]
                                  : current.filter((item) => item !== option.key);
                                return { ...prev, allowedDashboardPages: Array.from(new Set(next)) };
                              })
                            }
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span>{option.label}</span>
                            <span style={{ fontSize: '12px', color: '#64748b', direction: 'ltr', textAlign: 'right' }}>{option.key}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ads' && canShowAdsTab(selectedUser) && (
              <div className="user-ads-tab">
                <div className="ads-header">
                  <h3>إعلانات المستخدم</h3>
                  <div className="ads-filter">
                    <label htmlFor="category-filter">فلترة حسب القسم:</label>
                    <ManagedSelect
                      value={selectedCategory === 'all' ? '' : selectedCategory}
                      onChange={(v) => setSelectedCategory(v || 'all')}
                      options={Object.entries(CATEGORY_LABELS_AR).map(([slug, label]) => ({ value: slug, label }))}
                      placeholder="all"
                    />
                  </div>
                </div>

                <div className="ads-list">
                  {filteredAds.length > 0 ? (
                    filteredAds.map((ad) => (
                      <div key={ad.id} className="ad-item" onClick={() => openAdDetailsModal(ad)}>
                        <div className="ad-image">
                          <Image
                            src={ad.image}
                            alt={ad.title}
                            width={120}
                            height={90}
                            style={{ objectFit: 'cover', borderRadius: '8px' }}
                          />
                        </div>
                        <div className="ad-content">
                          <h4>{ad.title}</h4>
                          <div className="ad-details">
                            <p><span className="detail-label">القسم:</span> <span className="category-badge">{ad.category}</span></p>
                            <p><span className="detail-label">الحالة:</span> <span className={`status-badge ${ad.status === 'منشور' ? 'published' : 'pending'}`}>{ad.status}</span></p>
                            <p><span className="detail-label">تاريخ النشر:</span> {formatDateDDMMYYYY(ad.publishDate)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-ads-message">
                      <div className="no-ads-icon">📢</div>
                      <p>لا توجد إعلانات في هذا القسم</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'clients' && canShowDelegateClientsTab(selectedUser) && (
              <div style={{ padding: '24px', flex: 1, backgroundColor: '#f9fafb' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'flex-end', backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>تاريخ التسجيل من</label>
                    <input
                      type="date"
                      className="input"
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                      value={delegateFilterStartDate}
                      onChange={(e) => setDelegateFilterStartDate(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>تاريخ التسجيل إلى</label>
                    <input
                      type="date"
                      className="input"
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                      value={delegateFilterEndDate}
                      onChange={(e) => setDelegateFilterEndDate(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => { setDelegateFilterStartDate(''); setDelegateFilterEndDate(''); }}
                    style={{ padding: '8px 16px', height: '40px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap', color: '#374151' }}
                  >
                    إعادة تعيين
                  </button>
                </div>

                {isFetchingClients ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6366f1' }}>
                    <div style={{
                      border: '4px solid #f3f4f6',
                      borderTop: '4px solid #6366f1',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      margin: '0 auto 20px',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ fontWeight: '600' }}>جاري جلب القائمة...</p>
                  </div>
                ) : delegateClients.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                    {delegateClients.filter(client => {
                      if (!delegateFilterStartDate && !delegateFilterEndDate) return true;
                      if (!client.registered_at) return false;
                      const regTime = new Date(client.registered_at).getTime();
                      const startTime = delegateFilterStartDate ? new Date(delegateFilterStartDate).getTime() : -Infinity;
                      const endTime = delegateFilterEndDate ? new Date(delegateFilterEndDate).setHours(23, 59, 59, 999) : Infinity;
                      return regTime >= startTime && regTime <= endTime;
                    }).map((client) => (
                      <div key={client.id} style={{
                        padding: '16px',
                        backgroundColor: 'white',
                        borderRadius: '14px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: '#eef2ff',
                            color: '#6366f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '18px'
                          }}>
                            {client.name ? client.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontWeight: '800', color: '#111827', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{client.name || 'مستخدِم بدون اسم'}</span>
                              {client.phone_verified && (
                                <span style={{
                                  color: '#10b981',
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  backgroundColor: '#d1fae5',
                                  border: '1px solid #10b981'
                                }} title="رقم موثق">✓</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                              <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Phone size={14} style={{ color: '#6366f1' }} />
                                <span>{client.phone}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MapPin size={14} style={{ color: '#6366f1' }} />
                                <span>{client.address || 'موقع غير محدد'}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} style={{ color: '#6366f1' }} />
                                <span>{formatDateDDMMYYYY(client.registered_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const userToView: User = {
                              id: String(client.id),
                              name: client.name || 'مستخدِم بدون اسم',
                              phone: client.phone,
                              address: client.address,
                              userCode: client.user_code,
                              delegateCode: null,
                              status: client.status === 'banned' || client.status === 'blocked' ? 'banned' : 'active',
                              registrationDate: client.registered_at,
                              adsCount: client.listings_count,
                              role: client.role,
                              lastLogin: '',
                              phoneVerified: client.phone_verified,
                            };
                            handleViewProfile(userToView);
                          }}
                          title="عرض الملف الشخصي"
                          style={{
                            backgroundColor: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
                        >
                          <ExternalLink size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px'
                    }}>
                      <Users size={40} />
                    </div>
                    <h4 style={{ color: '#374151', margin: '0 0 8px' }}>لا يوجد عملاء</h4>
                    <p style={{ margin: 0, fontSize: '14px' }}>لم يقم أي مستخدمين بالتسجيل باستخدام كود هذا المندوب حتى الآن.</p>
                  </div>
                )}
              </div>
            )}

            {isAdModalOpen && adInModal && (
              <div className="modal-overlay" onClick={closeAdDetailsModal}>
                <div className="ad-details-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>تفاصيل الإعلان</h3>
                    <button className="modal-close" onClick={closeAdDetailsModal}>✕</button>
                  </div>
                  <div className="modal-content">
                    <div className="ad-details-grid">
                      <div className="ad-details-image">
                        <Image src={adInModal.image} alt={adInModal.title} width={480} height={360} style={{ objectFit: 'cover' }} />
                      </div>
                      <div className="ad-details-info">
                        <h4 className="ad-details-title">{adInModal.title}</h4>
                        <div className="ad-details-meta">
                          <span className="category-badge">{adInModal.category}</span>
                          <span className={`status-badge ${adInModal.status === 'منشور' ? 'published' : 'pending'}`}>{adInModal.status}</span>
                          <span className="publish-date">{formatDateDDMMYYYY(adInModal.publishDate)}</span>
                        </div>
                        <div className="ad-details-rows">
                          <div className="detail-row"><span className="detail-label">القسم</span><span className="detail-value">{adInModal.category}</span></div>
                          <div className="detail-row"><span className="detail-label">القسم (slug)</span><span className="detail-value">{adInModal.categorySlug}</span></div>
                          <div className="detail-row"><span className="detail-label">الحالة</span><span className="detail-value">{adInModal.status}</span></div>
                          <div className="detail-row"><span className="detail-label">تاريخ النشر</span><span className="detail-value">{formatDateDDMMYYYY(adInModal.publishDate)}</span></div>
                          <div className="detail-row"><span className="detail-label">نوع العقار</span><span className="detail-value">{adInModal.attributes?.property_type ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">نوع العقد</span><span className="detail-value">{adInModal.attributes?.contract_type ?? '-'}</span></div>
                          {/* <div className="detail-row"><span className="detail-label">القسم الرئيسي</span><span className="detail-value">{adInModal.attributes?.main_category ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">القسم الفرعي</span><span className="detail-value">{adInModal.attributes?.sub_category ?? '-'}</span></div> */}
                          <div className="detail-row"><span className="detail-label">السعر</span><span className="detail-value">{adInModal.price ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">الهاتف</span><span className="detail-value">{adInModal.contactPhone ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">واتساب</span><span className="detail-value">{adInModal.whatsappPhone ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">الخطة</span><span className="detail-value">{adInModal.planType ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">المشاهدات</span><span className="detail-value">{typeof adInModal.views === 'number' ? adInModal.views : '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">الترتيب</span><span className="detail-value">{typeof adInModal.rank === 'number' ? adInModal.rank : '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">المحافظة</span><span className="detail-value">{adInModal.governorate ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">المدينة</span><span className="detail-value">{adInModal.city ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">إحداثيات</span><span className="detail-value">{adInModal.lat ?? '-'}, {adInModal.lng ?? '-'}</span></div>
                          <div className="detail-row"><span className="detail-label">رقم الإعلان</span><span className="detail-value">{adInModal.id}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn-primary" onClick={closeAdDetailsModal}>إغلاق</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="user-transactions-tab">
                <h3>المعاملات المالية</h3>
                <div className="subscription-form">
                  <h4>اشتراك سنوي للمستخدم</h4>
                  <div className="subscription-grid">
                    <div className="form-group">
                      <label>العنوان</label>
                      <input
                        type="text"
                        className="form-input"
                        value={subscriptionForm.title}
                        onChange={(e) => handleSubscriptionChange('title', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>قيمة الاشتراك السنوي</label>
                      <input
                        type="number"
                        min={0}
                        className="form-input"
                        value={subscriptionForm.annualFee}
                        onChange={(e) => handleSubscriptionChange('annualFee', Number(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label>المبلغ المدفوع</label>
                      <input
                        type="number"
                        min={0}
                        className="form-input"
                        value={subscriptionForm.paidAmount}
                        onChange={(e) => handleSubscriptionChange('paidAmount', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="subscription-actions">
                    <button className="btn-save" onClick={saveSubscriptionForUser}>حفظ الاشتراك</button>
                  </div>
                </div>
                <div className="transactions-list">
                  {transactions.map((t, i) => (
                    <div className="transaction-item" key={i}>
                      <span>{t.title || '—'}</span>
                      <span>{`قيمة الاشتراك: ${t.annualFee} | المدفوع: ${t.paidAmount} جنيه`}</span>
                      <span>{formatDateDDMMYYYY(t.date)}</span>
                    </div>
                  ))}
                  <div className="transaction-item">
                    <span>رسوم إعلان</span>
                    <span>-50 جنيه</span>
                    <span>2024-01-15</span>
                  </div>
                  <div className="transaction-item">
                    <span>إيداع</span>
                    <span>+200 جنيه</span>
                    <span>2024-01-10</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="user-logs-tab">
                <h3>سجل النشاطات</h3>
                <div className="logs-list">
                  <div className="log-item">
                    <span>تسجيل دخول</span>
                    <span>2024-01-20 10:30</span>
                  </div>
                  <div className="log-item">
                    <span>نشر إعلان جديد</span>
                    <span>2024-01-18 14:20</span>
                  </div>
                  <div className="log-item">
                    <span>تعديل الملف الشخصي</span>
                    <span>2024-01-15 09:15</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="user-permissions-tab">
                <h3>الأذونات والصلاحيات</h3>
                <div className="permissions-list">
                  <div className="permission-item">
                    <label>
                      <input type="checkbox" defaultChecked />
                      نشر الإعلانات
                    </label>
                  </div>
                  <div className="permission-item">
                    <label>
                      <input type="checkbox" defaultChecked />
                      تعديل الملف الشخصي
                    </label>
                  </div>
                  <div className="permission-item">
                    <label>
                      <input type="checkbox" />
                      الوصول للإحصائيات المتقدمة
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={closeAddUserModal}>
          <div className="add-user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إضافة مستخدم جديد</h3>
              <button className="modal-close" onClick={closeAddUserModal}>✕</button>
            </div>
            <div className="modal-content">
              <div className="edit-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>الاسم الكامل</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newUserForm.name}
                      onChange={(e) => handleNewUserChange('name', e.target.value)}
                      placeholder="اسم المستخدم"
                    />
                  </div>
                  <div className="form-group">
                    <label>رقم الهاتف</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={newUserForm.phone}
                      onChange={(e) => handleNewUserChange('phone', e.target.value)}
                      placeholder="+20 1XX XXX XXXX"
                    />
                  </div>
                  <div className="form-group">
                    <label>البريد الإلكتروني</label>
                    <input
                      type="email"
                      className="form-input"
                      value={newUserForm.email}
                      onChange={(e) => handleNewUserChange('email', e.target.value)}
                      placeholder="employee@example.com"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>كلمة المرور</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={newUserForm.password}
                        onChange={(e) => handleNewUserChange('password', e.target.value)}
                        placeholder="أدخل كلمة المرور أو أنشئ واحدة تلقائيًا"
                        style={{ flex: '1 1 320px', direction: 'ltr', textAlign: 'left', letterSpacing: '0.05em' }}
                      />
                      <button
                        type="button"
                        onClick={generateUserPassword}
                        style={{
                          border: '1px solid #bfdbfe',
                          borderRadius: '12px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          padding: '0 16px',
                          minHeight: '46px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        إنشاء باسورد
                      </button>
                      <button
                        type="button"
                        onClick={copyGeneratedPassword}
                        disabled={!String(newUserForm.password || '').trim()}
                        style={{
                          border: '1px solid #cbd5e1',
                          borderRadius: '12px',
                          background: String(newUserForm.password || '').trim() ? '#0f766e' : '#e2e8f0',
                          color: String(newUserForm.password || '').trim() ? '#ffffff' : '#64748b',
                          padding: '0 16px',
                          minHeight: '46px',
                          fontWeight: 700,
                          cursor: String(newUserForm.password || '').trim() ? 'pointer' : 'not-allowed',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        نسخ
                      </button>
                    </div>
                    <p style={{ marginTop: '8px', color: '#64748b', fontSize: '13px' }}>
                      سيتم إرسال هذه الكلمة مع الحساب عند الإنشاء. إذا تركتها فارغة سيستخدم النظام الإعداد الافتراضي الحالي.
                    </p>
                  </div>
                  <div className="form-group">
                    <label>الدور</label>
                    <select
                      className="form-select"
                      value={newUserForm.role}
                      onChange={(e) => handleNewUserChange('role', e.target.value)}
                    >
                      {editableRoleOptions.map((roleOption) => (
                        <option key={roleOption} value={roleOption}>{roleOption}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>الحالة</label>
                    <select
                      className="form-select"
                      value={newUserForm.status}
                      onChange={(e) => handleNewUserChange('status', e.target.value)}
                    >
                      <option value="active">نشط</option>
                      <option value="banned">محظور</option>
                    </select>
                  </div>
                  {isCurrentAdmin && mapRoleToApi(newUserForm.role) === 'employee' && (
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>الصفحات المسموح بها للموظف</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                        {DASHBOARD_PERMISSION_OPTIONS.map((option) => {
                          const selected = newUserForm.allowedDashboardPages.includes(option.key);
                          return (
                            <label key={option.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: selected ? '1px solid #14b8a6' : '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 12px', background: selected ? '#f0fdfa' : '#fff' }}>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...newUserForm.allowedDashboardPages, option.key]
                                    : newUserForm.allowedDashboardPages.filter((item) => item !== option.key);
                                  handleNewUserChange('allowedDashboardPages', next);
                                }}
                              />
                              <span>{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="form-group">
                    <label>تاريخ التسجيل</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newUserForm.registrationDate}
                      onChange={(e) => handleNewUserChange('registrationDate', e.target.value)}
                    />
                  </div>
                  {/* <div className="form-group">
                    <label>آخر تسجيل دخول</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newUserForm.lastLogin}
                      onChange={(e) => handleNewUserChange('lastLogin', e.target.value)}
                    />
                  </div> */}
                  {/* <div className="form-group">
                    <label>عدد الإعلانات</label>
                    <input
                      type="number"
                      min={0}
                      className="form-input"
                      value={newUserForm.adsCount}
                      onChange={(e) => handleNewUserChange('adsCount', Number(e.target.value))}
                    />
                  </div> */}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeAddUserModal}>إلغاء</button>
              <button className="btn-save-user" onClick={saveNewUser}>حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Packages Modal */}
      {isPackagesModalOpen && selectedUserForPackages && (
        <div className="modal-overlay" onClick={closePackagesModal}>
          <div className="packages-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إدارة باقات المستخدم</h3>
              <button className="modal-close" onClick={closePackagesModal}>✕</button>
            </div>
            <div className="modal-content">
              {/* Loading State */}
              {(packagesModalState === 'loading' || packagesModalState === 'retrying') && <PackageLoadingSkeleton />}

              {/* Error State */}
              {packagesModalState === 'error' && packagesError && (
                <PackageErrorDisplay 
                  error={{ type: 'unknown', message: packagesError, canRetry: true }} 
                  onRetry={retryFetchPackages} 
                />
              )}

              {/* Loaded State */}
              {packagesModalState === 'loaded' && (
                <>
                  <div className="plan-cards">
                    <div className="plan-card">
                      <div className="plan-title">الباقة المتميزة <span className={`status-pill ${packagesForm.startFeaturedNow ? (getRemainingByDates(packagesForm.featuredStartDate, packagesForm.featuredExpiryDate) > 0 ? 'success' : 'danger') : 'neutral'}`}>{packagesForm.startFeaturedNow ? (getRemainingByDates(packagesForm.featuredStartDate, packagesForm.featuredExpiryDate) > 0 ? 'نشطة' : 'منتهية') : 'غير نشطة'}</span></div>
                      <div className="plan-meta">
                        <div className="meta-item"><span className="meta-label">تاريخ البدء</span><span className="meta-value">{packagesForm.featuredStartDate || '—'}</span></div>
                        <div className="meta-item"><span className="meta-label">تاريخ الانتهاء</span><span className="meta-value">{packagesForm.featuredExpiryDate || '—'}</span></div>
                        <div className="meta-item remaining"><span className="meta-label">المتبقي</span><span className="meta-value">{getRemainingByDates(packagesForm.featuredStartDate, packagesForm.featuredExpiryDate)} يوم</span></div>
                      </div>
                      <div className="plan-progress"><div className="progress-track"><div className="progress-bar" style={{ width: `${getProgressPercent(packagesForm.featuredStartDate, packagesForm.featuredExpiryDate)}%` }}></div></div><div className="progress-label">{getProgressPercent(packagesForm.featuredStartDate, packagesForm.featuredExpiryDate)}%</div></div>
                      <div className="plan-grid">
                        <div className="field">
                          <label>عدد الإعلانات المتميزة</label>
                          <input
                            type="number"
                            className="form-input"
                            min={0}
                            value={packagesForm.featuredAds}
                            onChange={(e) => handlePackagesChange('featuredAds', Number(e.target.value))}
                            disabled={packagesModalState === 'loading' || packagesModalState === 'saving'}
                          />
                        </div>
                        <div className="field">
                          <label>عدد أيام صلاحية المتميزة</label>
                          <input
                            type="number"
                            className="form-input"
                            min={0}
                            value={packagesForm.featuredDays}
                            onChange={(e) => handlePackagesChange('featuredDays', Number(e.target.value))}
                            disabled={packagesModalState === 'loading' || packagesModalState === 'saving'}
                          />
                        </div>
                      </div>
                      <label className="toggle-label compact">
                        <span className="toggle-text">بدء الآن</span>
                        <div className="toggle-switch-container">
                          <input
                            type="checkbox"
                            className="toggle-input"
                            checked={packagesForm.startFeaturedNow}
                            onChange={(e) => {
                              const v = e.target.checked;
                              handlePackagesChange('startFeaturedNow', v);
                              if (v) {
                                handlePackagesChange('featuredStartDate', new Date().toISOString().split('T')[0]);
                                handlePackagesChange('startStandardNow', false);
                              }
                            }}
                            disabled={packagesModalState === 'loading' || packagesModalState === 'saving'}
                          />
                          <span className="toggle-slider"></span>
                          <span className="toggle-status">{packagesForm.startFeaturedNow ? 'مفعل' : 'مغلق'}</span>
                        </div>
                      </label>
                    </div>
                    <div className="plan-card">
                      <div className="plan-title">الباقة الستاندر <span className={`status-pill ${packagesForm.startStandardNow ? (getRemainingByDates(packagesForm.standardStartDate, packagesForm.standardExpiryDate) > 0 ? 'success' : 'danger') : 'neutral'}`}>{packagesForm.startStandardNow ? (getRemainingByDates(packagesForm.standardStartDate, packagesForm.standardExpiryDate) > 0 ? 'نشطة' : 'منتهية') : 'غير نشطة'}</span></div>
                      <div className="plan-meta">
                        <div className="meta-item"><span className="meta-label">تاريخ البدء</span><span className="meta-value">{packagesForm.standardStartDate || '—'}</span></div>
                        <div className="meta-item"><span className="meta-label">تاريخ الانتهاء</span><span className="meta-value">{packagesForm.standardExpiryDate || '—'}</span></div>
                        <div className="meta-item remaining"><span className="meta-label">المتبقي</span><span className="meta-value">{getRemainingByDates(packagesForm.standardStartDate, packagesForm.standardExpiryDate)} يوم</span></div>
                      </div>
                      <div className="plan-progress"><div className="progress-track"><div className="progress-bar" style={{ width: `${getProgressPercent(packagesForm.standardStartDate, packagesForm.standardExpiryDate)}%` }}></div></div><div className="progress-label">{getProgressPercent(packagesForm.standardStartDate, packagesForm.standardExpiryDate)}%</div></div>
                      <div className="plan-grid">
                        <div className="field">
                          <label>عدد الإعلانات الستاندر</label>
                          <input
                            type="number"
                            className="form-input"
                            min={0}
                            value={packagesForm.standardAds}
                            onChange={(e) => handlePackagesChange('standardAds', Number(e.target.value))}
                            disabled={packagesModalState === 'loading' || packagesModalState === 'saving'}
                          />
                        </div>
                        <div className="field">
                          <label>عدد أيام صلاحية الستاندر</label>
                          <input
                            type="number"
                            className="form-input"
                            min={0}
                            value={packagesForm.standardDays}
                            onChange={(e) => handlePackagesChange('standardDays', Number(e.target.value))}
                            disabled={packagesModalState === 'loading' || packagesModalState === 'saving'}
                          />
                        </div>
                      </div>
                      <label className="toggle-label compact">
                        <span className="toggle-text">بدء الآن</span>
                        <div className="toggle-switch-container">
                          <input
                            type="checkbox"
                            className="toggle-input"
                            checked={packagesForm.startStandardNow}
                            onChange={(e) => {
                              const v = e.target.checked;
                              handlePackagesChange('startStandardNow', v);
                              if (v) {
                                handlePackagesChange('standardStartDate', new Date().toISOString().split('T')[0]);
                                handlePackagesChange('startFeaturedNow', false);
                              }
                            }}
                            disabled={packagesModalState === 'loading' || packagesModalState === 'saving'}
                          />
                          <span className="toggle-slider"></span>
                          <span className="toggle-status">{packagesForm.startStandardNow ? 'مفعل' : 'مغلق'}</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Dynamic Categories Section */}
                  <div style={{ 
                    marginTop: '24px',
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        width: '4px',
                        height: '24px',
                        backgroundColor: '#1c6b74',
                        borderRadius: '2px'
                      }} />
                      <h4 style={{ 
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#111827'
                      }}>الأقسام المسموحة ({dynamicCategories.length} قسم)</h4>
                    </div>
                    <DynamicCategoriesSection
                      categories={dynamicCategories}
                      selectedCategories={selectedPackageCategories}
                      onToggle={handlePackageCategoryToggle}
                      loadState={categoriesLoadState}
                    />
                  </div>

                  {/* Package History Table */}
                  <div style={{ 
                    marginTop: '24px',
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        width: '4px',
                        height: '24px',
                        backgroundColor: '#1c6b74',
                        borderRadius: '2px'
                      }} />
                      <h4 style={{ 
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#111827'
                      }}>تاريخ الباقات ({packageHistory.length} سجل)</h4>
                    </div>
                    <PackageHistoryTable history={packageHistory} />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closePackagesModal}>إلغاء</button>
              <button 
                className="btn-save-package" 
                onClick={savePackages}
                disabled={packagesModalState === 'loading' || packagesModalState === 'saving'}
              >
                {packagesModalState === 'saving' ? 'جاري الحفظ...' : 'حفظ الباقة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {isVerifyModalOpen && userForVerify && (
        <div className="modal-overlay" onClick={closeVerifyModal}>
          <div className="verify-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>كود التحقق</h3>
              <button className="modal-close" onClick={closeVerifyModal}>✕</button>
            </div>
            <div className="modal-content">
              <div className="code-row">
                <div className="code-display" title="اضغط للنسخ" onClick={copyVerificationCode}>{verificationCode}</div>
                <button className="copy-icon" onClick={copyVerificationCode} title="نسخ الكود">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="9" y="9" width="11" height="11" rx="2" ry="2" stroke="white" strokeWidth="2" />
                    <rect x="4" y="4" width="11" height="11" rx="2" ry="2" stroke="white" strokeWidth="2" />
                  </svg>
                </button>
                <button className="whatsapp-icon" onClick={() => openWhatsAppWithCode(userForVerify)} title="إرسال عبر واتساب">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.8 15.2c-.4.2-1 .4-1.5.2-.3-.1-.7-.2-1.1-.5-.6-.3-1.2-.8-1.7-1.4-.5-.5-.9-1.1-1.1-1.6-.2-.4-.3-.8-.2-1.1.1-.6.7-.9 1.1-1.1l.3-.2c.1-.1.2-.1.3 0 .1.1.7.9.8 1 .1.1.1.2 0 .3l-.3.4c-.1.1-.1.2 0 .4.2.3.5.7.8 1 .3.3.7.6 1 .8.1.1.3.1.4 0l.4-.3c.1-.1.2-.1.3 0 .1.1.9.7 1 .8.1.1.1.2 0 .3l-.1.2c-.2.4-.6.9-1.2 1.1z" fill="white" />
                    <path d="M20 12a8 8 0 1 0-14.6 4.8L4 21l4.3-1.3A8 8 0 0 0 20 12z" stroke="white" strokeWidth="2" fill="none" />
                  </svg>
                </button>
              </div>
              <p className="verify-helper">يمكنك نسخ الكود وإرساله للمستخدم عبر الواتساب.</p>
            </div>
            <div className="modal-footer">
              {/* <button className="btn-cancel" onClick={closeVerifyModal}>إغلاق</button> */}
              {/*    <button className="btn-verify-done" onClick={() => { if (userForVerify) handleVerifyPhone(userForVerify.id); closeVerifyModal(); }}>تم التحقق</button>*/}
            </div>
          </div>
        </div>
      )}
      {isFavoritesModalOpen && selectedUserForFavorites && (
        <div className="modal-overlay" onClick={closeFavoritesModal}>
          <div className="favorites-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تفضيل المعلن في الأقسام</h3>
              <button className="modal-close" onClick={closeFavoritesModal}>✕</button>
            </div>
            <div className="modal-content">
              {isLoadingFavorites ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                  <p style={{ marginTop: '1rem', color: '#666' }}>جاري تحميل البيانات...</p>
                </div>
              ) : (
                <>
                  {favoritesError && (
                    <div style={{ 
                      padding: '0.75rem', 
                      marginBottom: '1rem', 
                      backgroundColor: '#fff3cd', 
                      border: '1px solid #ffc107',
                      borderRadius: '8px',
                      color: '#856404',
                      fontSize: '0.9rem'
                    }}>
                      ⚠️ {favoritesError}
                    </div>
                  )}
                  {featuredEnabledCategories.length === 0 ? (
                    <div style={{
                      border: '1px solid #fde68a',
                      background: '#fffbeb',
                      color: '#92400e',
                      borderRadius: '12px',
                      padding: '1rem',
                      lineHeight: 1.8,
                      fontWeight: 600,
                    }}>
                      برجاء تشغيل المعلنين المميزين لدي أي قسم لإظهاره في النافذة.
                    </div>
                  ) : (
                    <div className="favorites-grid">
                      {featuredEnabledCategories.map((categoryObj) => {
                        const slug = categoryObj.slug;
                        const label = categoryObj.nameAr ?? slug;
                        const checked = favoriteSlugs.includes(slug);
                        return (
                          <div key={slug} className="favorite-item">
                            <div className="favorite-label">{label}</div>
                            <label className="toggle-label compact">
                              <div className="toggle-switch-container">
                                <input
                                  type="checkbox"
                                  className="toggle-input"
                                  checked={checked}
                                  onChange={(e) => toggleFavoriteSlug(slug, e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                                <span className="toggle-status">{checked ? 'مفضل' : 'غير مفضل'}</span>
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={clearFavoritesForUser}>إلغاء التفضيل للجميع</button>
              <button
                className="btn-save"
                onClick={saveFavoritesForUser}
                disabled={featuredEnabledCategories.length === 0}
                style={featuredEnabledCategories.length === 0 ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delegate Clients Modal */}
      {isDelegateClientsModalOpen && selectedDelegateForClients && (
        <div className="modal-overlay" onClick={() => setIsDelegateClientsModalOpen(false)}>
          <div className="delegate-clients-modal" onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '95%',
            maxWidth: '650px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            animation: 'modalFadeIn 0.3s ease-out'
          }}>
            <div className="modal-header" style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#1c6b74ff',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px' }}>
                  <Users size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>عملاء المندوب</h3>
                  <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>{selectedDelegateForClients.name}</p>
                </div>
              </div>
              <button onClick={() => setIsDelegateClientsModalOpen(false)} style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>✕</button>
            </div>

            <div className="modal-content" style={{ padding: '24px', overflowY: 'auto', flex: 1, backgroundColor: '#f9fafb' }}>
              {isFetchingClients ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6366f1' }}>
                  <div style={{
                    border: '4px solid #f3f4f6',
                    borderTop: '4px solid #1c6b74ff',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    margin: '0 auto 20px',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <p style={{ fontWeight: '600' }}>جاري جلب القائمة...</p>
                </div>
              ) : delegateClients.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {delegateClients.map((client) => (
                    <div key={client.id} style={{
                      padding: '16px',
                      backgroundColor: 'white',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          backgroundColor: '#eef2ff',
                          color: '#1c6b74ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '18px'
                        }}>
                          {client.name ? client.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontWeight: '800', color: '#111827', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{client.name || 'مستخدِم بدون اسم'}</span>
                            {client.phone_verified && (
                              <span style={{
                                color: '#10b981',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: '#d1fae5',
                                border: '1px solid #10b981'
                              }} title="رقم موثق">✓</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Phone size={14} style={{ color: '#1c6b74ff' }} />
                              <span>{client.phone}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MapPin size={14} style={{ color: '#1c6b74ff' }} />
                              <span>{client.address || 'موقع غير محدد'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleViewClientProfile(client)}
                        title="عرض الملف الشخصي"
                        style={{
                          backgroundColor: '#1c6b74ff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
                      >
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <Users size={40} />
                  </div>
                  <h4 style={{ color: '#374151', margin: '0 0 8px' }}>لا يوجد عملاء</h4>
                  <p style={{ margin: 0, fontSize: '14px' }}>لم يقم أي مستخدمين بالتسجيل باستخدام كود هذا المندوب حتى الآن.</p>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{
              padding: '16px 24px',
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: 'white'
            }}>
              <button
                onClick={() => setIsDelegateClientsModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <div className="toast-content">
              <span className="toast-message">{toast.message}</span>
              {toast.actions && toast.actions.length > 0 && (
                <div className="toast-actions">
                  {toast.actions.map((action, idx) => (
                    <button
                      key={idx}
                      className={`toast-action ${action.variant ?? 'primary'}`}
                      onClick={() => {
                        action.onClick?.();
                        removeToast(toast.id);
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="إغلاق"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="users-header">
        <div className="header-content">
          <h1>المستخدمون والمعلِنون والمناديب</h1>
          <p>إدارة حسابات المستخدمين والمعلنين</p>
        </div>
      </div>

      <div className="users-content">
        <div className="search-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="ابحث بالاسم، الهاتف، الكود، الإيميل، الحالة، الدور أو العنوان..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="search-btn" onClick={() => setDebouncedSearchTerm(searchTerm.trim())}>🔍</button>
          </div>
        </div>

        <div className="users-tabs">
          <button
            className={`tab-btn ${roleFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            الكل
          </button>
          <button
            className={`tab-btn ${roleFilter === 'users' ? 'active' : ''}`}
            onClick={() => setRoleFilter('users')}
          >
            المستخدمون
          </button>
          <button
            className={`tab-btn ${roleFilter === 'advertisers' ? 'active' : ''}`}
            onClick={() => setRoleFilter('advertisers')}
          >
            المعلنون
          </button>
          <button
            className={`tab-btn ${roleFilter === 'delegates' ? 'active' : ''}`}
            onClick={() => setRoleFilter('delegates')}
          >
            المناديب
          </button>
          {isCurrentAdmin && (
            <button
              className={`tab-btn ${roleFilter === 'employees' ? 'active' : ''}`}
              onClick={() => setRoleFilter('employees')}
            >
              الموظفون
            </button>
          )}
        </div>

        {/* Results Info */}
        <div className="results-info">
          <div className="results-count">
            عرض {displayStart} - {displayEnd} من {serverTotal} مستخدم
          </div>
          <div className="page-info">
            الصفحة {serverPage} من {totalPages}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="users-table-container desktop-view">
          <div className="table-actions">
            <button
              className="btn-add-user"
              onClick={openAddUserModal}
            >
              ➕ إضافة مستخدم
            </button>
            <button
              className="btn-export-table excel"
              onClick={() => exportToExcel(filteredUsers, 'users-export')}
            >
              تصدير Excel
            </button>
          </div>
          <table className="users-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>رقم الهاتف</th>
                <th>كود المستخدم</th>
                <th>كود المندوب</th>
                <th>الحالة</th>
                <th>تاريخ التسجيل</th>
                <th>عدد الإعلانات</th>
                <th>الدور</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user.id}>
                  <td className="user-name">
                    {user.name}
                    {user.phoneVerified && (
                      <span className="verified-badge" title="موثّق" style={{ marginRight: 6 }}>
                        ✓
                      </span>
                    )}
                  </td>
                  <td className="user-phone">
                    <div className="phone-with-whatsapp">
                      <span className="phone-number">{user.phone}</span>

                      <button
                        className="whatsapp-icon"
                        onClick={() => openWhatsAppContact(user)}
                        title="فتح واتساب"
                      >
                        <Image src="/whatsapp_3670133.png" alt="واتساب" width={24} height={24} />
                      </button>
                    </div>
                  </td>
                  <td className="user-code">{user.userCode}</td>
                  <td className="delegate-code">
                    {user.delegateCode ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span>{user.delegateCode}</span>
                        <button
                          className="delegate-profile-icon"
                          onClick={() => handleViewDelegateProfile(user.delegateCode!)}
                          title="عرض ملف المندوب"
                          style={{
                            background: '#1c6b74ff',
                            border: 'none',
                            borderRadius: '11px',
                            width: '24px',
                            height: '24px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(99, 102, 241, 0.3)';
                          }}
                        >
                          <UserIcon size={14} color="white" />
                        </button>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${user.status}`}>
                      {user.status === 'active' ? 'نشط' : 'محظور'}
                    </span>
                  </td>
                  <td className="registration-date">{formatDateDDMMYYYY(user.registrationDate)}</td>
                  <td className="ads-count">{user.adsCount}</td>
                  <td className="user-role">{mapRoleToLabel(user.role)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() => handleViewProfile(user)}
                        title="عرض الملف الشخصي"
                      >
                        عرض
                      </button>
                      {canManageEmployeeRecord(user) && (
                        <button
                          type="button"
                          onClick={() => openEmployeePermissionsEditor(user)}
                          title="إدارة الصفحات المسموح بها"
                          style={{
                            background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '11px',
                            padding: '4px 10px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            marginRight: '4px',
                          }}
                        >
                          صلاحيات
                        </button>
                      )}
                      <button
                        className={`btn-ban ${user.status === 'banned' ? 'unban' : ''}`}
                        onClick={() => handleBanUser(user.id)}
                        title={user.status === 'active' ? 'حظر المستخدم' : 'إلغاء الحظر'}
                      >
                        {user.status === 'active' ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                            <path d="m4.9 4.9 14.2 14.2" stroke="white" strokeWidth="2" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                          </svg>
                        )}
                      </button>
                      {/* <button
                        className="btn-reset-password"
                        onClick={() => handleResetPassword(user.id)}
                        title="إعادة تعيين كلمة السر"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M21 3v5h-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 16H3v5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button> */}
                      {/* <button
                        className="btn-change-password"
                        onClick={() => handleChangePassword(user.id)}
                        title="تغيير كلمة السر"
                      >
                        🔑
                      </button> */}
                      <button
                        className="btn-change-password"
                        onClick={() => handleChangePassword(user.id)}
                        title="تغيير كلمة السر"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="white" strokeWidth="2" />
                          <circle cx="12" cy="16" r="1" fill="white" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="white" strokeWidth="2" />
                        </svg>
                      </button>
                      <button
                        className="btn-verify-phone"
                        onClick={() => openVerifyModal(user)}
                        title="عرض كود التحقق"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                          <path d="M8 12l2.5 2.5L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        className="btn-packages"
                        onClick={() => openPackagesModal(user)}
                        title="الباقات"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 7l9-4 9 4-9 4-9-4z" stroke="white" strokeWidth="2" />
                          <path d="M3 12l9 4 9-4" stroke="white" strokeWidth="2" />
                          <path d="M3 12v5l9 4 9-4v-5" stroke="white" strokeWidth="2" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleAdUpdateButton(user)}
                        title={user.showAdUpdateButton === false ? 'إظهار زر تحديث الإعلان في التطبيق' : 'إخفاء زر تحديث الإعلان من التطبيق'}
                        style={{
                          backgroundColor: user.showAdUpdateButton === false ? '#64748b' : '#0f766e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '11px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '4px',
                        }}
                      >
                        {user.showAdUpdateButton === false ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                      </button>
                      {(
                        ['advertiser', 'معلن'].includes(String(user.role || '').toLowerCase().trim()) ||
                        (
                          ['delegate', 'representative', 'مندوب'].includes(String(user.role || '').toLowerCase().trim()) &&
                          user.adsCount > 0
                        )
                      ) && (
                        <button
                          className="btn-favorites"
                          onClick={() => openFavoritesModal(user)}
                          title="المفضلة"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="white" />
                          </svg>
                        </button>
                      )}
                      {canShowDelegateClientsTab(user) && (
                        <button
                          className="btn-delegate-clients"
                          onClick={() => handleOpenDelegateClients(user)}
                          title="عملاء المندوب"
                          style={{
                            backgroundColor: '#1c6b74ff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '11px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '4px'
                          }}
                        >
                          <Users size={16} />
                        </button>
                      )}
                      <button
                        className="btn-delete-user"
                        onClick={() => handleDeleteUser(user.id)}
                        title="حذف المستخدم"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6h18" stroke="white" strokeWidth="2" />
                          <path d="M8 6V4h8v2" stroke="white" strokeWidth="2" />
                          <path d="M6 6l1 14h10l1-14" stroke="white" strokeWidth="2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Actions */}
        <div className="table-actions mobile-actions">
          <button
            className="btn-add-user"
            onClick={openAddUserModal}
          >
            ➕ إضافة مستخدم
          </button>
          <button
            className="btn-export-table excel"
            onClick={() => exportToExcel(filteredUsers, 'users-export')}
          >
            تصدير Excel
          </button>
        </div>

        {/* Mobile Cards View */}
        <div className="users-cards-container mobile-view">
          {currentUsers.map((user) => (
            <div key={user.id} className="user-card">
              <div className="card-header">
                <div className="user-info">
                  <h3 className="user-name">
                    {user.name}
                    {user.phoneVerified && (
                      <span className="verified-badge" title="موثّق" style={{ marginRight: 6 }}>
                        ✓
                      </span>
                    )}
                  </h3>
                  <span className="user-code">كود: {user.userCode}</span>
                  {user.delegateCode && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span className="delegate-code">
                        مندوب: {user.delegateCode}
                      </span>
                      <button
                        onClick={() => handleViewDelegateProfile(user.delegateCode!)}
                        title="عرض ملف المندوب"
                        style={{
                          background: '#1c6b74ff',
                          border: 'none',
                          borderRadius: '11px',
                          width: '20px',
                          height: '20px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 1px 3px rgba(99, 102, 241, 0.3)'
                        }}
                      >
                        <UserIcon size={12} color="white" />
                      </button>
                    </div>
                  )}
                </div>
                <span className={`status-badge ${user.status}`}>
                  {user.status === 'active' ? 'نشط' : 'محظور'}
                </span>
              </div>

              <div className="card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">رقم الهاتف:</span>
                    <span className="info-value phone-with-whatsapp">
                      {user.phone}
                      <button
                        className="whatsapp-icon"
                        onClick={() => openWhatsAppContact(user)}
                        title="فتح واتساب"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16.8 15.2c-.4.2-1 .4-1.5.2-.3-.1-.7-.2-1.1-.5-.6-.3-1.2-.8-1.7-1.4-.5-.5-.9-1.1-1.1-1.6-.2-.4-.3-.8-.2-1.1.1-.6.7-.9 1.1-1.1l.3-.2c.1-.1.2-.1.3 0 .1.1.7.9.8 1 .1.1.1.2 0 .3l-.3.4c-.1.1-.1.2 0 .4.2.3.5.7.8 1 .3.3.7.6 1 .8.1.1.3.1.4 0l.4-.3c.1-.1.2-.1.3 0 .1.1.9.7 1 .8.1.1.1.2 0 .3l-.1.2c-.2.4-.6.9-1.2 1.1z" fill="white" />
                          <path d="M20 12a8 8 0 1 0-14.6 4.8L4 21l4.3-1.3A8 8 0 0 0 20 12z" stroke="white" strokeWidth="2" fill="none" />
                        </svg>
                      </button>
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">الدور:</span>
                    <span className="info-value">{mapRoleToLabel(user.role)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">تاريخ التسجيل:</span>
                    <span className="info-value">{formatDateDDMMYYYY(user.registrationDate)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">عدد الإعلانات:</span>
                    <span className="info-value">{user.adsCount}</span>
                  </div>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="btn-view"
                  onClick={() => handleViewProfile(user)}
                  title="عرض الملف الشخصي"
                >
                  عرض الملف
                </button>
                {canManageEmployeeRecord(user) && (
                  <button
                    type="button"
                    onClick={() => openEmployeePermissionsEditor(user)}
                    title="إدارة الصفحات المسموح بها"
                    style={{
                      background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '11px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                    }}
                  >
                    صلاحيات الموظف
                  </button>
                )}
                <button
                  className={`btn-ban ${user.status === 'banned' ? 'unban' : ''}`}
                  onClick={() => handleBanUser(user.id)}
                  title={user.status === 'active' ? 'حظر المستخدم' : 'إلغاء الحظر'}
                >
                  {user.status === 'active' ? 'حظر' : 'إلغاء الحظر'}
                </button>
                {canShowDelegateClientsTab(user) && (
                  <button
                    className="btn-delegate-clients"
                    onClick={() => handleOpenDelegateClients(user)}
                    title="عملاء المندوب"
                    style={{
                      backgroundColor: '#1c6b74ff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '11px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)'
                    }}
                  >
                    <Users size={16} />
                    عملاء المندوب
                  </button>
                )}
                {/* <button
                  className="btn-reset-password"
                  onClick={() => handleResetPassword(user.id)}
                  title="إعادة تعيين كلمة السر"
                >
                  إعادة تعيين
                </button> */}
                <button
                  className="btn-change-password"
                  onClick={() => handleChangePassword(user.id)}
                  title="تغيير كلمة السر"
                >
                  تغيير كلمة السر
                </button>
                {/* <button
                  className="btn-set-pin"
                  onClick={() => handleSetPIN(user.id)}
                  title="تعيين PIN"
                >
                  تعيين PIN
                </button> */}
                <button
                  className="btn-verify-phone"
                  onClick={() => openVerifyModal(user)}
                  title="عرض كود التحقق"
                >
                  توثيق
                </button>
                <button
                  className="btn-packages"
                  onClick={() => openPackagesModal(user)}
                  title="الباقات"
                >
                  الباقات
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAdUpdateButton(user)}
                  title={user.showAdUpdateButton === false ? 'إظهار زر تحديث الإعلان في التطبيق' : 'إخفاء زر تحديث الإعلان من التطبيق'}
                  style={{
                    backgroundColor: user.showAdUpdateButton === false ? '#64748b' : '#0f766e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '11px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                  }}
                >
                  {user.showAdUpdateButton === false ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                  {user.showAdUpdateButton === false ? 'إظهار التحديث' : 'إخفاء التحديث'}
                </button>
                {(
                  ['advertiser', 'معلن'].includes(String(user.role || '').toLowerCase().trim()) ||
                  (
                    ['delegate', 'representative', 'مندوب'].includes(String(user.role || '').toLowerCase().trim()) &&
                    user.adsCount > 0
                  )
                ) && (
                  <button
                    className="btn-favorites"
                    onClick={() => openFavoritesModal(user)}
                    title="المفضلة"
                  >
                    المفضلة
                  </button>
                )}
                <button
                  className="btn-delete-user"
                  onClick={() => handleDeleteUser(user.id)}
                  title="حذف المستخدم"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              عرض {serverTotal} مستخدم في {totalPages} صفحة
            </div>

            <div className="pagination">
              <button
                className="pagination-btn pagination-nav"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
              >
                السابق
              </button>

              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  className={`pagination-btn ${page === currentPage ? 'active' : ''
                    } ${page === '...' ? 'pagination-dots' : ''}`}
                  onClick={() => typeof page === 'number' && goToPage(page)}
                  disabled={page === '...'}
                >
                  {page}
                </button>
              ))}

              <button
                className="pagination-btn pagination-nav"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>لا توجد نتائج</h3>
            <p>لم يتم العثور على مستخدمين يطابقون البحث</p>
          </div>
        )}
      </div>
    </div>
  );
}
