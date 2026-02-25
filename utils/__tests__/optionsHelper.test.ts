import {
    ensureOtherAtEnd,
    sortOptionsWithOtherAtEnd,
    processOptions,
    processOptionsMap,
    processHierarchicalOptions,
    OTHER_OPTION
} from '../optionsHelper';

describe('OptionsHelper', () => {
    describe('ensureOtherAtEnd', () => {
        it('يضع "غير ذلك" في آخر القائمة', () => {
            const input = ['A', 'غير ذلك', 'B', 'C'];
            const result = ensureOtherAtEnd(input);
            expect(result).toEqual(['A', 'B', 'C', 'غير ذلك']);
            expect(result[result.length - 1]).toBe('غير ذلك');
        });

        it('يزيل التكرار من "غير ذلك"', () => {
            const input = ['A', 'غير ذلك', 'B', 'غير ذلك', 'C'];
            const result = ensureOtherAtEnd(input);
            expect(result).toEqual(['A', 'B', 'C', 'غير ذلك']);
            expect(result.filter(x => x === 'غير ذلك')).toHaveLength(1);
        });

        it('يضيف "غير ذلك" إذا لم يكن موجوداً', () => {
            const input = ['A', 'B', 'C'];
            const result = ensureOtherAtEnd(input);
            expect(result).toEqual(['A', 'B', 'C', 'غير ذلك']);
        });

        it('يتعامل مع قائمة فارغة', () => {
            const result = ensureOtherAtEnd([]);
            expect(result).toEqual(['غير ذلك']);
        });

        it('يحافظ على ترتيب العناصر الأخرى', () => {
            const input = ['Z', 'A', 'M', 'غير ذلك'];
            const result = ensureOtherAtEnd(input);
            expect(result).toEqual(['Z', 'A', 'M', 'غير ذلك']);
        });
    });

    describe('sortOptionsWithOtherAtEnd', () => {
        it('يرتب القائمة أبجدياً مع "غير ذلك" في الآخر', () => {
            const input = ['ج', 'غير ذلك', 'أ', 'ب'];
            const result = sortOptionsWithOtherAtEnd(input);
            expect(result[result.length - 1]).toBe('غير ذلك');
            expect(result.slice(0, -1)).toEqual(['أ', 'ب', 'ج']);
        });

        it('يرتب الأرقام بشكل صحيح', () => {
            const input = ['2024', '2022', 'غير ذلك', '2023'];
            const result = sortOptionsWithOtherAtEnd(input);
            expect(result).toEqual(['2022', '2023', '2024', 'غير ذلك']);
        });
    });

    describe('processOptions', () => {
        it('يعالج قائمة عادية', () => {
            const input = ['A', 'غير ذلك', 'B'];
            const result = processOptions(input);
            expect(result).toEqual(['A', 'B', 'غير ذلك']);
        });

        it('يعالج قائمة مع الترتيب', () => {
            const input = ['ج', 'غير ذلك', 'أ', 'ب'];
            const result = processOptions(input, true);
            expect(result).toEqual(['أ', 'ب', 'ج', 'غير ذلك']);
        });

        it('يتعامل مع null', () => {
            const result = processOptions(null);
            expect(result).toEqual(['غير ذلك']);
        });

        it('يتعامل مع undefined', () => {
            const result = processOptions(undefined);
            expect(result).toEqual(['غير ذلك']);
        });

        it('يزيل القيم الفارغة', () => {
            const input = ['A', '', '  ', 'B', 'غير ذلك'];
            const result = processOptions(input);
            expect(result).toEqual(['A', 'B', 'غير ذلك']);
        });

        it('يزيل التكرار', () => {
            const input = ['A', 'B', 'A', 'غير ذلك', 'B'];
            const result = processOptions(input);
            expect(result).toEqual(['A', 'B', 'غير ذلك']);
        });
    });

    describe('processOptionsMap', () => {
        it('يعالج Record من options', () => {
            const input = {
                'تويوتا': ['كامري', 'غير ذلك', 'كورولا'],
                'هيونداي': ['إلنترا', 'غير ذلك', 'توسان']
            };
            const result = processOptionsMap(input);

            expect(result['تويوتا']).toEqual(['كامري', 'كورولا', 'غير ذلك']);
            expect(result['هيونداي']).toEqual(['إلنترا', 'توسان', 'غير ذلك']);
        });

        it('يعالج مع الترتيب', () => {
            const input = {
                'brand1': ['C', 'غير ذلك', 'A', 'B']
            };
            const result = processOptionsMap(input, true);

            expect(result['brand1']).toEqual(['A', 'B', 'C', 'غير ذلك']);
        });

        it('يتعامل مع Record فارغ', () => {
            const result = processOptionsMap({});
            expect(result).toEqual({});
        });
    });

    describe('processHierarchicalOptions', () => {
        it('يعالج options هرمية', () => {
            const input = {
                'تكنولوجيا': ['مطور', 'غير ذلك', 'مهندس'],
                'طب': ['طبيب', 'صيدلي', 'غير ذلك']
            };
            const result = processHierarchicalOptions(input);

            expect(result['تكنولوجيا']).toEqual(['مطور', 'مهندس', 'غير ذلك']);
            expect(result['طب']).toEqual(['طبيب', 'صيدلي', 'غير ذلك']);
        });
    });

    describe('Real-world scenarios', () => {
        it('سيناريو: سنوات السيارات', () => {
            const years = ['2024', '2023', 'غير ذلك', '2022', '2021'];
            const result = processOptions(years);

            expect(result[result.length - 1]).toBe('غير ذلك');
            expect(result).toContain('2024');
            expect(result).toContain('2021');
        });

        it('سيناريو: أنواع الوقود', () => {
            const fuels = ['ديزل', 'غير ذلك', 'بنزين', 'كهرباء'];
            const result = processOptions(fuels, true);

            expect(result[result.length - 1]).toBe('غير ذلك');
            // التحقق من الترتيب الأبجدي
            const withoutOther = result.slice(0, -1);
            const sorted = [...withoutOther].sort((a, b) => a.localeCompare(b, 'ar'));
            expect(withoutOther).toEqual(sorted);
        });

        it('سيناريو: ماركات وموديلات السيارات', () => {
            const brandsModels = {
                'تويوتا': ['كامري', 'غير ذلك', 'كورولا', 'راف فور'],
                'هيونداي': ['إلنترا', 'توسان', 'غير ذلك', 'سوناتا'],
                'مرسيدس': ['C-Class', 'E-Class', 'غير ذلك']
            };

            const result = processOptionsMap(brandsModels);

            // التحقق من أن كل ماركة لها "غير ذلك" في الآخر
            Object.values(result).forEach(models => {
                expect(models[models.length - 1]).toBe('غير ذلك');
            });
        });

        it('سيناريو: تخصصات الوظائف (هرمي)', () => {
            const jobsMainSubs = {
                'تكنولوجيا المعلومات': ['مطور ويب', 'غير ذلك', 'مطور موبايل'],
                'الطب': ['طبيب عام', 'طبيب أسنان', 'غير ذلك'],
                'التعليم': ['مدرس', 'غير ذلك', 'محاضر']
            };

            const result = processHierarchicalOptions(jobsMainSubs);

            expect(result['تكنولوجيا المعلومات'][result['تكنولوجيا المعلومات'].length - 1]).toBe('غير ذلك');
            expect(result['الطب'][result['الطب'].length - 1]).toBe('غير ذلك');
            expect(result['التعليم'][result['التعليم'].length - 1]).toBe('غير ذلك');
        });

        it('سيناريو: API response مع بيانات غير منتظمة', () => {
            const apiResponse = ['  A  ', '', 'غير ذلك', 'B', null as any, 'غير ذلك', '  C  '];
            const result = processOptions(apiResponse);

            expect(result).toEqual(['A', 'B', 'C', 'غير ذلك']);
            expect(result.filter(x => x === 'غير ذلك')).toHaveLength(1);
        });
    });

    describe('Edge cases', () => {
        it('قائمة تحتوي فقط على "غير ذلك"', () => {
            const result = processOptions(['غير ذلك']);
            expect(result).toEqual(['غير ذلك']);
        });

        it('قائمة تحتوي على "غير ذلك" متعددة فقط', () => {
            const result = processOptions(['غير ذلك', 'غير ذلك', 'غير ذلك']);
            expect(result).toEqual(['غير ذلك']);
        });

        it('قائمة كبيرة جداً', () => {
            const largeList = Array.from({ length: 1000 }, (_, i) => `Item ${i}`);
            largeList.push('غير ذلك');
            largeList.splice(500, 0, 'غير ذلك'); // إضافة في المنتصف

            const result = processOptions(largeList);

            expect(result.length).toBe(1001); // 1000 items + 1 "غير ذلك"
            expect(result[result.length - 1]).toBe('غير ذلك');
        });

        it('قائمة مع أحرف خاصة', () => {
            const input = ['A@#$', 'غير ذلك', 'B%^&', 'C*()'];
            const result = processOptions(input);
            expect(result).toEqual(['A@#$', 'B%^&', 'C*()', 'غير ذلك']);
        });
    });
});
