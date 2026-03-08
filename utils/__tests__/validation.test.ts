/**
 * Unit Tests for Validation Functions
 * 
 * Tests for validateOptionName, validateRankSequence, and validateOptions
 * 
 * Requirements: 6.34, 8.3, 8.11
 */

import { describe, it, expect } from 'vitest';
import { validateOptionName, validateRankSequence, validateOptions } from '../validation';
import { RankData } from '@/types/filters-lists';

describe('validateOptionName', () => {
    it('should accept valid option names', () => {
        const result = validateOptionName('جديد');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should reject empty names', () => {
        const result = validateOptionName('');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('لا يمكن أن يكون الاسم فارغاً');
    });

    it('should reject whitespace-only names', () => {
        const result = validateOptionName('   ');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('لا يمكن أن يكون الاسم فارغاً');
    });

    it('should reject names longer than 255 characters', () => {
        const longName = 'a'.repeat(256);
        const result = validateOptionName(longName);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('الاسم طويل جداً (الحد الأقصى 255 حرف)');
    });

    it('should accept names with exactly 255 characters', () => {
        const maxName = 'a'.repeat(255);
        const result = validateOptionName(maxName);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should reject names with < character', () => {
        const result = validateOptionName('test<script>');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('الاسم يحتوي على أحرف غير مسموح بها');
    });

    it('should reject names with > character', () => {
        const result = validateOptionName('test>alert');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('الاسم يحتوي على أحرف غير مسموح بها');
    });

    it('should accept names with Arabic characters', () => {
        const result = validateOptionName('مستعمل - حالة جيدة');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should accept names with numbers and special characters (except < >)', () => {
        const result = validateOptionName('Option-123_test@domain.com');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
});

describe('validateRankSequence', () => {
    it('should accept valid sequential ranks starting from 1', () => {
        const ranks: RankData[] = [
            { option: 'جديد', rank: 1 },
            { option: 'مستعمل', rank: 2 },
            { option: 'غير ذلك', rank: 3 },
        ];
        const result = validateRankSequence(ranks);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should accept empty rank array', () => {
        const result = validateRankSequence([]);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should reject ranks not starting from 1', () => {
        const ranks: RankData[] = [
            { option: 'جديد', rank: 2 },
            { option: 'مستعمل', rank: 3 },
        ];
        const result = validateRankSequence(ranks);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('الترتيب غير متسلسل');
    });

    it('should reject ranks with gaps', () => {
        const ranks: RankData[] = [
            { option: 'جديد', rank: 1 },
            { option: 'مستعمل', rank: 3 }, // Gap: missing rank 2
        ];
        const result = validateRankSequence(ranks);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('الترتيب غير متسلسل');
    });

    it('should reject duplicate ranks', () => {
        const ranks: RankData[] = [
            { option: 'جديد', rank: 1 },
            { option: 'مستعمل', rank: 1 }, // Duplicate rank
            { option: 'غير ذلك', rank: 2 },
        ];
        const result = validateRankSequence(ranks);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('يوجد قيم ترتيب مكررة');
    });

    it('should handle unsorted rank arrays', () => {
        const ranks: RankData[] = [
            { option: 'غير ذلك', rank: 3 },
            { option: 'جديد', rank: 1 },
            { option: 'مستعمل', rank: 2 },
        ];
        const result = validateRankSequence(ranks);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should reject ranks with multiple errors', () => {
        const ranks: RankData[] = [
            { option: 'جديد', rank: 2 }, // Not starting from 1
            { option: 'مستعمل', rank: 2 }, // Duplicate
        ];
        const result = validateRankSequence(ranks);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });
});

describe('validateOptions', () => {
    it('should accept valid unique options', () => {
        const options = ['جديد', 'مستعمل', 'غير ذلك'];
        const result = validateOptions(options);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.duplicates).toHaveLength(0);
    });

    it('should reject empty options', () => {
        const options = ['جديد', '', 'مستعمل'];
        const result = validateOptions(options);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('يوجد خيارات فارغة');
    });

    it('should detect duplicates within new options', () => {
        const options = ['جديد', 'مستعمل', 'جديد'];
        const result = validateOptions(options);
        expect(result.valid).toBe(false);
        expect(result.duplicates).toContain('جديد');
        expect(result.errors.some(err => err.includes('جديد') && err.includes('مكرر'))).toBe(true);
    });

    it('should detect duplicates with existing options', () => {
        const options = ['ممتاز', 'جيد'];
        const existingOptions = ['جديد', 'مستعمل', 'ممتاز'];
        const result = validateOptions(options, existingOptions);
        expect(result.valid).toBe(false);
        expect(result.duplicates).toContain('ممتاز');
        expect(result.errors.some(err => err.includes('ممتاز') && err.includes('موجود بالفعل'))).toBe(true);
    });

    it('should validate each option name', () => {
        const options = ['جديد', 'test<script>', 'مستعمل'];
        const result = validateOptions(options);
        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('test<script>') && err.includes('أحرف غير مسموح بها'))).toBe(true);
    });

    it('should handle empty array', () => {
        const result = validateOptions([]);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should detect multiple duplicates', () => {
        const options = ['جديد', 'مستعمل', 'جديد', 'مستعمل', 'ممتاز'];
        const result = validateOptions(options);
        expect(result.valid).toBe(false);
        expect(result.duplicates).toContain('جديد');
        expect(result.duplicates).toContain('مستعمل');
    });

    it('should count duplicate occurrences', () => {
        const options = ['جديد', 'جديد', 'جديد'];
        const result = validateOptions(options);
        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('جديد') && err.includes('3 مرات'))).toBe(true);
    });

    it('should handle whitespace-only options', () => {
        const options = ['جديد', '   ', 'مستعمل'];
        const result = validateOptions(options);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('يوجد خيارات فارغة');
    });

    it('should validate options with long names', () => {
        const longName = 'a'.repeat(256);
        const options = ['جديد', longName];
        const result = validateOptions(options);
        expect(result.valid).toBe(false);
        expect(result.errors.some(err => err.includes('طويل جداً'))).toBe(true);
    });

    it('should be case-sensitive for duplicates', () => {
        const options = ['جديد', 'جديد'];
        const result = validateOptions(options);
        // These are exact duplicates, so should be detected
        expect(result.valid).toBe(false);
        expect(result.duplicates).toContain('جديد');
    });

    it('should handle complex validation scenarios', () => {
        const options = ['جديد', '', 'مستعمل', 'جديد', 'test<script>'];
        const existingOptions = ['مستعمل'];
        const result = validateOptions(options, existingOptions);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.duplicates.length).toBeGreaterThan(0);
    });
});
