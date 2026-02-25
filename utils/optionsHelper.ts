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

export { OTHER_OPTION };
