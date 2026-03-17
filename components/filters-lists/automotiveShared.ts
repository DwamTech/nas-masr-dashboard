import type { CategoryField } from '@/types/filters-lists';

export const AUTOMOTIVE_SHARED_CATEGORY_SLUGS = ['cars', 'cars_rent', 'spare-parts'] as const;
export const AUTOMOTIVE_SHARED_MODAL_TITLE = 'القوائم المشتركة للمركبات';

export type FiltersFieldScope = 'all' | 'excludeAutomotiveShared' | 'onlyAutomotiveShared';

export function isAutomotiveSharedCategorySlug(slug: string): boolean {
    return AUTOMOTIVE_SHARED_CATEGORY_SLUGS.includes(slug as (typeof AUTOMOTIVE_SHARED_CATEGORY_SLUGS)[number]);
}

export function isAutomotiveSharedFieldName(fieldName: string): boolean {
    const normalized = fieldName.trim().toLowerCase();
    return normalized === 'brand' || normalized === 'model';
}

export function filterFieldsByScope(
    fields: CategoryField[],
    scope: FiltersFieldScope
): CategoryField[] {
    if (scope === 'all') {
        return fields;
    }

    return fields.filter((field) => (
        scope === 'onlyAutomotiveShared'
            ? isAutomotiveSharedFieldName(field.field_name)
            : !isAutomotiveSharedFieldName(field.field_name)
    ));
}

export function getFieldDisplayName(fieldName: string): string {
    return isAutomotiveSharedFieldName(fieldName) && fieldName.trim().toLowerCase() === 'model'
        ? 'الموديل'
        : 'الماركة';
}

export function getModalFieldScope(categorySlug: string, modalField: string | null): FiltersFieldScope {
    if (categorySlug === 'cars' && modalField && isAutomotiveSharedFieldName(modalField)) {
        return 'onlyAutomotiveShared';
    }

    return isAutomotiveSharedCategorySlug(categorySlug)
        ? 'excludeAutomotiveShared'
        : 'all';
}
