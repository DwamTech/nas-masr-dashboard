'use client';

import { useCallback, useState } from 'react';
import { Category, CategoryField } from '@/types/filters-lists';
import { fetchCategoryFields } from '@/services/categoryFields';
import { fetchGovernorates } from '@/services/governorates';
import { cache, CACHE_TIMES } from '@/utils/cache';

interface CategoryCardProps {
    category: Category;
    onRankClick: (category: Category) => void;
    onEditClick: (category: Category) => void;
}

/**
 * CategoryCard Component
 * 
 * Displays a single category with:
 * - Category icon and name
 * - Field count badge
 * - "ترتيب الاختيارات" (Rank Options) button
 * - "اضافة/تعديل الاختيارات" (Add/Edit Options) button
 * - Hover effects with prefetching
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 11.1, 14.14
 */
export default function CategoryCard({
    category,
    onRankClick,
    onEditClick,
}: CategoryCardProps) {
    const [fieldCount, setFieldCount] = useState<number | null>(null);
    const [isPrefetching, setIsPrefetching] = useState(false);
    const [prefetchedParents, setPrefetchedParents] = useState(false);

    /**
     * Detect if a field is hierarchical
     */
    const isHierarchicalField = useCallback((fieldName: string): boolean => {
        const fieldNameLower = fieldName.toLowerCase();
        const hierarchicalPatterns = ['governorate', 'city', 'brand', 'model', 'main_section', 'sub_section'];
        return hierarchicalPatterns.some(pattern => fieldNameLower.includes(pattern));
    }, []);

    /**
     * Prefetch parent options for hierarchical fields
     * This improves perceived performance when opening hierarchical modals
     * Requirement: 14.14
     */
    const prefetchParentOptions = useCallback(async () => {
        if (prefetchedParents) return; // Already prefetched

        try {
            // Check if we have category fields cached
            const cacheKey = `fields:${category.slug}`;
            let response = cache.get(cacheKey);

            if (!response) {
                // Fields not cached yet, fetch them
                response = await fetchCategoryFields(category.slug);
                cache.set(cacheKey, response, CACHE_TIMES.CATEGORY_FIELDS);
            }

            // Check if any field is hierarchical
            const hasHierarchicalFields = response?.data?.some((field: CategoryField) =>
                isHierarchicalField(field.field_name)
            );

            if (!hasHierarchicalFields) {
                setPrefetchedParents(true);
                return;
            }

            // Prefetch governorates (most common hierarchical parent)
            const governoratesCacheKey = 'governorates';
            const cachedGovernorates = cache.get(governoratesCacheKey);

            if (!cachedGovernorates) {
                const governorates = await fetchGovernorates();
                cache.set(governoratesCacheKey, governorates, CACHE_TIMES.GOVERNORATES);
            }

            // Prefetch brands if category supports make/model
            if (response.makes && response.makes.length > 0) {
                const makesCacheKey = `makes:${category.slug}`;
                cache.set(makesCacheKey, response.makes, CACHE_TIMES.CATEGORY_FIELDS);
            }

            setPrefetchedParents(true);
        } catch (error) {
            console.error('Failed to prefetch parent options:', error);
            // Don't set prefetchedParents to true on error, allow retry
        }
    }, [category.slug, prefetchedParents, isHierarchicalField]);

    /**
     * Prefetch category fields on hover
     * This improves perceived performance when opening modals
     * Requirement: 14.14
     */
    const handleMouseEnter = useCallback(async () => {
        if (fieldCount !== null) return; // Already fetched

        setIsPrefetching(true);
        try {
            const cacheKey = `fields:${category.slug}`;
            const cached = cache.get(cacheKey);

            if (cached) {
                setFieldCount(cached.data?.length || 0);
                setIsPrefetching(false);
                return;
            }

            // Prefetch from API
            const response = await fetchCategoryFields(category.slug);
            cache.set(cacheKey, response, CACHE_TIMES.CATEGORY_FIELDS);
            setFieldCount(response.data?.length || 0);
        } catch (error) {
            console.error('Failed to prefetch category fields:', error);
        } finally {
            setIsPrefetching(false);
        }
    }, [category.slug, fieldCount]);

    /**
     * Handle rank button click
     * Opens the rank modal for the entire category (all fields)
     */
    const handleRankClick = useCallback(() => {
        onRankClick(category);
    }, [category, onRankClick]);

    /**
     * Handle rank button hover
     * Prefetch parent options for hierarchical fields
     * Requirement: 14.14
     */
    const handleRankButtonHover = useCallback(() => {
        prefetchParentOptions();
    }, [prefetchParentOptions]);

    /**
     * Handle edit button click
     * Opens the edit modal for the entire category (all fields)
     */
    const handleEditClick = useCallback(() => {
        onEditClick(category);
    }, [category, onEditClick]);

    /**
     * Handle edit button hover
     * Prefetch parent options for hierarchical fields
     * Requirement: 14.14
     */
    const handleEditButtonHover = useCallback(() => {
        prefetchParentOptions();
    }, [prefetchParentOptions]);

    return (
        <div
            className="category-card"
            onMouseEnter={handleMouseEnter}
        >
            {/* Card Header with Icon and Name */}
            <div className="card-header">
                {category.icon_url && (
                    <img
                        src={category.icon_url}
                        alt={`أيقونة ${category.name}`}
                        className="category-icon"
                    />
                )}
                <div className="category-info">
                    <h3 className="category-name">{category.name}</h3>
                    {fieldCount !== null && (
                        <span className="field-count-badge" aria-label={`${fieldCount} حقل متاح`}>
                            {fieldCount} حقل
                        </span>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="card-actions" role="group" aria-label={`إجراءات ${category.name}`}>
                <button
                    onClick={handleRankClick}
                    onMouseEnter={handleRankButtonHover}
                    className="action-button rank-button"
                    title="ترتيب الاختيارات"
                    aria-label={`ترتيب اختيارات ${category.name}`}
                >
                    <span aria-hidden="true">📊</span> ترتيب الاختيارات
                </button>
                <button
                    onClick={handleEditClick}
                    onMouseEnter={handleEditButtonHover}
                    className="action-button edit-button"
                    title="اضافة/تعديل الاختيارات"
                    aria-label={`اضافة أو تعديل اختيارات ${category.name}`}
                >
                    <span aria-hidden="true">✏️</span> اضافة/تعديل الاختيارات
                </button>
            </div>

            <style jsx>{`
                .category-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    height: 100%;
                    position: relative;
                    overflow: hidden;
                }

                /* Subtle gradient overlay on hover */
                .category-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, transparent 100%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                }

                .category-card:hover {
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                    transform: translateY(-4px);
                }

                .category-card:hover::before {
                    opacity: 1;
                }

                .card-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                }

                .category-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 6px;
                    object-fit: cover;
                    flex-shrink: 0;
                }

                .category-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    flex: 1;
                }

                .category-name {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #2d3748;
                    margin: 0;
                    line-height: 1.4;
                }

                .field-count-badge {
                    display: inline-block;
                    background: #edf2f7;
                    color: #2d3748;
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    width: fit-content;
                }

                .card-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    margin-top: auto;
                }

                .action-button {
                    padding: 0.75rem 1rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    text-align: center;
                    white-space: nowrap;
                    /* Ensure minimum 44x44px touch target (Requirement 4.18, 11.3) */
                    min-height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    position: relative;
                    overflow: hidden;
                }

                /* Ripple effect on click */
                .action-button::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .action-button:active::after {
                    opacity: 1;
                }

                .rank-button {
                    background: linear-gradient(135deg, #3182ce 0%, #2c5aa0 100%);
                    color: white;
                    box-shadow: 0 2px 4px rgba(49, 130, 206, 0.2);
                }

                .rank-button:hover {
                    background: linear-gradient(135deg, #2c5aa0 0%, #2563a8 100%);
                    box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
                    transform: translateY(-2px);
                }

                .rank-button:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 4px rgba(49, 130, 206, 0.2);
                }

                /* Touch feedback for mobile devices (Requirement 4.18, 11.3) */
                .action-button:active {
                    transform: scale(0.98);
                    opacity: 0.9;
                }

                .edit-button {
                    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                    color: white;
                    box-shadow: 0 2px 4px rgba(72, 187, 120, 0.2);
                }

                .edit-button:hover {
                    background: linear-gradient(135deg, #38a169 0%, #2f8f5a 100%);
                    box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
                    transform: translateY(-2px);
                }

                .edit-button:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 4px rgba(72, 187, 120, 0.2);
                }

                /* Responsive Grid Layout */
                @media (max-width: 640px) {
                    .category-card {
                        padding: 1rem;
                    }

                    .action-button {
                        /* Ensure larger touch targets on mobile (Requirement 4.18, 11.3) */
                        padding: 0.875rem 1rem;
                        font-size: 0.875rem;
                        min-height: 48px;
                    }
                }

                /* Touch device specific styles (Requirement 4.18, 11.3) */
                @media (hover: none) and (pointer: coarse) {
                    .action-button {
                        min-height: 48px;
                        padding: 0.875rem 1rem;
                    }
                    
                    /* Enhanced visual feedback for touch */
                    .action-button:active {
                        background: rgba(0, 0, 0, 0.1);
                    }
                    
                    .rank-button:active {
                        background: #2563a8;
                    }
                    
                    .edit-button:active {
                        background: #2f8f5a;
                    }
                }

                @media (min-width: 641px) and (max-width: 1024px) {
                    .category-card {
                        padding: 1.25rem;
                    }
                }

                @media (min-width: 1025px) {
                    .category-card {
                        padding: 1.5rem;
                    }
                }
            `}</style>
        </div>
    );
}
