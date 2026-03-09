'use client';

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Category, CategoryField, FieldMetadata, RankData } from '@/types/filters-lists';
import type { AdminMakeListItem } from '@/models/makes';
import { fetchCategoryFields } from '@/services/categoryFields';
import { fetchAdminMakesWithIds } from '@/services/makes';
import { updateOptionRanks } from '@/services/optionRanks';
import { fetchGovernorates } from '@/services/governorates';
import { ParentSelector } from './ParentSelector';
import { cache, INVALIDATION_PATTERNS } from '@/utils/cache';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useFocusReturn } from '@/hooks/useFocusReturn';
import '@/components/DraggableOptions/styles.css';
import './animations.css';
import './tailwind-shim.css';

const DraggableOptionsList = lazy(() =>
    import('@/components/DraggableOptions/DraggableOptionsList').then(module => ({
        default: module.DraggableOptionsList
    }))
);

function DraggableListLoading() {
    return (
        <div className="flex flex-col items-center justify-center p-12 gap-4">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600">جاري تحميل القائمة...</p>
        </div>
    );
}

interface RankModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category;
    field?: CategoryField; // Optional - if not provided, used internally from allFields
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

export default function RankModal({ isOpen, onClose, category, field: initialField, parent }: RankModalProps) {
    const [options, setOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fieldMetadata, setFieldMetadata] = useState<FieldMetadata | null>(null);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    // All fields for the category (for tabs)
    const [allFields, setAllFields] = useState<CategoryField[]>([]);
    const [activeField, setActiveField] = useState<CategoryField | null>(initialField || null);

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
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 200);
    }, [onClose]);

    // Load all category fields for tabs on mount
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

                if (!activeField && fields.length > 0) {
                    setActiveField(fields[0]);
                } else if (activeField && !fields.some((f: CategoryField) => f.field_name === activeField.field_name)) {
                    setActiveField(fields[0] || null);
                }
            } catch (err) {
                console.error('Error loading category fields for tabs:', err);
            }
        };

        loadFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, category.slug]);

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
                makes = await fetchAdminMakesWithIds();
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
                    makes = await fetchAdminMakesWithIds();
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
            } else {
                // Generic: look for parent field in category fields
                const response = await fetchCategoryFields(category.slug);
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
                    makes = await fetchAdminMakesWithIds();
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
            } else {
                // Generic: load the child field options from category fields
                const response = await fetchCategoryFields(category.slug);
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
            const response = await fetchCategoryFields(category.slug);
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
    }, [category.slug, activeField?.field_name, parent, selectedParent, fieldMetadata, handleClose]);

    const renderOption = useCallback((option: string) => {
        return (
            <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
                <span className="flex-1" style={{ color: '#111827' }}>{option}</span>
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
                <div className="flex items-center justify-between p-6" style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                    borderBottom: '1px solid #e5e7eb'
                }}>
                    <h2 id="rank-modal-title" className="font-bold truncate" style={{
                        color: '#111827',
                        fontSize: '1.5rem',
                        flex: 1,
                        paddingRight: '1rem',
                        margin: 0
                    }}>
                        ترتيب اختيارات {category.name}
                        {selectedParent && ` - ${selectedParent}`}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="transition-all duration-200 rounded-full flex-shrink-0"
                        style={{
                            width: '40px',
                            height: '40px',
                            minWidth: '40px',
                            minHeight: '40px',
                            color: '#6b7280',
                            backgroundColor: '#f3f4f6',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.backgroundColor = '#fee2e2';
                            e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#6b7280';
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                            e.currentTarget.style.transform = 'scale(1)';
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
                        style={{
                            position: 'absolute',
                            bottom: '5.5rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 20,
                            backgroundColor: '#166534',
                            color: '#ffffff',
                            padding: '0.6rem 1.25rem',
                            borderRadius: '999px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            animation: 'fadeIn 0.2s ease',
                        }}
                    >
                        {successMessage}
                    </div>
                )}

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
                            backgroundColor: '#ffffff',
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
                        <div className="border rounded-lg p-4 mb-4" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }} role="alert" aria-live="assertive">
                            <p className="font-medium">خطأ</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    )}

                    {/* Success toast is rendered outside the scroll area as a floating overlay */}

                    {!loading && fieldMetadata && (
                        <div>
                            {fieldMetadata.listType === 'independent' ? (
                                <div>
                                    <p className="text-sm mb-4" style={{ color: '#4b5563' }}>
                                        قائمة مستقلة - {options.length} خيار
                                    </p>
                                    <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                                        اسحب الخيارات لإعادة ترتيبها. سيتم حفظ التغييرات تلقائياً.
                                    </p>
                                    <Suspense fallback={<DraggableListLoading />}>
                                        <DraggableOptionsList
                                            options={options}
                                            onReorder={handleReorder}
                                            onSave={handleSave}
                                            renderOption={renderOption}
                                            otherOptionLabel="غير ذلك"
                                            disabled={saving}
                                        />
                                    </Suspense>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm mb-4" style={{ color: '#4b5563' }}>
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
                                            <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                                                اسحب الخيارات لإعادة ترتيبها. سيتم حفظ التغييرات تلقائياً.
                                            </p>
                                            <Suspense fallback={<DraggableListLoading />}>
                                                <DraggableOptionsList
                                                    options={options}
                                                    onReorder={handleReorder}
                                                    onSave={handleSave}
                                                    renderOption={renderOption}
                                                    otherOptionLabel="غير ذلك"
                                                    disabled={saving}
                                                />
                                            </Suspense>
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
                        className="px-6 py-3 rounded-lg transition-all duration-200 font-medium"
                        style={{
                            minHeight: '44px',
                            fontSize: '1rem',
                            color: '#374151',
                            backgroundColor: '#ffffff',
                            border: '1px solid #d1d5db',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.5 : 1,
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
                        onMouseEnter={(e) => {
                            if (!saving) {
                                e.currentTarget.style.backgroundColor = '#f9fafb';
                                e.currentTarget.style.borderColor = '#9ca3af';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
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
