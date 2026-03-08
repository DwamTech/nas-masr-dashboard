import {
    ensureOtherAtEnd,
    sortOptionsWithOtherAtEnd,
    processOptions,
    processOptionsMap,
    processHierarchicalOptions,
    parseBulkInput,
    validateOptions,
    calculateRanks,
    detectOtherOption,
    OptionsHelper,
    OTHER_OPTION,
    type ValidationResult,
    type RankData
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

        it('يحافظ على التكرار (لا يزيله)', () => {
            const input = ['A', 'B', 'A', 'غير ذلك', 'B'];
            const result = processOptions(input);
            // processOptions لا يزيل التكرار، فقط يضع "غير ذلك" في الآخر
            expect(result).toEqual(['A', 'B', 'A', 'B', 'غير ذلك']);
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

describe('parseBulkInput', () => {
    it('يحلل مدخل مفصول بفواصل', () => {
        const input = 'option1, option2, option3';
        const result = parseBulkInput(input);
        expect(result).toEqual(['option1', 'option2', 'option3']);
    });

    it('يحلل مدخل مفصول بأسطر جديدة', () => {
        const input = 'option1\noption2\noption3';
        const result = parseBulkInput(input);
        expect(result).toEqual(['option1', 'option2', 'option3']);
    });

    it('يزيل المسافات الزائدة', () => {
        const input = '  option1  ,  option2  ,  option3  ';
        const result = parseBulkInput(input);
        expect(result).toEqual(['option1', 'option2', 'option3']);
    });

    it('يزيل القيم الفارغة', () => {
        const input = 'option1, , option2, , option3';
        const result = parseBulkInput(input);
        expect(result).toEqual(['option1', 'option2', 'option3']);
    });

    it('يتعامل مع مدخل فارغ', () => {
        const result = parseBulkInput('');
        expect(result).toEqual([]);
    });

    it('يتعامل مع مدخل null', () => {
        const result = parseBulkInput(null as any);
        expect(result).toEqual([]);
    });

    it('يتعامل مع مدخل undefined', () => {
        const result = parseBulkInput(undefined as any);
        expect(result).toEqual([]);
    });

    it('يحلل مدخل بخيار واحد بدون فاصل', () => {
        const input = 'single option';
        const result = parseBulkInput(input);
        expect(result).toEqual(['single option']);
    });

    it('يحلل مدخل عربي مفصول بفواصل', () => {
        const input = 'خيار1, خيار2, خيار3';
        const result = parseBulkInput(input);
        expect(result).toEqual(['خيار1', 'خيار2', 'خيار3']);
    });

    it('يحلل مدخل عربي مفصول بأسطر جديدة', () => {
        const input = 'خيار1\nخيار2\nخيار3';
        const result = parseBulkInput(input);
        expect(result).toEqual(['خيار1', 'خيار2', 'خيار3']);
    });
});

describe('validateOptions', () => {
    it('يقبل خيارات صحيحة', () => {
        const options = ['option1', 'option2', 'option3'];
        const result = validateOptions(options);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.duplicates).toHaveLength(0);
    });

    it('يكتشف التكرارات داخل المصفوفة', () => {
        const options = ['option1', 'option2', 'option1'];
        const result = validateOptions(options);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.duplicates).toContain('option1');
    });

    it('يكتشف التكرارات مع الخيارات الموجودة', () => {
        const options = ['option1', 'option2'];
        const existing = ['option2', 'option3'];
        const result = validateOptions(options, existing);
        expect(result.valid).toBe(false);
        expect(result.duplicates).toContain('option2');
    });

    it('يكتشف القيم الفارغة', () => {
        const options = ['option1', '', 'option2'];
        const result = validateOptions(options);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('يتعامل مع مدخل غير صحيح', () => {
        const result = validateOptions(null as any);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('يقبل خيارات عربية صحيحة', () => {
        const options = ['خيار1', 'خيار2', 'خيار3'];
        const result = validateOptions(options);
        expect(result.valid).toBe(true);
    });

    it('يكتشف التكرارات العربية', () => {
        const options = ['خيار1', 'خيار2', 'خيار1'];
        const result = validateOptions(options);
        expect(result.valid).toBe(false);
        expect(result.duplicates).toContain('خيار1');
    });

    it('يتعامل مع مسافات زائدة في الخيارات', () => {
        const options = ['  option1  ', 'option1'];
        const result = validateOptions(options);
        // يجب أن يكتشف التكرار بعد تنظيف المسافات
        expect(result.duplicates.length).toBeGreaterThan(0);
    });
});

describe('calculateRanks', () => {
    it('يحسب الترتيبات المتسلسلة', () => {
        const options = ['option1', 'option2', 'option3'];
        const result = calculateRanks(options);
        expect(result).toEqual([
            { option: 'option1', rank: 1 },
            { option: 'option2', rank: 2 },
            { option: 'option3', rank: 3 }
        ]);
    });

    it('يبدأ الترتيب من 1', () => {
        const options = ['a', 'b', 'c'];
        const result = calculateRanks(options);
        expect(result[0].rank).toBe(1);
    });

    it('يحافظ على ترتيب الخيارات', () => {
        const options = ['z', 'a', 'm'];
        const result = calculateRanks(options);
        expect(result[0].option).toBe('z');
        expect(result[1].option).toBe('a');
        expect(result[2].option).toBe('m');
    });

    it('يتعامل مع قائمة فارغة', () => {
        const result = calculateRanks([]);
        expect(result).toEqual([]);
    });

    it('يتعامل مع خيار واحد', () => {
        const result = calculateRanks(['single']);
        expect(result).toEqual([{ option: 'single', rank: 1 }]);
    });

    it('يحسب الترتيبات للخيارات العربية', () => {
        const options = ['خيار1', 'خيار2', 'خيار3'];
        const result = calculateRanks(options);
        expect(result).toEqual([
            { option: 'خيار1', rank: 1 },
            { option: 'خيار2', rank: 2 },
            { option: 'خيار3', rank: 3 }
        ]);
    });

    it('يحسب الترتيبات لقائمة كبيرة', () => {
        const options = Array.from({ length: 100 }, (_, i) => `option${i}`);
        const result = calculateRanks(options);
        expect(result).toHaveLength(100);
        expect(result[99].rank).toBe(100);
    });
});

describe('OptionsHelper class', () => {
    it('يوفر واجهة موحدة للعمليات', () => {
        expect(OptionsHelper.OTHER_OPTION).toBe('غير ذلك');
    });

    it('ensureOtherIsLast يعمل بشكل صحيح', () => {
        const input = ['A', 'غير ذلك', 'B'];
        const result = OptionsHelper.ensureOtherIsLast(input);
        expect(result).toEqual(['A', 'B', 'غير ذلك']);
    });

    it('parseBulkInput يعمل بشكل صحيح', () => {
        const input = 'option1, option2, option3';
        const result = OptionsHelper.parseBulkInput(input);
        expect(result).toEqual(['option1', 'option2', 'option3']);
    });

    it('validateOptions يعمل بشكل صحيح', () => {
        const options = ['option1', 'option2'];
        const result = OptionsHelper.validateOptions(options);
        expect(result.valid).toBe(true);
    });

    it('calculateRanks يعمل بشكل صحيح', () => {
        const options = ['a', 'b', 'c'];
        const result = OptionsHelper.calculateRanks(options);
        expect(result).toHaveLength(3);
        expect(result[0].rank).toBe(1);
    });
});

describe('detectOtherOption', () => {
    it('يكتشف "غير ذلك" عندما يكون موجوداً', () => {
        const options = ['option1', 'غير ذلك', 'option2'];
        const result = detectOtherOption(options);
        expect(result).toBe(true);
    });

    it('يعيد false عندما لا يكون "غير ذلك" موجوداً', () => {
        const options = ['option1', 'option2', 'option3'];
        const result = detectOtherOption(options);
        expect(result).toBe(false);
    });

    it('يكتشف "غير ذلك" في البداية', () => {
        const options = ['غير ذلك', 'option1', 'option2'];
        const result = detectOtherOption(options);
        expect(result).toBe(true);
    });

    it('يكتشف "غير ذلك" في النهاية', () => {
        const options = ['option1', 'option2', 'غير ذلك'];
        const result = detectOtherOption(options);
        expect(result).toBe(true);
    });

    it('يتعامل مع قائمة فارغة', () => {
        const result = detectOtherOption([]);
        expect(result).toBe(false);
    });

    it('يتعامل مع null', () => {
        const result = detectOtherOption(null as any);
        expect(result).toBe(false);
    });

    it('يتعامل مع undefined', () => {
        const result = detectOtherOption(undefined as any);
        expect(result).toBe(false);
    });

    it('يكتشف "غير ذلك" حتى مع وجود نسخ متعددة', () => {
        const options = ['option1', 'غير ذلك', 'option2', 'غير ذلك'];
        const result = detectOtherOption(options);
        expect(result).toBe(true);
    });
});

describe('OptionsHelper class - detectOtherOption', () => {
    it('detectOtherOption يعمل بشكل صحيح', () => {
        const options = ['option1', 'غير ذلك', 'option2'];
        const result = OptionsHelper.detectOtherOption(options);
        expect(result).toBe(true);
    });

    it('detectOtherOption يعيد false عندما لا يكون "غير ذلك" موجوداً', () => {
        const options = ['option1', 'option2', 'option3'];
        const result = OptionsHelper.detectOtherOption(options);
        expect(result).toBe(false);
    });
});

/**
 * Comprehensive tests for OptionsHelper class methods
 * **Validates: Requirements 6.18, 6.19, 7.1, 7.4**
 */
describe('OptionsHelper - Comprehensive Edge Cases', () => {
    describe('ensureOtherIsLast - Various Input Orders', () => {
        it('should handle "غير ذلك" at the beginning', () => {
            const input = ['غير ذلك', 'A', 'B', 'C'];
            const result = OptionsHelper.ensureOtherIsLast(input);
            expect(result).toEqual(['A', 'B', 'C', 'غير ذلك']);
            expect(result[result.length - 1]).toBe('غير ذلك');
        });

        it('should handle "غير ذلك" in the middle', () => {
            const input = ['A', 'B', 'غير ذلك', 'C', 'D'];
            const result = OptionsHelper.ensureOtherIsLast(input);
            expect(result).toEqual(['A', 'B', 'C', 'D', 'غير ذلك']);
            expect(result[result.length - 1]).toBe('غير ذلك');
        });

        it('should handle "غير ذلك" already at the end', () => {
            const input = ['A', 'B', 'C', 'غير ذلك'];
            const result = OptionsHelper.ensureOtherIsLast(input);
            expect(result).toEqual(['A', 'B', 'C', 'غير ذلك']);
            expect(result[result.length - 1]).toBe('غير ذلك');
        });

        it('should handle multiple "غير ذلك" occurrences', () => {
            const input = ['غير ذلك', 'A', 'غير ذلك', 'B', 'غير ذلك', 'C'];
            const result = OptionsHelper.ensureOtherIsLast(input);
            expect(result).toEqual(['A', 'B', 'C', 'غير ذلك']);
            expect(result.filter(opt => opt === 'غير ذلك')).toHaveLength(1);
        });

        it('should handle reverse alphabetical order', () => {
            const input = ['Z', 'Y', 'X', 'غير ذلك', 'W'];
            const result = OptionsHelper.ensureOtherIsLast(input);
            expect(result).toEqual(['Z', 'Y', 'X', 'W', 'غير ذلك']);
        });

        it('should handle mixed Arabic and English', () => {
            const input = ['Option1', 'خيار2', 'غير ذلك', 'Option3'];
            const result = OptionsHelper.ensureOtherIsLast(input);
            expect(result).toEqual(['Option1', 'خيار2', 'Option3', 'غير ذلك']);
        });

        it('should handle single element array with "غير ذلك"', () => {
            const input = ['غير ذلك'];
            const result = OptionsHelper.ensureOtherIsLast(input);
            expect(result).toEqual(['غير ذلك']);
        });

        it('should handle array with only non-"غير ذلك" elements', () => {
            const input = ['A', 'B', 'C'];
            const result = OptionsHelper.ensureOtherIsLast(input);
            expect(result).toEqual(['A', 'B', 'C', 'غير ذلك']);
        });
    });

    describe('parseBulkInput - Edge Cases with Empty Strings and Whitespace', () => {
        it('should handle input with only whitespace', () => {
            const input = '   \n   \t   ';
            const result = OptionsHelper.parseBulkInput(input);
            expect(result).toEqual([]);
        });

        it('should handle comma-separated with excessive whitespace', () => {
            const input = '  option1  ,   option2   ,    option3   ';
            const result = OptionsHelper.parseBulkInput(input);
            expect(result).toEqual(['option1', 'option2', 'option3']);
        });

        it('should handle line-separated with excessive whitespace', () => {
            const input = '  option1  \n   option2   \n    option3   ';
            const result = OptionsHelper.parseBulkInput(input);
            expect(result).toEqual(['option1', 'option2', 'option3']);
        });

        it('should handle empty lines in line-separated input', () => {
            const input = 'option1\n\n\noption2\n\noption3';
            const result = OptionsHelper.parseBulkInput(input);
            expect(result).toEqual(['option1', 'option2', 'option3']);
        });

        it('should handle empty values in comma-separated input', () => {
            const input = 'option1,,,option2,,option3,';
            const result = OptionsHelper.parseBulkInput(input);
            expect(result).toEqual(['option1', 'option2', 'option3']);
        });

        it('should handle mixed empty strings and whitespace', () => {
            const input = 'option1,  ,   , option2,\t\t, option3';
            const result = OptionsHelper.parseBulkInput(input);
            expect(result).toEqual(['option1', 'option2', 'option3']);
        });

        it('should handle tabs and special whitespace characters', () => {
            const input = 'option1\t,\toption2\t,\toption3';
            const result = OptionsHelper.parseBulkInput(input);
            expect(result).toEqual(['option1', 'option2', 'option3']);
        });

        it('should handle Arabic text with whitespace', () => {
            const input = '  خيار1  ,   خيار2   ,    خيار3   ';
            const result = OptionsHelper.parseBulkInput(input);
            expect(result).toEqual(['خيار1', 'خيار2', 'خيار3']);
        });

        it('should handle single option with leading/trailing whitespace', () => {
            const input = '   single option   ';
            const result = OptionsHelper.parseBulkInput(input);
            expect(result).toEqual(['single option']);
        });

        it('should handle Windows-style line endings (CRLF)', () => {
            const input = 'option1\r\noption2\r\noption3';
            const result = OptionsHelper.parseBulkInput(input);
            expect(result).toEqual(['option1', 'option2', 'option3']);
        });

        it('should handle mixed line endings', () => {
            const input = 'option1\noption2\r\noption3\roption4';
            const result = OptionsHelper.parseBulkInput(input);
            // Should handle \n and \r\n, but \r alone might be treated differently
            expect(result.length).toBeGreaterThan(0);
            expect(result).toContain('option1');
        });

        it('should handle very long whitespace sequences', () => {
            const input = 'option1' + ' '.repeat(100) + ',' + ' '.repeat(100) + 'option2';
            const result = OptionsHelper.parseBulkInput(input);
            expect(result).toEqual(['option1', 'option2']);
        });

        it('should handle input with only commas', () => {
            const input = ',,,,,';
            const result = OptionsHelper.parseBulkInput(input);
            expect(result).toEqual([]);
        });

        it('should handle input with only newlines', () => {
            const input = '\n\n\n\n';
            const result = OptionsHelper.parseBulkInput(input);
            expect(result).toEqual([]);
        });
    });

    describe('calculateRanks - Sequential Generation', () => {
        it('should generate sequential ranks starting from 1', () => {
            const options = ['A', 'B', 'C', 'D', 'E'];
            const result = OptionsHelper.calculateRanks(options);

            expect(result).toHaveLength(5);
            result.forEach((item, index) => {
                expect(item.rank).toBe(index + 1);
            });
        });

        it('should maintain sequential ranks for large arrays', () => {
            const options = Array.from({ length: 1000 }, (_, i) => `Option${i}`);
            const result = OptionsHelper.calculateRanks(options);

            expect(result).toHaveLength(1000);
            expect(result[0].rank).toBe(1);
            expect(result[999].rank).toBe(1000);

            // Verify all ranks are sequential
            for (let i = 0; i < result.length; i++) {
                expect(result[i].rank).toBe(i + 1);
            }
        });

        it('should preserve option order in rank calculation', () => {
            const options = ['Z', 'A', 'M', 'B', 'Y'];
            const result = OptionsHelper.calculateRanks(options);

            expect(result[0]).toEqual({ option: 'Z', rank: 1 });
            expect(result[1]).toEqual({ option: 'A', rank: 2 });
            expect(result[2]).toEqual({ option: 'M', rank: 3 });
            expect(result[3]).toEqual({ option: 'B', rank: 4 });
            expect(result[4]).toEqual({ option: 'Y', rank: 5 });
        });

        it('should handle Arabic options with sequential ranks', () => {
            const options = ['خيار1', 'خيار2', 'خيار3', 'غير ذلك'];
            const result = OptionsHelper.calculateRanks(options);

            expect(result).toEqual([
                { option: 'خيار1', rank: 1 },
                { option: 'خيار2', rank: 2 },
                { option: 'خيار3', rank: 3 },
                { option: 'غير ذلك', rank: 4 }
            ]);
        });

        it('should handle options with special characters', () => {
            const options = ['Option@1', 'Option#2', 'Option$3'];
            const result = OptionsHelper.calculateRanks(options);

            expect(result).toEqual([
                { option: 'Option@1', rank: 1 },
                { option: 'Option#2', rank: 2 },
                { option: 'Option$3', rank: 3 }
            ]);
        });

        it('should handle options with numbers', () => {
            const options = ['2024', '2023', '2022', '2021'];
            const result = OptionsHelper.calculateRanks(options);

            expect(result).toEqual([
                { option: '2024', rank: 1 },
                { option: '2023', rank: 2 },
                { option: '2022', rank: 3 },
                { option: '2021', rank: 4 }
            ]);
        });

        it('should handle duplicate option names (ranks still sequential)', () => {
            const options = ['A', 'B', 'A', 'C'];
            const result = OptionsHelper.calculateRanks(options);

            expect(result).toEqual([
                { option: 'A', rank: 1 },
                { option: 'B', rank: 2 },
                { option: 'A', rank: 3 },
                { option: 'C', rank: 4 }
            ]);
        });

        it('should return empty array for empty input', () => {
            const result = OptionsHelper.calculateRanks([]);
            expect(result).toEqual([]);
        });

        it('should handle single option', () => {
            const result = OptionsHelper.calculateRanks(['SingleOption']);
            expect(result).toEqual([{ option: 'SingleOption', rank: 1 }]);
        });
    });

    describe('Integration Tests - Requirement Validation', () => {
        /**
         * **Validates: Requirement 6.18** - Bulk input parsing (comma-separated)
         */
        it('Requirement 6.18: should parse comma-separated bulk input correctly', () => {
            const input = 'جديد, مستعمل, ممتاز, جيد';
            const result = OptionsHelper.parseBulkInput(input);

            expect(result).toEqual(['جديد', 'مستعمل', 'ممتاز', 'جيد']);
            expect(result).toHaveLength(4);
        });

        /**
         * **Validates: Requirement 6.19** - Bulk input parsing (line-separated)
         */
        it('Requirement 6.19: should parse line-separated bulk input correctly', () => {
            const input = 'جديد\nمستعمل\nممتاز\nجيد';
            const result = OptionsHelper.parseBulkInput(input);

            expect(result).toEqual(['جديد', 'مستعمل', 'ممتاز', 'جيد']);
            expect(result).toHaveLength(4);
        });

        /**
         * **Validates: Requirement 7.1** - "غير ذلك" detection
         */
        it('Requirement 7.1: should detect "غير ذلك" option correctly', () => {
            const withOther = ['خيار1', 'خيار2', 'غير ذلك'];
            const withoutOther = ['خيار1', 'خيار2', 'خيار3'];

            expect(OptionsHelper.detectOtherOption(withOther)).toBe(true);
            expect(OptionsHelper.detectOtherOption(withoutOther)).toBe(false);
        });

        /**
         * **Validates: Requirement 7.4** - ensureOtherIsLast functionality
         */
        it('Requirement 7.4: should ensure "غير ذلك" is always last', () => {
            const input1 = ['غير ذلك', 'A', 'B', 'C'];
            const input2 = ['A', 'غير ذلك', 'B', 'C'];
            const input3 = ['A', 'B', 'C', 'غير ذلك'];

            const result1 = OptionsHelper.ensureOtherIsLast(input1);
            const result2 = OptionsHelper.ensureOtherIsLast(input2);
            const result3 = OptionsHelper.ensureOtherIsLast(input3);

            expect(result1[result1.length - 1]).toBe('غير ذلك');
            expect(result2[result2.length - 1]).toBe('غير ذلك');
            expect(result3[result3.length - 1]).toBe('غير ذلك');

            // Verify other elements maintain their relative order
            expect(result1.slice(0, -1)).toEqual(['A', 'B', 'C']);
            expect(result2.slice(0, -1)).toEqual(['A', 'B', 'C']);
            expect(result3.slice(0, -1)).toEqual(['A', 'B', 'C']);
        });

        /**
         * Combined workflow test: Parse bulk input, ensure "غير ذلك" is last, calculate ranks
         */
        it('should handle complete workflow: parse → ensure other last → calculate ranks', () => {
            // Step 1: Parse bulk input (comma-separated)
            const bulkInput = 'مستعمل, جديد, غير ذلك, ممتاز';
            const parsed = OptionsHelper.parseBulkInput(bulkInput);
            expect(parsed).toEqual(['مستعمل', 'جديد', 'غير ذلك', 'ممتاز']);

            // Step 2: Ensure "غير ذلك" is last
            const ordered = OptionsHelper.ensureOtherIsLast(parsed);
            expect(ordered[ordered.length - 1]).toBe('غير ذلك');
            expect(ordered).toEqual(['مستعمل', 'جديد', 'ممتاز', 'غير ذلك']);

            // Step 3: Calculate ranks
            const ranked = OptionsHelper.calculateRanks(ordered);
            expect(ranked).toEqual([
                { option: 'مستعمل', rank: 1 },
                { option: 'جديد', rank: 2 },
                { option: 'ممتاز', rank: 3 },
                { option: 'غير ذلك', rank: 4 }
            ]);

            // Verify "غير ذلك" has the highest rank
            const otherRank = ranked.find(r => r.option === 'غير ذلك');
            expect(otherRank?.rank).toBe(ranked.length);
        });

        /**
         * Combined workflow test: Parse line-separated input with whitespace
         */
        it('should handle line-separated input with whitespace in complete workflow', () => {
            const bulkInput = '  جديد  \n  مستعمل  \n  غير ذلك  \n  ممتاز  ';
            const parsed = OptionsHelper.parseBulkInput(bulkInput);
            const ordered = OptionsHelper.ensureOtherIsLast(parsed);
            const ranked = OptionsHelper.calculateRanks(ordered);

            expect(ranked[ranked.length - 1]).toEqual({ option: 'غير ذلك', rank: 4 });
            expect(ranked.map(r => r.rank)).toEqual([1, 2, 3, 4]);
        });
    });
});
