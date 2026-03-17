'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category, CategoryField, FieldMetadata, RankData } from '@/types/filters-lists';
import type { AdminMakeListItem } from '@/models/makes';
import { fetchCategoryFields } from '@/services/categoryFields';
import { fetchAdminMakesWithIds } from '@/services/makes';
import { updateOptionRanks } from '@/services/optionRanks';
import { fetchGovernorates } from '@/services/governorates';
import { ParentSelector } from './ParentSelector';
import { filterFieldsByScope, FiltersFieldScope } from './automotiveShared';
import { cache, INVALIDATION_PATTERNS } from '@/utils/cache';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useFocusReturn } from '@/hooks/useFocusReturn';
import { DraggableOptionsList } from '@/components/DraggableOptions/DraggableOptionsList';
import '@/components/DraggableOptions/styles.css';
import './animations.css';
import './tailwind-shim.css';

interface RankModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category;
    field?: CategoryField;
    initialFieldName?: string;
    fieldScope?: FiltersFieldScope;
    titleOverride?: string;
    parent?: string;
}

function detectListType(field: CategoryField): FieldMetadata {
    const hierarchicalPatterns = [
        { parent: 'governorate', child: 'city' },
        { parent: 'brand', child: 'model' },
        { parent: 'main_section', child: 'sub_section' },
    ];

    const fieldNameLower = field.field_name.toLowerCase();

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

    return {
        listType: 'independent',
        hasParent: false,
    };
}

