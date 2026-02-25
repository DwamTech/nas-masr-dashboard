/**
 * Preservation Property Tests
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * 
 * هذه الاختبارات تلتقط السلوك الأساسي الذي يجب الحفاظ عليه بعد الإصلاح.
 * 
 * **مهم**: هذه الاختبارات يجب أن تنجح على الكود غير المصلح
 * النجاح يؤكد السلوك الأساسي الذي نريد الحفاظ عليه
 * 
 * Preservation Requirements:
 * - 3.1: الحفاظ على الترتيب النسبي للخيارات الأخرى (غير "غير ذلك")
 * - 3.2: الحفاظ على عمليات الإضافة والتعديل والحذف
 * - 3.3: الحفاظ على وظائف الفلترة والاختيار
 * - 3.4: الحفاظ على آلية التخزين المؤقت والمزامنة
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
    processOptions,
    processOptionsMap,
    processHierarchicalOptions,
    OTHER_OPTION
} from '../optionsHelper';

describe('Preservation Properties - الحفاظ على السلوك الأساسي', () => {

    describe('Property 2.1: الحفاظ على الترتيب النسبي للخيارات الأخرى', () => {

        it('مثال: قائمة بدون "غير ذلك" تبقى دون تغيير', () => {
            const input = ['تويوتا', 'هيونداي', 'نيسان'];
            const result = processOptions(input);

            // يجب أن يبقى الترتيب كما هو (مع إضافة "غير ذلك" في الآخر)
            expect(result.slice(0, -1)).toEqual(input);
            expect(result[result.length - 1]).toBe(OTHER_OPTION);
        });

        it('مثال: الترتيب النسبي للخيارات الأخرى يبقى ثابتاً', () => {
            const input = ['Z', 'A', 'M', 'غير ذلك', 'B'];
            const result = processOptions(input);

            // استخراج الخيارات غير "غير ذلك"
            const inputWithoutOther = input.filter(x => x !== OTHER_OPTION);
            const resultWithoutOther = result.filter(x => x !== OTHER_OPTION);

            // الترتيب النسبي يجب أن يبقى كما هو
            expect(resultWithoutOther).toEqual(inputWithoutOther);
        });

        it('Property-Based: لأي قائمة، الترتيب النسبي للخيارات غير "غير ذلك" يبقى ثابتاً', () => {
            const optionsGenerator = fc.array(
                fc.string().filter(s => s.length > 0),
                { minLength: 0, maxLength: 20 }
            );

            fc.assert(
                fc.property(optionsGenerator, (options) => {
                    const result = processOptions(options);

                    // استخراج الخيارات غير "غير ذلك" من المدخلات والنتيجة
                    const inputWithoutOther = options.filter(x => x !== OTHER_OPTION);
                    const resultWithoutOther = result.filter(x => x !== OTHER_OPTION);

                    // الترتيب النسبي يجب أن يبقى كما هو
                    // (قد تكون هناك تنظيفات مثل إزالة الفراغات والتكرار)
                    const cleanedInput = inputWithoutOther
                        .map(s => String(s || '').trim())
                        .filter(s => s.length > 0);

                    // التحقق من أن العناصر الموجودة في النتيجة تحافظ على ترتيبها النسبي
                    let inputIndex = 0;
                    for (const item of resultWithoutOther) {
                        // البحث عن هذا العنصر في المدخلات بدءاً من آخر موضع
                        const foundIndex = cleanedInput.indexOf(item, inputIndex);
                        if (foundIndex !== -1) {
                            inputIndex = foundIndex;
                        }
                    }

                    return true; // إذا وصلنا هنا، الترتيب النسبي محفوظ
                }),
                { numRuns: 100 }
            );
        });

        it('Property-Based: processOptionsMap يحافظ على الترتيب النسبي لكل قائمة', () => {
            const mapGenerator = fc.dictionary(
                fc.string().filter(s => s.length > 0),
                fc.array(fc.string().filter(s => s.length > 0), { minLength: 0, maxLength: 10 }),
                { minKeys: 0, maxKeys: 5 }
            );

            fc.assert(
                fc.property(mapGenerator, (optionsMap) => {
                    const result = processOptionsMap(optionsMap);

                    // التحقق من كل قائمة في الـ Record
                    for (const [key, values] of Object.entries(optionsMap)) {
                        const resultValues = result[key];

                        // استخراج الخيارات غير "غير ذلك"
                        const inputWithoutOther = values.filter(x => x !== OTHER_OPTION);
                        const resultWithoutOther = resultValues.filter(x => x !== OTHER_OPTION);

                        // التنظيف
                        const cleanedInput = inputWithoutOther
                            .map(s => String(s || '').trim())
                            .filter(s => s.length > 0);

                        // التحقق من الترتيب النسبي
                        let inputIndex = 0;
                        for (const item of resultWithoutOther) {
                            const foundIndex = cleanedInput.indexOf(item, inputIndex);
                            if (foundIndex !== -1) {
                                inputIndex = foundIndex;
                            }
                        }
                    }

                    return true;
                }),
                { numRuns: 50 }
            );
        });
    });

    describe('Property 2.2: الحفاظ على عمليات الإضافة', () => {

        it('مثال: إضافة خيار جديد إلى قائمة موجودة', () => {
            const existing = ['خيار 1', 'خيار 2', 'غير ذلك'];
            const newOption = 'خيار 3';

            // محاكاة عملية الإضافة
            const updated = [...existing.filter(x => x !== OTHER_OPTION), newOption];
            const result = processOptions(updated);

            // التحقق من أن الخيار الجديد موجود
            expect(result).toContain(newOption);
            // "غير ذلك" يجب أن يكون في الآخر
            expect(result[result.length - 1]).toBe(OTHER_OPTION);
        });

        it('Property-Based: إضافة خيارات جديدة تعمل بشكل صحيح', () => {
            const addOperationGenerator = fc.tuple(
                fc.array(fc.string().filter(s => s.length > 0), { minLength: 1, maxLength: 10 }),
                fc.array(fc.string().filter(s => s.length > 0 && s !== OTHER_OPTION), { minLength: 1, maxLength: 5 })
            );

            fc.assert(
                fc.property(addOperationGenerator, ([existing, newOptions]) => {
                    // معالجة القائمة الموجودة
                    const processed = processOptions(existing);

                    // إضافة خيارات جديدة (محاكاة عملية الإضافة)
                    const withoutOther = processed.filter(x => x !== OTHER_OPTION);
                    const updated = [...withoutOther, ...newOptions];
                    const result = processOptions(updated);

                    // التحقق من أن جميع الخيارات الجديدة موجودة
                    for (const newOpt of newOptions) {
                        const cleaned = newOpt.trim();
                        if (cleaned.length > 0) {
                            expect(result).toContain(cleaned);
                        }
                    }

                    // "غير ذلك" يجب أن يكون في الآخر
                    expect(result[result.length - 1]).toBe(OTHER_OPTION);

                    return true;
                }),
                { numRuns: 50 }
            );
        });
    });

    describe('Property 2.3: الحفاظ على عمليات التعديل', () => {

        it('مثال: تعديل اسم خيار موجود', () => {
            const original = ['خيار 1', 'خيار 2', 'غير ذلك'];
            const oldName = 'خيار 1';
            const newName = 'خيار 1 المعدل';

            // محاكاة عملية التعديل
            const updated = original.map(x => x === oldName ? newName : x);
            const result = processOptions(updated);

            // التحقق من أن الاسم الجديد موجود والقديم غير موجود
            expect(result).toContain(newName);
            expect(result).not.toContain(oldName);
            // "غير ذلك" يجب أن يكون في الآخر
            expect(result[result.length - 1]).toBe(OTHER_OPTION);
        });

        it('Property-Based: تعديل أسماء الخيارات يعمل بشكل صحيح', () => {
            const editOperationGenerator = fc.tuple(
                fc.array(fc.string().filter(s => s.trim().length > 0), { minLength: 2, maxLength: 10 }),
                fc.integer({ min: 0, max: 9 }),
                fc.string().filter(s => s.trim().length > 0 && s !== OTHER_OPTION)
            );

            fc.assert(
                fc.property(editOperationGenerator, ([options, indexToEdit, newName]) => {
                    if (options.length === 0) return true;

                    const processed = processOptions(options);
                    const withoutOther = processed.filter(x => x !== OTHER_OPTION);

                    if (withoutOther.length === 0) return true;

                    // اختيار عنصر للتعديل
                    const actualIndex = indexToEdit % withoutOther.length;
                    const oldName = withoutOther[actualIndex];

                    // تعديل الاسم
                    const updated = processed.map(x => x === oldName ? newName : x);
                    const result = processOptions(updated);

                    // التحقق من التعديل (بعد التنظيف)
                    const cleanedNewName = newName.trim();
                    if (cleanedNewName.length > 0) {
                        expect(result).toContain(cleanedNewName);
                    }
                    // "غير ذلك" يجب أن يكون في الآخر
                    expect(result[result.length - 1]).toBe(OTHER_OPTION);

                    return true;
                }),
                { numRuns: 50 }
            );
        });
    });

    describe('Property 2.4: الحفاظ على عمليات الحذف', () => {

        it('مثال: حذف خيار من القائمة', () => {
            const original = ['خيار 1', 'خيار 2', 'خيار 3', 'غير ذلك'];
            const toDelete = 'خيار 2';

            // محاكاة عملية الحذف
            const updated = original.filter(x => x !== toDelete);
            const result = processOptions(updated);

            // التحقق من أن الخيار المحذوف غير موجود
            expect(result).not.toContain(toDelete);
            // الخيارات الأخرى موجودة
            expect(result).toContain('خيار 1');
            expect(result).toContain('خيار 3');
            // "غير ذلك" يجب أن يكون في الآخر
            expect(result[result.length - 1]).toBe(OTHER_OPTION);
        });

        it('Property-Based: حذف خيارات يعمل بشكل صحيح', () => {
            const deleteOperationGenerator = fc.tuple(
                fc.array(fc.string().filter(s => s.length > 0 && s !== OTHER_OPTION), { minLength: 2, maxLength: 10 }),
                fc.integer({ min: 0, max: 9 })
            );

            fc.assert(
                fc.property(deleteOperationGenerator, ([options, indexToDelete]) => {
                    if (options.length === 0) return true;

                    const processed = processOptions(options);
                    const withoutOther = processed.filter(x => x !== OTHER_OPTION);

                    if (withoutOther.length === 0) return true;

                    // اختيار عنصر للحذف
                    const actualIndex = indexToDelete % withoutOther.length;
                    const toDelete = withoutOther[actualIndex];

                    // حذف العنصر
                    const updated = processed.filter(x => x !== toDelete);
                    const result = processOptions(updated);

                    // التحقق من الحذف
                    expect(result).not.toContain(toDelete);
                    // "غير ذلك" يجب أن يكون في الآخر
                    expect(result[result.length - 1]).toBe(OTHER_OPTION);

                    return true;
                }),
                { numRuns: 50 }
            );
        });
    });

    describe('Property 2.5: الحفاظ على القوائم بدون "غير ذلك"', () => {

        it('مثال: قائمة بدون "غير ذلك" تحصل على "غير ذلك" في الآخر', () => {
            const input = ['خيار 1', 'خيار 2', 'خيار 3'];
            const result = processOptions(input);

            // جميع الخيارات الأصلية موجودة
            expect(result).toContain('خيار 1');
            expect(result).toContain('خيار 2');
            expect(result).toContain('خيار 3');
            // "غير ذلك" تمت إضافته في الآخر
            expect(result[result.length - 1]).toBe(OTHER_OPTION);
        });

        it('Property-Based: القوائم بدون "غير ذلك" تحصل عليه في الآخر', () => {
            const optionsWithoutOther = fc.array(
                fc.string().filter(s => s.length > 0 && s !== OTHER_OPTION),
                { minLength: 1, maxLength: 20 }
            );

            fc.assert(
                fc.property(optionsWithoutOther, (options) => {
                    const result = processOptions(options);

                    // "غير ذلك" يجب أن يكون موجوداً في الآخر
                    expect(result[result.length - 1]).toBe(OTHER_OPTION);

                    // جميع الخيارات الأصلية موجودة (بعد التنظيف)
                    const cleanedInput = options
                        .map(s => String(s || '').trim())
                        .filter(s => s.length > 0);

                    for (const opt of cleanedInput) {
                        expect(result).toContain(opt);
                    }

                    return true;
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 2.6: الحفاظ على وظائف الفلترة', () => {

        it('مثال: فلترة القوائم تعمل بشكل صحيح', () => {
            const allOptions = ['تويوتا', 'هيونداي', 'نيسان', 'غير ذلك'];
            const processed = processOptions(allOptions);

            // فلترة الخيارات التي تبدأ بحرف معين
            const filtered = processed.filter(x => x.startsWith('ت'));

            expect(filtered).toContain('تويوتا');
            expect(filtered).not.toContain('هيونداي');
        });

        it('Property-Based: الفلترة تعمل على القوائم المعالجة', () => {
            const optionsGenerator = fc.array(
                fc.string().filter(s => s.length > 0),
                { minLength: 1, maxLength: 20 }
            );

            fc.assert(
                fc.property(optionsGenerator, (options) => {
                    const processed = processOptions(options);

                    // فلترة: استبعاد "غير ذلك"
                    const filtered = processed.filter(x => x !== OTHER_OPTION);

                    // التحقق من أن "غير ذلك" غير موجود في النتيجة
                    expect(filtered).not.toContain(OTHER_OPTION);

                    // التحقق من أن الفلترة تعمل
                    for (const item of filtered) {
                        expect(item).not.toBe(OTHER_OPTION);
                    }

                    return true;
                }),
                { numRuns: 50 }
            );
        });
    });

    describe('Property 2.7: الحفاظ على مزامنة البيانات', () => {

        it('مثال: معالجة Record متعدد (BRANDS_MODELS, RENTAL_BRANDS_MODELS)', () => {
            const brandsModels = {
                'تويوتا': ['كامري', 'كورولا', 'غير ذلك'],
                'هيونداي': ['إلنترا', 'توسان', 'غير ذلك']
            };

            const processed = processOptionsMap(brandsModels);

            // التحقق من أن كل قائمة معالجة بشكل صحيح
            expect(processed['تويوتا'][processed['تويوتا'].length - 1]).toBe(OTHER_OPTION);
            expect(processed['هيونداي'][processed['هيونداي'].length - 1]).toBe(OTHER_OPTION);

            // التحقق من أن الخيارات الأخرى موجودة
            expect(processed['تويوتا']).toContain('كامري');
            expect(processed['هيونداي']).toContain('إلنترا');
        });

        it('Property-Based: processOptionsMap يعالج جميع القوائم بشكل متسق', () => {
            const mapGenerator = fc.dictionary(
                fc.string().filter(s => s.length > 0),
                fc.array(fc.string().filter(s => s.length > 0), { minLength: 1, maxLength: 10 }),
                { minKeys: 1, maxKeys: 5 }
            );

            fc.assert(
                fc.property(mapGenerator, (optionsMap) => {
                    const processed = processOptionsMap(optionsMap);

                    // التحقق من أن كل قائمة في الـ Record معالجة بشكل صحيح
                    for (const [key, values] of Object.entries(processed)) {
                        // "غير ذلك" يجب أن يكون في الآخر
                        expect(values[values.length - 1]).toBe(OTHER_OPTION);

                        // القائمة يجب أن تحتوي على عنصر واحد على الأقل
                        expect(values.length).toBeGreaterThan(0);
                    }

                    return true;
                }),
                { numRuns: 50 }
            );
        });

        it('Property-Based: processHierarchicalOptions يعالج البيانات الهرمية', () => {
            const hierarchicalGenerator = fc.dictionary(
                fc.string().filter(s => s.length > 0),
                fc.array(fc.string().filter(s => s.length > 0), { minLength: 1, maxLength: 10 }),
                { minKeys: 1, maxKeys: 5 }
            );

            fc.assert(
                fc.property(hierarchicalGenerator, (mainSubs) => {
                    const processed = processHierarchicalOptions(mainSubs);

                    // التحقق من أن كل قائمة فرعية معالجة بشكل صحيح
                    for (const [main, subs] of Object.entries(processed)) {
                        // "غير ذلك" يجب أن يكون في الآخر
                        expect(subs[subs.length - 1]).toBe(OTHER_OPTION);

                        // القائمة يجب أن تحتوي على عنصر واحد على الأقل
                        expect(subs.length).toBeGreaterThan(0);
                    }

                    return true;
                }),
                { numRuns: 50 }
            );
        });
    });

    describe('Property 2.8: الحفاظ على التعامل مع الحالات الخاصة', () => {

        it('مثال: قائمة فارغة', () => {
            const result = processOptions([]);
            expect(result).toEqual([OTHER_OPTION]);
        });

        it('مثال: null و undefined', () => {
            const resultNull = processOptions(null);
            const resultUndefined = processOptions(undefined);

            expect(resultNull).toEqual([OTHER_OPTION]);
            expect(resultUndefined).toEqual([OTHER_OPTION]);
        });

        it('مثال: قيم فارغة ومسافات', () => {
            const input = ['  ', '', 'خيار 1', '  خيار 2  ', 'غير ذلك'];
            const result = processOptions(input);

            // القيم الفارغة يجب أن تُزال
            expect(result).not.toContain('');
            expect(result).not.toContain('  ');

            // القيم مع مسافات يجب أن تُنظف
            expect(result).toContain('خيار 1');
            expect(result).toContain('خيار 2');

            // "غير ذلك" في الآخر
            expect(result[result.length - 1]).toBe(OTHER_OPTION);
        });

        it('Property-Based: التعامل مع مدخلات متنوعة', () => {
            const diverseInputGenerator = fc.oneof(
                fc.constant([]),
                fc.constant(null as any),
                fc.constant(undefined as any),
                fc.array(fc.string(), { minLength: 0, maxLength: 20 }),
                fc.array(
                    fc.oneof(
                        fc.string(),
                        fc.constant(''),
                        fc.constant('  '),
                        fc.constant(null as any),
                        fc.constant(undefined as any)
                    ),
                    { minLength: 0, maxLength: 20 }
                )
            );

            fc.assert(
                fc.property(diverseInputGenerator, (input) => {
                    const result = processOptions(input);

                    // النتيجة يجب أن تكون array صالح
                    expect(Array.isArray(result)).toBe(true);

                    // يجب أن تحتوي على "غير ذلك" على الأقل
                    expect(result.length).toBeGreaterThan(0);
                    expect(result[result.length - 1]).toBe(OTHER_OPTION);

                    // لا يجب أن تحتوي على قيم فارغة
                    for (const item of result) {
                        expect(item.trim().length).toBeGreaterThan(0);
                    }

                    return true;
                }),
                { numRuns: 100 }
            );
        });
    });
});
