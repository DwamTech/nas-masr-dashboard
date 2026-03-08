/**
 * Field Type Detection Utility
 * 
 * Provides functions to detect whether a field is an independent list or hierarchical list
 * and return metadata about the field structure.
 * 
 * Requirements: 10.1, 10.2, 10.6, 10.7
 */

import { CategoryField, FieldMetadata } from '@/types/filters-lists';

/**
 * Hierarchical patterns that define parent-child relationships
 * 
 * Each pattern defines:
 * - parent: The parent field name pattern (e.g., 'governorate')
 * - child: The child field name pattern (e.g., 'city')
 */
const HIERARCHICAL_PATTERNS = [
    { parent: 'governorate', child: 'city' },
    { parent: 'brand', child: 'model' },
    { parent: 'main_section', child: 'sub_section' },
] as const;

/**
 * Detect whether a field is independent or hierarchical
 * 
 * Checks the field name against known hierarchical patterns to determine:
 * - If it's an independent list (standalone options)
 * - If it's a hierarchical parent field (has children)
 * - If it's a hierarchical child field (belongs to a parent)
 * 
 * @param field - The category field to analyze
 * @returns Field metadata with list type information
 * 
 * Requirements: 10.1, 10.2, 10.6, 10.7
 */
export function detectListType(field: CategoryField): FieldMetadata {
    const fieldNameLower = field.field_name.toLowerCase();

    // Check if field is part of a hierarchical relationship
    for (const pattern of HIERARCHICAL_PATTERNS) {
        // Check if this is a parent field
        if (fieldNameLower.includes(pattern.parent)) {
            return {
                listType: 'hierarchical',
                hasParent: false,
                childField: pattern.child,
            };
        }

        // Check if this is a child field
        if (fieldNameLower.includes(pattern.child)) {
            return {
                listType: 'hierarchical',
                hasParent: true,
                parentField: pattern.parent,
            };
        }
    }

    // Default to independent list
    return {
        listType: 'independent',
        hasParent: false,
    };
}

/**
 * Check if a field is an independent list
 * 
 * @param field - The category field to check
 * @returns True if the field is an independent list
 */
export function isIndependentList(field: CategoryField): boolean {
    const metadata = detectListType(field);
    return metadata.listType === 'independent';
}

/**
 * Check if a field is a hierarchical list
 * 
 * @param field - The category field to check
 * @returns True if the field is a hierarchical list
 */
export function isHierarchicalList(field: CategoryField): boolean {
    const metadata = detectListType(field);
    return metadata.listType === 'hierarchical';
}

/**
 * Check if a field is a parent field in a hierarchical list
 * 
 * @param field - The category field to check
 * @returns True if the field is a hierarchical parent field
 */
export function isParentField(field: CategoryField): boolean {
    const metadata = detectListType(field);
    return metadata.listType === 'hierarchical' && !metadata.hasParent;
}

/**
 * Check if a field is a child field in a hierarchical list
 * 
 * @param field - The category field to check
 * @returns True if the field is a hierarchical child field
 */
export function isChildField(field: CategoryField): boolean {
    const metadata = detectListType(field);
    return metadata.listType === 'hierarchical' && metadata.hasParent === true;
}
