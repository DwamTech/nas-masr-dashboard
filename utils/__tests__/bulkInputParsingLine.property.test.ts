/**
 * Property-Based Test for Bulk Input Parsing - Line Separated
 * 
 * Task 7.5: Write property test for bulk input parsing (line-separated)
 * **Property 8: Bulk Input Parsing - Line Separated**
 * **Validates: Requirements 6.19**
 * 
 * Feature: filters-lists-management
 * Spec Path: .kiro/specs/filters-lists-management
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { OptionsHelper, parseBulkInput } from '../optionsHelper';

describe('Property 8: Bulk Input Parsing - Line Separated', () => {
    /**
     * Property: For any line-separated string input (newline delimited), 
     * the parsing function should split on newlines, trim whitespace from 
     * each option, remove empty strings, and return an array of clean option strings.
     * 
     * This property validates that the parsing function:
     * 1. Splits on newlines correctly (\n and \r\n)
     * 2. Trims whitespace from each option
     * 3. Removes empty strings
     * 4. Returns an array of clean option strings
     * 5. Handles edge cases (empty input, only newlines, etc.)
     */

    it('Property: يحلل مدخل مفصول بأسطر جديدة بشكل صحيح', () => {
        fc.assert(
            fc.property(
                // Generator: array of non-empty strings (options) without newlines or commas
                fc.array(
                    fc.string({ minLength: 1, maxLength: 50 })
                        .filter(str => str.trim().length > 0 && !str.includes('\n') && !str.includes('\r') && !str.includes(',')),
                    { minLength: 1, maxLength: 20 }
                ),
                (options) => {
                    // إنشاء مدخل مفصول بأسطر جديدة
                    const input = options.join('\n');

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

    it('Property: يتعامل مع أسطر جديدة من نوع CRLF (\\r\\n)', () => {
        fc.assert(
            fc.property(
                // Generator: array of non-empty strings (options) without newlines or commas
                fc.array(
                    fc.string({ minLength: 1, maxLength: 50 })
                        .filter(str => str.trim().length > 0 && !str.includes('\n') && !str.includes('\r') && !str.includes(',')),
                    { minLength: 1, maxLength: 20 }
                ),
                (options) => {
                    // إنشاء مدخل مفصول بأسطر جديدة من نوع CRLF (Windows)
                    const input = options.join('\r\n');

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
                // Generator: array of strings with potential whitespace (no newlines or commas)
                fc.array(
                    fc.string({ minLength: 1, maxLength: 30 })
                        .filter(str => str.trim().length > 0 && !str.includes('\n') && !str.includes('\r') && !str.includes(',')),
                    { minLength: 1, maxLength: 15 }
                ),
                // Generator: whitespace patterns (spaces, tabs)
                fc.constantFrom('', ' ', '  ', '   ', '\t', ' \t '),
                (options, whitespace) => {
                    // إضافة مسافات زائدة قبل وبعد كل خيار
                    const paddedOptions = options.map(opt => `${whitespace}${opt}${whitespace}`);
                    const input = paddedOptions.join('\n');

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
                // Generator: array of strings (some may be empty after trimming, no newlines)
                fc.array(
                    fc.string({ minLength: 0, maxLength: 30 })
                        .filter(str => !str.includes('\n') && !str.includes('\r')),
                    { minLength: 1, maxLength: 20 }
                ),
                (options) => {
                    // إنشاء مدخل مفصول بأسطر جديدة
                    const input = options.join('\n');

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

    it('Property: يتعامل مع أسطر جديدة متعددة متتالية', () => {
        fc.assert(
            fc.property(
                // Generator: array of non-empty strings (no newlines or commas)
                fc.array(
                    fc.string({ minLength: 1, maxLength: 30 })
                        .filter(str => str.trim().length > 0 && !str.includes('\n') && !str.includes('\r') && !str.includes(',')),
                    { minLength: 1, maxLength: 15 }
                ),
                // Generator: number of newlines between options
                fc.integer({ min: 1, max: 5 }),
                (options, newlineCount) => {
                    // إنشاء مدخل مع أسطر جديدة متعددة
                    const separator = '\n'.repeat(newlineCount);
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

    it('Property: يتعامل مع أسطر جديدة في البداية والنهاية', () => {
        fc.assert(
            fc.property(
                // Generator: array of non-empty strings (no newlines or commas)
                fc.array(
                    fc.string({ minLength: 1, maxLength: 30 })
                        .filter(str => str.trim().length > 0 && !str.includes('\n') && !str.includes('\r') && !str.includes(',')),
                    { minLength: 1, maxLength: 15 }
                ),
                // Generator: leading and trailing newlines
                fc.integer({ min: 0, max: 3 }),
                fc.integer({ min: 0, max: 3 }),
                (options, leadingNewlines, trailingNewlines) => {
                    // إنشاء مدخل مع أسطر جديدة في البداية والنهاية
                    const leading = '\n'.repeat(leadingNewlines);
                    const trailing = '\n'.repeat(trailingNewlines);
                    const input = `${leading}${options.join('\n')}${trailing}`;

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
                // Generator: array of unique strings (no newlines or commas)
                fc.uniqueArray(
                    fc.string({ minLength: 1, maxLength: 30 })
                        .filter(str => str.trim().length > 0 && !str.includes('\n') && !str.includes('\r') && !str.includes(',')),
                    { minLength: 2, maxLength: 20 }
                ),
                (options) => {
                    // إنشاء مدخل مفصول بأسطر جديدة
                    const input = options.join('\n');

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
                // Generator: array of Arabic strings (no newlines)
                fc.array(
                    fc.stringMatching(/^[\u0600-\u06FF\s]+$/)
                        .filter(str => str.trim().length > 0 && !str.includes('\n') && !str.includes('\r')),
                    { minLength: 1, maxLength: 15 }
                ),
                (options) => {
                    // إنشاء مدخل مفصول بأسطر جديدة
                    const input = options.join('\n');

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
                // Generator: array of strings with special characters (no newlines or commas)
                fc.array(
                    fc.string({ minLength: 1, maxLength: 30 })
                        .filter(str => str.trim().length > 0 && !str.includes('\n') && !str.includes('\r') && !str.includes(',')),
                    { minLength: 1, maxLength: 15 }
                ),
                (options) => {
                    // إنشاء مدخل مفصول بأسطر جديدة
                    const input = options.join('\n');

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

    it('Property: يتعامل مع خيارات تحتوي على فواصل', () => {
        fc.assert(
            fc.property(
                // Generator: array of strings that may contain commas (no newlines)
                fc.array(
                    fc.string({ minLength: 1, maxLength: 30 })
                        .filter(str => str.trim().length > 0 && !str.includes('\n') && !str.includes('\r')),
                    { minLength: 1, maxLength: 15 }
                ),
                (options) => {
                    // إنشاء مدخل مفصول بأسطر جديدة (قد تحتوي الخيارات على فواصل)
                    const input = options.join('\n');

                    // تحليل المدخل
                    const result = parseBulkInput(input);

                    // التحقق من أن الفواصل داخل الخيارات محفوظة
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

        it('يتعامل مع مدخل يحتوي على أسطر جديدة فقط', () => {
            const result = parseBulkInput('\n\n\n');
            expect(result).toEqual([]);
        });

        it('يتعامل مع مدخل يحتوي على مسافات وأسطر جديدة فقط', () => {
            const result = parseBulkInput('  \n  \n  \n  ');
            expect(result).toEqual([]);
        });

        it('يحلل خيار واحد بدون سطر جديد', () => {
            const result = parseBulkInput('single option');
            expect(result).toEqual(['single option']);
        });

        it('يحلل خيارين مفصولين بسطر جديد', () => {
            const result = parseBulkInput('option1\noption2');
            expect(result).toEqual(['option1', 'option2']);
        });

        it('يحلل خيارين مفصولين بـ CRLF', () => {
            const result = parseBulkInput('option1\r\noption2');
            expect(result).toEqual(['option1', 'option2']);
        });

        it('يزيل المسافات الزائدة', () => {
            const result = parseBulkInput('  option1  \n  option2  \n  option3  ');
            expect(result).toEqual(['option1', 'option2', 'option3']);
        });

        it('يزيل الأسطر الفارغة', () => {
            const result = parseBulkInput('option1\n\noption2\n\noption3');
            expect(result).toEqual(['option1', 'option2', 'option3']);
        });

        it('يتعامل مع أسطر جديدة في البداية', () => {
            const result = parseBulkInput('\n\n\noption1\noption2');
            expect(result).toEqual(['option1', 'option2']);
        });

        it('يتعامل مع أسطر جديدة في النهاية', () => {
            const result = parseBulkInput('option1\noption2\n\n\n');
            expect(result).toEqual(['option1', 'option2']);
        });

        it('يتعامل مع أسطر جديدة في البداية والنهاية', () => {
            const result = parseBulkInput('\n\n\noption1\noption2\n\n\n');
            expect(result).toEqual(['option1', 'option2']);
        });

        it('يتعامل مع أسطر تحتوي على مسافات فقط', () => {
            const result = parseBulkInput('option1\n   \noption2\n\t\noption3');
            expect(result).toEqual(['option1', 'option2', 'option3']);
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
        it('سيناريو: إضافة سنوات السيارات (سطر لكل سنة)', () => {
            const input = '2024\n2023\n2022\n2021\n2020';
            const result = parseBulkInput(input);
            expect(result).toEqual(['2024', '2023', '2022', '2021', '2020']);
        });

        it('سيناريو: إضافة أنواع الوقود (سطر لكل نوع)', () => {
            const input = 'بنزين\nديزل\nكهرباء\nهايبرد';
            const result = parseBulkInput(input);
            expect(result).toEqual(['بنزين', 'ديزل', 'كهرباء', 'هايبرد']);
        });

        it('سيناريو: إضافة موديلات السيارات (سطر لكل موديل)', () => {
            const input = 'كامري\nكورولا\nراف فور\nيارس';
            const result = parseBulkInput(input);
            expect(result).toEqual(['كامري', 'كورولا', 'راف فور', 'يارس']);
        });

        it('سيناريو: إضافة محافظات (سطر لكل محافظة)', () => {
            const input = 'القاهرة\nالجيزة\nالإسكندرية\nالشرقية';
            const result = parseBulkInput(input);
            expect(result).toEqual(['القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية']);
        });

        it('سيناريو: إضافة مع مسافات زائدة', () => {
            const input = '  خيار1  \n  خيار2  \n  خيار3  ';
            const result = parseBulkInput(input);
            expect(result).toEqual(['خيار1', 'خيار2', 'خيار3']);
        });

        it('سيناريو: إضافة مع أسطر فارغة متعددة', () => {
            const input = 'option1\n\n\noption2\n\noption3';
            const result = parseBulkInput(input);
            expect(result).toEqual(['option1', 'option2', 'option3']);
        });

        it('سيناريو: إضافة مع خيارات تحتوي على أرقام وأحرف', () => {
            const input = 'C-Class\nE-Class\nS-Class\nGLE 350';
            const result = parseBulkInput(input);
            expect(result).toEqual(['C-Class', 'E-Class', 'S-Class', 'GLE 350']);
        });

        it('سيناريو: إضافة مع خيارات تحتوي على أحرف خاصة', () => {
            const input = 'Option #1\nOption @2\nOption $3';
            const result = parseBulkInput(input);
            expect(result).toEqual(['Option #1', 'Option @2', 'Option $3']);
        });

        it('سيناريو: إضافة من نسخ ولصق من Excel (CRLF)', () => {
            const input = 'خيار1\r\nخيار2\r\nخيار3\r\nخيار4';
            const result = parseBulkInput(input);
            expect(result).toEqual(['خيار1', 'خيار2', 'خيار3', 'خيار4']);
        });

        it('سيناريو: إضافة خيارات تحتوي على فواصل', () => {
            const input = 'Option 1, with comma\nOption 2, also with comma\nOption 3';
            const result = parseBulkInput(input);
            expect(result).toEqual(['Option 1, with comma', 'Option 2, also with comma', 'Option 3']);
        });

        it('سيناريو: إضافة مدن بأسماء مركبة', () => {
            const input = 'مدينة نصر\nالمعادي الجديدة\nالقاهرة الجديدة\n6 أكتوبر';
            const result = parseBulkInput(input);
            expect(result).toEqual(['مدينة نصر', 'المعادي الجديدة', 'القاهرة الجديدة', '6 أكتوبر']);
        });
    });

    // Integration with OptionsHelper class
    describe('Integration with OptionsHelper', () => {
        it('OptionsHelper.parseBulkInput يعمل بشكل صحيح مع أسطر جديدة', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.string({ minLength: 1, maxLength: 30 })
                            .filter(str => str.trim().length > 0 && !str.includes('\n') && !str.includes('\r') && !str.includes(',')),
                        { minLength: 1, maxLength: 15 }
                    ),
                    (options) => {
                        const input = options.join('\n');
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

        it('OptionsHelper.parseBulkInput يعمل بشكل صحيح مع CRLF', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.string({ minLength: 1, maxLength: 30 })
                            .filter(str => str.trim().length > 0 && !str.includes('\n') && !str.includes('\r') && !str.includes(',')),
                        { minLength: 1, maxLength: 15 }
                    ),
                    (options) => {
                        const input = options.join('\r\n');
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
