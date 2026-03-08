/**
 * Property-Based Test for Bulk Input Parsing - Comma Separated
 * 
 * Task 7.4: Write property test for bulk input parsing (comma-separated)
 * **Property 7: Bulk Input Parsing - Comma Separated**
 * **Validates: Requirements 6.18**
 * 
 * Feature: filters-lists-management
 * Spec Path: .kiro/specs/filters-lists-management
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { OptionsHelper, parseBulkInput } from '../optionsHelper';

describe('Property 7: Bulk Input Parsing - Comma Separated', () => {
    /**
     * Property: For any comma-separated string input, the parsing function 
     * should split on commas, trim whitespace from each option, remove empty 
     * strings, and return an array of clean option strings.
     * 
     * This property validates that the parsing function:
     * 1. Splits on commas correctly
     * 2. Trims whitespace from each option
     * 3. Removes empty strings
     * 4. Returns an array of clean option strings
     * 5. Handles edge cases (empty input, only commas, etc.)
     */

    it('Property: يحلل مدخل مفصول بفواصل بشكل صحيح', () => {
        fc.assert(
            fc.property(
                // Generator: array of non-empty strings (options) without commas or newlines
                fc.array(
                    fc.string({ minLength: 1, maxLength: 50 })
                        .filter(str => str.trim().length > 0 && !str.includes(',') && !str.includes('\n')),
                    { minLength: 1, maxLength: 20 }
                ),
                (options) => {
                    // إنشاء مدخل مفصول بفواصل
                    const input = options.join(', ');

                    // تحليل المدخل
                    const result = parseBulkInput(input);

                    // التحقق من أن النتيجة تحتوي على نفس عدد الخيارات
                    expect(result).toHaveLength(options.length);

                    // التحقق من أن كل خيار تم تنظيفه بشكل صحيح
                    result.forEach((option, index) => {
                        expect(option).toBe(options[index].trim());
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: يزيل المسافات الزائدة من كل خيار', () => {
        fc.assert(
            fc.property(
                // Generator: array of strings with potential whitespace (no commas or newlines)
                fc.array(
                    fc.string({ minLength: 1, maxLength: 30 })
                        .filter(str => str.trim().length > 0 && !str.includes(',') && !str.includes('\n')),
                    { minLength: 1, maxLength: 15 }
                ),
                // Generator: whitespace patterns (spaces, tabs)
                fc.constantFrom('', ' ', '  ', '   ', '\t', ' \t '),
                (options, whitespace) => {
                    // إضافة مسافات زائدة قبل وبعد كل خيار
                    const paddedOptions = options.map(opt => `${whitespace}${opt}${whitespace}`);
                    const input = paddedOptions.join(',');

                    // تحليل المدخل
                    const result = parseBulkInput(input);

                    // التحقق من أن كل خيار تم تنظيفه من المسافات
                    result.forEach((option, index) => {
                        expect(option).toBe(options[index].trim());
                        expect(option).not.toMatch(/^\s/); // لا يبدأ بمسافة
                        expect(option).not.toMatch(/\s$/); // لا ينتهي بمسافة
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: يزيل القيم الفارغة من النتيجة', () => {
        fc.assert(
            fc.property(
                // Generator: array of strings (some may be empty after trimming, no commas or newlines)
                fc.array(
                    fc.string({ minLength: 0, maxLength: 30 })
                        .filter(str => !str.includes(',') && !str.includes('\n')),
                    { minLength: 1, maxLength: 20 }
                ),
                (options) => {
                    // إنشاء مدخل مفصول بفواصل
                    const input = options.join(',');

                    // تحليل المدخل
                    const result = parseBulkInput(input);

                    // التحقق من أن النتيجة لا تحتوي على قيم فارغة
                    result.forEach(option => {
                        expect(option.length).toBeGreaterThan(0);
                        expect(option.trim()).toBe(option);
                    });

                    // التحقق من أن عدد النتائج يساوي عدد الخيارات غير الفارغة
                    const nonEmptyOptions = options.filter(opt => opt.trim().length > 0);
                    expect(result).toHaveLength(nonEmptyOptions.length);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: يتعامل مع فواصل متعددة متتالية', () => {
        fc.assert(
            fc.property(
                // Generator: array of non-empty strings (no commas or newlines)
                fc.array(
                    fc.string({ minLength: 1, maxLength: 30 })
                        .filter(str => str.trim().length > 0 && !str.includes(',') && !str.includes('\n')),
                    { minLength: 1, maxLength: 15 }
                ),
                // Generator: number of commas between options
                fc.integer({ min: 1, max: 5 }),
                (options, commaCount) => {
                    // إنشاء مدخل مع فواصل متعددة
                    const separator = ','.repeat(commaCount);
                    const input = options.join(separator);

                    // تحليل المدخل
                    const result = parseBulkInput(input);

                    // التحقق من أن النتيجة تحتوي على نفس الخيارات (بدون قيم فارغة)
                    expect(result).toHaveLength(options.length);
                    result.forEach((option, index) => {
                        expect(option).toBe(options[index].trim());
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: يتعامل مع فواصل في البداية والنهاية', () => {
        fc.assert(
            fc.property(
                // Generator: array of non-empty strings (no commas or newlines)
                fc.array(
                    fc.string({ minLength: 1, maxLength: 30 })
                        .filter(str => str.trim().length > 0 && !str.includes(',') && !str.includes('\n')),
                    { minLength: 1, maxLength: 15 }
                ),
                // Generator: leading and trailing commas
                fc.integer({ min: 0, max: 3 }),
                fc.integer({ min: 0, max: 3 }),
                (options, leadingCommas, trailingCommas) => {
                    // إنشاء مدخل مع فواصل في البداية والنهاية
                    const leading = ','.repeat(leadingCommas);
                    const trailing = ','.repeat(trailingCommas);
                    const input = `${leading}${options.join(',')}${trailing}`;

                    // تحليل المدخل
                    const result = parseBulkInput(input);

                    // التحقق من أن النتيجة تحتوي على نفس الخيارات (بدون قيم فارغة)
                    expect(result).toHaveLength(options.length);
                    result.forEach((option, index) => {
                        expect(option).toBe(options[index].trim());
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: يحافظ على ترتيب الخيارات', () => {
        fc.assert(
            fc.property(
                // Generator: array of unique strings (no commas or newlines)
                fc.uniqueArray(
                    fc.string({ minLength: 1, maxLength: 30 })
                        .filter(str => str.trim().length > 0 && !str.includes(',') && !str.includes('\n')),
                    { minLength: 2, maxLength: 20 }
                ),
                (options) => {
                    // إنشاء مدخل مفصول بفواصل
                    const input = options.join(',');

                    // تحليل المدخل
                    const result = parseBulkInput(input);

                    // التحقق من أن الترتيب محفوظ
                    result.forEach((option, index) => {
                        expect(option).toBe(options[index].trim());
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: يعمل مع نصوص عربية', () => {
        fc.assert(
            fc.property(
                // Generator: array of Arabic strings (no commas or newlines)
                fc.array(
                    fc.stringMatching(/^[\u0600-\u06FF\s]+$/)
                        .filter(str => str.trim().length > 0 && !str.includes(',') && !str.includes('\n')),
                    { minLength: 1, maxLength: 15 }
                ),
                (options) => {
                    // إنشاء مدخل مفصول بفواصل
                    const input = options.join(', ');

                    // تحليل المدخل
                    const result = parseBulkInput(input);

                    // التحقق من أن النتيجة صحيحة
                    expect(result).toHaveLength(options.length);
                    result.forEach((option, index) => {
                        expect(option).toBe(options[index].trim());
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    it('Property: يتعامل مع خيارات تحتوي على أحرف خاصة', () => {
        fc.assert(
            fc.property(
                // Generator: array of strings with special characters
                fc.array(
                    fc.string({ minLength: 1, maxLength: 30 })
                        .filter(str => str.trim().length > 0 && !str.includes(',')),
                    { minLength: 1, maxLength: 15 }
                ),
                (options) => {
                    // إنشاء مدخل مفصول بفواصل
                    const input = options.join(',');

                    // تحليل المدخل
                    const result = parseBulkInput(input);

                    // التحقق من أن الأحرف الخاصة محفوظة
                    result.forEach((option, index) => {
                        expect(option).toBe(options[index].trim());
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    // Unit tests for edge cases
    describe('Edge Cases', () => {
        it('يتعامل مع مدخل فارغ', () => {
            const result = parseBulkInput('');
            expect(result).toEqual([]);
        });

        it('يتعامل مع مدخل يحتوي على فواصل فقط', () => {
            const result = parseBulkInput(',,,');
            expect(result).toEqual([]);
        });

        it('يتعامل مع مدخل يحتوي على مسافات وفواصل فقط', () => {
            const result = parseBulkInput('  ,  ,  ,  ');
            expect(result).toEqual([]);
        });

        it('يحلل خيار واحد بدون فاصل', () => {
            const result = parseBulkInput('single option');
            expect(result).toEqual(['single option']);
        });

        it('يحلل خيارين مفصولين بفاصلة', () => {
            const result = parseBulkInput('option1,option2');
            expect(result).toEqual(['option1', 'option2']);
        });

        it('يزيل المسافات الزائدة', () => {
            const result = parseBulkInput('  option1  ,  option2  ,  option3  ');
            expect(result).toEqual(['option1', 'option2', 'option3']);
        });

        it('يزيل القيم الفارغة بين الفواصل', () => {
            const result = parseBulkInput('option1, , option2, , option3');
            expect(result).toEqual(['option1', 'option2', 'option3']);
        });

        it('يتعامل مع فواصل في البداية', () => {
            const result = parseBulkInput(',,,option1,option2');
            expect(result).toEqual(['option1', 'option2']);
        });

        it('يتعامل مع فواصل في النهاية', () => {
            const result = parseBulkInput('option1,option2,,,');
            expect(result).toEqual(['option1', 'option2']);
        });

        it('يتعامل مع فواصل في البداية والنهاية', () => {
            const result = parseBulkInput(',,,option1,option2,,,');
            expect(result).toEqual(['option1', 'option2']);
        });

        it('يتعامل مع null', () => {
            const result = parseBulkInput(null as any);
            expect(result).toEqual([]);
        });

        it('يتعامل مع undefined', () => {
            const result = parseBulkInput(undefined as any);
            expect(result).toEqual([]);
        });
    });

    // Real-world scenarios
    describe('Real-world Scenarios', () => {
        it('سيناريو: إضافة سنوات السيارات', () => {
            const input = '2024, 2023, 2022, 2021, 2020';
            const result = parseBulkInput(input);
            expect(result).toEqual(['2024', '2023', '2022', '2021', '2020']);
        });

        it('سيناريو: إضافة أنواع الوقود', () => {
            const input = 'بنزين, ديزل, كهرباء, هايبرد';
            const result = parseBulkInput(input);
            expect(result).toEqual(['بنزين', 'ديزل', 'كهرباء', 'هايبرد']);
        });

        it('سيناريو: إضافة موديلات السيارات', () => {
            const input = 'كامري, كورولا, راف فور, يارس';
            const result = parseBulkInput(input);
            expect(result).toEqual(['كامري', 'كورولا', 'راف فور', 'يارس']);
        });

        it('سيناريو: إضافة محافظات', () => {
            const input = 'القاهرة, الجيزة, الإسكندرية, الشرقية';
            const result = parseBulkInput(input);
            expect(result).toEqual(['القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية']);
        });

        it('سيناريو: إضافة مع مسافات زائدة', () => {
            const input = '  خيار1  ,  خيار2  ,  خيار3  ';
            const result = parseBulkInput(input);
            expect(result).toEqual(['خيار1', 'خيار2', 'خيار3']);
        });

        it('سيناريو: إضافة مع فواصل متعددة', () => {
            const input = 'option1,,,option2,,option3';
            const result = parseBulkInput(input);
            expect(result).toEqual(['option1', 'option2', 'option3']);
        });

        it('سيناريو: إضافة مع خيارات تحتوي على أرقام وأحرف', () => {
            const input = 'C-Class, E-Class, S-Class, GLE 350';
            const result = parseBulkInput(input);
            expect(result).toEqual(['C-Class', 'E-Class', 'S-Class', 'GLE 350']);
        });

        it('سيناريو: إضافة مع خيارات تحتوي على أحرف خاصة', () => {
            const input = 'Option #1, Option @2, Option $3';
            const result = parseBulkInput(input);
            expect(result).toEqual(['Option #1', 'Option @2', 'Option $3']);
        });
    });

    // Integration with OptionsHelper class
    describe('Integration with OptionsHelper', () => {
        it('OptionsHelper.parseBulkInput يعمل بشكل صحيح', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.string({ minLength: 1, maxLength: 30 })
                            .filter(str => str.trim().length > 0 && !str.includes(',') && !str.includes('\n')),
                        { minLength: 1, maxLength: 15 }
                    ),
                    (options) => {
                        const input = options.join(', ');
                        const result = OptionsHelper.parseBulkInput(input);

                        expect(result).toHaveLength(options.length);
                        result.forEach((option, index) => {
                            expect(option).toBe(options[index].trim());
                        });
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});
