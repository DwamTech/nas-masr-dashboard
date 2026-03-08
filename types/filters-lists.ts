/**
 * TypeScript interfaces for Filters and Lists Management feature
 */

// Category
export interface Category {
    id: number;
    slug: string;
    name: string;
    icon?: string;
    icon_url?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Category Field
export interface CategoryField {
    id: number;
    category_slug: string;
    field_name: string;
    display_name: string;
    type: 'text' | 'select' | 'radio' | 'checkbox' | 'number';
    required: boolean;
    filterable: boolean;
    options: string[];
    rules_json?: Record<string, any>;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

// Field Type Detection
export type ListType = 'independent' | 'hierarchical';

export interface FieldMetadata {
    listType: ListType;
    hasParent: boolean;
    parentField?: string;
    childField?: string;
}

// Option Rank
export interface OptionRank {
    id: number;
    category_id: number;
    field_name: string;
    option_value: string;
    rank: number;
    parent_value?: string; // For hierarchical lists
    created_at: string;
    updated_at: string;
}

// Rank Update Request
export interface RankUpdateRequest {
    field: string;
    ranks: RankData[];
    parentId?: string; // For hierarchical child ranks
}

export interface RankData {
    option: string;
    rank: number;
}

// Rank Update Response
export interface RankUpdateResponse {
    success: boolean;
    message: string;
    data?: {
        updated_count: number;
    };
}

// Option Update Request
export interface OptionUpdateRequest {
    field: string;
    options: OptionData[];
    parent_id?: string; // For hierarchical lists
}

export interface OptionData {
    value: string;
    is_active: boolean;
    rank?: number;
}

// Validation Result
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    duplicates: string[];
}

// Modal State
export interface ModalState {
    type: 'rank' | 'edit' | null;
    category: string | null;
    field: string | null;
    parent: string | null;
}

// API Response Types
export interface CategoriesResponse {
    data: Category[];
}

export interface CategoryFieldsResponse {
    data: CategoryField[];
    governorates?: any[];
    makes?: any[];
    supports_make_model?: boolean;
    supports_sections?: boolean;
    main_sections?: any[];
}
