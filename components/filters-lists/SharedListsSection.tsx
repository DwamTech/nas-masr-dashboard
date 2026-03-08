'use client';

import { useState, useEffect } from 'react';
import { fetchGovernorates } from '@/services/governorates';
import { Governorate } from '@/models/governorates';
import { cache, CACHE_TIMES } from '@/utils/cache';

/**
 * SharedListsSection Component
 * 
 * Displays shared lists that apply across all categories (e.g., Governorates and Cities).
 * Shows hierarchical list structure with parent count and child count.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 13.1, 13.2, 13.3
 */
export default function SharedListsSection() {
    const [governorates, setGovernorates] = useState<Governorate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadGovernorates();
    }, []);

    const loadGovernorates = async () => {
        try {
            setLoading(true);
            setError(null);

            // Check cache first
            const cacheKey = 'governorates:all';
            const cached = cache.get<Governorate[]>(cacheKey);

            if (cached) {
                setGovernorates(cached);
                setLoading(false);
                return;
            }

            // Fetch from API
            const data = await fetchGovernorates();

            // Cache the data
            cache.set(cacheKey, data, CACHE_TIMES.GOVERNORATES);

            setGovernorates(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    // Calculate total cities count
    const totalCitiesCount = governorates.reduce((sum, gov) => sum + (gov.cities?.length || 0), 0);

    return (
        <div className="shared-lists-section">
            <h2 className="section-title">القوائم المشتركة</h2>

            {loading && (
                <div className="loading-container" role="status" aria-live="polite">
                    <span className="sr-only">جاري تحميل القوائم المشتركة...</span>
                    {/* Skeleton loaders */}
                    <div className="skeleton-card" aria-hidden="true">
                        <div className="skeleton-line skeleton-title"></div>
                        <div className="skeleton-line skeleton-text"></div>
                    </div>
                </div>
            )}

            {error && (
                <div className="error-container" role="alert" aria-live="assertive">
                    <p className="error-message">{error}</p>
                    <button onClick={loadGovernorates} className="retry-button" aria-label="إعادة محاولة تحميل القوائم المشتركة">
                        إعادة المحاولة
                    </button>
                </div>
            )}

            {!loading && !error && (
                <div className="shared-lists-grid" role="list" aria-label="القوائم المشتركة">
                    {/* Governorates and Cities - Hierarchical List */}
                    <div className="list-card hierarchical" role="listitem">
                        <div className="list-header">
                            <h3 className="list-title">المحافظات والمدن</h3>
                            <span className="list-type-badge" aria-label="نوع القائمة: هرمية">قائمة هرمية</span>
                        </div>
                        <div className="list-content">
                            <div className="count-display" role="group" aria-label="إحصائيات المحافظات والمدن">
                                <div className="count-item parent">
                                    <span className="count-label">المحافظات</span>
                                    <span className="count-value" aria-label={`${governorates.length} محافظة`}>{governorates.length}</span>
                                </div>
                                <span className="count-separator" aria-hidden="true">←</span>
                                <div className="count-item child">
                                    <span className="count-label">المدن</span>
                                    <span className="count-value" aria-label={`${totalCitiesCount} مدينة`}>{totalCitiesCount}</span>
                                </div>
                            </div>
                            <p className="list-description">
                                قائمة المحافظات والمدن المستخدمة في جميع الأقسام
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .shared-lists-section {
                    margin-bottom: 2rem;
                }

                .section-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #1a202c;
                    margin-bottom: 1.5rem;
                }

                .loading-container {
                    display: flex;
                    gap: 1rem;
                }

                .skeleton-card {
                    background: white;
                    border-radius: 8px;
                    padding: 1.5rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    width: 100%;
                    max-width: 400px;
                }

                .skeleton-line {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                    border-radius: 4px;
                }

                .skeleton-title {
                    height: 24px;
                    width: 60%;
                    margin-bottom: 1rem;
                }

                .skeleton-text {
                    height: 16px;
                    width: 80%;
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

                .shared-lists-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 1.5rem;
                }

                .list-card {
                    background: white;
                    border-radius: 8px;
                    padding: 1.5rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    transition: box-shadow 0.2s;
                }

                .list-card:hover {
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .list-card.hierarchical {
                    border-right: 4px solid #805ad5;
                }

                .list-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .list-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #2d3748;
                }

                .list-type-badge {
                    background: #e9d8fd;
                    color: #553c9a;
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .list-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .count-display {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: #f7fafc;
                    border-radius: 6px;
                }

                .count-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                }

                .count-item.parent {
                    flex: 1;
                }

                .count-item.child {
                    flex: 1;
                }

                .count-label {
                    font-size: 0.875rem;
                    color: #718096;
                }

                .count-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #2d3748;
                }

                .count-separator {
                    font-size: 1.5rem;
                    color: #cbd5e0;
                    font-weight: 300;
                }

                .list-description {
                    font-size: 0.875rem;
                    color: #718096;
                    line-height: 1.5;
                }

                @media (max-width: 640px) {
                    .shared-lists-grid {
                        grid-template-columns: 1fr;
                    }

                    .count-display {
                        flex-direction: column;
                        gap: 0.5rem;
                    }

                    .count-separator {
                        transform: rotate(90deg);
                    }
                }
            `}</style>
        </div>
    );
}
