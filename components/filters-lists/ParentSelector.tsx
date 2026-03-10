'use client';

import { useState, useEffect } from 'react';

/**
 * ParentSelector Component
 * 
 * Dropdown selector for choosing parent options in hierarchical lists.
 * Used in RankModal and EditModal to select parent context before
 * displaying child options.
 * 
 * Requirements: 4.9, 4.10, 4.11
 * Task 18.2: Enhanced with screen reader support
 */

interface ParentSelectorProps {
    /** List of parent options to display */
    parents: string[];
    /** Currently selected parent */
    selectedParent: string | null;
    /** Callback when parent selection changes */
    onParentChange: (parent: string) => void;
    /** Label for the selector */
    label?: string;
    /** Whether the selector is disabled */
    disabled?: boolean;
    /** Loading state */
    loading?: boolean;
}

export function ParentSelector({
    parents,
    selectedParent,
    onParentChange,
    label = 'اختر الفئة الرئيسية',
    disabled = false,
    loading = false,
}: ParentSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.parent-selector-dropdown')) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isOpen]);

    const handleSelect = (parent: string) => {
        onParentChange(parent);
        setIsOpen(false);
    };

    if (loading) {
        return (
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
                <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 animate-pulse" role="status" aria-live="polite">
                    <div className="h-5 bg-gray-300 rounded w-1/3" aria-hidden="true"></div>
                    <span className="sr-only">جاري تحميل الخيارات...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6">
            <label htmlFor="parent-selector" className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>
            <div className="relative parent-selector-dropdown">
                <button
                    id="parent-selector"
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`
                        w-full p-3 text-right border rounded-lg
                        flex items-center justify-between
                        transition-colors
                        ${disabled
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-900 hover:border-blue-500 cursor-pointer'
                        }
                        ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
                    `}
                    style={{ color: '#111827' }}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-label={selectedParent ? `${label}: ${selectedParent}` : `${label}: لم يتم الاختيار`}
                    aria-controls="parent-options-list"
                >
                    <span className={selectedParent ? 'text-gray-900' : 'text-gray-400'}>
                        {selectedParent || 'اختر...'}
                    </span>
                    <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto"
                         style={{ scrollbarWidth: 'thin' }}>
                        {parents.length === 0 ? (
                            <div className="p-3 text-center text-gray-500 text-sm" role="status">
                                لا توجد خيارات متاحة
                            </div>
                        ) : (
                            <ul id="parent-options-list" role="listbox" className="py-1" aria-label={label}>
                                {parents.map((parent, index) => (
                                    <li
                                        key={parent}
                                        role="option"
                                        aria-selected={parent === selectedParent}
                                        aria-label={`${parent}${parent === selectedParent ? ' - محدد' : ''}`}
                                        onClick={() => handleSelect(parent)}
                                        className={`
                                            px-4 py-2 cursor-pointer transition-colors
                                            ${parent === selectedParent
                                                ? 'bg-blue-50 text-blue-700 font-medium'
                                                : 'text-gray-900 hover:bg-gray-50'
                                            }
                                        `}
                                        style={{ color: parent === selectedParent ? '#1d4ed8' : '#111827' }}
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleSelect(parent);
                                            }
                                        }}
                                    >
                                        {parent}
                                        {parent === selectedParent && (
                                            <span className="sr-only"> (محدد حالياً)</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
