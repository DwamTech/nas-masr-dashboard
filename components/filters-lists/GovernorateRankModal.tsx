'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category } from '@/types/filters-lists';
import { Governorate } from '@/models/governorates';
import { fetchAllGovernorates, updateGovernorateRanks, updateCityRanks } from '@/services/governorates-admin';
import { ParentSelector } from './ParentSelector';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useFocusReturn } from '@/hooks/useFocusReturn';
import { DraggableOptionsList } from '@/components/DraggableOptions/DraggableOptionsList';
import {
    FiltersCrudAlert,
    FiltersCrudFooter,
    FiltersCrudHeader,
    FiltersCrudShell,
    FiltersCrudTabs,
    filtersCrudStyles as styles,
} from './FiltersCrudPrimitives';
import '@/components/DraggableOptions/styles.css';
import './animations.css';
import './tailwind-shim.css';

interface GovernorateRankModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category;
}

export default function GovernorateRankModal({ isOpen, onClose }: GovernorateRankModalProps) {
    const [governorates, setGovernorates] = useState<Governorate[]>([]);
    const [selectedGov, setSelectedGov] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'gov' | 'city'>('gov');
    const [options, setOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
    useFocusReturn(isOpen);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            setGovernorates([]);
            setSelectedGov(null);
            setActiveTab('gov');
            setOptions([]);
            setError(null);
            setSuccessMessage(null);
            onClose();
        }, 200);
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) return;

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
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen, handleClose]);

    useEffect(() => {
        if (!isOpen) return;

        const loadGovernorates = async () => {
            setLoading(true);
            setError(null);
            try {
                const sortable = await fetchAllGovernorates({ includeInactive: true });
                setGovernorates(sortable);

                if (activeTab === 'gov') {
                    setOptions(sortable.map((gov) => gov.name));
                } else if (activeTab === 'city') {
                    const gov = sortable.find((item) => item.name === selectedGov);
                    if (gov) {
                        const cities = (gov.cities || []).filter((city) => city.name !== 'غير ذلك' && city.id !== null);
                        setOptions(cities.map((city) => city.name));
                    } else if (sortable.length > 0) {
                        setSelectedGov(sortable[0].name);
                    } else {
                        setOptions([]);
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'فشل تحميل البيانات');
            } finally {
                setLoading(false);
            }
        };

        void loadGovernorates();
    }, [isOpen, activeTab, selectedGov]);

    useEffect(() => {
        if (!isOpen || governorates.length === 0) return;

        if (activeTab === 'gov') {
            setOptions(governorates.map((gov) => gov.name));
            return;
        }

        let govToUse = selectedGov;
        if (!govToUse && governorates.length > 0) {
            govToUse = governorates[0].name;
            setSelectedGov(govToUse);
        }

        const gov = governorates.find((item) => item.name === govToUse);
        if (gov) {
            const cities = (gov.cities || []).filter((city) => city.name !== 'غير ذلك' && city.id !== null);
            setOptions(cities.map((city) => city.name));
        } else {
            setOptions([]);
        }
    }, [activeTab, selectedGov, governorates, isOpen]);

    const handleReorder = useCallback((newOrder: string[]) => {
        setOptions(newOrder);
    }, []);

    const handleSave = useCallback(async (ranks: { option: string; rank: number }[]) => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (activeTab === 'gov') {
                const payload = ranks
                    .map((rankItem) => {
                        const gov = governorates.find((item) => item.name === rankItem.option);
                        return { id: gov?.id as number, rank: rankItem.rank };
                    })
                    .filter((item) => item.id != null);

                await updateGovernorateRanks(payload);
            } else {
                const gov = governorates.find((item) => item.name === selectedGov);
                const cities = (gov?.cities || []).filter((city) => city.name !== 'غير ذلك' && city.id !== null);
                const payload = ranks
                    .map((rankItem) => {
                        const city = cities.find((item) => item.name === rankItem.option);
                        return { id: city?.id as number, rank: rankItem.rank };
                    })
                    .filter((item) => item.id != null);

                await updateCityRanks(payload);
            }

            setSuccessMessage('تم حفظ الترتيب بنجاح');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الترتيب';
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    }, [activeTab, governorates, selectedGov]);

    const renderOption = useCallback((option: string) => (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="flex-1 text-base font-semibold text-slate-900">{option}</span>
        </div>
    ), []);

    const handleParentChange = useCallback((newParent: string) => {
        setSelectedGov(newParent);
    }, []);

    if (!isOpen && !isClosing) return null;

    return (
        <FiltersCrudShell onOverlayClick={handleClose} align="start">
            <div
                ref={modalRef}
                style={{ width: '100%' }}
                onClick={(event) => event.stopPropagation()}
            >
                <FiltersCrudHeader
                    title={`ترتيب ${activeTab === 'gov' ? 'المحافظات' : `مدن ${selectedGov || ''}`}`}
                    subtitle="اسحب العناصر لإعادة ترتيبها، وسيتم حفظ الترتيب تلقائيًا مباشرة بعد الإفلات."
                    onClose={handleClose}
                />

                <FiltersCrudTabs
                    tabs={[
                        { key: 'gov', label: 'المحافظات', active: activeTab === 'gov', onClick: () => setActiveTab('gov') },
                        { key: 'city', label: 'المدن', active: activeTab === 'city', onClick: () => setActiveTab('city') },
                    ]}
                />

                <div className={styles.body}>
                    {error && (
                        <FiltersCrudAlert variant="error" title="تعذر تنفيذ العملية">
                            <p>{error}</p>
                        </FiltersCrudAlert>
                    )}

                    {successMessage && (
                        <FiltersCrudAlert variant="success" title="تم بنجاح">
                            <p>{successMessage}</p>
                        </FiltersCrudAlert>
                    )}

                    {loading && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                            <div className={styles.spinner} />
                            <p>جاري التحميل...</p>
                        </div>
                    )}

                    {!loading && (
                        <>
                            <FiltersCrudAlert variant="info" title="حفظ تلقائي بعد السحب">
                                <p>رتب المحافظات أو المدن بالسحب فقط، وسيتم حفظ الترتيب تلقائيًا بدون زر إضافي.</p>
                            </FiltersCrudAlert>

                            {activeTab === 'gov' ? (
                                <div>
                                    <p className={styles.sectionMeta}>المحافظات - {options.length} خيار</p>
                                    <p className={styles.helperText}>اسحب الخيارات لإعادة ترتيبها. سيتم حفظ التغييرات تلقائياً.</p>
                                    <div style={{ maxHeight: 'min(42vh, 420px)', overflowY: 'auto', overflowX: 'hidden', paddingInlineEnd: '0.25rem', overscrollBehavior: 'contain' }}>
                                        <DraggableOptionsList
                                            key={`gov-${options.length}`}
                                            options={options}
                                            onReorder={handleReorder}
                                            onSave={handleSave}
                                            renderOption={renderOption}
                                            otherOptionLabel="غير ذلك"
                                            disabled={saving}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className={styles.sectionMeta}>المدن - تابعة لمحافظة مختارة</p>

                                    <ParentSelector
                                        parents={governorates.map((gov) => gov.name)}
                                        selectedParent={selectedGov}
                                        onParentChange={handleParentChange}
                                        label="اختر المحافظة"
                                        disabled={saving}
                                        loading={loading}
                                    />

                                    {selectedGov ? (
                                        <>
                                            <p className={styles.helperText} style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                                                اسحب الخيارات لإعادة ترتيبها. سيتم حفظ التغييرات تلقائياً.
                                            </p>
                                            <div style={{ maxHeight: 'min(42vh, 420px)', overflowY: 'auto', overflowX: 'hidden', paddingInlineEnd: '0.25rem', overscrollBehavior: 'contain' }}>
                                                <DraggableOptionsList
                                                    key={`city-${selectedGov}-${options.length}`}
                                                    options={options}
                                                    onReorder={handleReorder}
                                                    onSave={handleSave}
                                                    renderOption={renderOption}
                                                    otherOptionLabel="غير ذلك"
                                                    disabled={saving}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className={styles.emptyState}>
                                            <p>الرجاء اختيار المحافظة أولاً</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <FiltersCrudFooter onClose={handleClose} disabled={saving} label={saving ? 'جاري الحفظ...' : 'إغلاق'} />
            </div>
        </FiltersCrudShell>
    );
}
