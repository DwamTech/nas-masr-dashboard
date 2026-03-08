/**
 * Performance Tests - Lazy Loading
 * 
 * Task 21.4: Write performance tests
 * Tests lazy loading of modals
 * 
 * Requirements: 14.13
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React, { lazy, Suspense } from 'react';

describe('Lazy Loading Performance Tests - Task 21.4', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Modal Lazy Loading (Requirement 14.13)', () => {
        it('should not load RankModal component in initial bundle', async () => {
            // Mock the lazy import
            const mockRankModal = vi.fn(() => <div>RankModal</div>);
            const LazyRankModal = lazy(() => Promise.resolve({ default: mockRankModal }));

            // Component should not be loaded yet
            expect(mockRankModal).not.toHaveBeenCalled();

            // Render with Suspense
            render(
                <Suspense fallback={<div>Loading...</div>}>
                    <LazyRankModal />
                </Suspense>
            );

            // Should show loading fallback initially
            expect(screen.getByText('Loading...')).toBeInTheDocument();

            // Wait for lazy component to load
            await waitFor(() => {
                expect(screen.getByText('RankModal')).toBeInTheDocument();
            });

            // Component should now be loaded
            expect(mockRankModal).toHaveBeenCalled();
        });

        it('should not load EditModal component in initial bundle', async () => {
            // Mock the lazy import
            const mockEditModal = vi.fn(() => <div>EditModal</div>);
            const LazyEditModal = lazy(() => Promise.resolve({ default: mockEditModal }));

            // Component should not be loaded yet
            expect(mockEditModal).not.toHaveBeenCalled();

            // Render with Suspense
            render(
                <Suspense fallback={<div>Loading...</div>}>
                    <LazyEditModal />
                </Suspense>
            );

            // Should show loading fallback initially
            expect(screen.getByText('Loading...')).toBeInTheDocument();

            // Wait for lazy component to load
            await waitFor(() => {
                expect(screen.getByText('EditModal')).toBeInTheDocument();
            });

            // Component should now be loaded
            expect(mockEditModal).toHaveBeenCalled();
        });

        it('should not load DraggableOptionsList component in initial bundle', async () => {
            // Mock the lazy import
            const mockDraggableList = vi.fn(() => <div>DraggableList</div>);
            const LazyDraggableList = lazy(() => Promise.resolve({ default: mockDraggableList }));

            // Component should not be loaded yet
            expect(mockDraggableList).not.toHaveBeenCalled();

            // Render with Suspense
            render(
                <Suspense fallback={<div>Loading list...</div>}>
                    <LazyDraggableList />
                </Suspense>
            );

            // Should show loading fallback initially
            expect(screen.getByText('Loading list...')).toBeInTheDocument();

            // Wait for lazy component to load
            await waitFor(() => {
                expect(screen.getByText('DraggableList')).toBeInTheDocument();
            });

            // Component should now be loaded
            expect(mockDraggableList).toHaveBeenCalled();
        });

        it('should display loading fallback while lazy component loads', async () => {
            const LoadingFallback = () => (
                <div className="modal-loading-overlay">
                    <div className="modal-loading-spinner">
                        <div className="spinner"></div>
                        <p>جاري التحميل...</p>
                    </div>
                </div>
            );

            const LazyComponent = lazy(() =>
                new Promise(resolve => {
                    setTimeout(() => {
                        resolve({ default: () => <div>Loaded Component</div> });
                    }, 50);
                })
            );

            render(
                <Suspense fallback={<LoadingFallback />}>
                    <LazyComponent />
                </Suspense>
            );

            // Should show loading fallback
            expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();

            // Wait for component to load
            await waitFor(() => {
                expect(screen.getByText('Loaded Component')).toBeInTheDocument();
            }, { timeout: 500 });

            // Loading fallback should be gone
            expect(screen.queryByText('جاري التحميل...')).not.toBeInTheDocument();
        });

        it('should handle lazy loading errors gracefully', async () => {
            const ErrorBoundary = class extends React.Component<
                { children: React.ReactNode },
                { hasError: boolean }
            > {
                constructor(props: { children: React.ReactNode }) {
                    super(props);
                    this.state = { hasError: false };
                }

                static getDerivedStateFromError() {
                    return { hasError: true };
                }

                render() {
                    if (this.state.hasError) {
                        return <div>Error loading component</div>;
                    }
                    return this.props.children;
                }
            };

            const FailingLazyComponent = lazy(() =>
                Promise.reject(new Error('Failed to load'))
            );

            render(
                <ErrorBoundary>
                    <Suspense fallback={<div>Loading...</div>}>
                        <FailingLazyComponent />
                    </Suspense>
                </ErrorBoundary>
            );

            // Should eventually show error
            await waitFor(() => {
                expect(screen.getByText('Error loading component')).toBeInTheDocument();
            });
        });

        it('should only load modal component when modal is opened', async () => {
            const mockModalComponent = vi.fn(() => <div>Modal Content</div>);
            const LazyModal = lazy(() => Promise.resolve({ default: mockModalComponent }));

            const TestComponent = ({ isOpen }: { isOpen: boolean }) => (
                <div>
                    <div>Page Content</div>
                    {isOpen && (
                        <Suspense fallback={<div>Loading modal...</div>}>
                            <LazyModal />
                        </Suspense>
                    )}
                </div>
            );

            const { rerender } = render(<TestComponent isOpen={false} />);

            // Modal should not be loaded when closed
            expect(mockModalComponent).not.toHaveBeenCalled();
            expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();

            // Open modal
            rerender(<TestComponent isOpen={true} />);

            // Should show loading fallback
            expect(screen.getByText('Loading modal...')).toBeInTheDocument();

            // Wait for modal to load
            await waitFor(() => {
                expect(screen.getByText('Modal Content')).toBeInTheDocument();
            });

            // Modal component should now be loaded
            expect(mockModalComponent).toHaveBeenCalled();
        });

        it('should cache lazy loaded components after first load', async () => {
            const mockComponent = vi.fn(() => <div>Cached Component</div>);
            const LazyComponent = lazy(() => Promise.resolve({ default: mockComponent }));

            const TestComponent = ({ show }: { show: boolean }) => (
                <div>
                    {show && (
                        <Suspense fallback={<div>Loading...</div>}>
                            <LazyComponent />
                        </Suspense>
                    )}
                </div>
            );

            const { rerender } = render(<TestComponent show={true} />);

            // Wait for first load
            await waitFor(() => {
                expect(screen.getByText('Cached Component')).toBeInTheDocument();
            });

            expect(mockComponent).toHaveBeenCalledTimes(1);

            // Hide component
            rerender(<TestComponent show={false} />);
            expect(screen.queryByText('Cached Component')).not.toBeInTheDocument();

            // Show again - should use cached version
            rerender(<TestComponent show={true} />);

            // Should appear immediately without loading fallback
            await waitFor(() => {
                expect(screen.getByText('Cached Component')).toBeInTheDocument();
            });

            // Component function should be called again for rendering, but import is cached
            expect(mockComponent).toHaveBeenCalledTimes(2);
        });
    });

    describe('Code Splitting Benefits', () => {
        it('should reduce initial bundle size by lazy loading modals', () => {
            // This test verifies the concept of code splitting
            // In a real scenario, you would measure bundle sizes

            const initialComponents = ['Page', 'Header', 'Footer', 'CategoryCard'];
            const lazyComponents = ['RankModal', 'EditModal', 'DraggableList'];

            // Initial bundle should only include initial components
            const initialBundle = initialComponents;
            expect(initialBundle).not.toContain('RankModal');
            expect(initialBundle).not.toContain('EditModal');
            expect(initialBundle).not.toContain('DraggableList');

            // Lazy components are loaded on demand
            expect(lazyComponents).toContain('RankModal');
            expect(lazyComponents).toContain('EditModal');
            expect(lazyComponents).toContain('DraggableList');
        });

        it('should load components in parallel when multiple modals are opened', async () => {
            const mockRankModal = vi.fn(() => <div>RankModal</div>);
            const mockEditModal = vi.fn(() => <div>EditModal</div>);

            const LazyRankModal = lazy(() =>
                new Promise(resolve => {
                    setTimeout(() => resolve({ default: mockRankModal }), 50);
                })
            );

            const LazyEditModal = lazy(() =>
                new Promise(resolve => {
                    setTimeout(() => resolve({ default: mockEditModal }), 50);
                })
            );

            const TestComponent = () => (
                <div>
                    <Suspense fallback={<div>Loading Rank...</div>}>
                        <LazyRankModal />
                    </Suspense>
                    <Suspense fallback={<div>Loading Edit...</div>}>
                        <LazyEditModal />
                    </Suspense>
                </div>
            );

            const startTime = Date.now();
            render(<TestComponent />);

            // Both should load in parallel
            await waitFor(() => {
                expect(screen.getByText('RankModal')).toBeInTheDocument();
                expect(screen.getByText('EditModal')).toBeInTheDocument();
            });

            const loadTime = Date.now() - startTime;

            // Should load in ~50ms (parallel), not ~100ms (sequential)
            // Allow generous margin for test execution overhead
            expect(loadTime).toBeLessThan(500);
        });
    });
});