export default function RankModal({
    isOpen,
    onClose,
    category,
    field,
    initialFieldName,
    fieldScope = 'all',
    titleOverride,
    parent,
}: RankModalProps) {
    const requestedFieldName = initialFieldName || field?.field_name;
    const [options, setOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fieldMetadata, setFieldMetadata] = useState<FieldMetadata | null>(null);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    // All fields for the category (for tabs)
    const [allFields, setAllFields] = useState<CategoryField[]>([]);
    const [activeField, setActiveField] = useState<CategoryField | null>(null);

    const [parentOptions, setParentOptions] = useState<string[]>([]);
    const [selectedParent, setSelectedParent] = useState<string | null>(parent || null);
    const [loadingParents, setLoadingParents] = useState(false);

    /**
     * Cache of fetched makes (brand + models) to avoid repeated API calls.
     * Populated once per modal open for brand/model fields.
     */
    const [makesCache, setMakesCache] = useState<AdminMakeListItem[]>([]);

    const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
    useFocusReturn(isOpen);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 200);
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) return;

        // Prevent body scroll when modal is open
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                handleClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
            // Restore body scroll when modal closes
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen, handleClose]);

    // Load all category fields for tabs on mount
    useEffect(() => {
        if (!isOpen) return;

        const loadFields = async () => {
            try {
                const response = await fetchCategoryFields(category.slug, undefined, { includeHidden: true });
                // Filter out 'name' fields — free-text entered by ad creators, not selectable options
                const fields = (response.data || []).filter(
                    (f: CategoryField) => f.field_name !== 'name'
                );
                const filteredFields = filterFieldsByScope(fields, fieldScope);
                setAllFields(filteredFields);
                setActiveField((previousActiveField) => {
                    if (requestedFieldName) {
                        const preferredField = filteredFields.find((f) => f.field_name === requestedFieldName);
                        if (preferredField) {
                            return preferredField;
                        }
                    }

                    if (previousActiveField) {
                        const persistedField = filteredFields.find((f) => f.field_name === previousActiveField.field_name);
                        if (persistedField) {
                            return persistedField;
                        }
                    }

                    return filteredFields[0] || null;
                });
            } catch (err) {
                console.error('Error loading category fields for tabs:', err);
            }
        };
        loadFields();
    }, [isOpen, category.slug, requestedFieldName, fieldScope]);

    // Reload options when modal opens or active field changes
    useEffect(() => {
        if (!isOpen || !activeField) return;

        const loadOptions = async () => {
            setLoading(true);
            setError(null);
            setSuccessMessage(null);

            try {
                const metadata = detectListType(activeField);
                setFieldMetadata(metadata);

                if (metadata.listType === 'hierarchical') {
                    if (!metadata.hasParent) {
                        // Parent field (e.g. brand): rank the parents themselves
                        // For brand/make: load from /api/makes, not category fields
                        if (metadata.childField === 'model') {
                            await loadBrandFieldOptions();
                        } else {
                            // generic parent (e.g. governorate as parent)
                            await loadIndependentOptions();
                        }
                    } else {
                        // Child field (e.g. model): show parent selector first
                        await loadParentOptions(metadata);
                        if (selectedParent) {
                            await loadChildOptions(metadata, selectedParent);
                        } else {
                            setOptions([]);
                            setLoading(false);
                        }
                    }
                } else {
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
    }, [isOpen, category.slug, activeField?.field_name, selectedParent]);

    /**
     * Load brand names from /api/makes to use as the makes list that can be ranked.
     * Used when the active field IS the brand/make field (parent, not child).
     */
    const loadBrandFieldOptions = async () => {
        try {
            let makes = makesCache;
            if (makes.length === 0) {
                makes = await fetchAdminMakesWithIds(undefined, { includeInactive: true });
                setMakesCache(makes);
            }
            const brandNames = makes.map(m => m.name);
            setOptions(brandNames);
        } catch (err) {
            console.error('Error loading brand options:', err);
            throw new Error('فشل تحميل قائمة الماركات');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Load parent selector options for child fields (e.g. model → needs brand selector).
     * For brand parent: fetches makes from /api/makes and caches them.
     * For governorate parent: fetches governorates list.
     */
    const loadParentOptions = async (metadata: FieldMetadata) => {
        setLoadingParents(true);

        try {
            if (metadata.parentField === 'brand') {
                // Fetch makes from /api/makes and cache them
                let makes = makesCache;
                if (makes.length === 0) {
                    makes = await fetchAdminMakesWithIds(undefined, { includeInactive: true });
                    setMakesCache(makes);
                }
                const brandNames = makes.map(m => m.name);
                setParentOptions(brandNames);

                // Auto-select first brand if none selected
                if (!selectedParent && brandNames.length > 0) {
                    setSelectedParent(brandNames[0]);
                }
            } else if (metadata.parentField === 'governorate') {
                const governorates = await fetchGovernorates();
                const parentNames = governorates.map(g => g.name);
                setParentOptions(parentNames);

                if (!selectedParent && parentNames.length > 0) {
                    setSelectedParent(parentNames[0]);
                }
            } else if (metadata.parentField === 'main_section') {
                const response = await fetchCategoryFields(category.slug, undefined, { includeHidden: true });
                const sections = Array.isArray(response.main_sections) ? response.main_sections : [];
                const mainNames = sections
                    .map((s: any) => (s?.name ?? '').toString().trim())
                    .filter((v: string) => v.length > 0);
                const uniqueMainNames = Array.from(new Set(mainNames));
                setParentOptions(uniqueMainNames);

                if (!selectedParent && uniqueMainNames.length > 0) {
                    setSelectedParent(uniqueMainNames[0]);
                }
            } else {
                // Generic: look for parent field in category fields
                const response = await fetchCategoryFields(category.slug, undefined, { includeHidden: true });
                const parentFieldName = metadata.parentField || '';
                const parentField = response.data.find((f: CategoryField) => f.field_name === parentFieldName);

                if (parentField) {
                    setParentOptions(parentField.options || []);
                }
            }
        } catch (err) {
            console.error('Error loading parent options:', err);
            throw new Error('فشل تحميل الخيارات الرئيسية');
        } finally {
            setLoadingParents(false);
        }
    };

    /**
     * Load child options for the selected parent (e.g. models for a brand).
     * For brand→model: uses makesCache to get models without extra API calls.
     * For governorate→city: fetches cities from the governorate.
     */
    const loadChildOptions = async (metadata: FieldMetadata, parentValue: string) => {
        setLoading(true);

        try {
            if (metadata.parentField === 'brand') {
                // Get models for the selected brand from the makes cache
                let makes = makesCache;
                if (makes.length === 0) {
                    makes = await fetchAdminMakesWithIds(undefined, { includeInactive: true });
                    setMakesCache(makes);
                }
                const selectedMake = makes.find(m => m.name === parentValue);
                const modelNames = selectedMake?.models ?? [];
                setOptions(modelNames);
            } else if (metadata.parentField === 'governorate') {
                const governorates = await fetchGovernorates();
                const governorate = governorates.find(g => g.name === parentValue);

                if (governorate) {
                    setOptions(governorate.cities.map(c => c.name));
                } else {
                    setOptions([]);
                }
            } else if (metadata.parentField === 'main_section') {
                const response = await fetchCategoryFields(category.slug, undefined, { includeHidden: true });
                const sections = Array.isArray(response.main_sections) ? response.main_sections : [];
                const selectedMain = sections.find(
                    (s: any) => (s?.name ?? '').toString().trim() === parentValue
                );
                const subSections = Array.isArray(selectedMain?.sub_sections)
                    ? selectedMain.sub_sections
                    : [];
                const subNames = subSections
                    .map((s: any) => (s?.name ?? '').toString().trim())
                    .filter((v: string) => v.length > 0);
                setOptions(Array.from(new Set(subNames)));
            } else {
                // Generic: load the child field options from category fields
                const response = await fetchCategoryFields(category.slug, undefined, { includeHidden: true });
                const targetField = response.data.find(
                    (f: CategoryField) => f.field_name === activeField?.field_name
                );
                setOptions(targetField?.options ?? []);
            }
        } catch (err) {
            console.error('Error loading child options:', err);
            throw new Error('فشل تحميل الخيارات الفرعية');
        } finally {
            setLoading(false);
        }
    };

    const loadIndependentOptions = async () => {
        if (!activeField) return;
        try {
            const response = await fetchCategoryFields(category.slug, undefined, { includeHidden: true });
            const targetField = response.data.find((f: CategoryField) => f.field_name === activeField.field_name);

            if (!targetField) {
                throw new Error('الحقل المطلوب غير موجود');
            }

            const fieldOptions = targetField.options || [];
            setOptions(fieldOptions);
        } finally {
            setLoading(false);
        }
    };

    const handleParentChange = useCallback((newParent: string) => {
        setSelectedParent(newParent);

        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('parent', newParent);
            window.history.replaceState({}, '', url.toString());
        }
    }, []);

    const handleReorder = useCallback((newOrder: string[]) => {
        setOptions(newOrder);
    }, []);

    const handleSave = useCallback(async (ranks: RankData[]) => {
        if (!activeField) return;
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (fieldMetadata?.listType === 'hierarchical' && fieldMetadata.hasParent) {
                if (!selectedParent) {
                    throw new Error('يجب اختيار الفئة الرئيسية أولاً');
                }

                if (ranks.length === 0) {
                    throw new Error('لا توجد خيارات للترتيب');
                }
            }

            const parentContext = (fieldMetadata?.listType === 'hierarchical' && fieldMetadata.hasParent)
                ? selectedParent
                : parent;

            await updateOptionRanks(
                category.slug,
                activeField.field_name,
                ranks,
                parentContext || undefined
            );

            const pattern = INVALIDATION_PATTERNS.RANK_UPDATE(category.slug);
            cache.invalidate(pattern);

            setSuccessMessage('تم حفظ الترتيب بنجاح ✓');

            // Clear success message after 3 seconds — but keep the modal open
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (err) {
            console.error('Error saving ranks:', err);
            const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الترتيب';
            setError(errorMessage);
            throw err;
        } finally {
            setSaving(false);
        }
    }, [category.slug, activeField, parent, selectedParent, fieldMetadata]);

    const renderOption = useCallback((option: string) => {
        return (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <span className="flex-1 text-base font-semibold text-slate-900">{option}</span>
            </div>
        );
    }, []);

    if (!isOpen && !isClosing) return null;

    return (
        <div
            className={`modal-backdrop ${isClosing ? 'closing' : ''}`}
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
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) handleClose();
            }}
        >
            <div
                ref={modalRef}
                className={`modal-content ${isClosing ? 'closing' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="rank-modal-title"
                style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                    maxWidth: '42rem',
                    width: '100%',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 10000,
                    overflow: 'hidden'
                }}
            >
                <div className="flex items-start justify-between gap-4 p-6" style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                    borderBottom: '1px solid #e5e7eb'
                }}>
                    <div className="min-w-0 flex-1 pr-3">
                        <h2 id="rank-modal-title" className="truncate text-2xl font-bold text-slate-900">
                            ترتيب اختيارات {titleOverride || category.name}
                            {selectedParent && ` - ${selectedParent}`}
                        </h2>
                        <p className="mt-2 text-sm leading-7 text-slate-500">
                            اسحب العناصر لإعادة ترتيبها، وسيتم حفظ الترتيب تلقائيًا فور الإفلات.
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                        style={{
                            padding: 0
                        }}
                        aria-label="إغلاق نافذة ترتيب الخيارات"
                        title="إغلاق (Esc)"
                    >
                        <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Floating Success Toast — positioned absolutely so it doesn't affect scroll */}
                {successMessage && (
                    <div
                        role="status"
                        aria-live="polite"
                        className="pointer-events-none absolute inset-x-0 top-[6.7rem] z-20 mx-auto w-[min(92%,28rem)] rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right text-emerald-950 shadow-lg"
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-full bg-emerald-100 p-2 text-emerald-700">
                                <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold">تم حفظ الترتيب</p>
                                <p className="mt-1 text-sm leading-6 text-emerald-800">{successMessage}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Field Tabs - horizontal scrollable tab bar for switching between category fields */}
                {allFields.length > 1 && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            overflowX: 'auto',
                            borderBottom: '1px solid #e5e7eb',
                            padding: '1rem 1.5rem 0.9rem',
                            gap: '0.5rem',
                            flexShrink: 0,
                            WebkitOverflowScrolling: 'touch',
                            backgroundColor: '#f8fafc',
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
                                    }}
                                    style={{
                                        padding: '0.75rem 1.1rem',
                                        whiteSpace: 'nowrap',
                                        border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                                        borderBottom: '1px solid ' + (isActive ? '#bfdbfe' : 'transparent'),
                                        background: isActive ? '#eff6ff' : '#ffffff',
                                        color: isActive ? '#2563eb' : '#64748b',
                                        fontWeight: isActive ? 700 : 600,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        borderRadius: '999px',
                                        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
                                    }}
                                >
                                    {f.display_name}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div
                    className="flex-1 overflow-y-auto p-6"
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        backgroundColor: '#fafbfc',
                        overscrollBehavior: 'contain',
                        touchAction: 'pan-y',
                        minHeight: 0
                    }}
                    onWheel={(e) => {
                        // Prevent wheel events from propagating to parent elements
                        // This ensures scroll stays contained within the modal
                        e.stopPropagation();
                    }}
                >
                    {loading && (
                        <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#3b82f6' }} aria-hidden="true"></div>
                            <span className="sr-only">جاري تحميل الخيارات...</span>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-right text-rose-900 shadow-sm" role="alert" aria-live="assertive">
                            <div className="mt-0.5 rounded-full bg-rose-100 p-2 text-rose-700">
                                <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold">تعذر تنفيذ العملية</p>
                                <p className="mt-1 text-sm leading-6 text-rose-800">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Success toast is rendered outside the scroll area as a floating overlay */}

                    {!loading && fieldMetadata && (
                        <div>
                            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-950 shadow-sm">
                                <div className="mt-0.5 rounded-full bg-white p-2 text-sky-700 shadow-sm">
                                    <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold">ترتيب تلقائي الحفظ</p>
                                    <p className="mt-1 text-sm leading-6 text-sky-800">
                                        لا تحتاج إلى زر حفظ. اسحب الخيار إلى مكانه الجديد وسيتم حفظ الترتيب تلقائيًا.
                                    </p>
                                </div>
                            </div>
                            {fieldMetadata.listType === 'independent' ? (
                                <div>
                                    <p className="mb-2 text-sm font-semibold" style={{ color: '#475569' }}>
                                        قائمة مستقلة - {options.length} خيار
                                    </p>
                                    <p className="mb-4 text-xs leading-7" style={{ color: '#64748b' }}>
                                        اسحب الخيارات لإعادة ترتيبها. سيتم حفظ التغييرات تلقائياً.
                                    </p>
                                    <DraggableOptionsList
                                        options={options}
                                        onReorder={handleReorder}
                                        onSave={handleSave}
                                        renderOption={renderOption}
                                        otherOptionLabel="غير ذلك"
                                        disabled={saving}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <p className="mb-4 text-sm font-semibold" style={{ color: '#475569' }}>
                                        قائمة هرمية - {fieldMetadata.hasParent ? 'خيارات فرعية' : 'خيارات رئيسية'}
                                    </p>

                                    {fieldMetadata.hasParent && (
                                        <ParentSelector
                                            parents={parentOptions}
                                            selectedParent={selectedParent}
                                            onParentChange={handleParentChange}
                                            label={`اختر ${fieldMetadata.parentField === 'governorate' ? 'المحافظة' : fieldMetadata.parentField === 'brand' ? 'الماركة' : 'الفئة الرئيسية'}`}
                                            disabled={saving}
                                            loading={loadingParents}
                                        />
                                    )}

                                    {(!fieldMetadata.hasParent || selectedParent) ? (
                                        <>
                                            <p className="mb-4 text-xs leading-7" style={{ color: '#64748b' }}>
                                                اسحب الخيارات لإعادة ترتيبها. سيتم حفظ التغييرات تلقائياً.
                                            </p>
                                            <DraggableOptionsList
                                                options={options}
                                                onReorder={handleReorder}
                                                onSave={handleSave}
                                                renderOption={renderOption}
                                                otherOptionLabel="غير ذلك"
                                                disabled={saving}
                                            />
                                        </>
                                    ) : (
                                        <div className="text-center py-8" style={{ color: '#6b7280' }} role="status">
                                            <svg className="w-16 h-16 mx-auto mb-4" style={{ color: '#d1d5db' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <p>الرجاء اختيار الفئة الرئيسية أولاً</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 p-6" style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
                    borderTop: '1px solid #e5e7eb'
                }}>
                    <button
                        onClick={handleClose}
                        disabled={saving}
                        className="rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-slate-800"
                        style={{
                            minHeight: '44px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.5 : 1,
                            boxShadow: '0 12px 25px rgba(15, 23, 42, 0.18)'
                        }}
                        aria-label={saving ? 'جاري حفظ الترتيب، الرجاء الانتظار' : 'إغلاق نافذة الترتيب'}
                    >
                        {saving ? 'جاري الحفظ...' : 'إغلاق'}
                    </button>
                </div>
            </div>
        </div>
    );
}
