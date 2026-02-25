/**
 * Bug Condition Exploration Test
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * هذا الاختبار يستكشف حالة المشكلة: خيار "غير ذلك" يظهر في مواضع عشوائية
 * بدلاً من أن يكون دائماً في آخر القائمة.
 * 
 * **مهم جداً**: هذا الاختبار يجب أن يفشل على الكود غير المصلح
 * الفشل يؤكد وجود المشكلة ويوضح الأمثلة المضادة
 * 
 * Bug Condition Formula:
 * isBugCondition(input) = input.options.includes('غير ذلك') 
 *                         AND input.options.indexOf('غير ذلك') !== (input.options.length - 1)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ensureOtherAtEnd, processOptions, processOptionsMap, processHierarchicalOptions } from '../optionsHelper';

const OTHER_OPTION = 'غير ذلك';

/**
 * يتحقق من حالة المشكلة: هل "غير ذلك" في موضع غير الآخر؟
 */
function isBugCondition(options: string[]): boolean {
    return (
        options.includes(OTHER_OPTION) &&
        options.indexOf(OTHER_OPTION) !== options.length - 1
    );
}

/**
 * السلوك المتوقع: "غير ذلك" يجب أن يكون دائماً في آخر القائمة
 */
function isExpectedBehavior(options: string[]): boolean {
    if (!options.includes(OTHER_OPTION)) {
        return true; // القوائم بدون "غير ذلك" لا تتأثر
    }
    return options[options.length - 1] === OTHER_OPTION;
}

