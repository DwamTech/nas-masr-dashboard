/**
 * Options Helper Utility
 * 
 * يوفر دوال مساعدة لإدارة خيارات الأقسام
 * يضمن أن "غير ذلك" دائماً في آخر القائمة
 */

const OTHER_OPTION = 'غير ذلك';

/**
 * يضمن أن "غير ذلك" موجود في آخر القائمة
 * @param options - القائمة الأصلية
 * @returns القائمة مع "غير ذلك" في الآخر
 */
export function ensureOtherAtEnd(options: string[]): string[] {
    if (!Array.isArray(options)) {
        return [OTHER_OPTION];
    }

    // إزالة كل نسخ "غير ذلك" من القائمة
    const filtered = options.filter(opt => opt !== OTHER_OPTION);

    // إضافة "غير ذلك" في الآخر
    return [...filtered, OTHER_OPTION];
}

/**
 * يرتب القائمة أبجدياً مع إبقاء "غير ذلك" في الآخر
 * @param options - القائمة الأصلية
 * @returns القائمة مرتبة مع "غير ذلك" في الآخر
 */
export function sortOptionsWithOtherAtEnd(options: string[]): string[] {
    if (!Array.isArray(options)) {
        return [OTHER_OPTION];
    }

    // إزالة "غير ذلك" وترتيب الباقي
    const filtered = options.filter(opt => opt !== OTHER_OPTION);
    const sorted = filtered.sort((a, b) => a.localeCompare(b, 'ar'));

    // إضافة "غير ذلك" في الآخر
    return [...sorted, OTHER_OPTION];
}

/**
 * يعالج options من API ويضمن "غير ذلك" في الآخر
 * @param options - القائمة من API
 * @param shouldSort - هل نرتب القائمة أبجدياً؟
 * @returns القائمة معالجة
 */
export function processOptions(options: string[] | null | undefined, shouldSort = false): string[] {
    if (!options || !Array.isArray(options) || options.length === 0) {
        return [OTHER_OPTION];
    }

    // تنظيف القائمة من القيم الفارغة
    const cleaned = options
        .map(opt => String(opt || '').trim())
        .filter(opt => opt.length > 0);

    if (cleaned.length === 0) {
        return [OTHER_OPTION];
    }

    // ترتيب أو مجرد وضع "غير ذلك" في الآخر
    return shouldSort
        ? sortOptionsWithOtherAtEnd(cleaned)
        : ensureOtherAtEnd(cleaned);
}

/**
 * يعالج Record من options (مثل BRANDS_MODELS)
 * @param optionsMap - الـ Record الأصلي
 * @param shouldSort - هل نرتب القوائم؟
 * @returns الـ Record معالج
 */
export function processOptionsMap<T extends Record<string, string[]>>(
    optionsMap: T,
    shouldSort = false
): T {
    const processed = {} as T;

    for (const [key, values] of Object.entries(optionsMap)) {
        processed[key as keyof T] = processOptions(values, shouldSort) as T[keyof T];
    }

    return processed;
}

/**
 * يعالج hierarchical options (مثل JOBS_MAIN_SUBS)
 * @param mainSubs - الـ Record الهرمي
 * @param shouldSort - هل نرتب القوائم؟
 * @returns الـ Record معالج
 */
export function processHierarchicalOptions(
    mainSubs: Record<string, string[]>,
    shouldSort = false
): Record<string, string[]> {
    return processOptionsMap(mainSubs, shouldSort);
}

/**
 * Hook لمعالجة options تلقائياً
 */
export function useProcessedOptions(
    options: string[] | null | undefined,
    shouldSort = false
): string[] {
    // في React component، يمكن استخدام useMemo
    // لكن هنا نعيد القيمة مباشرة
    return processOptions(options, shouldSort);
}

/**
 * يحلل مدخلات الإضافة الجماعية (فاصلة أو سطر جديد)
 * @param input - النص المدخل (فاصل بفواصل أو أسطر جديدة)
 * @returns مصفوفة من الخيارات المنظفة
 */
export function parseBulkInput(input: string): string[] {
    if (!input || typeof input !== 'string') {
        return [];
    }

    // محاولة تحديد الفاصل (فاصلة أو سطر جديد)
    const hasCommas = input.includes(',');
    const hasNewlines = input.includes('\n');

    let options: string[] = [];

    if (hasCommas && !hasNewlines) {
        // فاصل بفواصل
        options = input.split(',');
    } else if (hasNewlines) {
        // فاصل بأسطر جديدة
        options = input.split('\n');
    } else if (hasCommas) {
        // إذا كان هناك فواصل وأسطر جديدة، استخدم الفواصل
        options = input.split(',');
    } else {
        // إذا لم يكن هناك فاصل، اعتبر المدخل كخيار واحد
        options = [input];
    }

    // تنظيف كل خيار: إزالة المسافات الزائدة والقيم الفارغة
    return options
        .map(opt => String(opt || '').trim())
        .filter(opt => opt.length > 0);
}

