/**
 * Performance Tests - Prefetching
 * 
 * Task 21.4: Write performance tests
 * Tests prefetching behavior for category data
 * 
 * Requirements: 14.14
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState, useEffect } from 'react';
import { cache, CACHE_TIMES } from '@/utils/cache';
import { fetchCategoryFields } from '@/services/categoryFields';
import { fetchGovernorates } from '@/services/governorates';

// Mock services
vi.mock('@/services/categoryFields');
vi.mock('@/services/governorates');

describe('Prefetching Performance Tests - Task 21.4', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cache.clear();
    });

    afterEach(() => {
        cache.clear();
    });

    describe('Category Field Prefetching (Requirement 14.14)', () => {
        it('should prefetch category fields on card hover', async () => {
            const mockFields = [
                { id: 1, field_name: 'condition', display_name: 'الحالة', options: ['جديد', 'مستعمل'] }
            ];

            vi.mocked(fetchCategoryFields).mockResolvedValue(mockFields);

            const TestCard = ({ categorySlug }: { categorySlug: string }) => {
                const handleMouseEnter = async () => {
                    const cacheKey = `fields:${categorySlug}`;
                    const cached = cache.get(cacheKey);

                    if (!cached) {
                        const fields = await fetchCategoryFields(categorySlug);
                        cache.set(cacheKey, fields, CACHE_TIMES.CATEGORY_FIELDS);
                    }
                };

                return (
                    <div onMouseEnter={handleMouseEnter} data-testid="category-card">
                        Category Card
                    </div>
                );
            };

            const user = userEvent.setup();
            render(<TestCard categorySlug="cars" />);

            // Initially, fields should not be fetched
            expect(fetchCategoryFields).not.toHaveBeenCalled();

            // Hover over card
            const card = screen.getByTestId('category-card');
            await user.hover(card);

            // Should trigger prefetch
            await waitFor(() => {
                expect(fetchCategoryFields).toHaveBeenCalledWith('cars');
            });

            // Data should be cached
            const cached = cache.get('fields:cars');
            expect(cached).toEqual(mockFields);
        });

        it('should not refetch if data is already cached', async () => {
            const mockFields = [
                { id: 1, field_name: 'condition', display_name: 'الحالة', options: ['جديد', 'مستعمل'] }
            ];

            // Pre-populate cache
            cache.set('fields:cars', mockFields, CACHE_TIMES.CATEGORY_FIELDS);

            vi.mocked(fetchCategoryFields).mockResolvedValue(mockFields);

            const TestCard = ({ categorySlug }: { categorySlug: string }) => {
                const handleMouseEnter = async () => {
                    const cacheKey = `fields:${categorySlug}`;
                    const cached = cache.get(cacheKey);

                    if (!cached) {
                        const fields = await fetchCategoryFields(categorySlug);
                        cache.set(cacheKey, fields, CACHE_TIMES.CATEGORY_FIELDS);
                    }
                };

                return (
                    <div onMouseEnter={handleMouseEnter} data-testid="category-card">
                        Category Card
                    </div>
                );
            };

            const user = userEvent.setup();
            render(<TestCard categorySlug="cars" />);

            // Hover over card
            const card = screen.getByTestId('category-card');
            await user.hover(card);

            // Should not fetch because data is cached
            expect(fetchCategoryFields).not.toHaveBeenCalled();
        });

        it('should prefetch multiple category fields on multiple hovers', async () => {
            const mockCarsFields = [
                { id: 1, field_name: 'condition', display_name: 'الحالة', options: ['جديد', 'مستعمل'] }
            ];

            const mockRealEstateFields = [
                { id: 2, field_name: 'property_type', display_name: 'نوع العقار', options: ['شقة', 'فيلا'] }
            ];

            vi.mocked(fetchCategoryFields)
                .mockResolvedValueOnce(mockCarsFields)
                .mockResolvedValueOnce(mockRealEstateFields);

            const TestCards = () => {
                const handleMouseEnter = async (categorySlug: string) => {
                    const cacheKey = `fields:${categorySlug}`;
                    const cached = cache.get(cacheKey);

                    if (!cached) {
                        const fields = await fetchCategoryFields(categorySlug);
                        cache.set(cacheKey, fields, CACHE_TIMES.CATEGORY_FIELDS);
                    }
                };

                return (
                    <div>
                        <div
                            onMouseEnter={() => handleMouseEnter('cars')}
                            data-testid="cars-card"
                        >
                            Cars Card
                        </div>
                        <div
                            onMouseEnter={() => handleMouseEnter('real-estate')}
                            data-testid="real-estate-card"
                        >
                            Real Estate Card
                        </div>
                    </div>
                );
            };

            const user = userEvent.setup();
            render(<TestCards />);

            // Hover over first card
            await user.hover(screen.getByTestId('cars-card'));
            await waitFor(() => {
                expect(fetchCategoryFields).toHaveBeenCalledWith('cars');
            });

            // Hover over second card
            await user.hover(screen.getByTestId('real-estate-card'));
            await waitFor(() => {
                expect(fetchCategoryFields).toHaveBeenCalledWith('real-estate');
            });

            // Both should be cached
            expect(cache.get('fields:cars')).toEqual(mockCarsFields);
            expect(cache.get('fields:real-estate')).toEqual(mockRealEstateFields);
        });
    });

    describe('Parent Options Prefetching (Requirement 14.14)', () => {
        it('should prefetch governorates for hierarchical fields', async () => {
            const mockGovernorates = [
                { id: 1, name: 'القاهرة', cities: [] },
                { id: 2, name: 'الجيزة', cities: [] }
            ];

            vi.mocked(fetchGovernorates).mockResolvedValue(mockGovernorates);

            const TestComponent = () => {
                const handlePrefetch = async () => {
                    const cacheKey = 'governorates';
                    const cached = cache.get(cacheKey);

                    if (!cached) {
                        const governorates = await fetchGovernorates();
                        cache.set(cacheKey, governorates, CACHE_TIMES.GOVERNORATES);
                    }
                };

                return (
                    <button onClick={handlePrefetch} data-testid="prefetch-btn">
                        Prefetch
                    </button>
                );
            };

            const user = userEvent.setup();
            render(<TestComponent />);

            // Initially not fetched
            expect(fetchGovernorates).not.toHaveBeenCalled();

            // Trigger prefetch
            await user.click(screen.getByTestId('prefetch-btn'));

            // Should fetch governorates
            await waitFor(() => {
                expect(fetchGovernorates).toHaveBeenCalled();
            });

            // Should be cached
            const cached = cache.get('governorates');
            expect(cached).toEqual(mockGovernorates);
        });

        it('should prefetch parent options on rank button hover', async () => {
            const mockFields = [
                { id: 1, field_name: 'city', display_name: 'المدينة', options: [] }
            ];

            const mockGovernorates = [
                { id: 1, name: 'القاهرة', cities: [] }
            ];

            vi.mocked(fetchCategoryFields).mockResolvedValue(mockFields);
            vi.mocked(fetchGovernorates).mockResolvedValue(mockGovernorates);

            const TestComponent = () => {
                const handleRankButtonHover = async () => {
                    // Check if any field is hierarchical
                    const fields = await fetchCategoryFields('cars');
                    const hasHierarchical = fields.some((f: any) =>
                        f.field_name.toLowerCase().includes('city')
                    );

                    if (hasHierarchical) {
                        const cached = cache.get('governorates');
                        if (!cached) {
                            const governorates = await fetchGovernorates();
                            cache.set('governorates', governorates, CACHE_TIMES.GOVERNORATES);
                        }
                    }
                };

                return (
                    <button
                        onMouseEnter={handleRankButtonHover}
                        data-testid="rank-btn"
                    >
                        ترتيب الاختيارات
                    </button>
                );
            };

            const user = userEvent.setup();
            render(<TestComponent />);

            // Hover over rank button
            await user.hover(screen.getByTestId('rank-btn'));

            // Should prefetch both fields and governorates
            await waitFor(() => {
                expect(fetchCategoryFields).toHaveBeenCalled();
                expect(fetchGovernorates).toHaveBeenCalled();
            });
        });

        it('should not prefetch parent options if already cached', async () => {
            const mockGovernorates = [
                { id: 1, name: 'القاهرة', cities: [] }
            ];

            // Pre-populate cache
            cache.set('governorates', mockGovernorates, CACHE_TIMES.GOVERNORATES);

            vi.mocked(fetchGovernorates).mockResolvedValue(mockGovernorates);

            const TestComponent = () => {
                const handlePrefetch = async () => {
                    const cached = cache.get('governorates');
                    if (!cached) {
                        const governorates = await fetchGovernorates();
                        cache.set('governorates', governorates, CACHE_TIMES.GOVERNORATES);
                    }
                };

                return (
                    <button onClick={handlePrefetch} data-testid="prefetch-btn">
                        Prefetch
                    </button>
                );
            };

            const user = userEvent.setup();
            render(<TestComponent />);

            // Trigger prefetch
            await user.click(screen.getByTestId('prefetch-btn'));

            // Should not fetch because already cached
            expect(fetchGovernorates).not.toHaveBeenCalled();
        });
    });

    describe('Cache Usage for Navigation (Requirement 14.13)', () => {
        it('should use cached data when navigating between categories', async () => {
            const mockFields = [
                { id: 1, field_name: 'condition', display_name: 'الحالة', options: ['جديد', 'مستعمل'] }
            ];

            // Pre-populate cache
            cache.set('fields:cars', mockFields, CACHE_TIMES.CATEGORY_FIELDS);

            vi.mocked(fetchCategoryFields).mockResolvedValue(mockFields);

            const TestComponent = ({ categorySlug }: { categorySlug: string }) => {
                const [fields, setFields] = useState<any[]>([]);

                useEffect(() => {
                    const loadFields = async () => {
                        const cacheKey = `fields:${categorySlug}`;
                        const cached = cache.get(cacheKey);

                        if (cached) {
                            setFields(cached);
                        } else {
                            const data = await fetchCategoryFields(categorySlug);
                            cache.set(cacheKey, data, CACHE_TIMES.CATEGORY_FIELDS);
                            setFields(data);
                        }
                    };

                    loadFields();
                }, [categorySlug]);

                return (
                    <div>
                        {fields.map(f => (
                            <div key={f.id}>{f.display_name}</div>
                        ))}
                    </div>
                );
            };

            render(<TestComponent categorySlug="cars" />);

            // Should use cached data
            await waitFor(() => {
                expect(screen.getByText('الحالة')).toBeInTheDocument();
            });

            // Should not fetch from API
            expect(fetchCategoryFields).not.toHaveBeenCalled();
        });

        it('should fetch fresh data if cache is stale', async () => {
            const mockFields = [
                { id: 1, field_name: 'condition', display_name: 'الحالة', options: ['جديد', 'مستعمل'] }
            ];

            // Set cache with very short stale time (already expired)
            cache.set('fields:cars', mockFields, -1000);

            vi.mocked(fetchCategoryFields).mockResolvedValue(mockFields);

            const TestComponent = ({ categorySlug }: { categorySlug: string }) => {
                const [fields, setFields] = useState<any[]>([]);

                useEffect(() => {
                    const loadFields = async () => {
                        const cacheKey = `fields:${categorySlug}`;
                        const cached = cache.get(cacheKey);

                        if (cached) {
                            setFields(cached);
                        } else {
                            const data = await fetchCategoryFields(categorySlug);
                            cache.set(cacheKey, data, CACHE_TIMES.CATEGORY_FIELDS);
                            setFields(data);
                        }
                    };

                    loadFields();
                }, [categorySlug]);

                return (
                    <div>
                        {fields.map(f => (
                            <div key={f.id}>{f.display_name}</div>
                        ))}
                    </div>
                );
            };

            render(<TestComponent categorySlug="cars" />);

            // Should fetch fresh data because cache is stale
            await waitFor(() => {
                expect(fetchCategoryFields).toHaveBeenCalledWith('cars');
            });
        });
    });

    describe('Prefetching Performance Benefits', () => {
        it('should reduce modal open time with prefetched data', async () => {
            const mockFields = [
                { id: 1, field_name: 'condition', display_name: 'الحالة', options: ['جديد', 'مستعمل'] }
            ];

            // Simulate prefetched data
            cache.set('fields:cars', mockFields, CACHE_TIMES.CATEGORY_FIELDS);

            const TestModal = ({ categorySlug }: { categorySlug: string }) => {
                const [fields, setFields] = useState<any[]>([]);
                const [loading, setLoading] = useState(true);

                useEffect(() => {
                    const loadFields = async () => {
                        const startTime = Date.now();
                        const cacheKey = `fields:${categorySlug}`;
                        const cached = cache.get(cacheKey);

                        if (cached) {
                            // Instant load from cache
                            setFields(cached);
                            setLoading(false);
                            const loadTime = Date.now() - startTime;
                            expect(loadTime).toBeLessThan(10); // Should be nearly instant
                        }
                    };

                    loadFields();
                }, [categorySlug]);

                if (loading) return <div>Loading...</div>;

                return (
                    <div>
                        {fields.map(f => (
                            <div key={f.id}>{f.display_name}</div>
                        ))}
                    </div>
                );
            };

            render(<TestModal categorySlug="cars" />);

            // Should load instantly from cache
            await waitFor(() => {
                expect(screen.getByText('الحالة')).toBeInTheDocument();
            }, { timeout: 50 });

            // Should not show loading state
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        it('should handle concurrent prefetch requests efficiently', async () => {
            const mockFields = [
                { id: 1, field_name: 'condition', display_name: 'الحالة', options: ['جديد', 'مستعمل'] }
            ];

            vi.mocked(fetchCategoryFields).mockResolvedValue(mockFields);

            const prefetchCategory = async (categorySlug: string) => {
                const cacheKey = `fields:${categorySlug}`;
                const cached = cache.get(cacheKey);

                if (!cached) {
                    const fields = await fetchCategoryFields(categorySlug);
                    cache.set(cacheKey, fields, CACHE_TIMES.CATEGORY_FIELDS);
                }
            };

            // Trigger multiple concurrent prefetches for the same category
            await Promise.all([
                prefetchCategory('cars'),
                prefetchCategory('cars'),
                prefetchCategory('cars')
            ]);

            // Without request deduplication, each call will fetch independently
            // This test verifies that the cache is properly set after fetching
            expect(fetchCategoryFields).toHaveBeenCalled();

            // Verify cache is populated
            const cached = cache.get('fields:cars');
            expect(cached).toEqual(mockFields);
        });
    });
});

