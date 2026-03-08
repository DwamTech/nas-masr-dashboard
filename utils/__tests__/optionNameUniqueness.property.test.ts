/**
 * Property-Based Test for Option Name Uniqueness Validation
 * 
 * Task 7.6: Write property test for option name uniqueness validation
 * **Property 11: Option Name Uniqueness Validation**
 * **Validates: Requirements 6.34**
 * 
 * Feature: filters-lists-management
 * Spec Path: .kiro/specs/filters-lists-management
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { OptionsHelper, ValidationResult } from '../optionsHelper';

describe('Property 11: Option Name Uniqueness Validation', () => {
    /**
     * Property: For any field, all option names within that field must be unique 
     * (case-sensitive), and the validation function should reject any attempt to 
     * add or edit an option that would create a duplicate name.
     * 
     * This property validates that the validateOptions function:
     * 1. Detects duplicates within the new options array
     * 2. Detects duplicates between new options and existing options
     * 3. Returns validation results with error messages
     * 4. Handles case-sensitive comparison
     * 5. Trims whitespace before comparison
     */

    it('Property: يكتشف التكرارات داخل مصفوفة الخيارات الجديدة', () => {
        fc.assert(
            fc.property(
                // Generator: خيار واحد سيتم تكراره (غير فارغ بعد trim)
                fc.string({ minLength: 1, maxLength: 20 })
                    .filter(s => s.trim().length > 0),
                // Generator: عدد التكرارات
                fc.integer({ min: 2, max: 5 }),
                // Generator: خيارات إضافية فريدة
                fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
                (duplicateOption, duplicateCount, otherOptions) => {
                    // إنشاء قائمة تحتوي على تكرارات
                    const duplicates = Array(duplicateCount).fill(duplicateOption);
                    // إزالة أي تكرارات من الخيارات الأخرى
                    const uniqueOthers = otherOptions.filter(opt => opt !== duplicateOption);
                    const testOptions = [...duplicates, ...uniqueOthers];

                    // التحقق من الخاصية
                    const result = OptionsHelper.validateOptions(testOptions, []);

                    // يجب أن تكون النتيجة غير صالحة
                    expect(result.valid).toBe(false);
                    // يجب أن تحتوي على أخطاء
                    expect(result.errors.length).toBeGreaterThan(0);
                    // يجب أن تحتوي على الخيار المكرر في قائمة التكرارات (بعد trim)
                    expect(result.duplicates).toContain(duplicateOption.trim());
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: يكتشف التكرارات بين الخيارات الجديدة والموجودة', () => {
        fc.assert(
            fc.property(
                // Generator: خيارات موجودة (غير فارغة بعد trim)
                fc.array(
                    fc.string({ minLength: 1, maxLength: 20 })
                        .filter(s => s.trim().length > 0),
                    { minLength: 1, maxLength: 10 }
                ),
                // Generator: خيارات جديدة (بعضها مكرر من الموجودة)
                fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
                (existingOptions, newOptions) => {
                    // إزالة التكرارات من الخيارات الموجودة
                    const uniqueExisting = Array.from(new Set(existingOptions.map(s => s.trim())));

                    if (uniqueExisting.length === 0) {
                        return; // تخطي الحالة الفارغة
                    }

                    // اختيار خيار واحد على الأقل من الموجودة لإضافته للجديدة
                    const duplicateOption = uniqueExisting[0];
                    const testNewOptions = [duplicateOption, ...newOptions];

                    // التحقق من الخاصية
                    const result = OptionsHelper.validateOptions(testNewOptions, uniqueExisting);

                    // يجب أن تكون النتيجة غير صالحة
                    expect(result.valid).toBe(false);
                    // يجب أن تحتوي على أخطاء
                    expect(result.errors.length).toBeGreaterThan(0);
                    // يجب أن تحتوي على الخيار المكرر في قائمة التكرارات
                    expect(result.duplicates).toContain(duplicateOption);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: يقبل الخيارات الفريدة بدون تكرارات', () => {
        fc.assert(
            fc.property(
                // Generator: خيارات فريدة (غير فارغة بعد trim)
                fc.uniqueArray(
                    fc.string({ minLength: 1, maxLength: 20 })
                        .filter(s => s.trim().length > 0),
                    { minLength: 1, maxLength: 20 }
                ),
                // Generator: خيارات موجودة فريدة ومختلفة (غير فارغة بعد trim)
                fc.uniqueArray(
                    fc.string({ minLength: 1, maxLength: 20 })
                        .filter(s => s.trim().length > 0),
                    { maxLength: 10 }
                ),
                (newOptions, existingOptions) => {
                    // التأكد من عدم وجود تداخل بين الخيارات الجديدة والموجودة (بعد trim)
                    const existingSet = new Set(existingOptions.map(s => s.trim()));
                    const uniqueNewOptions = newOptions
                        .map(s => s.trim())
                        .filter(opt => !existingSet.has(opt));

                    if (uniqueNewOptions.length === 0) {
                        return; // تخطي الحالة الفارغة
                    }

                    // التحقق من الخاصية
                    const result = OptionsHelper.validateOptions(uniqueNewOptions, Array.from(existingSet));

                    // يجب أن تكون النتيجة صالحة
                    expect(result.valid).toBe(true);
                    // يجب ألا تحتوي على أخطاء
                    expect(result.errors.length).toBe(0);
                    // يجب ألا تحتوي على تكرارات
                    expect(result.duplicates.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: يتعامل مع المقارنة الحساسة لحالة الأحرف (case-sensitive)', () => {
        fc.assert(
            fc.property(
                // Generator: خيار بحروف صغيرة
                fc.string({ minLength: 1, maxLength: 20 })
                    .filter(s => s.toLowerCase() === s && s.toUpperCase() !== s),
                (option) => {
                    // إنشاء نسخة بحروف كبيرة
                    const upperOption = option.toUpperCase();

                    if (option === upperOption) {
                        return; // تخطي إذا كانت الحروف متطابقة
                    }

                    // الخيارات الجديدة تحتوي على كلا النسختين
                    const testOptions = [option, upperOption];

                    // التحقق من الخاصية
                    const result = OptionsHelper.validateOptions(testOptions, []);

                    // يجب أن تكون النتيجة صالحة لأن المقارنة case-sensitive
                    // (الخيارات مختلفة بسبب حالة الأحرف)
                    expect(result.valid).toBe(true);
                    expect(result.duplicates.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: يزيل المسافات الزائدة قبل المقارنة', () => {
        fc.assert(
            fc.property(
                // Generator: خيار بدون مسافات زائدة
                fc.string({ minLength: 1, maxLength: 20 })
                    .filter(s => s.trim() === s && s.length > 0),
                // Generator: عدد المسافات في البداية
                fc.integer({ min: 1, max: 5 }),
                // Generator: عدد المسافات في النهاية
                fc.integer({ min: 1, max: 5 }),
                (option, leadingSpaces, trailingSpaces) => {
                    // إنشاء نسخ مع مسافات زائدة
                    const optionWithLeading = ' '.repeat(leadingSpaces) + option;
                    const optionWithTrailing = option + ' '.repeat(trailingSpaces);
                    const optionWithBoth = ' '.repeat(leadingSpaces) + option + ' '.repeat(trailingSpaces);

                    // الخيارات الجديدة تحتوي على نسخ مختلفة من نفس الخيار
                    const testOptions = [option, optionWithLeading, optionWithTrailing, optionWithBoth];

                    // التحقق من الخاصية
                    const result = OptionsHelper.validateOptions(testOptions, []);

                    // يجب أن تكون النتيجة غير صالحة (تكرارات بعد إزالة المسافات)
                    expect(result.valid).toBe(false);
                    // يجب أن تحتوي على أخطاء
                    expect(result.errors.length).toBeGreaterThan(0);
                    // يجب أن تحتوي على الخيار في قائمة التكرارات
                    expect(result.duplicates).toContain(option);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: يرفض القيم الفارغة', () => {
        fc.assert(
            fc.property(
                // Generator: خيارات صالحة
                fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
                // Generator: عدد القيم الفارغة
                fc.integer({ min: 1, max: 5 }),
                (validOptions, emptyCount) => {
                    // إضافة قيم فارغة
                    const emptyValues = Array(emptyCount).fill('');
                    const testOptions = [...validOptions, ...emptyValues];

                    // التحقق من الخاصية
                    const result = OptionsHelper.validateOptions(testOptions, []);

                    // يجب أن تكون النتيجة غير صالحة
                    expect(result.valid).toBe(false);
                    // يجب أن تحتوي على أخطاء
                    expect(result.errors.length).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property: يعيد رسائل خطأ وصفية للتكرارات', () => {
        fc.assert(
            fc.property(
                // Generator: خيار مكرر (غير فارغ بعد trim)
                fc.string({ minLength: 1, maxLength: 20 })
                    .filter(s => s.trim().length > 0),
                (duplicateOption) => {
                    // إنشاء قائمة تحتوي على تكرارات
                    const testOptions = [duplicateOption, duplicateOption, 'option1', 'option2'];

                    // التحقق من الخاصية
                    const result = OptionsHelper.validateOptions(testOptions, []);

                    // يجب أن تكون النتيجة غير صالحة
                    expect(result.valid).toBe(false);
                    // يجب أن تحتوي على رسالة خطأ
                    expect(result.errors.length).toBeGreaterThan(0);
                    // يجب أن تحتوي رسالة الخطأ على الخيار المكرر (بعد trim)
                    const errorMessage = result.errors.join(' ');
                    expect(errorMessage).toContain(duplicateOption.trim());
                }
            ),
            { numRuns: 100 }
        );
    });

    // Unit tests for edge cases
    describe('Edge Cases', () => {
        it('يتعامل مع قائمة فارغة', () => {
            const result = OptionsHelper.validateOptions([], []);
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
            expect(result.duplicates.length).toBe(0);
        });

        it('يتعامل مع خيار واحد فريد', () => {
            const result = OptionsHelper.validateOptions(['option1'], []);
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
            expect(result.duplicates.length).toBe(0);
        });

        it('يكتشف تكرار خيار واحد مرتين', () => {
            const result = OptionsHelper.validateOptions(['option1', 'option1'], []);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.duplicates).toContain('option1');
        });

        it('يكتشف تكرار خيار ثلاث مرات', () => {
            const result = OptionsHelper.validateOptions(['option1', 'option1', 'option1'], []);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.duplicates).toContain('option1');
        });

        it('يكتشف تكرارات متعددة', () => {
            const result = OptionsHelper.validateOptions(
                ['option1', 'option1', 'option2', 'option2', 'option3'],
                []
            );
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.duplicates).toContain('option1');
            expect(result.duplicates).toContain('option2');
        });

        it('يكتشف تكرار مع الخيارات الموجودة', () => {
            const result = OptionsHelper.validateOptions(
                ['newOption1', 'existingOption1'],
                ['existingOption1', 'existingOption2']
            );
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.duplicates).toContain('existingOption1');
        });

        it('يقبل خيارات جديدة فريدة مع خيارات موجودة', () => {
            const result = OptionsHelper.validateOptions(
                ['newOption1', 'newOption2'],
                ['existingOption1', 'existingOption2']
            );
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
            expect(result.duplicates.length).toBe(0);
        });

        it('يزيل المسافات الزائدة في البداية', () => {
            const result = OptionsHelper.validateOptions(['  option1', 'option1'], []);
            expect(result.valid).toBe(false);
            expect(result.duplicates).toContain('option1');
        });

        it('يزيل المسافات الزائدة في النهاية', () => {
            const result = OptionsHelper.validateOptions(['option1  ', 'option1'], []);
            expect(result.valid).toBe(false);
            expect(result.duplicates).toContain('option1');
        });

        it('يزيل المسافات الزائدة في البداية والنهاية', () => {
            const result = OptionsHelper.validateOptions(['  option1  ', 'option1'], []);
            expect(result.valid).toBe(false);
            expect(result.duplicates).toContain('option1');
        });

        it('يميز بين الحروف الكبيرة والصغيرة (case-sensitive)', () => {
            const result = OptionsHelper.validateOptions(['Option1', 'option1'], []);
            // يجب أن تكون صالحة لأن المقارنة case-sensitive
            expect(result.valid).toBe(true);
            expect(result.duplicates.length).toBe(0);
        });

        it('يرفض قيمة فارغة', () => {
            const result = OptionsHelper.validateOptions(['option1', '', 'option2'], []);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('يرفض قيمة تحتوي على مسافات فقط', () => {
            const result = OptionsHelper.validateOptions(['option1', '   ', 'option2'], []);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('يتعامل مع مدخل غير صحيح (null)', () => {
            const result = OptionsHelper.validateOptions(null as any, []);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('يتعامل مع مدخل غير صحيح (undefined)', () => {
            const result = OptionsHelper.validateOptions(undefined as any, []);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('يتعامل مع مدخل غير صحيح (not an array)', () => {
            const result = OptionsHelper.validateOptions('not an array' as any, []);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    // Real-world scenarios with Arabic text
    describe('Real-world Scenarios with Arabic Text', () => {
        it('سيناريو: إضافة موديلات سيارات فريدة', () => {
            const existingModels = ['كامري', 'كورولا', 'راف فور'];
            const newModels = ['يارس', 'أفالون'];
            const result = OptionsHelper.validateOptions(newModels, existingModels);
            expect(result.valid).toBe(true);
            expect(result.duplicates.length).toBe(0);
        });

        it('سيناريو: محاولة إضافة موديل موجود', () => {
            const existingModels = ['كامري', 'كورولا', 'راف فور'];
            const newModels = ['يارس', 'كامري']; // كامري موجود بالفعل
            const result = OptionsHelper.validateOptions(newModels, existingModels);
            expect(result.valid).toBe(false);
            expect(result.duplicates).toContain('كامري');
        });

        it('سيناريو: إضافة محافظات مع تكرارات داخلية', () => {
            const newGovernorates = ['القاهرة', 'الجيزة', 'القاهرة']; // تكرار القاهرة
            const result = OptionsHelper.validateOptions(newGovernorates, []);
            expect(result.valid).toBe(false);
            expect(result.duplicates).toContain('القاهرة');
        });

        it('سيناريو: إضافة مدن مع مسافات زائدة', () => {
            const existingCities = ['مدينة نصر', 'المعادي'];
            const newCities = ['  مدينة نصر  ', 'مصر الجديدة']; // مدينة نصر مع مسافات
            const result = OptionsHelper.validateOptions(newCities, existingCities);
            expect(result.valid).toBe(false);
            expect(result.duplicates).toContain('مدينة نصر');
        });

        it('سيناريو: إضافة تخصصات وظيفية فريدة', () => {
            const existingSpecialties = ['مطور ويب', 'مطور موبايل'];
            const newSpecialties = ['مهندس DevOps', 'مصمم UI/UX'];
            const result = OptionsHelper.validateOptions(newSpecialties, existingSpecialties);
            expect(result.valid).toBe(true);
            expect(result.duplicates.length).toBe(0);
        });

        it('سيناريو: إضافة أنواع وقود مع تكرارات', () => {
            const existingFuels = ['بنزين', 'ديزل'];
            const newFuels = ['كهرباء', 'هايبرد', 'بنزين']; // بنزين موجود
            const result = OptionsHelper.validateOptions(newFuels, existingFuels);
            expect(result.valid).toBe(false);
            expect(result.duplicates).toContain('بنزين');
        });

        it('سيناريو: إضافة حالات سيارات مع قيمة فارغة', () => {
            const newConditions = ['جديد', '', 'مستعمل']; // قيمة فارغة
            const result = OptionsHelper.validateOptions(newConditions, []);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('سيناريو: التمييز بين الحروف العربية المتشابهة', () => {
            // في العربية، الحروف case-insensitive بطبيعتها، لكن نختبر أحرف مختلفة
            const options = ['الإسكندرية', 'الاسكندرية']; // همزة مختلفة
            const result = OptionsHelper.validateOptions(options, []);
            // يجب أن تكون صالحة لأن الأحرف مختلفة
            expect(result.valid).toBe(true);
            expect(result.duplicates.length).toBe(0);
        });

        it('سيناريو: إضافة خيارات مع أرقام عربية وإنجليزية', () => {
            const options = ['٢٠٢٤', '2024']; // نفس الرقم بأشكال مختلفة
            const result = OptionsHelper.validateOptions(options, []);
            // يجب أن تكون صالحة لأن الأحرف مختلفة
            expect(result.valid).toBe(true);
            expect(result.duplicates.length).toBe(0);
        });
    });
});
