'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category, CategoryField, FieldMetadata, OptionData } from '@/types/filters-lists';
import { fetchCategoryFields } from '@/services/categoryFields';
import { fetchAdminMakesWithIds } from '@/services/makes';
import { fetchGovernorates } from '@/services/governorates';
import { updateCategoryFieldOptions, postAdminMakeModels } from '@/services/makes';
import { cache, INVALIDATION_PATTERNS } from '@/utils/cache';
import { OptionsHelper } from '@/utils/optionsHelper';
import BulkAddTextarea from './BulkAddTextarea';
import { ParentSelector } from './ParentSelector';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useFocusReturn } from '@/hooks/useFocusReturn';
import '@/components/DraggableOptions/styles.css';
import './animations.css';
import './tailwind-shim.css';

/**
 * EditModal Component
 * 
 * Modal for adding, editing, and hiding/showing field options.
 * Supports both independent lists and hierarchical lists.
 * 
 * Task 11.1: Create EditModal component with independent list support
 * 
 * Features:
 * - Detects list type (independent vs hierarchical) from field metadata
 * - Renders modal with field display name in header
 * - Fetches current options sorted by rank
 * - Displays options with edit and hide/show buttons
 * - Shows "مخفي" badge and reduced opacity for hidden options
 * - Prevents editing/hiding "غير ذلك" option
 * 
 * Requirements: 6.1, 6.7, 6.8, 6.12, 6.13, 6.14, 6.17, 10.1, 10.2
 */

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category;
    field?: CategoryField; // Optional - if not provided, the first field is used
    parent?: string; // For hierarchical lists
}

interface OptionWithState extends OptionData {
    isEditing?: boolean;
    originalValue?: string;
}

/**
 * Detect whether a field is independent or hierarchical
 * @param field - The category field to analyze
 * @returns Field metadata with list type information
 */
function detectListType(f: CategoryField): FieldMetadata {
    // Hierarchical patterns
    const hierarchicalPatterns = [
        { parent: 'governorate', child: 'city' },
        { parent: 'brand', child: 'model' },
        { parent: 'main_section', child: 'sub_section' },
    ];

    const fieldNameLower = f.field_name.toLowerCase();

    // Check if field is part of a hierarchical relationship
    for (const pattern of hierarchicalPatterns) {
        if (fieldNameLower.includes(pattern.parent)) {
            return {
                listType: 'hierarchical',
                hasParent: false,
                childField: pattern.child,
            };
        }
        if (fieldNameLower.includes(pattern.child)) {
            return {
                listType: 'hierarchical',
                hasParent: true,
                parentField: pattern.parent,
            };
        }
    }

    // Default to independent
    return {
        listType: 'independent',
        hasParent: false,
    };
}

