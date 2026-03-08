'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { OptionsHelper } from '@/utils/optionsHelper';
import { debounce } from '@/utils/performance';

/**
 * BulkAddTextarea Component
 * 
 * Component for bulk option addition with validation and preview.
 * 
 * Task 12.1: Create BulkAddTextarea component
 * 
 * Features:
 * - Displays textarea above single option input
 * - Accepts comma-separated and line-separated input
 * - Parses input using OptionsHelper.parseBulkInput
 * - Displays preview of options to be added
 * - Validates all options before adding (duplicates, empty values)
 * - Shows specific error messages for invalid options
 * 
 * Requirements: 6.18, 6.19, 6.20, 6.21, 6.22, 6.26
 */

interface BulkAddTextareaProps {
    onAdd: (options: string[]) => void;
    existingOptions: string[];
    placeholder?: string;
    disabled?: boolean;
}

export default function BulkAddTextarea({
    onAdd,
    existingOptions,
    placeholder = 'أدخل الخيارات مفصولة بفواصل أو كل خيار في سطر جديد...',
    disabled = false,
}: BulkAddTextareaProps) {
    const [bulkInput, setBulkInput] = useState<string>('');
    const [previewOptions, setPreviewOptions] = useState<string[]>([]);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

    /**
     * Parse and validate bulk input with debouncing
     * Task 21.3: Debounce bulk input parsing (300ms)
     * Requirements: 6.18, 6.19, 6.20, 6.21, 6.22, 12.3
     */
    const debouncedParse = useMemo(
        () =>
            debounce((input: string, existing: string[]) => {
                if (!input.trim()) {
                    setPreviewOptions([]);
                    setValidationErrors([]);
                    setValidationWarnings([]);
                    return;
                }

                // Parse input using OptionsHelper (Requirements 6.18, 6.19)
                const parsed = OptionsHelper.parseBulkInput(input);

                // Validate all options (Requirement 6.21)
                const validation = OptionsHelper.validateOptions(parsed, existing);

                setPreviewOptions(parsed);
                setValidationErrors(validation.errors);
                setValidationWarnings(validation.warnings);
            }, 300),
        []
    );

    useEffect(() => {
        // Debounce parsing to avoid expensive operations on every keystroke
        debouncedParse(bulkInput, existingOptions);
    }, [bulkInput, existingOptions, debouncedParse]);

    /**
     * Handle bulk add button click
     * Requirement 6.21: Add all valid options
     */
    const handleBulkAdd = useCallback(() => {
        if (previewOptions.length === 0) {
            return;
        }

        // Only add if there are no validation errors
        if (validationErrors.length === 0) {
            onAdd(previewOptions);
            // Clear input after successful add
            setBulkInput('');
            setPreviewOptions([]);
            setValidationErrors([]);
            setValidationWarnings([]);
        }
    }, [previewOptions, validationErrors, onAdd]);

    const hasErrors = validationErrors.length > 0;
    const hasWarnings = validationWarnings.length > 0;
    const canAdd = previewOptions.length > 0 && !hasErrors;

    return (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                إضافة خيارات متعددة (Bulk Add)
            </label>

            {/* Textarea for bulk input - Requirements 6.18, 6.19 */}
            <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* Helper text */}
            <p className="text-xs text-gray-500 mt-2">
                يمكنك إدخال الخيارات بطريقتين:
                <br />
                • مفصولة بفواصل: خيار1, خيار2, خيار3
                <br />
                • كل خيار في سطر جديد
            </p>

            {/* Preview section - Requirement 6.22 */}
            {previewOptions.length > 0 && (
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">
                            معاينة ({previewOptions.length} خيار)
                        </h4>
                    </div>

                    {/* Preview list */}
                    <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                        <ul className="space-y-1">
                            {previewOptions.map((option, index) => (
                                <li
                                    key={index}
                                    className="flex items-center gap-2 text-sm text-gray-700"
                                >
                                    <svg
                                        className="w-4 h-4 text-green-500 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    <span>{option}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Validation errors - Requirement 6.26 */}
            {hasErrors && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-800 mb-1">أخطاء في التحقق:</p>
                    <ul className="list-disc list-inside space-y-1">
                        {validationErrors.map((error, index) => (
                            <li key={index} className="text-sm text-red-700">
                                {error}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Validation warnings */}
            {hasWarnings && !hasErrors && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-800 mb-1">تحذيرات:</p>
                    <ul className="list-disc list-inside space-y-1">
                        {validationWarnings.map((warning, index) => (
                            <li key={index} className="text-sm text-yellow-700">
                                {warning}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Bulk add button */}
            <div className="mt-4 flex items-center justify-between">
                <button
                    onClick={handleBulkAdd}
                    disabled={!canAdd || disabled}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    إضافة الكل ({previewOptions.length})
                </button>

                {bulkInput.trim() && (
                    <button
                        onClick={() => {
                            setBulkInput('');
                            setPreviewOptions([]);
                            setValidationErrors([]);
                            setValidationWarnings([]);
                        }}
                        disabled={disabled}
                        className="text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        مسح
                    </button>
                )}
            </div>
        </div>
    );
}
