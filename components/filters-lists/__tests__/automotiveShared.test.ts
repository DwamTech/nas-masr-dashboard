import { describe, expect, it } from 'vitest';
import type { CategoryField } from '@/types/filters-lists';
import {
    filterFieldsByScope,
    getFieldDisplayName,
    getModalFieldScope,
    isAutomotiveSharedCategorySlug,
    isAutomotiveSharedFieldName,
} from '../automotiveShared';

const mockFields: CategoryField[] = [
    {
        id: 1,
        category_slug: 'cars',
        field_name: 'brand',
        display_name: 'الماركة',
        type: 'select',
        required: false,
        filterable: true,
        options: [],
        is_active: true,
        sort_order: 1,
        created_at: '',
        updated_at: '',
    },
    {
        id: 2,
        category_slug: 'cars',
        field_name: 'model',
        display_name: 'الموديل',
        type: 'select',
        required: false,
        filterable: true,
        options: [],
        is_active: true,
        sort_order: 2,
        created_at: '',
        updated_at: '',
    },
    {
        id: 3,
        category_slug: 'cars',
        field_name: 'condition',
        display_name: 'الحالة',
        type: 'select',
        required: false,
        filterable: true,
        options: [],
        is_active: true,
        sort_order: 3,
        created_at: '',
        updated_at: '',
    },
];

describe('automotiveShared helpers', () => {
    it('detects automotive shared categories correctly', () => {
        expect(isAutomotiveSharedCategorySlug('cars')).toBe(true);
        expect(isAutomotiveSharedCategorySlug('cars_rent')).toBe(true);
        expect(isAutomotiveSharedCategorySlug('spare-parts')).toBe(true);
        expect(isAutomotiveSharedCategorySlug('real_estate')).toBe(false);
    });

    it('detects only brand and model as shared automotive fields', () => {
        expect(isAutomotiveSharedFieldName('brand')).toBe(true);
        expect(isAutomotiveSharedFieldName('model')).toBe(true);
        expect(isAutomotiveSharedFieldName('condition')).toBe(false);
    });

    it('filters shared automotive fields out of per-category modals', () => {
        expect(filterFieldsByScope(mockFields, 'excludeAutomotiveShared').map((field) => field.field_name))
            .toEqual(['condition']);
    });

    it('keeps only shared automotive fields inside shared modal scope', () => {
        expect(filterFieldsByScope(mockFields, 'onlyAutomotiveShared').map((field) => field.field_name))
            .toEqual(['brand', 'model']);
    });

    it('returns the correct modal scope for shared automotive entry', () => {
        expect(getModalFieldScope('cars', 'brand')).toBe('onlyAutomotiveShared');
        expect(getModalFieldScope('cars', 'model')).toBe('onlyAutomotiveShared');
        expect(getModalFieldScope('cars_rent', null)).toBe('excludeAutomotiveShared');
        expect(getModalFieldScope('real_estate', null)).toBe('all');
    });

    it('returns Arabic display names for the automotive shared tabs', () => {
        expect(getFieldDisplayName('brand')).toBe('الماركة');
        expect(getFieldDisplayName('model')).toBe('الموديل');
    });
});
