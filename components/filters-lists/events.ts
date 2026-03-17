'use client';

export const FILTERS_LISTS_DATA_CHANGED_EVENT = 'filters-lists:data-changed';

export type FiltersListsDataScope = 'all' | 'automotive' | 'governorates' | 'sections' | 'fields';

export function emitFiltersListsDataChanged(scope: FiltersListsDataScope = 'all') {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(
        new CustomEvent(FILTERS_LISTS_DATA_CHANGED_EVENT, {
            detail: { scope },
        })
    );
}
