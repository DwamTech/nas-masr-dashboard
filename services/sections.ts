'use client';

/**
 * Sections API Service
 * 
 * Handles API calls for unified categories that use main_sections → sub_sections
 * structure (e.g., car-services, home-services, animals, tools, etc.)
 * 
 * API Endpoints:
 * - GET    /api/main-sections?category_slug=X       → fetch main sections
 * - GET    /api/sub-sections/{mainSection}           → fetch sub sections  
 * - POST   /api/admin/main-section/{categorySlug}    → create main section
 * - POST   /api/admin/sub-section/{mainSection}      → add sub sections
 * - PUT    /api/admin/main-section/{mainSection}      → update main section
 * - PUT    /api/admin/sub-section/{subSection}        → update sub section
 * - DELETE /api/admin/main-section/{mainSection}      → delete main section
 * - DELETE /api/admin/sub-section/{subSection}         → delete sub section
 */

import { MainSection, MainSectionsResponse, SubSection } from '@/types/filters-lists';

const API_BASE = process.env.LARAVEL_API_URL || 'https://back.nasmasr.app/api';

function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

/**
 * Fetch main sections with their sub sections for a category
 */
export async function fetchMainSections(categorySlug: string): Promise<MainSectionsResponse> {
    const res = await fetch(`${API_BASE}/main-sections?category_slug=${categorySlug}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        throw new Error('فشل تحميل الأقسام الرئيسية');
    }

    return res.json();
}

/**
 * Fetch sub sections for a specific main section
 */
export async function fetchSubSections(mainSectionId: number): Promise<SubSection[]> {
    const res = await fetch(`${API_BASE}/sub-sections/${mainSectionId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        throw new Error('فشل تحميل الأقسام الفرعية');
    }

    return res.json();
}

/**
 * Create a new main section for a category
 */
export async function createMainSection(categorySlug: string, name: string, title?: string): Promise<MainSection> {
    const res = await fetch(`${API_BASE.replace('/api', '')}/api/admin/main-section/${categorySlug}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, title }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل إنشاء القسم الرئيسي');
    }

    return res.json();
}

/**
 * Add sub sections to a main section
 */
export async function addSubSections(mainSectionId: number, subSectionNames: string[]): Promise<{ main_section_id: number; sub_sections: SubSection[] }> {
    const res = await fetch(`${API_BASE.replace('/api', '')}/api/admin/sub-section/${mainSectionId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sub_sections: subSectionNames }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل إضافة الأقسام الفرعية');
    }

    return res.json();
}

/**
 * Update a main section name/title
 */
export async function updateMainSection(mainSectionId: number, data: { name?: string; title?: string }): Promise<MainSection> {
    const res = await fetch(`${API_BASE.replace('/api', '')}/api/admin/main-section/${mainSectionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل تعديل القسم الرئيسي');
    }

    return res.json();
}

/**
 * Update a sub section name/title
 */
export async function updateSubSection(subSectionId: number, data: { name?: string; title?: string }): Promise<SubSection> {
    const res = await fetch(`${API_BASE.replace('/api', '')}/api/admin/sub-section/${subSectionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل تعديل القسم الفرعي');
    }

    return res.json();
}

/**
 * Delete a main section (fails if used by listings)
 */
export async function deleteMainSection(mainSectionId: number): Promise<void> {
    const res = await fetch(`${API_BASE.replace('/api', '')}/api/admin/main-section/${mainSectionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل حذف القسم الرئيسي');
    }
}

/**
 * Delete a sub section (fails if used by listings)
 */
export async function deleteSubSection(subSectionId: number): Promise<void> {
    const res = await fetch(`${API_BASE.replace('/api', '')}/api/admin/sub-section/${subSectionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'فشل حذف القسم الفرعي');
    }
}
