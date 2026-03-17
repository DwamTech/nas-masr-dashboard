'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchGovernorates } from '@/services/governorates';
import { fetchAdminMakesWithIds } from '@/services/makes';
import { Governorate } from '@/models/governorates';
import { cache, CACHE_TIMES } from '@/utils/cache';
import { Category } from '@/types/filters-lists';
import { AUTOMOTIVE_SHARED_MODAL_TITLE } from './automotiveShared';
import { FILTERS_LISTS_DATA_CHANGED_EVENT } from './events';

interface SharedListsSectionProps {
    onRankClick?: (category: Category, fieldName?: string) => void;
    onEditClick?: (category: Category, fieldName?: string) => void;
}

/**
 * SharedListsSection Component
 * 
 * Displays shared lists that apply across all categories (e.g., Governorates and Cities).
 * Shows hierarchical list structure with parent count and child count.
 * Now includes rank/edit buttons for managing governorate and city data.
 */
export default function SharedListsSection({ onRankClick, onEditClick }: SharedListsSectionProps) {
    const [governorates, setGovernorates] = useState<Governorate[]>([]);
    const [automotiveCounts, setAutomotiveCounts] = useState({ makes: 0, models: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadGovernorates = useCallback(async (forceFresh = false) => {
        try {
            setLoading(true);
            setError(null);

            const governoratesCacheKey = 'governorates:all';
            const automotiveCacheKey = 'shared:automotive-makes';
            const cachedGovernorates = forceFresh ? null : cache.get<Governorate[]>(governoratesCacheKey);
            const cachedMakes = forceFresh ? null : cache.get<{ id: number; name: string; models: string[] }[]>(automotiveCacheKey);

            const [governoratesData, makesData] = await Promise.all([
                cachedGovernorates ?? fetchGovernorates(),
                cachedMakes ?? fetchAdminMakesWithIds(),
            ]);

            if (!cachedGovernorates) {
                cache.set(governoratesCacheKey, governoratesData, CACHE_TIMES.GOVERNORATES);
            }

            if (!cachedMakes) {
                cache.set(automotiveCacheKey, makesData, CACHE_TIMES.GOVERNORATES);
            }

            setGovernorates(governoratesData);
            setAutomotiveCounts({
                makes: makesData.length,
                models: makesData.reduce((sum, make) => sum + make.models.length, 0),
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل البيانات');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadGovernorates();

        const handleSharedListsDataChanged = (event: Event) => {
            const scope = (event as CustomEvent<{ scope?: string }>).detail?.scope;
            if (!scope || scope === 'all' || scope === 'automotive' || scope === 'governorates') {
                void loadGovernorates(true);
            }
        };

        window.addEventListener(FILTERS_LISTS_DATA_CHANGED_EVENT, handleSharedListsDataChanged as EventListener);
        return () => {
            window.removeEventListener(FILTERS_LISTS_DATA_CHANGED_EVENT, handleSharedListsDataChanged as EventListener);
        };
    }, [loadGovernorates]);

    // Calculate total cities count
    const totalCitiesCount = governorates.reduce((sum, gov) => sum + (gov.cities?.length || 0), 0);
    const sharedAutomotiveCategory: Category = {
        id: 0,
        slug: 'cars',
        name: AUTOMOTIVE_SHARED_MODAL_TITLE,
        is_active: true,
        created_at: '',
        updated_at: '',
    };

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
                    <div className="list-card hierarchical automotive-shared" role="listitem">
                        <div className="list-header">
                            <h3 className="list-title">الماركات والموديلات</h3>
                            <span className="list-type-badge" aria-label="نوع القائمة: مشتركة بين عدة أقسام">مشتركة</span>
                        </div>
                        <div className="list-content">
                            <div className="count-display" role="group" aria-label="إحصائيات الماركات والموديلات">
                                <div className="count-item parent">
                                    <span className="count-label">الماركات</span>
                                    <span className="count-value" aria-label={`${automotiveCounts.makes} ماركة`}>
                                        {automotiveCounts.makes}
                                    </span>
                                </div>
                                <span className="count-separator" aria-hidden="true">←</span>
                                <div className="count-item child">
                                    <span className="count-label">الموديلات</span>
                                    <span className="count-value" aria-label={`${automotiveCounts.models} موديل`}>
                                        {automotiveCounts.models}
                                    </span>
                                </div>
                            </div>
                            <p className="list-description">
                                مصدر موحد للمركبات يظهر بنفس الترتيب في السيارات، إيجار السيارات، وقطع الغيار.
                            </p>
                            <div className="list-meta">
                                <span className="list-chip">السيارات</span>
                                <span className="list-chip">إيجار السيارات</span>
                                <span className="list-chip">قطع الغيار</span>
                            </div>
                            <div className="card-actions">
                                <button
                                    className="action-button rank-button"
                                    onClick={() => onRankClick?.(sharedAutomotiveCategory, 'brand')}
                                    aria-label="ترتيب الماركات والموديلات المشتركة"
                                >
                                    📊 ترتيب الاختيارات
                                </button>
                                <button
                                    className="action-button edit-button"
                                    onClick={() => onEditClick?.(sharedAutomotiveCategory, 'brand')}
                                    aria-label="إضافة أو تعديل الماركات والموديلات المشتركة"
                                >
                                    ✏️ اضافة/تعديل الاختيارات
                                </button>
                            </div>
                        </div>
                    </div>

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
                            {/* Action Buttons */}
                            <div className="card-actions">
                                <button
                                    className="action-button rank-button"
                                    onClick={() => onRankClick?.({
                                        id: 0, slug: 'shared_governorates', name: 'المحافظات والمدن',
                                        is_active: true, created_at: '', updated_at: '',
                                    })}
                                    aria-label="ترتيب اختيارات المحافظات والمدن"
                                >
                                    📊 ترتيب الاختيارات
                                </button>
                                <button
                                    className="action-button edit-button"
                                    onClick={() => onEditClick?.({
                                        id: 0, slug: 'shared_governorates', name: 'المحافظات والمدن',
                                        is_active: true, created_at: '', updated_at: '',
                                    })}
                                    aria-label="اضافة/تعديل المحافظات والمدن"
                                >
                                    ✏️ اضافة/تعديل الاختيارات
                                </button>
                            </div>
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

                .list-card.automotive-shared {
                    border-right-color: #0f766e;
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

                .list-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .list-chip {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.35rem 0.75rem;
                    border-radius: 999px;
                    background: #f0fdfa;
                    color: #0f766e;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .card-actions {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 0.5rem;
                }

                .action-button {
                    flex: 1;
                    padding: 0.625rem 1rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: center;
                }

                .rank-button {
                    background: #3b82f6;
                    color: white;
                }

                .rank-button:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
                }

                .edit-button {
                    background: #ef4444;
                    color: white;
                }

                .edit-button:hover {
                    background: #dc2626;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
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

                    .card-actions {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
}
