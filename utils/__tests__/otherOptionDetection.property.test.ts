/**
 * Property-Based Test for "غير ذلك" Detection
 * 
 * Task 7.2: Write property test for "غير ذلك" detection
 * **Property 12: "غير ذلك" Detection**
 * **Validates: Requirements 7.1**
 * 
 * Feature: filters-lists-management
 * Spec Path: .kiro/specs/filters-lists-management
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { OptionsHelper, OTHER_OPTION } from '../optionsHelper';

describe('Property 12: "غير ذلك" Detection', () => {
    /**
     * Property: For any array of option strings, the system should correctly 
     * identify whether "غير ذلك" is present in the array, returning true if 
     * found and false otherwise.
     * 
     * This property validates that the detection function:
     * 1. Returns true when "غير ذلك" is present at any position
     * 2. Returns false when "غير ذلك" is not present
     * 3. Handles edge cases (empty arrays, null, undefined)
     * 4. Works correctly regardless of array size or content
     */

    it('Property: يكتشف "غير ذلك" بشكل صحيح في أي موضع من القائمة', () => {
        fc.assert(
            fc.property(
                // Generator: قائمة من الخيارات مع أو بدون "غير ذلك"
                fc.array(fc.string({ minLength: 1, maxLength: 20 })),
                fc.boolean(),
                (options, shouldIncludeOther) => {
                    // إزالة أي "غير ذلك" موجود في القائمة المولدة عشوائياً
                    const cleanedOptions = options.filter(opt => opt !== OTHER_OPTION);

                    // إضافة "غير ذلك" بناءً على shouldIncludeOther
                    const testOptions = shouldIncludeOther
                        ? [...cleanedOptions, OTHER_OPTION]
                        : cleanedOptions;

                    // التحقق من الخاصية
                    const result = OptionsHelper.detectOtherOption(testOptions);

                    // يجب أن يكون النتيجة مطابقة لـ shouldIncludeOther
                    expect(result).toBe(shouldIncludeOther);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: يكتشف "غير ذلك" في أي موضع (بداية، منتصف، نهاية)', () => {
        fc.assert(
            fc.property(
                // Generator: قائمة من الخيارات
                fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 50 }),
                // موضع إدراج "غير ذلك"
                fc.integer({ min: 0, max: 100 }),
                (options, insertPosition) => {
                    // إزالة أي "غير ذلك" موجود
                    const cleanedOptions = options.filter(opt => opt !== OTHER_OPTION);

                    if (cleanedOptions.length === 0) {
                        // حالة خاصة: قائمة فارغة
                        const testOptions = [OTHER_OPTION];
                        expect(OptionsHelper.detectOtherOption(testOptions)).toBe(true);
                        return;
                    }

                    // إدراج "غير ذلك" في موضع عشوائي
                    const position = insertPosition % (cleanedOptions.length + 1);
                    const testOptions = [
                        ...cleanedOptions.slice(0, position),
                        OTHER_OPTION,
                        ...cleanedOptions.slice(position)
                    ];

                    // يجب أن يكتشف "غير ذلك" بغض النظر عن موضعه
                    expect(OptionsHelper.detectOtherOption(testOptions)).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: يعيد false عندما لا يكون "غير ذلك" موجوداً', () => {
        fc.assert(
            fc.property(
                // Generator: قائمة من الخيارات بدون "غير ذلك"
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 })
                        .filter(str => str !== OTHER_OPTION)
                ),
                (options) => {
                    // التحقق من أن "غير ذلك" غير موجود
                    const result = OptionsHelper.detectOtherOption(options);
                    expect(result).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: يكتشف "غير ذلك" حتى مع وجود نسخ متعددة', () => {
        fc.assert(
            fc.property(
                // Generator: قائمة من الخيارات
                fc.array(fc.string({ minLength: 1, maxLength: 20 })),
                // عدد نسخ "غير ذلك" المراد إضافتها
                fc.integer({ min: 1, max: 5 }),
                (options, otherCount) => {
                    // إزالة أي "غير ذلك" موجود
                    const cleanedOptions = options.filter(opt => opt !== OTHER_OPTION);

                    // إضافة نسخ متعددة من "غير ذلك"
                    const testOptions = [
                        ...cleanedOptions,
                        ...Array(otherCount).fill(OTHER_OPTION)
                    ];

                    // يجب أن يكتشف "غير ذلك" حتى مع وجود نسخ متعددة
                    expect(OptionsHelper.detectOtherOption(testOptions)).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: يتعامل مع قوائم كبيرة بكفاءة', () => {
        fc.assert(
            fc.property(
                // Generator: قائمة كبيرة من الخيارات
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 })
                        .filter(str => str !== OTHER_OPTION),
                    { minLength: 100, maxLength: 1000 }
                ),
                fc.boolean(),
                (options, shouldIncludeOther) => {
                    const testOptions = shouldIncludeOther
                        ? [...options, OTHER_OPTION]
                        : options;

                    const result = OptionsHelper.detectOtherOption(testOptions);
                    expect(result).toBe(shouldIncludeOther);
                }
            ),
            { numRuns: 50 } // عدد أقل من التكرارات للقوائم الكبيرة
        );
    });

    // Unit tests for edge cases
    describe('Edge Cases', () => {
        it('يتعامل مع قائمة فارغة', () => {
            const result = OptionsHelper.detectOtherOption([]);
            expect(result).toBe(false);
        });

        it('يتعامل مع قائمة تحتوي فقط على "غير ذلك"', () => {
            const result = OptionsHelper.detectOtherOption([OTHER_OPTION]);
            expect(result).toBe(true);
        });

        it('يتعامل مع قائمة تحتوي على نسخ متعددة من "غير ذلك"', () => {
            const result = OptionsHelper.detectOtherOption([
                OTHER_OPTION,
                'option1',
                OTHER_OPTION,
                'option2',
                OTHER_OPTION
            ]);
            expect(result).toBe(true);
        });

        it('يكتشف "غير ذلك" في البداية', () => {
            const result = OptionsHelper.detectOtherOption([
                OTHER_OPTION,
                'option1',
                'option2'
            ]);
            expect(result).toBe(true);
        });

        it('يكتشف "غير ذلك" في المنتصف', () => {
            const result = OptionsHelper.detectOtherOption([
                'option1',
                OTHER_OPTION,
                'option2'
            ]);
            expect(result).toBe(true);
        });

        it('يكتشف "غير ذلك" في النهاية', () => {
            const result = OptionsHelper.detectOtherOption([
                'option1',
                'option2',
                OTHER_OPTION
            ]);
            expect(result).toBe(true);
        });

        it('يعيد false لقائمة بدون "غير ذلك"', () => {
            const result = OptionsHelper.detectOtherOption([
                'option1',
                'option2',
                'option3'
            ]);
            expect(result).toBe(false);
        });

        it('يتعامل مع خيارات مشابهة لـ "غير ذلك"', () => {
            const result = OptionsHelper.detectOtherOption([
                'غير',
                'ذلك',
                'غير ذلك ',  // مسافة زائدة
                ' غير ذلك',  // مسافة في البداية
                'غيرذلك'     // بدون مسافة
            ]);
            // يجب أن يعيد false لأن لا شيء يطابق "غير ذلك" بالضبط
            expect(result).toBe(false);
        });

        it('يكتشف "غير ذلك" بالضبط (case-sensitive)', () => {
            const result = OptionsHelper.detectOtherOption([
                'option1',
                OTHER_OPTION,
                'option2'
            ]);
            expect(result).toBe(true);
        });

        it('يتعامل مع مدخل غير صحيح (null)', () => {
            const result = OptionsHelper.detectOtherOption(null as any);
            expect(result).toBe(false);
        });

        it('يتعامل مع مدخل غير صحيح (undefined)', () => {
            const result = OptionsHelper.detectOtherOption(undefined as any);
            expect(result).toBe(false);
        });

        it('يتعامل مع قائمة تحتوي على قيم null و undefined', () => {
            const result = OptionsHelper.detectOtherOption([
                'option1',
                null as any,
                undefined as any,
                OTHER_OPTION,
                'option2'
            ]);
            expect(result).toBe(true);
        });
    });

    // Real-world scenarios
    describe('Real-world Scenarios', () => {
        it('سيناريو: قائمة سنوات السيارات', () => {
            const years = ['2024', '2023', '2022', '2021', OTHER_OPTION];
            expect(OptionsHelper.detectOtherOption(years)).toBe(true);
        });

        it('سيناريو: قائمة أنواع الوقود بدون "غير ذلك"', () => {
            const fuels = ['بنزين', 'ديزل', 'كهرباء', 'هايبرد'];
            expect(OptionsHelper.detectOtherOption(fuels)).toBe(false);
        });

        it('سيناريو: قائمة موديلات السيارات', () => {
            const models = ['كامري', 'كورولا', 'راف فور', OTHER_OPTION];
            expect(OptionsHelper.detectOtherOption(models)).toBe(true);
        });

        it('سيناريو: قائمة محافظات', () => {
            const governorates = ['القاهرة', 'الجيزة', 'الإسكندرية', OTHER_OPTION];
            expect(OptionsHelper.detectOtherOption(governorates)).toBe(true);
        });

        it('سيناريو: قائمة تخصصات وظيفية', () => {
            const specialties = ['مطور ويب', 'مطور موبايل', 'مهندس DevOps'];
            expect(OptionsHelper.detectOtherOption(specialties)).toBe(false);
        });
    });
});
