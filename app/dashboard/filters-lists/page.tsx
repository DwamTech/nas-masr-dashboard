'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SharedListsSection from '@/components/filters-lists/SharedListsSection';
import CategoryCardsSection from '@/components/filters-lists/CategoryCardsSection';
import RankModal from '@/components/filters-lists/RankModal';
import EditModal from '@/components/filters-lists/EditModal';
import SectionsRankModal from '@/components/filters-lists/SectionsRankModal';
import SectionsEditModal from '@/components/filters-lists/SectionsEditModal';
import GovernorateRankModal from '@/components/filters-lists/GovernorateRankModal';
import GovernorateEditModal from '@/components/filters-lists/GovernorateEditModal';
import {
    AUTOMOTIVE_SHARED_MODAL_TITLE,
    getModalFieldScope,
    isAutomotiveSharedFieldName,
} from '@/components/filters-lists/automotiveShared';
import { prefetchCategoryFields } from '@/services/categoryFields';
import { prefetchGovernorates } from '@/services/governorates';
import { prefetchAllGovernorates } from '@/services/governorates-admin';
import { prefetchAdminMakesWithIds } from '@/services/makes';
import { prefetchMainSections } from '@/services/sections';
import { Category } from '@/types/filters-lists';

/**
 * Categories that use category_fields. All other categories
 * are assumed to be unified categories (main_sections → sub_sections).
 */
const FIELD_BASED_CATEGORY_SLUGS = [
    'real_estate', 'cars', 'cars_rent', 'spare-parts',
    'jobs', 'teachers', 'doctors'
];

function isUnifiedCategory(slug: string): boolean {
    return !FIELD_BASED_CATEGORY_SLUGS.includes(slug) && slug !== 'shared_governorates';
}

function isGovernorateSlug(slug: string): boolean {
    return slug === 'shared_governorates';
}

function isAutomotiveCategory(slug: string): boolean {
    return slug === 'cars' || slug === 'cars_rent' || slug === 'spare-parts';
}

/**
 * Loading fallback for lazy-loaded modals
 * Displays a centered spinner while the modal is being loaded
 */
/**
 * Filters and Lists Management Page
 * 
 * This page provides administrators with a centralized interface to manage
 * all application lists and field options, supporting both independent lists
 * (standalone options) and hierarchical lists (parent-child relationships).
 */
export default function FiltersListsPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedModalType, setSelectedModalType] = useState<'rank' | 'edit' | null>(null);
    const [selectedFieldName, setSelectedFieldName] = useState<string | null>(null);
    const router = useRouter();
    const modalTitleOverride = selectedCategory?.slug === 'cars' && selectedFieldName && isAutomotiveSharedFieldName(selectedFieldName)
        ? AUTOMOTIVE_SHARED_MODAL_TITLE
        : undefined;

    const prefetchModalData = (category: Category, fieldName?: string) => {
        if (isGovernorateSlug(category.slug)) {
            void prefetchAllGovernorates();
            return;
        }

        if (isUnifiedCategory(category.slug)) {
            void prefetchMainSections(category.slug, { includeInactive: true });
            return;
        }

        void prefetchCategoryFields(category.slug, undefined, { includeHidden: true });
        void prefetchGovernorates();

        if (isAutomotiveCategory(category.slug) || (fieldName && isAutomotiveSharedFieldName(fieldName))) {
            void prefetchAdminMakesWithIds(undefined, { includeInactive: true });
        }
    };

    useEffect(() => {
        // Check authentication
        const authStatus = localStorage.getItem('isAuthenticated') === 'true';
        setIsAuthenticated(authStatus);

        if (!authStatus) {
            router.push('/auth/login');
        }
    }, [router]);

    /**
     * Handle rank button click from CategoryCard
     * Opens the rank modal for the selected category
     */
    const handleRankClick = (category: Category, fieldName?: string) => {
        prefetchModalData(category, fieldName);
        setSelectedCategory(category);
        setSelectedFieldName(fieldName ?? null);
        setSelectedModalType('rank');
    };

    /**
     * Handle edit button click from CategoryCard
     * Opens the edit modal for the selected category
     */
    const handleEditClick = (category: Category, fieldName?: string) => {
        prefetchModalData(category, fieldName);
        setSelectedCategory(category);
        setSelectedFieldName(fieldName ?? null);
        setSelectedModalType('edit');
    };

    /**
     * Handle modal close
     */
    const handleCloseModal = () => {
        setSelectedModalType(null);
        setSelectedCategory(null);
        setSelectedFieldName(null);
    };

    if (!isAuthenticated) {
        return null;
    }

    const fieldScope = selectedCategory
        ? getModalFieldScope(selectedCategory.slug, selectedFieldName)
        : 'all';
    const initialFieldName = selectedFieldName || undefined;

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
            {selectedModalType === 'rank' && selectedCategory && !isUnifiedCategory(selectedCategory.slug) && !isGovernorateSlug(selectedCategory.slug) && (
                <RankModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    category={selectedCategory}
                    initialFieldName={initialFieldName}
                    fieldScope={fieldScope}
                    titleOverride={modalTitleOverride}
                />
            )}

            {/* Sections-based Rank Modal (unified categories) */}
            {selectedModalType === 'rank' && selectedCategory && isUnifiedCategory(selectedCategory.slug) && (
                <SectionsRankModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    category={selectedCategory}
                />
            )}

            {/* Governorate Rank Modal */}
            {selectedModalType === 'rank' && selectedCategory && isGovernorateSlug(selectedCategory.slug) && (
                <GovernorateRankModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    category={selectedCategory}
                />
            )}

            {/* Field-based Edit Modal (real_estate, cars, jobs, etc.) */}
            {selectedModalType === 'edit' && selectedCategory && !isUnifiedCategory(selectedCategory.slug) && !isGovernorateSlug(selectedCategory.slug) && (
                <EditModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    category={selectedCategory}
                    initialFieldName={initialFieldName}
                    fieldScope={fieldScope}
                    titleOverride={modalTitleOverride}
                />
            )}

            {/* Sections-based Edit Modal (unified categories) */}
            {selectedModalType === 'edit' && selectedCategory && isUnifiedCategory(selectedCategory.slug) && (
                <SectionsEditModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    category={selectedCategory}
                />
            )}

            {/* Governorate Edit Modal */}
            {selectedModalType === 'edit' && selectedCategory && isGovernorateSlug(selectedCategory.slug) && (
                <GovernorateEditModal
                    isOpen={true}
                    onClose={handleCloseModal}
                />
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
