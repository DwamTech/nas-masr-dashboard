import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import SharedListsSection from '../SharedListsSection';
import { fetchGovernorates } from '@/services/governorates';
import { fetchAdminMakesWithIds } from '@/services/makes';
import { cache } from '@/utils/cache';
import type { Governorate } from '@/models/governorates';
import '@testing-library/jest-dom';

// Mock the services
vi.mock('@/services/governorates', () => ({
    fetchGovernorates: vi.fn()
}));

vi.mock('@/services/makes', () => ({
    fetchAdminMakesWithIds: vi.fn()
}));

// Mock the cache utility
vi.mock('@/utils/cache', () => ({
    cache: {
        get: vi.fn(),
        set: vi.fn(),
        invalidate: vi.fn(),
        clear: vi.fn()
    },
    CACHE_TIMES: {
        GOVERNORATES: 30 * 60 * 1000
    }
}));

describe('SharedListsSection', () => {
    const mockGovernorates: Governorate[] = [
        {
            id: 1,
            name: 'القاهرة',
            cities: [
                { id: 1, name: 'مدينة نصر', governorate_id: 1 },
                { id: 2, name: 'المعادي', governorate_id: 1 },
                { id: 3, name: 'مصر الجديدة', governorate_id: 1 }
            ]
        },
        {
            id: 2,
            name: 'الجيزة',
            cities: [
                { id: 4, name: 'الدقي', governorate_id: 2 },
                { id: 5, name: 'المهندسين', governorate_id: 2 }
            ]
        },
        {
            id: 3,
            name: 'الإسكندرية',
            cities: [
                { id: 6, name: 'المنتزه', governorate_id: 3 },
                { id: 7, name: 'العجمي', governorate_id: 3 },
                { id: 8, name: 'سيدي جابر', governorate_id: 3 },
                { id: 9, name: 'محرم بك', governorate_id: 3 }
            ]
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset cache mock
        (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
        (fetchAdminMakesWithIds as ReturnType<typeof vi.fn>).mockResolvedValue([
            { id: 1, name: 'تويوتا', models: ['كورولا', 'يارس'] },
            { id: 2, name: 'هيونداي', models: ['النترا'] },
        ]);
    });

    describe('Rendering', () => {
        it('renders section title correctly', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            render(<SharedListsSection />);

            expect(screen.getByText('القوائم المشتركة')).toBeInTheDocument();
        });

        it('renders hierarchical list card with correct title', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByText('المحافظات والمدن')).toBeInTheDocument();
            });
        });

        it('renders automotive shared list card with correct title', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByText('الماركات والموديلات')).toBeInTheDocument();
            });
        });

        it('displays hierarchical list type badge', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByText('قائمة هرمية')).toBeInTheDocument();
            });
        });

        it('displays list description', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByText('قائمة المحافظات والمدن المستخدمة في جميع الأقسام')).toBeInTheDocument();
            });
        });

        it('displays automotive shared description', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByText(/مصدر موحد للمركبات/)).toBeInTheDocument();
            });
        });
    });

    describe('Count Display Accuracy', () => {
        it('displays correct governorates count', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByText('المحافظات')).toBeInTheDocument();
                expect(screen.getByLabelText('3 محافظة')).toBeInTheDocument();
            });
        });

        it('displays correct total cities count', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByText('المدن')).toBeInTheDocument();
                expect(screen.getByLabelText('9 مدينة')).toBeInTheDocument();
            });
        });

        it('displays correct count separator', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getAllByText('←')).toHaveLength(2);
            });
        });

        it('displays correct automotive makes and models counts', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByLabelText('2 ماركة')).toBeInTheDocument();
                expect(screen.getByLabelText('3 موديل')).toBeInTheDocument();
            });
        });

        it('calculates cities count correctly with empty cities array', async () => {
            const governoratesWithEmptyCities: Governorate[] = [
                {
                    id: 1,
                    name: 'القاهرة',
                    cities: []
                },
                {
                    id: 2,
                    name: 'الجيزة',
                    cities: [
                        { id: 1, name: 'الدقي', governorate_id: 2 }
                    ]
                }
            ];

            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(governoratesWithEmptyCities);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByLabelText('2 محافظة')).toBeInTheDocument();
                expect(screen.getByLabelText('1 مدينة')).toBeInTheDocument();
            });
        });

        it('handles governorates with undefined cities property', async () => {
            const governoratesWithUndefinedCities: Governorate[] = [
                {
                    id: 1,
                    name: 'القاهرة',
                    cities: undefined as any
                }
            ];

            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(governoratesWithUndefinedCities);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByLabelText('1 محافظة')).toBeInTheDocument();
                expect(screen.getByLabelText('0 مدينة')).toBeInTheDocument();
            });
        });
    });

    describe('Loading States', () => {
        it('displays loading skeleton initially', () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockImplementation(
                () => new Promise(() => { }) // Never resolves
            );

            render(<SharedListsSection />);

            const skeletonCard = document.querySelector('.skeleton-card');
            expect(skeletonCard).toBeInTheDocument();
        });

        it('displays skeleton with correct structure', () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockImplementation(
                () => new Promise(() => { })
            );

            render(<SharedListsSection />);

            const skeletonTitle = document.querySelector('.skeleton-title');
            const skeletonText = document.querySelector('.skeleton-text');

            expect(skeletonTitle).toBeInTheDocument();
            expect(skeletonText).toBeInTheDocument();
        });

        it('hides loading state after data loads', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            render(<SharedListsSection />);

            await waitFor(() => {
                const skeletonCard = document.querySelector('.skeleton-card');
                expect(skeletonCard).not.toBeInTheDocument();
            });
        });

        it('shows content after loading completes', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByText('المحافظات والمدن')).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('displays error message when fetch fails', async () => {
            const errorMessage = 'فشل الاتصال بالخادم';
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockRejectedValue(new Error(errorMessage));

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByText(errorMessage)).toBeInTheDocument();
            });
        });

        it('displays retry button on error', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByText('إعادة المحاولة')).toBeInTheDocument();
            });
        });

        it('retries fetching when retry button is clicked', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>)
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce(mockGovernorates);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByText('إعادة المحاولة')).toBeInTheDocument();
            });

            const retryButton = screen.getByText('إعادة المحاولة');
            fireEvent.click(retryButton);

            await waitFor(() => {
                expect(screen.getByText('المحافظات والمدن')).toBeInTheDocument();
            });

            expect(fetchGovernorates).toHaveBeenCalledTimes(2);
        });

        it('hides error message after successful retry', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>)
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce(mockGovernorates);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByText('Network error')).toBeInTheDocument();
            });

            const retryButton = screen.getByText('إعادة المحاولة');
            fireEvent.click(retryButton);

            await waitFor(() => {
                expect(screen.queryByText('Network error')).not.toBeInTheDocument();
            });
        });

        it('handles non-Error objects thrown during fetch', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockRejectedValue('String error');

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByText('حدث خطأ أثناء تحميل البيانات')).toBeInTheDocument();
            });
        });
    });

    describe('Cache Integration', () => {
        it('checks cache before fetching from API', async () => {
            (cache.get as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
                if (key === 'governorates:all') return mockGovernorates;
                if (key === 'shared:automotive-makes') {
                    return [
                        { id: 1, name: 'تويوتا', models: ['كورولا', 'يارس'] },
                        { id: 2, name: 'هيونداي', models: ['النترا'] },
                    ];
                }
                return null;
            });

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(cache.get).toHaveBeenCalledWith('governorates:all');
            });

            // Should not call API if cache hit
            expect(fetchGovernorates).not.toHaveBeenCalled();
            expect(fetchAdminMakesWithIds).not.toHaveBeenCalled();
        });

        it('uses cached data when available', async () => {
            (cache.get as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
                if (key === 'governorates:all') return mockGovernorates;
                if (key === 'shared:automotive-makes') {
                    return [
                        { id: 1, name: 'تويوتا', models: ['كورولا', 'يارس'] },
                        { id: 2, name: 'هيونداي', models: ['النترا'] },
                    ];
                }
                return null;
            });

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByText('المحافظات والمدن')).toBeInTheDocument();
                expect(screen.getByLabelText('3 محافظة')).toBeInTheDocument();
            });
        });

        it('fetches from API when cache is empty', async () => {
            (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(fetchGovernorates).toHaveBeenCalled();
            });
        });

        it('caches fetched data with correct key and time', async () => {
            (cache.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(cache.set).toHaveBeenCalledWith(
                    'governorates:all',
                    mockGovernorates,
                    30 * 60 * 1000 // CACHE_TIMES.GOVERNORATES
                );
            });
        });
    });

    describe('Edge Cases', () => {
        it('handles empty governorates array', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue([]);

            render(<SharedListsSection />);

            await waitFor(() => {
                const countValues = screen.getAllByText('0');
                expect(countValues).toHaveLength(2); // 0 governorates and 0 cities
            });
        });

        it('handles single governorate with multiple cities', async () => {
            const singleGovernorate: Governorate[] = [
                {
                    id: 1,
                    name: 'القاهرة',
                    cities: [
                        { id: 1, name: 'مدينة نصر', governorate_id: 1 },
                        { id: 2, name: 'المعادي', governorate_id: 1 },
                        { id: 3, name: 'مصر الجديدة', governorate_id: 1 },
                        { id: 4, name: 'حلوان', governorate_id: 1 },
                        { id: 5, name: 'المطرية', governorate_id: 1 }
                    ]
                }
            ];

            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(singleGovernorate);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByText('1')).toBeInTheDocument(); // 1 governorate
                expect(screen.getByText('5')).toBeInTheDocument(); // 5 cities
            });
        });

        it('handles large number of governorates and cities', async () => {
            const largeDataset: Governorate[] = Array.from({ length: 27 }, (_, i) => ({
                id: i + 1,
                name: `محافظة ${i + 1}`,
                cities: Array.from({ length: 10 }, (_, j) => ({
                    id: i * 10 + j + 1,
                    name: `مدينة ${j + 1}`,
                    governorate_id: i + 1
                }))
            }));

            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(largeDataset);

            render(<SharedListsSection />);

            await waitFor(() => {
                expect(screen.getByText('27')).toBeInTheDocument(); // 27 governorates
                expect(screen.getByText('270')).toBeInTheDocument(); // 270 cities
            });
        });
    });

    describe('Component Structure', () => {
        it('renders with correct CSS classes', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            const { container } = render(<SharedListsSection />);

            await waitFor(() => {
                expect(container.querySelector('.shared-lists-section')).toBeInTheDocument();
                expect(container.querySelector('.section-title')).toBeInTheDocument();
                expect(container.querySelector('.shared-lists-grid')).toBeInTheDocument();
            });
        });

        it('renders list card with hierarchical class', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            const { container } = render(<SharedListsSection />);

            await waitFor(() => {
                const listCard = container.querySelector('.list-card.hierarchical');
                expect(listCard).toBeInTheDocument();
            });
        });

        it('renders count display with correct structure', async () => {
            (fetchGovernorates as ReturnType<typeof vi.fn>).mockResolvedValue(mockGovernorates);

            const { container } = render(<SharedListsSection />);

            await waitFor(() => {
                expect(container.querySelector('.count-display')).toBeInTheDocument();
                expect(container.querySelector('.count-item.parent')).toBeInTheDocument();
                expect(container.querySelector('.count-item.child')).toBeInTheDocument();
                expect(container.querySelector('.count-separator')).toBeInTheDocument();
            });
        });
    });
});
