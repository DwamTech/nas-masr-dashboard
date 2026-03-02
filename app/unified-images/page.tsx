'use client';

import { useState, useEffect } from 'react';
import { UnifiedImagesTable } from './components/UnifiedImagesTable';
import { ImageUploadModal } from './components/ImageUploadModal';
import { fetchAdminCategories, toggleCategoryGlobalImage } from '@/services/makes';
import type { AdminCategoryListItem } from '@/models/makes';

export default function UnifiedImagesPage() {
    const [categories, setCategories] = useState<AdminCategoryListItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<AdminCategoryListItem | null>(
        null
    );
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        loadCategories();
    }, []);

    // Auto-dismiss success messages after 3 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Auto-dismiss error messages after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const loadCategories = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchAdminCategories();
            setCategories(data);
        } catch (err) {
            console.error('Failed to load categories:', err);
            setError('فشل تحميل الأقسام');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (categoryId: number, isActive: boolean) => {
        // Optimistic UI Update: Update state immediately for better UX
        const previousCategories = [...categories];

        setCategories((prevCategories) =>
            prevCategories.map((cat) =>
                cat.id === categoryId
                    ? { ...cat, is_global_image_active: isActive }
                    : cat
            )
        );

        try {
            await toggleCategoryGlobalImage(categoryId, isActive);
            setSuccessMessage('تم تحديث حالة الصورة الموحدة بنجاح');
            setError(null);
        } catch (err) {
            // Rollback on error: Revert to previous state
            setCategories(previousCategories);
            console.error('Failed to toggle:', err);
            setError('فشل تحديث حالة الصورة الموحدة');
        }
    };

    const handleUploadClick = (category: AdminCategoryListItem) => {
        setSelectedCategory(category);
        setShowUploadModal(true);
    };

    const handleUploadSuccess = (updatedCategory: AdminCategoryListItem) => {
        // Performance Optimization: Update only the specific category in state
        // instead of re-fetching all categories from the database
        setCategories((prevCategories) =>
            prevCategories.map((cat) =>
                cat.id === updatedCategory.id
                    ? {
                        ...cat,
                        global_image_url: updatedCategory.global_image_url,
                        global_image_full_url: updatedCategory.global_image_full_url,
                        is_global_image_active: updatedCategory.is_global_image_active,
                    }
                    : cat
            )
        );

        setShowUploadModal(false);
        setSuccessMessage('تم رفع الصورة بنجاح');
        setError(null);
    };

    const handleModalClose = () => {
        setShowUploadModal(false);
        setSelectedCategory(null);
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">إدارة صور الأقسام الموحدة</h1>

            {/* Success Message */}
            {successMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-600">{successMessage}</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="mt-2 text-gray-600">جاري التحميل...</p>
                </div>
            ) : (
                <UnifiedImagesTable
                    categories={categories}
                    onToggle={handleToggle}
                    onUploadClick={handleUploadClick}
                />
            )}

            {/* Upload Modal */}
            {showUploadModal && selectedCategory && (
                <ImageUploadModal
                    category={selectedCategory}
                    onClose={handleModalClose}
                    onSuccess={handleUploadSuccess}
                />
            )}
        </div>
    );
}
