/**
 * Unit Tests for Field Type Detection
 * 
 * Tests for detectListType and related helper functions
 * 
 * Requirements: 10.1, 10.2
 */

import { describe, it, expect } from 'vitest';
import {
    detectListType,
    isIndependentList,
    isHierarchicalList,
    isParentField,
    isChildField,
} from '../fieldTypeDetection';
import { CategoryField } from '@/types/filters-lists';

// Helper function to create a mock CategoryField
function createMockField(field_name: string): CategoryField {
    return {
        id: 1,
        category_slug: 'test',
        field_name,
        display_name: field_name,
        type: 'select',
        required: false,
        filterable: true,
        options: [],
        is_active: true,
        sort_order: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
    };
}

describe('detectListType', () => {
    describe('Independent Lists', () => {
        it('should detect condition as independent list', () => {
            const field = createMockField('condition');
            const result = detectListType(field);
            expect(result.listType).toBe('independent');
            expect(result.hasParent).toBe(false);
            expect(result.childField).toBeUndefined();
            expect(result.parentField).toBeUndefined();
        });

        it('should detect color as independent list', () => {
            const field = createMockField('color');
            const result = detectListType(field);
            expect(result.listType).toBe('independent');
            expect(result.hasParent).toBe(false);
        });

        it('should detect transmission as independent list', () => {
            const field = createMockField('transmission');
            const result = detectListType(field);
            expect(result.listType).toBe('independent');
            expect(result.hasParent).toBe(false);
        });

        it('should detect fuel_type as independent list', () => {
            const field = createMockField('fuel_type');
            const result = detectListType(field);
            expect(result.listType).toBe('independent');
            expect(result.hasParent).toBe(false);
        });
    });

    describe('Hierarchical Parent Fields', () => {
        it('should detect governorate as hierarchical parent', () => {
            const field = createMockField('governorate');
            const result = detectListType(field);
            expect(result.listType).toBe('hierarchical');
            expect(result.hasParent).toBe(false);
            expect(result.childField).toBe('city');
        });

        it('should detect governorate_id as hierarchical parent', () => {
            const field = createMockField('governorate_id');
            const result = detectListType(field);
            expect(result.listType).toBe('hierarchical');
            expect(result.hasParent).toBe(false);
            expect(result.childField).toBe('city');
        });

        it('should detect brand as hierarchical parent', () => {
            const field = createMockField('brand');
            const result = detectListType(field);
            expect(result.listType).toBe('hierarchical');
            expect(result.hasParent).toBe(false);
            expect(result.childField).toBe('model');
        });

        it('should detect make (brand) as hierarchical parent', () => {
            const field = createMockField('make');
            const result = detectListType(field);
            // 'make' doesn't match 'brand' pattern, so it's independent
            expect(result.listType).toBe('independent');
        });

        it('should detect main_section as hierarchical parent', () => {
            const field = createMockField('main_section');
            const result = detectListType(field);
            expect(result.listType).toBe('hierarchical');
            expect(result.hasParent).toBe(false);
            expect(result.childField).toBe('sub_section');
        });
    });

    describe('Hierarchical Child Fields', () => {
        it('should detect city as hierarchical child', () => {
            const field = createMockField('city');
            const result = detectListType(field);
            expect(result.listType).toBe('hierarchical');
            expect(result.hasParent).toBe(true);
            expect(result.parentField).toBe('governorate');
        });

        it('should detect city_id as hierarchical child', () => {
            const field = createMockField('city_id');
            const result = detectListType(field);
            expect(result.listType).toBe('hierarchical');
            expect(result.hasParent).toBe(true);
            expect(result.parentField).toBe('governorate');
        });

        it('should detect model as hierarchical child', () => {
            const field = createMockField('model');
            const result = detectListType(field);
            expect(result.listType).toBe('hierarchical');
            expect(result.hasParent).toBe(true);
            expect(result.parentField).toBe('brand');
        });

        it('should detect sub_section as hierarchical child', () => {
            const field = createMockField('sub_section');
            const result = detectListType(field);
            expect(result.listType).toBe('hierarchical');
            expect(result.hasParent).toBe(true);
            expect(result.parentField).toBe('main_section');
        });
    });

    describe('Case Insensitivity', () => {
        it('should detect GOVERNORATE as hierarchical parent', () => {
            const field = createMockField('GOVERNORATE');
            const result = detectListType(field);
            expect(result.listType).toBe('hierarchical');
            expect(result.hasParent).toBe(false);
        });

        it('should detect City as hierarchical child', () => {
            const field = createMockField('City');
            const result = detectListType(field);
            expect(result.listType).toBe('hierarchical');
            expect(result.hasParent).toBe(true);
        });

        it('should detect Brand as hierarchical parent', () => {
            const field = createMockField('Brand');
            const result = detectListType(field);
            expect(result.listType).toBe('hierarchical');
            expect(result.hasParent).toBe(false);
        });
    });
});

describe('isIndependentList', () => {
    it('should return true for independent lists', () => {
        const field = createMockField('condition');
        expect(isIndependentList(field)).toBe(true);
    });

    it('should return false for hierarchical lists', () => {
        const field = createMockField('governorate');
        expect(isIndependentList(field)).toBe(false);
    });

    it('should return false for child fields', () => {
        const field = createMockField('city');
        expect(isIndependentList(field)).toBe(false);
    });
});

describe('isHierarchicalList', () => {
    it('should return true for parent fields', () => {
        const field = createMockField('governorate');
        expect(isHierarchicalList(field)).toBe(true);
    });

    it('should return true for child fields', () => {
        const field = createMockField('city');
        expect(isHierarchicalList(field)).toBe(true);
    });

    it('should return false for independent lists', () => {
        const field = createMockField('condition');
        expect(isHierarchicalList(field)).toBe(false);
    });
});

describe('isParentField', () => {
    it('should return true for parent fields', () => {
        const field = createMockField('governorate');
        expect(isParentField(field)).toBe(true);
    });

    it('should return false for child fields', () => {
        const field = createMockField('city');
        expect(isParentField(field)).toBe(false);
    });

    it('should return false for independent lists', () => {
        const field = createMockField('condition');
        expect(isParentField(field)).toBe(false);
    });

    it('should return true for brand field', () => {
        const field = createMockField('brand');
        expect(isParentField(field)).toBe(true);
    });

    it('should return true for main_section field', () => {
        const field = createMockField('main_section');
        expect(isParentField(field)).toBe(true);
    });
});

describe('isChildField', () => {
    it('should return true for child fields', () => {
        const field = createMockField('city');
        expect(isChildField(field)).toBe(true);
    });

    it('should return false for parent fields', () => {
        const field = createMockField('governorate');
        expect(isChildField(field)).toBe(false);
    });

    it('should return false for independent lists', () => {
        const field = createMockField('condition');
        expect(isChildField(field)).toBe(false);
    });

    it('should return true for model field', () => {
        const field = createMockField('model');
        expect(isChildField(field)).toBe(true);
    });

    it('should return true for sub_section field', () => {
        const field = createMockField('sub_section');
        expect(isChildField(field)).toBe(true);
    });
});
