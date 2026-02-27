import { useCallback } from 'react';

interface UseRankCalculationOptions {
    otherOptionLabel?: string;
}

interface RankData {
    option: string;
    rank: number;
}

export function useRankCalculation(options: UseRankCalculationOptions = {}) {
    const { otherOptionLabel = 'غير ذلك' } = options;

    /**
     * Calculate sequential ranks for options
     * Ensures "غير ذلك" gets the highest rank
     */
    const calculateRanks = useCallback(
        (orderedOptions: string[]): RankData[] => {
            return orderedOptions.map((option, index) => ({
                option,
                rank: index + 1,
            }));
        },
        []
    );

    /**
     * Ensure "غير ذلك" is at the end of the list
     */
    const ensureOtherIsLast = useCallback(
        (options: string[]): string[] => {
            const otherIndex = options.findIndex(opt => opt === otherOptionLabel);

            if (otherIndex === -1) {
                // "غير ذلك" not found, return as is
                return options;
            }

            if (otherIndex === options.length - 1) {
                // Already at the end
                return options;
            }

            // Remove "غير ذلك" from current position and add to end
            const newOptions = [...options];
            newOptions.splice(otherIndex, 1);
            newOptions.push(otherOptionLabel);

            return newOptions;
        },
        [otherOptionLabel]
    );

    return {
        calculateRanks,
        ensureOtherIsLast,
    };
}
