'use client';

import { useState, useEffect } from 'react';
import { UnifiedImagesTable } from './components/UnifiedImagesTable';
import { ImageUploadModal } from './components/ImageUploadModal';
import { fetchAdminCategories, toggleCategoryGlobalImage } from '@/services/makes';
import type { AdminCategoryListItem } from '@/models/makes';
import { escapeHtml } from '@/utils/sanitize';
import styles from './page.module.css';

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
            // Sanitize error message to prevent XSS
            const errorMsg = err instanceof Error ? escapeHtml(err.message) : 'فشل تحميل الأقسام';
            setError(errorMsg);
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
            // Sanitize error message to prevent XSS
            const errorMsg = err instanceof Error ? escapeHtml(err.message) : 'فشل تحديث حالة الصورة الموحدة';
            setError(errorMsg);
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
        <div className={styles.container}>
            <h1 className={styles.title}>إدارة صور الأقسام الموحدة</h1>

            {/* Success Message */}
            {successMessage && (
                <div className={`${styles.messageBox} ${styles.successMessage}`}>
                    <p>{successMessage}</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className={`${styles.messageBox} ${styles.errorMessage}`}>
                    {/* Using dangerouslySetInnerHTML with sanitized content */}
                    <p dangerouslySetInnerHTML={{ __html: error }} />
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p className={styles.loadingText}>جاري التحميل...</p>
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