export default function EditModal({ isOpen, onClose, category, field: initialField, parent }: EditModalProps) {
    const [options, setOptions] = useState<OptionWithState[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fieldMetadata, setFieldMetadata] = useState<FieldMetadata | null>(null);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [newOptionValue, setNewOptionValue] = useState<string>(''); // Task 11.2: Single option add input
    const [isClosing, setIsClosing] = useState(false); // Task 23.2: Track closing animation

    // Fields management — load all category fields, select one as active
    const [allFields, setAllFields] = useState<CategoryField[]>([]);
    const [activeField, setActiveField] = useState<CategoryField | null>(initialField || null);

    // Task 13.1: State for hierarchical lists
    const [parentOptions, setParentOptions] = useState<string[]>([]);
    const [selectedParent, setSelectedParent] = useState<string | null>(parent || null);
    const [loadingParents, setLoadingParents] = useState(false);

    /**
     * Cache of fetched makes (brand + models) to avoid repeated API calls.
     * Populated once when the brand or model field becomes active.
     */
    const [makesCache, setMakesCache] = useState<{ id: number; name: string; models: string[] }[]>([]);

    // Task 18.1: Keyboard navigation support
    // Implement focus trap in modal (Requirement 11.5)
    const modalRef = useFocusTrap<HTMLDivElement>(isOpen);

    // Return focus to trigger element on modal close (Requirement 11.6)
    useFocusReturn(isOpen);

    // Task 18.1: Handle Escape key to close modal (Requirement 11.5)
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                handleClose(); // Use animated close
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    // Task 23.2: Handle animated modal close
    const handleClose = useCallback(() => {
        setIsClosing(true);
        // Wait for animation to complete before actually closing
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 200); // Match animation duration
    }, [onClose]);

    // Load all category fields for the tabs, then set active field
    useEffect(() => {
        if (!isOpen) return;

        const loadFields = async () => {
            try {
                const response = await fetchCategoryFields(category.slug);
                // Filter out 'name' fields — free-text entered by ad creators, not selectable options
                const fields = (response.data || []).filter(
                    (f: CategoryField) => f.field_name !== 'name'
                );
                setAllFields(fields);

                // Set active field: prefer the one passed via prop, otherwise the first field
                if (!activeField && fields.length > 0) {
                    setActiveField(fields[0]);
                } else if (activeField && !fields.some(f => f.field_name === activeField.field_name)) {
                    // Active field no longer in the list, default to first
                    setActiveField(fields[0] || null);
                }
            } catch (err) {
                console.error('Error loading category fields for tabs:', err);
            }
        };

        loadFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, category.slug]);

    // Fetch options when modal opens or active field changes
    useEffect(() => {
        if (!isOpen || !activeField) return;

        const loadOptions = async () => {
            setLoading(true);
            setError(null);
            setSuccessMessage(null);

            try {
                // Detect field type (Requirement 10.1)
                const metadata = detectListType(activeField);
                setFieldMetadata(metadata);

                // Task 13.1: Handle hierarchical lists
                if (metadata.listType === 'hierarchical') {
                    if (metadata.hasParent) {
                        // This is a child field (e.g., city, model)
                        // Load parent options first
                        await loadParentOptions(metadata);
                    } else {
                        // This is a parent field (e.g., governorate, brand)
                        if (metadata.childField === 'model') {
                            // Brand field: load from /api/makes
                            await loadBrandFieldOptions();
                        } else {
                            await loadIndependentOptions();
                        }
                    }
                } else {
                    // Independent list
                    await loadIndependentOptions();
                }
            } catch (err) {
                console.error('Error loading options:', err);
                setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الخيارات');
                setLoading(false);
            }
        };

        loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, category.slug, activeField?.field_name]);

    // Task 13.1: Load parent options for hierarchical child fields
    // Requirements: 6.9, 6.10
    useEffect(() => {
        if (!isOpen || !fieldMetadata || !selectedParent) return;
        if (fieldMetadata.listType !== 'hierarchical' || !fieldMetadata.hasParent) return;

        // Load child options when parent is selected
        loadChildOptions(selectedParent);
    }, [selectedParent, isOpen, fieldMetadata]);

    /**
     * Load options for independent lists
     * Fetches current options sorted by rank (Requirement 6.8)
     */
    const loadIndependentOptions = async () => {
        try {
            if (!activeField) return;
            const response = await fetchCategoryFields(category.slug);
            const targetField = response.data.find(f => f.field_name === activeField.field_name);

            if (!targetField) {
                throw new Error('الحقل المطلوب غير موجود');
            }

            const fieldOptions = targetField.options || [];

            // Convert to OptionWithState format
            // For now, all options are active (is_active: true)
            // Hidden option support will be added in Task 11.4
            const optionsWithState: OptionWithState[] = fieldOptions.map((opt, index) => ({
                value: opt,
                is_active: true,
                rank: index + 1,
                isEditing: false,
            }));

            setOptions(optionsWithState);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Load brand names from /api/makes for the brand field.
     * Used when the active field IS the brand/make field (parent, not child).
     */
    const loadBrandFieldOptions = async () => {
        try {
            let makes = makesCache;
            if (makes.length === 0) {
                makes = await fetchAdminMakesWithIds();
                setMakesCache(makes);
            }
            const brandOptions: OptionWithState[] = makes.map((m, index) => ({
                value: m.name,
                is_active: true,
                rank: index + 1,
                isEditing: false,
            }));
            setOptions(brandOptions);
        } catch (err) {
            console.error('Error loading brand options:', err);
            throw new Error('فشل تحميل قائمة الماركات');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Task 13.1: Load parent options for hierarchical lists
     * Requirements: 6.9, 6.10
     * 
     * Fetches parent options (e.g., governorates, brands) to populate the parent selector
     */
    const loadParentOptions = async (metadata: FieldMetadata) => {
        setLoadingParents(true);
        try {
            if (metadata.parentField?.includes('brand')) {
                // Fetch brands from /api/makes (the authoritative source)
                let makes = makesCache;
                if (makes.length === 0) {
                    makes = await fetchAdminMakesWithIds();
                    setMakesCache(makes);
                }
                const brandNames = makes.map(m => m.name);
                setParentOptions(brandNames);

                if (parent) {
                    setSelectedParent(parent);
                } else if (brandNames.length > 0) {
                    setSelectedParent(brandNames[0]);
                }
            } else if (metadata.parentField?.includes('governorate')) {
                const governorates = await fetchGovernorates();
                const parentNames = governorates.map(g => g.name);
                setParentOptions(parentNames);

                if (parent) {
                    setSelectedParent(parent);
                } else if (parentNames.length > 0) {
                    setSelectedParent(parentNames[0]);
                }
            }
        } catch (err) {
            console.error('Error loading parent options:', err);
            setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الخيارات الرئيسية');
        } finally {
            setLoadingParents(false);
            setLoading(false);
        }
    };

    /**
     * Task 13.1: Load child options for a specific parent
     * Requirements: 6.10, 6.31
     * 
     * Fetches child options (e.g., cities for a governorate) based on selected parent
     */
    const loadChildOptions = async (parentValue: string) => {
        setLoading(true);
        setError(null);

        try {
            if (fieldMetadata?.parentField?.includes('brand')) {
                // Fetch models for the selected brand from /api/makes cache
                let makes = makesCache;
                if (makes.length === 0) {
                    makes = await fetchAdminMakesWithIds();
                    setMakesCache(makes);
                }
                const selectedMake = makes.find(m => m.name === parentValue);
                const modelNames = selectedMake?.models ?? [];
                const modelOptions: OptionWithState[] = modelNames.map((model, index) => ({
                    value: model,
                    is_active: true,
                    rank: index + 1,
                    isEditing: false,
                }));
                setOptions(modelOptions);
            } else if (fieldMetadata?.parentField?.includes('governorate')) {
                const governorates = await fetchGovernorates();
                const selectedGov = governorates.find(g => g.name === parentValue);

                if (selectedGov && selectedGov.cities) {
                    const cityOptions: OptionWithState[] = selectedGov.cities.map((city, index) => ({
                        value: city.name,
                        is_active: true,
                        rank: index + 1,
                        isEditing: false,
                    }));
                    setOptions(cityOptions);
                } else {
                    setOptions([]);
                }
            }
        } catch (err) {
            console.error('Error loading child options:', err);
            setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الخيارات الفرعية');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Task 13.1: Handle parent selection change
     * Requirements: 6.10, 6.11
     * 
     * Updates selected parent and loads corresponding child options
     */
    const handleParentChange = useCallback((newParent: string) => {
        setSelectedParent(newParent);
        // Child options will be loaded by the useEffect hook
    }, []);

    /**
     * Check if an option is the "غير ذلك" option
     * Used to prevent editing/hiding this special option (Requirement 6.17)
     */
    const isOtherOption = useCallback((value: string): boolean => {
        return value === OptionsHelper.OTHER_OPTION;
    }, []);

    /**
     * Task 11.3: Handle starting inline edit for an option
     * Requirements: 6.12, 6.28
     * 
     * - Enables inline editing mode for the selected option
     * - Stores original value for potential cancellation
     */
    const handleStartEdit = useCallback((index: number) => {
        setOptions(prevOptions => prevOptions.map((opt, i) => {
            if (i === index) {
                return {
                    ...opt,
                    isEditing: true,
                    originalValue: opt.value,
                };
            }
            return opt;
        }));
        setError(null); // Clear any previous errors
    }, []);

    /**
     * Task 11.3: Handle saving inline edit for an option
     * Requirements: 6.28, 6.34
     * 
     * - Validates uniqueness before saving (Requirement 6.34)
     * - Preserves rank when editing option text
     * - Updates option value if validation passes
     */
    const handleSaveEdit = useCallback((index: number) => {
        const option = options[index];
        const newValue = option.value.trim();

        // Validate: check if empty
        if (!newValue) {
            setError('لا يمكن أن يكون الاسم فارغاً');
            return;
        }

        // Validate: check if it's "غير ذلك" (not allowed)
        if (newValue === OptionsHelper.OTHER_OPTION && option.originalValue !== OptionsHelper.OTHER_OPTION) {
            setError('لا يمكن تغيير الاسم إلى "غير ذلك"');
            return;
        }

        // Validate: check for duplicates (Requirement 6.34)
        // Exclude the current option being edited from the check
        const otherValues = options
            .filter((_, i) => i !== index)
            .map(opt => opt.value);

        const validation = OptionsHelper.validateOptions([newValue], otherValues);

        if (!validation.valid) {
            setError(validation.errors.join(', '));
            return;
        }

        // Clear any previous errors
        setError(null);

        // Update the option value and exit editing mode
        setOptions(prevOptions => prevOptions.map((opt, i) => {
            if (i === index) {
                return {
                    ...opt,
                    value: newValue,
                    isEditing: false,
                    originalValue: undefined,
                };
            }
            return opt;
        }));

        setSuccessMessage(`تم تعديل الخيار بنجاح`);
        setTimeout(() => setSuccessMessage(null), 3000);
    }, [options]);

    /**
     * Task 11.3: Handle canceling inline edit for an option
     * 
     * - Reverts to original value
     * - Exits editing mode
     */
    const handleCancelEdit = useCallback((index: number) => {
        setOptions(prevOptions => prevOptions.map((opt, i) => {
            if (i === index) {
                return {
                    ...opt,
                    value: opt.originalValue || opt.value,
                    isEditing: false,
                    originalValue: undefined,
                };
            }
            return opt;
        }));
        setError(null); // Clear any errors
    }, []);

    /**
     * Task 11.3: Handle inline edit value change
     * 
     * - Updates the option value in state as user types
     */
    const handleEditValueChange = useCallback((index: number, newValue: string) => {
        setOptions(prevOptions => prevOptions.map((opt, i) => {
            if (i === index) {
                return {
                    ...opt,
                    value: newValue,
                };
            }
            return opt;
        }));
    }, []);

    /**
     * Task 11.2: Handle adding a single new option
     * Task 13.2: Extended for hierarchical lists (Requirements 6.10, 6.31, 6.35)
     * Requirements: 6.27, 6.29, 6.30, 6.32, 6.34
     * 
     * - Validates option name before adding (Requirement 6.34)
     * - For hierarchical child lists: validates uniqueness within parent context (Requirement 6.35)
     * - Adds new option at rank 1 (Requirement 6.29, 6.31)
     * - Shifts existing option ranks down by 1 (Requirement 6.30)
     * - Ensures "غير ذلك" maintains highest rank (Requirement 6.32)
     */
    const handleAddOption = useCallback(() => {
        // Trim the input value
        const trimmedValue = newOptionValue.trim();

        // Validate: check if empty
        if (!trimmedValue) {
            setError('لا يمكن أن يكون الاسم فارغاً');
            return;
        }

        // Validate: check if it's "غير ذلك" (not allowed to add manually)
        if (trimmedValue === OptionsHelper.OTHER_OPTION) {
            setError('لا يمكن إضافة "غير ذلك" يدوياً - هذا الخيار موجود تلقائياً');
            return;
        }

        // Task 13.2: For hierarchical child lists, require parent selection (Requirement 6.10)
        if (fieldMetadata?.listType === 'hierarchical' && fieldMetadata.hasParent && !selectedParent) {
            setError('يرجى اختيار الفئة الرئيسية أولاً');
            return;
        }

        // Validate: check for duplicates
        // Task 13.2: For hierarchical child lists, validate uniqueness within parent context (Requirement 6.35)
        const existingValues = options.map(opt => opt.value);
        const validation = OptionsHelper.validateOptions([trimmedValue], existingValues);

        if (!validation.valid) {
            setError(validation.errors.join(', '));
            return;
        }

        // Clear any previous errors
        setError(null);

        // Add new option at rank 1 (Requirement 6.29, 6.31)
        const newOption: OptionWithState = {
            value: trimmedValue,
            is_active: true,
            rank: 1,
            isEditing: false,
        };

        // Shift existing option ranks down by 1 (Requirement 6.30)
        const updatedOptions = options.map(opt => ({
            ...opt,
            rank: (opt.rank || 0) + 1,
        }));

        // Insert new option at the beginning
        const newOptionsList = [newOption, ...updatedOptions];

        // Ensure "غير ذلك" maintains highest rank (Requirement 6.32)
        // Sort to ensure proper order, then recalculate ranks
        const sortedOptions = newOptionsList.sort((a, b) => {
            // "غير ذلك" always goes last
            if (a.value === OptionsHelper.OTHER_OPTION) return 1;
            if (b.value === OptionsHelper.OTHER_OPTION) return -1;
            // Others maintain their rank order
            return (a.rank || 0) - (b.rank || 0);
        });

        // Recalculate sequential ranks
        const finalOptions = sortedOptions.map((opt, index) => ({
            ...opt,
            rank: index + 1,
        }));

        setOptions(finalOptions);
        setNewOptionValue(''); // Clear input field

        // Task 13.2: Show success message with parent context for hierarchical child lists
        const successMsg = fieldMetadata?.listType === 'hierarchical' && fieldMetadata.hasParent && selectedParent
            ? `تمت إضافة "${trimmedValue}" في ${selectedParent} بنجاح`
            : `تمت إضافة "${trimmedValue}" بنجاح`;
        setSuccessMessage(successMsg);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
    }, [newOptionValue, options, fieldMetadata, selectedParent]);

    /**
     * Task 12.2: Handle bulk add of multiple options
     * Requirements: 6.21, 6.23, 6.24, 6.25, 6.32
     * 
     * - Adds all valid options starting from rank 1 (Requirement 6.21)
     * - Shifts existing option ranks down by count of new options (Requirement 6.24)
     * - Ensures "غير ذلك" maintains highest rank after bulk add (Requirement 6.32)
     * - Displays success message with count of added options (Requirement 6.25)
     */
    const handleBulkAdd = useCallback((newOptions: string[]) => {
        if (newOptions.length === 0) {
            return;
        }

        // Create new option objects starting from rank 1 (Requirement 6.21)
        const bulkOptions: OptionWithState[] = newOptions.map((opt, index) => ({
            value: opt,
            is_active: true,
            rank: index + 1,
            isEditing: false,
        }));

        // Shift existing option ranks down by count of new options (Requirement 6.24)
        const shiftAmount = newOptions.length;
        const updatedExistingOptions = options.map(opt => ({
            ...opt,
            rank: (opt.rank || 0) + shiftAmount,
        }));

        // Combine new and existing options
        const combinedOptions = [...bulkOptions, ...updatedExistingOptions];

        // Ensure "غير ذلك" maintains highest rank (Requirement 6.32)
        // Sort to ensure proper order, then recalculate ranks
        const sortedOptions = combinedOptions.sort((a, b) => {
            // "غير ذلك" always goes last
            if (a.value === OptionsHelper.OTHER_OPTION) return 1;
            if (b.value === OptionsHelper.OTHER_OPTION) return -1;
            // Others maintain their rank order
            return (a.rank || 0) - (b.rank || 0);
        });

        // Recalculate sequential ranks
        const finalOptions = sortedOptions.map((opt, index) => ({
            ...opt,
            rank: index + 1,
        }));

        setOptions(finalOptions);

        // Display success message with count (Requirement 6.25)
        setSuccessMessage(`تمت إضافة ${newOptions.length} خيار بنجاح`);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
    }, [options]);

    /**
     * Handle saving all changes
     * - Submits the current options to the backend API
     */
    const handleSave = useCallback(async () => {
        if (!activeField) return;
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Extract the string values from options
            const optionsToSave = options.map(opt => opt.value);

            // Save to backend using category fields API
            await updateCategoryFieldOptions(
                category.slug,
                activeField.field_name,
                optionsToSave
            );

            // Invalidate cache
            const pattern = INVALIDATION_PATTERNS.RANK_UPDATE(category.slug);
            cache.invalidate(pattern);

            setSuccessMessage('تم حفظ التغييرات بنجاح');

            // Close modal after short delay
            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (err) {
            console.error('Error saving options:', err);
            setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ التغييرات');
        } finally {
            setSaving(false);
        }
    }, [category.slug, activeField?.field_name, options, handleClose]);

    /**
     * Task 11.4: Handle toggling hide/show for an option
     * Requirements: 6.13, 6.14, 6.15, 6.16, 6.17, 8.13, 8.14, 8.15, 8.16
     * 
     * - Updates is_active flag on toggle (Requirement 6.15, 6.16)
     * - Prevents hiding "غير ذلك" option (Requirement 6.17)
     * - Preserves is_active state when updating ranks (Requirement 8.16)
     */
    const handleToggleVisibility = useCallback((index: number) => {
        const option = options[index];

        // Prevent hiding "غير ذلك" (Requirement 6.17)
        if (isOtherOption(option.value)) {
            setError('لا يمكن إخفاء خيار "غير ذلك"');
            return;
        }

        // Clear any previous errors
        setError(null);

        // Toggle is_active flag (Requirements 6.15, 6.16)
        setOptions(prevOptions => prevOptions.map((opt, i) => {
            if (i === index) {
                const newIsActive = !opt.is_active;
                return {
                    ...opt,
                    is_active: newIsActive,
                };
            }
            return opt;
        }));

        // Show success message
        const newState = !option.is_active;
        const message = newState
            ? `تم إظهار "${option.value}" بنجاح`
            : `تم إخفاء "${option.value}" بنجاح`;
        setSuccessMessage(message);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
    }, [options, isOtherOption]);

    /**
     * Render a single option row
     * Shows option with edit and hide/show buttons (Requirement 6.12, 6.13)
     * Task 11.3: Supports inline editing mode
     * Task 11.4: Supports hide/show toggle
     */
    const renderOptionRow = useCallback((option: OptionWithState, index: number) => {
        const isOther = isOtherOption(option.value);
        const isHidden = !option.is_active;
        const isEditing = option.isEditing || false;

        return (
            <div
                key={`${option.originalValue || option.value}-${index}`}
                className={`flex items-center gap-3 p-3 rounded-lg border ${isHidden
                    ? 'bg-gray-50 border-gray-200 opacity-50' // Reduced opacity for hidden options (Requirement 6.14)
                    : 'bg-white border-gray-200'
                    }`}
                role="listitem"
                aria-label={`${option.value}${isHidden ? ' - مخفي' : ''}${isOther ? ' - غير قابل للتعديل' : ''}`}
            >
                {/* Option value or edit input */}
                <div className="flex-1 flex items-center gap-2">
                    {isEditing ? (
                        // Task 11.3: Inline editing input
                        <input
                            type="text"
                            value={option.value}
                            onChange={(e) => handleEditValueChange(index, e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveEdit(index);
                                } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    handleCancelEdit(index);
                                }
                            }}
                            className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                            disabled={saving}
                        />
                    ) : (
                        <>
                            <span className="text-gray-900">{option.value}</span>

                            {/* "مخفي" badge for hidden options (Requirement 6.14) */}
                            {isHidden && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                                    مخفي
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        // Task 11.3: Save and Cancel buttons when editing
                        <>
                            <button
                                onClick={() => handleSaveEdit(index)}
                                disabled={saving}
                                className="p-2 rounded-lg text-green-600 hover:bg-green-50 active:bg-green-100 transition-colors"
                                style={{ minWidth: '44px', minHeight: '44px' }}
                                aria-label="حفظ التعديل"
                                title="حفظ"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleCancelEdit(index)}
                                disabled={saving}
                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                                style={{ minWidth: '44px', minHeight: '44px' }}
                                aria-label="إلغاء التعديل"
                                title="إلغاء"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Edit button - disabled for "غير ذلك" (Requirement 6.12, 6.17) */}
                            <button
                                onClick={() => handleStartEdit(index)}
                                disabled={isOther || saving}
                                className={`p-2 rounded-lg transition-colors ${isOther
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-blue-600 hover:bg-blue-50 active:bg-blue-100'
                                    }`}
                                style={{ minWidth: '44px', minHeight: '44px' }}
                                aria-label={`تعديل ${option.value}`}
                                title={isOther ? 'لا يمكن تعديل "غير ذلك"' : 'تعديل'}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>

                            {/* Hide/Show toggle - disabled for "غير ذلك" (Requirement 6.13, 6.17) */}
                            {/* Task 11.4: Implemented toggle functionality */}
                            <button
                                onClick={() => handleToggleVisibility(index)}
                                disabled={isOther || saving}
                                className={`p-2 rounded-lg transition-colors ${isOther
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : isHidden
                                        ? 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                                        : 'text-green-600 hover:bg-green-50 active:bg-green-100'
                                    }`}
                                style={{ minWidth: '44px', minHeight: '44px' }}
                                aria-label={isHidden ? `إظهار ${option.value}` : `إخفاء ${option.value}`}
                                title={isOther ? 'لا يمكن إخفاء "غير ذلك"' : isHidden ? 'إظهار' : 'إخفاء'}
                            >
                                {isHidden ? (
                                    // Eye-off icon for hidden options
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    // Eye icon for visible options
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }, [isOtherOption, saving, handleStartEdit, handleSaveEdit, handleCancelEdit, handleEditValueChange, handleToggleVisibility]);

    // Don't render if not open
    if (!isOpen && !isClosing) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop ${isClosing ? 'closing' : ''}`}
            style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
            }}>
            <div
                ref={modalRef}
                className={`bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col sm:mx-4 mx-0 modal-content ${isClosing ? 'closing' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-modal-title"
                style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                    maxWidth: '42rem',
                    width: '100%',
                    maxHeight: 'calc(100vh - 2rem)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 10000,
                    overflow: 'hidden'
                }}
            >
                {/* Header - category name, with close button */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
                    <h2 id="edit-modal-title" className="text-lg sm:text-xl font-bold text-gray-900 truncate pr-2">
                        {fieldMetadata?.listType === 'hierarchical' && fieldMetadata.hasParent && selectedParent
                            ? `تعديل ${activeField?.display_name ?? ''} - ${selectedParent}`
                            : `اضافة/تعديل خيارات ${category.name}`
                        }
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 flex-shrink-0 button-primary"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                        aria-label="إغلاق نافذة التعديل"
                        title="إغلاق (Esc)"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Field Tabs - horizontal scrollable tab bar for switching between category fields */}
                {allFields.length > 1 && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            overflowX: 'auto',
                            borderBottom: '2px solid #e5e7eb',
                            padding: '0 1.5rem',
                            gap: '0.25rem',
                            flexShrink: 0,
                            WebkitOverflowScrolling: 'touch',
                        }}
                        role="tablist"
                        aria-label="حقول القسم"
                    >
                        {allFields.map((f) => {
                            const isActive = activeField?.field_name === f.field_name;
                            return (
                                <button
                                    key={f.field_name}
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => {
                                        setActiveField(f);
                                        setOptions([]);
                                        setError(null);
                                        setSuccessMessage(null);
                                        setSelectedParent(null);
                                        setNewOptionValue('');
                                    }}
                                    style={{
                                        padding: '0.65rem 1.1rem',
                                        whiteSpace: 'nowrap',
                                        border: 'none',
                                        borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                                        background: 'none',
                                        color: isActive ? '#2563eb' : '#6b7280',
                                        fontWeight: isActive ? 600 : 400,
                                        fontSize: '0.875rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        marginBottom: '-2px',
                                    }}
                                >
                                    {f.display_name}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Content - Scrollable on small screens */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ flex: '1 1 auto', overflowY: 'auto', padding: '1.5rem', WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
                    {loading && (
                        <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
                            <span className="sr-only">جاري تحميل الخيارات...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-4 alert-enter" role="alert" aria-live="assertive">
                            <p className="font-medium">خطأ</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 mb-4 alert-enter" role="status" aria-live="polite">
                            <p className="font-medium">نجح</p>
                            <p className="text-sm mt-1">{successMessage}</p>
                        </div>
                    )}

                    {!loading && fieldMetadata && (
                        <div>
                            {/* Task 13.1: Parent selector for hierarchical child fields (Requirements 6.9, 6.10) */}
                            {fieldMetadata.listType === 'hierarchical' && fieldMetadata.hasParent && (
                                <ParentSelector
                                    parents={parentOptions}
                                    selectedParent={selectedParent}
                                    onParentChange={handleParentChange}
                                    label={`اختر ${fieldMetadata.parentField === 'governorate' ? 'المحافظة' : fieldMetadata.parentField === 'brand' ? 'الماركة' : 'الفئة الرئيسية'}`}
                                    disabled={saving}
                                    loading={loadingParents}
                                />
                            )}

                            {fieldMetadata.listType === 'independent' || (fieldMetadata.listType === 'hierarchical' && !fieldMetadata.hasParent) ? (
                                // Independent List Interface OR Hierarchical Parent Interface (Task 11.1)
                                <div>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {fieldMetadata.listType === 'hierarchical' && !fieldMetadata.hasParent
                                            ? `قائمة هرمية (رئيسية) - ${options.length} خيار`
                                            : `قائمة مستقلة - ${options.length} خيار`
                                        }
                                    </p>

                                    {/* Task 12.1, 12.2: Bulk add textarea (Requirements 6.18, 6.19, 6.20, 6.21, 6.22, 6.23, 6.24, 6.25, 6.26, 6.32) */}
                                    <BulkAddTextarea
                                        onAdd={handleBulkAdd}
                                        existingOptions={options.map(opt => opt.value)}
                                        disabled={saving}
                                    />

                                    {/* Task 11.2: Single option add input (Requirement 6.27) */}
                                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <label htmlFor="new-option-input" className="block text-sm font-medium text-gray-700 mb-2">
                                            إضافة خيار جديد
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                id="new-option-input"
                                                type="text"
                                                value={newOptionValue}
                                                onChange={(e) => setNewOptionValue(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddOption();
                                                    }
                                                }}
                                                placeholder="أدخل اسم الخيار الجديد"
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                disabled={saving}
                                                aria-describedby="new-option-help"
                                            />
                                            <button
                                                onClick={handleAddOption}
                                                disabled={saving || !newOptionValue.trim()}
                                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                style={{ minHeight: '44px' }}
                                                aria-label="إضافة الخيار الجديد"
                                            >
                                                إضافة
                                            </button>
                                        </div>
                                        <p id="new-option-help" className="text-xs text-gray-500 mt-2">
                                            سيتم إضافة الخيار الجديد في المرتبة الأولى وسيتم تحديث ترتيب الخيارات الموجودة تلقائياً
                                        </p>
                                    </div>

                                    {/* Options list - displays options with edit and hide/show buttons (Requirement 6.12, 6.13) */}
                                    <div className="space-y-2" role="list" aria-label="قائمة الخيارات">
                                        {options.length > 0 ? (
                                            options.map((option, index) => renderOptionRow(option, index))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500" role="status">
                                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                <p>لا توجد خيارات متاحة</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // Task 13.1: Hierarchical Child Interface (Requirements 6.9, 6.10, 6.31)
                                <div>
                                    {selectedParent ? (
                                        <>
                                            <p className="text-sm text-gray-600 mb-4">
                                                قائمة هرمية (فرعية) - {options.length} خيار في {selectedParent}
                                            </p>

                                            {/* Task 12.1, 12.2: Bulk add textarea for child options */}
                                            <BulkAddTextarea
                                                onAdd={handleBulkAdd}
                                                existingOptions={options.map(opt => opt.value)}
                                                disabled={saving}
                                            />

                                            {/* Task 11.2: Single option add input for child options */}
                                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <label htmlFor="new-child-option-input" className="block text-sm font-medium text-gray-700 mb-2">
                                                    إضافة خيار جديد في {selectedParent}
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        id="new-child-option-input"
                                                        type="text"
                                                        value={newOptionValue}
                                                        onChange={(e) => setNewOptionValue(e.target.value)}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddOption();
                                                            }
                                                        }}
                                                        placeholder="أدخل اسم الخيار الجديد"
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        disabled={saving}
                                                        aria-describedby="new-child-option-help"
                                                    />
                                                    <button
                                                        onClick={handleAddOption}
                                                        disabled={saving || !newOptionValue.trim()}
                                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                        style={{ minHeight: '44px' }}
                                                        aria-label={`إضافة خيار جديد في ${selectedParent}`}
                                                    >
                                                        إضافة
                                                    </button>
                                                </div>
                                                <p id="new-child-option-help" className="text-xs text-gray-500 mt-2">
                                                    سيتم إضافة الخيار الجديد في المرتبة الأولى ضمن {selectedParent}
                                                </p>
                                            </div>

                                            {/* Options list for child options */}
                                            <div className="space-y-2" role="list" aria-label={`قائمة خيارات ${selectedParent}`}>
                                                {options.length > 0 ? (
                                                    options.map((option, index) => renderOptionRow(option, index))
                                                ) : (
                                                    <div className="text-center py-8 text-gray-500" role="status">
                                                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                        <p>لا توجد خيارات متاحة في {selectedParent}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500" role="status">
                                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <p>يرجى اختيار فئة رئيسية أولاً</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer - Responsive padding and layout */}
                <div className="flex items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t flex-shrink-0 flex-wrap sm:flex-nowrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', padding: '1.5rem', borderTop: '1px solid #e5e7eb', flexShrink: 0 }}>
                    <button
                        onClick={handleClose}
                        disabled={saving}
                        className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed button-primary"
                        style={{ minHeight: '44px' }}
                        aria-label={saving ? 'جاري حفظ التغييرات، الرجاء الانتظار' : 'إغلاق نافذة التعديل'}
                    >
                        {saving ? 'جاري الحفظ...' : 'إغلاق'}
                    </button>

                    {/* Save button */}
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed button-primary"
                        style={{ minHeight: '44px' }}
                        aria-label={saving ? 'جاري حفظ التغييرات' : 'حفظ جميع التغييرات'}
                    >
                        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </button>
                </div>
            </div>
        </div>
    );
}
