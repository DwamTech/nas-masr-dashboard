'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import SharedListsSection from '@/components/filters-lists/SharedListsSection';
import CategoryCardsSection from '@/components/filters-lists/CategoryCardsSection';
import { useModalState } from '@/hooks/useModalState';
import { Category, CategoryField } from '@/types/filters-lists';
import { fetchCategories } from '@/services/categories';
import { fetchCategoryFields } from '@/services/categoryFields';

// Lazy load modals for code splitting
const RankModal = lazy(() => import('@/components/filters-lists/RankModal'));
const EditModal = lazy(() => import('@/components/filters-lists/EditModal'));
const SectionsRankModal = lazy(() => import('@/components/filters-lists/SectionsRankModal'));
const SectionsEditModal = lazy(() => import('@/components/filters-lists/SectionsEditModal'));

/**
 * Unified categories that use main_sections → sub_sections
 * instead of category_fields.
 */
const UNIFIED_CATEGORY_SLUGS = [
    'maintenance', 'car-services', 'home-services', 'lighting-decor',
    'animals', 'wholesale', 'production-lines', 'light-vehicles',
    'heavy-transport', 'tools', 'missing',
];

function isUnifiedCategory(slug: string): boolean {
    return UNIFIED_CATEGORY_SLUGS.includes(slug);
}

/**
 * Loading fallback for lazy-loaded modals
 * Displays a centered spinner while the modal is being loaded
 */
function ModalLoadingFallback() {
    return (
        <div className="modal-loading-overlay">
            <div className="modal-loading-spinner">
                <div className="spinner"></div>
                <p>جاري التحميل...</p>
            </div>
            <style jsx>{`
                .modal-loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal-loading-spinner {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f4f6;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                .modal-loading-spinner p {
                    margin: 0;
                    color: #4b5563;
                    font-size: 0.875rem;
                }
            `}</style>
        </div>
    );
}

/**
 * Filters and Lists Management Page
 * 
 * This page provides administrators with a centralized interface to manage
 * all application lists and field options, supporting both independent lists
 * (standalone options) and hierarchical lists (parent-child relationships).
 */
export default function FiltersListsPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const router = useRouter();
    const { modalState, openModal, closeModal } = useModalState();

    useEffect(() => {
        // Check authentication
        const authStatus = localStorage.getItem('isAuthenticated') === 'true';
        setIsAuthenticated(authStatus);

        if (!authStatus) {
            router.push('/auth/login');
        }
    }, [router]);

    // Load categories on mount
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await fetchCategories();
                setCategories(data);
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        };

        if (isAuthenticated) {
            loadCategories();
        }
    }, [isAuthenticated]);

    // Handle URL-based modal state restoration
    useEffect(() => {
        if (!modalState.category) return;

        const loadModalData = async () => {
            try {
                // Find the category
                const category = categories.find(c => c.slug === modalState.category);
                if (!category) return;

                setSelectedCategory(category);
            } catch (error) {
                console.error('Error loading modal data:', error);
            }
        };

        loadModalData();
    }, [modalState.category, categories]);

    /**
     * Handle rank button click from CategoryCard
     * Opens the rank modal for the selected category
     */
    const handleRankClick = (category: Category) => {
        setSelectedCategory(category);
        openModal('rank', category.slug, null);
    };

    /**
     * Handle edit button click from CategoryCard
     * Opens the edit modal for the selected category
     */
    const handleEditClick = (category: Category) => {
        setSelectedCategory(category);
        openModal('edit', category.slug, null);
    };

    /**
     * Handle modal close
     */
    const handleCloseModal = () => {
        closeModal();
        setSelectedCategory(null);
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="filters-lists-container">
            <div className="page-header">
                <h1 className="page-title">إدارة الفلاتر والقوائم</h1>
                <p className="page-subtitle">
                    إدارة مركزية لجميع القوائم وخيارات الحقول في التطبيق
                </p>
            </div>

            {/* Shared Lists Section — with rank/edit buttons */}
            <SharedListsSection
                onRankClick={handleRankClick}
                onEditClick={handleEditClick}
            />

            {/* Category Cards Section */}
            <CategoryCardsSection
                onRankClick={handleRankClick}
                onEditClick={handleEditClick}
            />

            {/* Field-based Rank Modal (real_estate, cars, jobs, etc.) */}
            {modalState.type === 'rank' && selectedCategory && !isUnifiedCategory(selectedCategory.slug) && (
                <Suspense fallback={<ModalLoadingFallback />}>
                    <RankModal
                        isOpen={true}
                        onClose={handleCloseModal}
                        category={selectedCategory}
                        parent={modalState.parent || undefined}
                    />
                </Suspense>
            )}

            {/* Sections-based Rank Modal (unified categories) */}
            {modalState.type === 'rank' && selectedCategory && isUnifiedCategory(selectedCategory.slug) && (
                <Suspense fallback={<ModalLoadingFallback />}>
                    <SectionsRankModal
                        isOpen={true}
                        onClose={handleCloseModal}
                        category={selectedCategory}
                    />
                </Suspense>
            )}

            {/* Field-based Edit Modal (real_estate, cars, jobs, etc.) */}
            {modalState.type === 'edit' && selectedCategory && !isUnifiedCategory(selectedCategory.slug) && (
                <Suspense fallback={<ModalLoadingFallback />}>
                    <EditModal
                        isOpen={true}
                        onClose={handleCloseModal}
                        category={selectedCategory}
                        parent={modalState.parent || undefined}
                    />
                </Suspense>
            )}

            {/* Sections-based Edit Modal (unified categories) */}
            {modalState.type === 'edit' && selectedCategory && isUnifiedCategory(selectedCategory.slug) && (
                <Suspense fallback={<ModalLoadingFallback />}>
                    <SectionsEditModal
                        isOpen={true}
                        onClose={handleCloseModal}
                        category={selectedCategory}
                    />
                </Suspense>
            )}

            <style jsx>{`
                .filters-lists-container {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .page-header {
                    margin-bottom: 2rem;
                }

                .page-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #1a202c;
                    margin-bottom: 0.5rem;
                }

                .page-subtitle {
                    font-size: 1rem;
                    color: #718096;
                }

                @media (max-width: 768px) {
                    .filters-lists-container {
                        padding: 1rem;
                    }

                    .page-title {
                        font-size: 1.5rem;
                    }

                    .page-subtitle {
                        font-size: 0.875rem;
                    }
                }
            `}</style>
        </div>
    );
}