describe('Bug Condition Exploration - "غير ذلك" Position', () => {
    describe('Property 1: Fault Condition - خيار "غير ذلك" في موضع غير الآخر', () => {

        it('مثال 1: BRANDS_MODELS - قائمة ماركات تحتوي على "غير ذلك" في المنتصف', () => {
            // هذا مثال محدد من التصميم
            const brandsWithOtherInMiddle = ['تويوتا', 'غير ذلك', 'هيونداي'];

            // التحقق من أن هذا يحقق شرط المشكلة
            expect(isBugCondition(brandsWithOtherInMiddle)).toBe(true);

            // تطبيق الإصلاح
            const fixed = ensureOtherAtEnd(brandsWithOtherInMiddle);

            // السلوك المتوقع: "غير ذلك" يجب أن يكون في الآخر
            expect(isExpectedBehavior(fixed)).toBe(true);
        });

        it('مثال 2: MAIN_SUBS - قائمة فرعية تحتوي على "غير ذلك" في المنتصف', () => {
            const subsWithOtherInMiddle = ['شاورما', 'غير ذلك', 'كباب'];

            expect(isBugCondition(subsWithOtherInMiddle)).toBe(true);

            // تطبيق الإصلاح
            const fixed = processOptions(subsWithOtherInMiddle);

            expect(isExpectedBehavior(fixed)).toBe(true);
        });

        it('مثال 3: Simple Options - سنوات تحتوي على "غير ذلك" في المنتصف', () => {
            const yearsWithOtherInMiddle = ['2024', '2023', 'غير ذلك', '2022', '2021'];

            expect(isBugCondition(yearsWithOtherInMiddle)).toBe(true);

            // تطبيق الإصلاح
            const fixed = processOptions(yearsWithOtherInMiddle);

            expect(isExpectedBehavior(fixed)).toBe(true);
        });

        it('مثال 4: "غير ذلك" في البداية', () => {
            const optionsWithOtherAtStart = ['غير ذلك', 'خيار 1', 'خيار 2'];

            expect(isBugCondition(optionsWithOtherAtStart)).toBe(true);

            // تطبيق الإصلاح
            const fixed = processOptions(optionsWithOtherAtStart);

            expect(isExpectedBehavior(fixed)).toBe(true);
        });

        it('Property-Based Test: لأي قائمة تحتوي على "غير ذلك" في موضع غير الآخر', () => {
            /**
             * نهج PBT محدد النطاق للمشاكل الحتمية:
             * نولد قوائم تحتوي على "غير ذلك" في مواضع محددة (ليس الآخر)
             * لضمان إمكانية التكرار والتحقق من حالة المشكلة
             */

            // Generator: قوائم تحتوي على "غير ذلك" في موضع غير الآخر
            const optionsWithOtherNotAtEnd = fc.array(
                fc.string().filter(s => s !== OTHER_OPTION && s.length > 0),
                { minLength: 1, maxLength: 10 }
            ).chain(items => {
                // إدراج "غير ذلك" في موضع عشوائي (ليس الآخر)
                return fc.integer({ min: 0, max: items.length - 1 }).map(pos => {
                    const result = [...items];
                    result.splice(pos, 0, OTHER_OPTION);
                    return result;
                });
            });

            fc.assert(
                fc.property(optionsWithOtherNotAtEnd, (options) => {
                    // التحقق من أننا نختبر حالة المشكلة فعلاً
                    expect(isBugCondition(options)).toBe(true);

                    // تطبيق الإصلاح
                    const fixed = processOptions(options);

                    // السلوك المتوقع: "غير ذلك" يجب أن يكون في الآخر
                    return isExpectedBehavior(fixed);
                }),
                {
                    numRuns: 100, // عدد الحالات المولدة
                    verbose: true, // إظهار الأمثلة المضادة بوضوح
                }
            );
        });

        it('Property-Based Test: BRANDS_MODELS - Record من قوائم', () => {
            // Generator لـ Record يحتوي على قوائم بعضها يحتوي على "غير ذلك" في مواضع خاطئة
            const brandsModelsWithBug = fc.dictionary(
                fc.string().filter(s => s.length > 0 && s !== OTHER_OPTION),
                fc.array(
                    fc.string().filter(s => s.length > 0 && s !== OTHER_OPTION),
                    { minLength: 1, maxLength: 5 }
                ).chain(models => {
                    // إدراج "غير ذلك" في موضع عشوائي (ليس الآخر)
                    return fc.integer({ min: 0, max: models.length - 1 }).map(pos => {
                        const result = [...models];
                        result.splice(pos, 0, OTHER_OPTION);
                        return result;
                    });
                }),
                { minKeys: 1, maxKeys: 3 }
            );

            fc.assert(
                fc.property(brandsModelsWithBug, (brandsModels) => {
                    // تطبيق الإصلاح
                    const fixed = processOptionsMap(brandsModels);

                    // التحقق من كل قائمة في الـ Record
                    let allCorrect = true;
                    for (const models of Object.values(fixed)) {
                        if (!isExpectedBehavior(models)) {
                            allCorrect = false;
                        }
                    }
                    return allCorrect;
                }),
                {
                    numRuns: 50,
                    verbose: true,
                }
            );
        });

        it('Property-Based Test: MAIN_SUBS - Hierarchical Options', () => {
            // Generator لبيانات هرمية (فئات رئيسية وفرعية)
            const mainSubsWithBug = fc.dictionary(
                fc.string().filter(s => s.length > 0 && s !== OTHER_OPTION),
                fc.array(
                    fc.string().filter(s => s.length > 0 && s !== OTHER_OPTION),
                    { minLength: 1, maxLength: 5 }
                ).chain(subs => {
                    return fc.integer({ min: 0, max: subs.length - 1 }).map(pos => {
                        const result = [...subs];
                        result.splice(pos, 0, OTHER_OPTION);
                        return result;
                    });
                }),
                { minKeys: 1, maxKeys: 3 }
            );

            fc.assert(
                fc.property(mainSubsWithBug, (mainSubs) => {
                    // تطبيق الإصلاح
                    const fixed = processHierarchicalOptions(mainSubs);

                    let allCorrect = true;
                    for (const subs of Object.values(fixed)) {
                        if (!isExpectedBehavior(subs)) {
                            allCorrect = false;
                        }
                    }
                    return allCorrect;
                }),
                {
                    numRuns: 50,
                    verbose: true,
                }
            );
        });
    });

    describe('Edge Cases - حالات حافة', () => {
        it('قائمة تحتوي فقط على "غير ذلك"', () => {
            const onlyOther = [OTHER_OPTION];

            // هذه ليست حالة مشكلة (لأن "غير ذلك" في الآخر بالفعل)
            expect(isBugCondition(onlyOther)).toBe(false);
            expect(isExpectedBehavior(onlyOther)).toBe(true);
        });

        it('قائمة لا تحتوي على "غير ذلك"', () => {
            const noOther = ['خيار 1', 'خيار 2', 'خيار 3'];

            // ليست حالة مشكلة
            expect(isBugCondition(noOther)).toBe(false);
            expect(isExpectedBehavior(noOther)).toBe(true);
        });

        it('قائمة تحتوي على "غير ذلك" في الآخر (السلوك الصحيح)', () => {
            const otherAtEnd = ['خيار 1', 'خيار 2', OTHER_OPTION];

            // ليست حالة مشكلة (السلوك صحيح)
            expect(isBugCondition(otherAtEnd)).toBe(false);
            expect(isExpectedBehavior(otherAtEnd)).toBe(true);
        });

        it('قائمة تحتوي على "غير ذلك" متعدد', () => {
            const multipleOther = ['خيار 1', OTHER_OPTION, 'خيار 2', OTHER_OPTION];

            // هذه حالة مشكلة (يوجد "غير ذلك" في موضع غير الآخر)
            expect(isBugCondition(multipleOther)).toBe(true);

            // تطبيق الإصلاح
            const fixed = processOptions(multipleOther);

            // السلوك المتوقع: يجب إزالة التكرار ووضع "غير ذلك" في الآخر
            expect(isExpectedBehavior(fixed)).toBe(true);
        });
    });
});
