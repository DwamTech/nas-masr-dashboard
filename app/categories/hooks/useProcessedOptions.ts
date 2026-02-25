import { useMemo } from 'react';
import { processOptions, processOptionsMap, processHierarchicalOptions } from '@/utils/optionsHelper';

/**
 * Hook لمعالجة options تلقائياً مع memoization
 * يضمن أن "غير ذلك" دائماً في آخر القائمة
 */
export function useProcessedOptions(
    options: string[] | null | undefined,
    shouldSort = false
): string[] {
    return useMemo(() => {
        return processOptions(options, shouldSort);
    }, [options, shouldSort]);
}

/**
 * Hook لمعالجة options map (مثل BRANDS_MODELS)
 */
export function useProcessedOptionsMap<T extends Record<string, string[]>>(
    optionsMap: T | null | undefined,
    shouldSort = false
): T {
    return useMemo(() => {
        if (!optionsMap) return {} as T;
        return processOptionsMap(optionsMap, shouldSort);
    }, [optionsMap, shouldSort]);
}

/**
 * Hook لمعالجة hierarchical options (مثل JOBS_MAIN_SUBS)
 */
export function useProcessedHierarchicalOptions(
    mainSubs: Record<string, string[]> | null | undefined,
    shouldSort = false
): Record<string, string[]> {
    return useMemo(() => {
        if (!mainSubs) return {};
        return processHierarchicalOptions(mainSubs, shouldSort);
    }, [mainSubs, shouldSort]);
}

/**
 * Hook لمعالجة كل أنواع الـ options في الـ state
 */
export function useProcessedCategoryOptions(rawOptions: {
    yearOptions?: string[];
    kmOptions?: string[];
    fuelOptions?: string[];
    transmissionOptions?: string[];
    exteriorColorOptions?: string[];
    carTypeOptions?: string[];
    propertyTypeOptions?: string[];
    contractTypeOptions?: string[];
    teacherSpecialtyOptions?: string[];
    doctorSpecialtyOptions?: string[];
    jobCategoryOptions?: string[];
    jobSpecialtyOptions?: string[];
    driverOptions?: string[];
}) {
    return useMemo(() => {
        const processed: typeof rawOptions = {};

        for (const [key, value] of Object.entries(rawOptions)) {
            if (Array.isArray(value)) {
                processed[key as keyof typeof rawOptions] = processOptions(value);
            }
        }

        return processed;
    }, [rawOptions]);
}
