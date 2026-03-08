/**
 * Validation Utility Functions
 * 
 * Provides validation functions for option names, rank sequences, and option lists
 * for the Filters and Lists Management feature.
 */

import { RankData } from '@/types/filters-lists';

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    duplicates: string[];
}

/**
 * Validates an option name
 * 
 * Checks for:
 * - Empty or whitespace-only names
 * - Length constraints (max 255 characters)
 * - Special characters that might break UI (< and >)
 * 
 * @param name - The option name to validate
 * @returns ValidationResult with validation status and error messages
 * 
 * Requirements: 6.34, 6.35
 */
export function validateOptionName(name: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for empty
    if (!name || name.trim().length === 0) {
        errors.push('لا يمكن أن يكون الاسم فارغاً');
    }

    // Check length
    if (name.length > 255) {
        errors.push('الاسم طويل جداً (الحد الأقصى 255 حرف)');
    }

    // Check for special characters that might break UI
    if (name.includes('<') || name.includes('>')) {
        errors.push('الاسم يحتوي على أحرف غير مسموح بها');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        duplicates: [],
    };
}

/**
 * Validates a rank sequence
 * 
 * Checks for:
 * - Sequential values starting from 1 (1, 2, 3, ...)
 * - No duplicate rank values
 * - No gaps in the sequence
 * 
 * @param ranks - Array of rank data to validate
 * @returns ValidationResult with validation status and error messages
 * 
 * Requirements: 8.3, 8.11
 */
export function validateRankSequence(ranks: RankData[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (ranks.length === 0) {
        return {
            valid: true,
            errors,
            warnings,
            duplicates: [],
        };
    }

    const rankValues = ranks.map(r => r.rank).sort((a, b) => a - b);

    // Check for sequential values starting from 1
    for (let i = 0; i < rankValues.length; i++) {
        if (rankValues[i] !== i + 1) {
            errors.push(`الترتيب غير متسلسل: متوقع ${i + 1} لكن وجد ${rankValues[i]}`);
            break;
        }
    }

    // Check for duplicates
    const uniqueRanks = new Set(rankValues);
    if (uniqueRanks.size !== rankValues.length) {
        errors.push('يوجد قيم ترتيب مكررة');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        duplicates: [],
    };
}

/**
 * Validates a list of options
 * 
 * Checks for:
 * - Duplicate option names (case-sensitive)
 * - Empty option values
 * - Invalid option names (using validateOptionName)
 * 
 * @param options - Array of option names to validate
 * @param existingOptions - Optional array of existing options to check against
 * @returns ValidationResult with validation status, error messages, and list of duplicates
 * 
 * Requirements: 6.34
 */
export function validateOptions(
    options: string[],
    existingOptions: string[] = []
): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const duplicates: string[] = [];

    // Check for empty values
    const emptyOptions = options.filter(opt => !opt || opt.trim().length === 0);
    if (emptyOptions.length > 0) {
        errors.push('يوجد خيارات فارغة');
    }

    // Check for duplicates within the new options
    const optionCounts = new Map<string, number>();
    options.forEach(opt => {
        const count = optionCounts.get(opt) || 0;
        optionCounts.set(opt, count + 1);
    });

    optionCounts.forEach((count, opt) => {
        if (count > 1) {
            duplicates.push(opt);
            errors.push(`الخيار "${opt}" مكرر ${count} مرات`);
        }
    });

    // Check for duplicates with existing options
    const existingSet = new Set(existingOptions);
    options.forEach(opt => {
        if (existingSet.has(opt) && !duplicates.includes(opt)) {
            duplicates.push(opt);
            errors.push(`الخيار "${opt}" موجود بالفعل`);
        }
    });

    // Validate each option name
    options.forEach(opt => {
        const nameValidation = validateOptionName(opt);
        if (!nameValidation.valid) {
            errors.push(...nameValidation.errors.map(err => `"${opt}": ${err}`));
        }
    });

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        duplicates,
    };
}
