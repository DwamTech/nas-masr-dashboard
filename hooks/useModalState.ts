'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { ModalState } from '@/types/filters-lists';

/**
 * Custom hook for managing modal state through URL query parameters
 * 
 * This hook enables:
 * - Deep linking to specific modals (shareable URLs)
 * - Browser back/forward navigation support
 * - Page refresh state restoration
 * - URL-based modal state synchronization
 * 
 * Modal state is stored in query parameters:
 * - ?modal=rank-options&category=cars&field=brand
 * - ?modal=rank-options&category=cars&field=city&parent=cairo
 * - ?modal=edit-options&category=cars&field=condition
 * - ?modal=edit-options&category=cars&field=city&parent=cairo
 * 
 * @returns Object containing:
 *   - modalState: Current modal state parsed from URL
 *   - openModal: Function to open a modal and update URL
 *   - closeModal: Function to close modal and clear URL parameters
 * 
 * @example
 * ```typescript
 * const { modalState, openModal, closeModal } = useModalState();
 * 
 * // Open rank modal
 * openModal('rank', 'cars', 'brand');
 * 
 * // Open hierarchical rank modal with parent context
 * openModal('rank', 'cars', 'city', 'cairo');
 * 
 * // Close modal
 * closeModal();
 * 
 * // Check if modal is open
 * if (modalState.type === 'rank') {
 *   // Render rank modal
 * }
 * ```
 */
export function useModalState() {
    const router = useRouter();
    const searchParams = useSearchParams();

    /**
     * Parse current modal state from URL query parameters
     * Returns null values for missing parameters
     */
    const modalState: ModalState = useMemo(() => ({
        type: (searchParams.get('modal') as 'rank' | 'edit' | null) || null,
        category: searchParams.get('category'),
        field: searchParams.get('field'),
        parent: searchParams.get('parent'),
    }), [searchParams]);

    /**
     * Open a modal by updating URL with query parameters
     * Does not reload the page - uses client-side navigation
     * 
     * @param type - Modal type: 'rank' or 'edit'
     * @param category - Category slug (e.g., 'cars')
     * @param field - Field name (e.g., 'brand', 'condition')
     * @param parent - Optional parent context for hierarchical lists (e.g., 'toyota')
     */
    const openModal = useCallback((
        type: 'rank' | 'edit',
        category: string,
        field: string | null,
        parent?: string
    ) => {
        const params = new URLSearchParams();
        params.set('modal', type);
        params.set('category', category);

        if (field) {
            params.set('field', field);
        }

        if (parent) {
            params.set('parent', parent);
        }

        // Use shallow routing to avoid page reload
        router.push(`?${params.toString()}`, { scroll: false });
    }, [router]);

    /**
     * Close the modal by removing all query parameters
     * Returns to the base page URL without modal state
     */
    const closeModal = useCallback(() => {
        // Navigate to the same page without query parameters
        router.push(window.location.pathname, { scroll: false });
    }, [router]);

    return {
        modalState,
        openModal,
        closeModal,
    };
}