/**
 * التحقق من صحة الخيارات (كشف التكرارات والقيم الفارغة)
 * @param options - الخيارات المراد التحقق منها
 * @param existingOptions - الخيارات الموجودة بالفعل (اختياري)
 * @returns نتيجة التحقق
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    duplicates: string[];
}

export function validateOptions(
    options: string[],
    existingOptions: string[] = []
): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const duplicates: string[] = [];

    if (!Array.isArray(options)) {
        return {
            valid: false,
            errors: ['المدخل يجب أن يكون مصفوفة'],
            warnings: [],
            duplicates: [],
        };
    }

    // التحقق من القيم الفارغة
    const emptyIndices = options
        .map((opt, idx) => ({ opt, idx }))
        .filter(({ opt }) => !opt || String(opt).trim().length === 0)
        .map(({ idx }) => idx);

    if (emptyIndices.length > 0) {
        errors.push(`يوجد قيم فارغة في المواضع: ${emptyIndices.join(', ')}`);
    }

    // التحقق من التكرارات داخل المصفوفة الجديدة
    const seen = new Set<string>();
    const internalDuplicates: string[] = [];

    options.forEach(opt => {
        const trimmed = String(opt || '').trim();
        if (trimmed.length > 0) {
            if (seen.has(trimmed)) {
                if (!internalDuplicates.includes(trimmed)) {
                    internalDuplicates.push(trimmed);
                }
            }
            seen.add(trimmed);
        }
    });

    if (internalDuplicates.length > 0) {
        duplicates.push(...internalDuplicates);
        errors.push(`يوجد خيارات مكررة: ${internalDuplicates.join(', ')}`);
    }

    // التحقق من التكرارات مع الخيارات الموجودة
    const existingSet = new Set(
        existingOptions.map(opt => String(opt || '').trim()).filter(opt => opt.length > 0)
    );

    const conflictingDuplicates: string[] = [];
    options.forEach(opt => {
        const trimmed = String(opt || '').trim();
        if (trimmed.length > 0 && existingSet.has(trimmed)) {
            if (!conflictingDuplicates.includes(trimmed)) {
                conflictingDuplicates.push(trimmed);
            }
        }
    });

    if (conflictingDuplicates.length > 0) {
        duplicates.push(...conflictingDuplicates);
        errors.push(`الخيارات التالية موجودة بالفعل: ${conflictingDuplicates.join(', ')}`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        duplicates,
    };
}

/**
 * واجهة بيانات الترتيب
 */
export interface RankData {
    option: string;
    rank: number;
}

/**
 * حساب الترتيبات المتسلسلة للخيارات
 * @param options - الخيارات المراد حساب ترتيبها
 * @returns مصفوفة من بيانات الترتيب
 */
export function calculateRanks(options: string[]): RankData[] {
    if (!Array.isArray(options) || options.length === 0) {
        return [];
    }

    return options.map((option, index) => ({
        option,
        rank: index + 1,
    }));
}

/**
 * يكتشف وجود "غير ذلك" في القائمة
 * @param options - القائمة المراد البحث فيها
 * @returns true إذا كان "غير ذلك" موجوداً، false خلاف ذلك
 */
export function detectOtherOption(options: string[]): boolean {
    if (!Array.isArray(options)) {
        return false;
    }
    return options.includes(OTHER_OPTION);
}

/**
 * فئة OptionsHelper - توفر واجهة موحدة للعمليات على الخيارات
 */
export class OptionsHelper {
    static readonly OTHER_OPTION = OTHER_OPTION;

    /**
     * يكتشف وجود "غير ذلك" في القائمة
     */
    static detectOtherOption(options: string[]): boolean {
        return detectOtherOption(options);
    }

    /**
     * يضمن أن "غير ذلك" موجود في آخر القائمة
     */
    static ensureOtherIsLast(options: string[]): string[] {
        return ensureOtherAtEnd(options);
    }

    /**
     * يحلل مدخلات الإضافة الجماعية
     */
    static parseBulkInput(input: string): string[] {
        return parseBulkInput(input);
    }

    /**
     * يتحقق من صحة الخيارات
     */
    static validateOptions(
        options: string[],
        existingOptions?: string[]
    ): ValidationResult {
        return validateOptions(options, existingOptions);
    }

    /**
     * يحسب الترتيبات المتسلسلة
     */
    static calculateRanks(options: string[]): RankData[] {
        return calculateRanks(options);
    }

    /**
     * يرتب القائمة أبجدياً مع إبقاء "غير ذلك" في الآخر
     */
    static sortOptionsWithOtherAtEnd(options: string[]): string[] {
        return sortOptionsWithOtherAtEnd(options);
    }

    /**
     * يعالج options من API
     */
    static processOptions(
        options: string[] | null | undefined,
        shouldSort?: boolean
    ): string[] {
        return processOptions(options, shouldSort);
    }

    /**
     * يعالج Record من options
     */
    static processOptionsMap<T extends Record<string, string[]>>(
        optionsMap: T,
        shouldSort?: boolean
    ): T {
        return processOptionsMap(optionsMap, shouldSort);
    }
}

export { OTHER_OPTION };
