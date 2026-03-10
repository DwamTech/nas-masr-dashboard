// services/banners.ts

import type { BannersResponse, UpdateBannerResponse } from '@/models/banners';

const API_BASE_URL = process.env.LARAVEL_API_URL || 'https://back.nasmasr.app/api';

/**
 * Fetch all banners
 */
export async function fetchBanners(token?: string): Promise<BannersResponse> {
    const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/admin/banners`, {
        method: 'GET',
        headers,
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch banners: ${response.statusText}`);
    }

    const data: BannersResponse = await response.json();
    return data;
}

/**
 * Create or add a new banner
 */
export async function createBanner(
    slug: string,
    bannerFile: File,
    token?: string
): Promise<UpdateBannerResponse> {
    const headers: HeadersInit = {
        'Accept': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append('slug', slug);
    formData.append('image', bannerFile);

    const response = await fetch(`${API_BASE_URL}/admin/banners`, {
        method: 'POST',
        headers,
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to create banner: ${response.statusText}`);
    }

    const data: UpdateBannerResponse = await response.json();
    return data;
}

/**
 * Update an existing banner by slug
 */
export async function updateBanner(
    slug: string,
    bannerFile: File,
    token?: string
): Promise<UpdateBannerResponse> {
    const headers: HeadersInit = {
        'Accept': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append('slug', slug);
    formData.append('image', bannerFile);
    formData.append('_method', 'PUT');

    const response = await fetch(`${API_BASE_URL}/admin/banners/${slug}`, {
        method: 'POST',
        headers,
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to update banner: ${response.statusText}`);
    }

    const data: UpdateBannerResponse = await response.json();
    return data;
}

/**
 * Get display name for banner slug
 */
export function getBannerDisplayName(slug: string): string {
    const displayNames: Record<string, string> = {
        // القسم الأول - البانرات الرئيسية
        'home': 'بانر الصفحة الرئيسية',
        'home_ads': 'بانر صفحة إضافة إعلان',
        'payment_single_ad_methods': 'صفحة طرق الدفع الخاصة بالإعلان الفردي',

        // الأقسام المختلفة
        'real_estate': 'عقارات',
        'cars': 'سيارات',
        'cars_rent': 'تأجير سيارات',
        'spare-parts': 'قطع غيار',
        'stores': 'محلات',
        'restaurants': 'مطاعم',
        'groceries': 'بقالة',
        'food-products': 'منتجات غذائية',
        'electronics': 'إلكترونيات',
        'home-appliances': 'أجهزة منزلية',
        'home-tools': 'أدوات منزلية',
        'furniture': 'أثاث',
        'doctors': 'أطباء',
        'health': 'صحة',
        'teachers': 'معلمون',
        'education': 'تعليم',
        'jobs': 'وظائف',
        'shipping': 'شحن',
        'mens-clothes': 'ملابس رجالي',
        'watches-jewelry': 'ساعات ومجوهرات',
        'free-professions': 'مهن حرة',
        'kids-toys': 'ألعاب أطفال',
        'gym': 'صالة رياضية',
        'construction': 'إنشاءات',
        'maintenance': 'صيانة',
        'car-services': 'خدمات سيارات',
        'home-services': 'خدمات منزلية',
        'lighting-decor': 'إضاءة وديكور',
        'animals': 'حيوانات',
        'farm-products': 'منتجات زراعية',
        'wholesale': 'جملة',
        'production-lines': 'خطوط إنتاج',
        'light-vehicles': 'مركبات خفيفة',
        'heavy-transport': 'نقل ثقيل',
        'tools': 'أدوات',
        'missing': 'مفقودات',
        'unified': 'موحد',
    };

    return displayNames[slug] || slug;
}
