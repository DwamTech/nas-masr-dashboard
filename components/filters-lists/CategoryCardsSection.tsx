'use client';

import { useState, useEffect } from 'react';
import { Category, CategoryField } from '@/types/filters-lists';
import { fetchCategories } from '@/services/categories';
import { cache, CACHE_TIMES } from '@/utils/cache';
import CategoryCard from './CategoryCard';

interface CategoryCardsSectionProps {
    onRankClick: (category: Category, field: CategoryField) => void;
    onEditClick: (category: Category, field: CategoryField) => void;
}

/**
 * CategoryCardsSection Component
 * 
 * Displays category cards in a responsive grid layout:
 * - 1 column on mobile (max-width: 640px)
 * - 2 columns on tablet (641px - 1024px)
 * - 3-4 columns on desktop (min-width: 1025px)
 * 
 * Fetches categories from API and handles loading/error states.
 * 
 * Requirements: 3.2, 3.3, 3.4, 3.5, 11.1
 */
export default function CategoryCardsSection({
    onRankClick,
    onEditClick,
}: CategoryCardsSectionProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            setError(null);

            // Check cache first
            const cacheKey = 'categories:all';
            const cached = cache.get<Category[]>(cacheKey);

            if (cached) {
                setCategories(cached);
                setLoading(false);
                return;
            }

            // Fetch from API
            const data = await fetchCategories();

            // Filter only active categories
            const activeCategories = data.filter(cat => cat.is_active);

            // Cache the data
            cache.set(cacheKey, activeCategories, CACHE_TIMES.CATEGORIES);

            setCategories(activeCategories);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleRankClick = (field: CategoryField) => {
        const category = categories.find(cat => cat.slug === field.category_slug);
        if (category) {
            onRankClick(category, field);
        }
    };

    const handleEditClick = (field: CategoryField) => {
        const category = categories.find(cat => cat.slug === field.category_slug);
        if (category) {
            onEditClick(category, field);
        }
    };

    return (
        <div className="category-cards-section">
            <h2 className="section-title">إدارة الأقسام</h2>

            {loading && (
                <div className="loading-container" role="status" aria-live="polite">
                    <span className="sr-only">جاري تحميل الأقسام...</span>
                    {/* Skeleton loaders for cards */}
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="skeleton-card" aria-hidden="true">
                            <div className="skeleton-header">
                                <div className="skeleton-icon"></div>
                                <div className="skeleton-text-group">
                                    <div className="skeleton-line skeleton-title"></div>
                                    <div className="skeleton-line skeleton-badge"></div>
                                </div>
                            </div>
                            <div className="skeleton-buttons">
                                <div className="skeleton-button"></div>
                                <div className="skeleton-button"></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <div className="error-container" role="alert" aria-live="assertive">
                    <p className="error-message">{error}</p>
                    <button onClick={loadCategories} className="retry-button" aria-label="إعادة محاولة تحميل الأقسام">
                        إعادة المحاولة
                    </button>
                </div>
            )}

            {!loading && !error && categories.length === 0 && (
                <div className="empty-state" role="status">
                    <p className="empty-message">لا توجد أقسام متاحة</p>
                </div>
            )}

            {!loading && !error && categories.length > 0 && (
                <div className="categories-grid" role="list" aria-label="قائمة الأقسام">
                    {categories.map((category) => (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            onRankClick={handleRankClick}
                            onEditClick={handleEditClick}
                        />
                    ))}
                </div>
            )}

            <style jsx>{`
                .category-cards-section {
                    margin-bottom: 2rem;
                }

                .section-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #1a202c;
                    margin-bottom: 1.5rem;
                }

                .loading-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 1.5rem;
                }

                .skeleton-card {
                    background: white;
                    border-radius: 8px;
                    padding: 1.5rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .skeleton-header {
                    display: flex;
                    gap: 1rem;
                }

                .skeleton-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 6px;
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                    flex-shrink: 0;
                }

                .skeleton-text-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    flex: 1;
                }

                .skeleton-line {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                    border-radius: 4px;
                }

                .skeleton-title {
                    height: 20px;
                    width: 70%;
                }

                .skeleton-badge {
                    height: 16px;
                    width: 40%;
                }

                .skeleton-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    margin-top: auto;
                }

                .skeleton-button {
                    height: 36px;
                    border-radius: 6px;
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                }

                @keyframes loading {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }

                .error-container {
                    background: #fff5f5;
                    border: 1px solid #fc8181;
                    border-radius: 8px;
                    padding: 1.5rem;
                    text-align: center;
                }

                .error-message {
                    color: #c53030;
                    margin-bottom: 1rem;
                }

                .retry-button {
                    background: #3182ce;
                    color: white;
                    border: none;
                    padding: 0.5rem 1.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: background 0.2s;
                }

                .retry-button:hover {
                    background: #2c5aa0;
                }

                .empty-state {
                    background: #f7fafc;
                    border: 1px dashed #cbd5e0;
                    border-radius: 8px;
                    padding: 2rem;
                    text-align: center;
                }

                .empty-message {
                    color: #718096;
                    font-size: 1rem;
                }

                /* Responsive Grid Layout */
                .categories-grid {
                    display: grid;
                    gap: 1.5rem;
                }

                /* Mobile: 1 column */
                @media (max-width: 640px) {
                    .categories-grid {
                        grid-template-columns: 1fr;
                    }

                    .loading-container {
                        grid-template-columns: 1fr;
                    }
                }

                /* Tablet: 2 columns */
                @media (min-width: 641px) and (max-width: 1024px) {
                    .categories-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .loading-container {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                /* Desktop: 3-4 columns */
                @media (min-width: 1025px) {
                    .categories-grid {
                        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    }

                    .loading-container {
                        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    }
                }
            `}</style>
        </div>
    );
}
