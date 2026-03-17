'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category, MainSection } from '@/types/filters-lists';
import { fetchMainSections, updateMainSectionRanks, updateSubSectionRanks } from '@/services/sections';
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

interface SectionsRankModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category;
}

export default function SectionsRankModal({ isOpen, onClose, category }: SectionsRankModalProps) {
    const [mainSections, setMainSections] = useState<MainSection[]>([]);
    const [selectedMain, setSelectedMain] = useState<MainSection | null>(null);
    const [activeTab, setActiveTab] = useState<'main' | 'sub'>('main');
    const [mainOptions, setMainOptions] = useState<string[]>([]);
    const [subOptions, setSubOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const loadData = async () => {
            setLoading(true);
            setError(null);
            setSuccessMessage(null);
            try {
                const response = await fetchMainSections(category.slug, { includeInactive: true });
                const sections = (response.main_sections || []).filter((section) => section.name !== 'غير ذلك' && section.id !== null);
                setMainSections(sections);
                setMainOptions(sections.map((section) => section.name));
                setSelectedMain((previous) => previous ?? sections[0] ?? null);
                await new Promise((resolve) => setTimeout(resolve, 50));
            } catch (err) {
                setError(err instanceof Error ? err.message : 'فشل تحميل البيانات');
            } finally {
                setLoading(false);
            }
        };

        void loadData();
    }, [isOpen, category.slug]);

    useEffect(() => {
        if (!selectedMain || !selectedMain.id || activeTab !== 'sub') return;

        const subs = selectedMain.subSections || selectedMain.sub_sections || [];
        const sortable = subs.filter((section) => section.name !== 'غير ذلك' && section.id !== null);
        setSubOptions(sortable.map((section) => section.name));
    }, [selectedMain, activeTab]);

    const handleTabChange = useCallback((tab: 'main' | 'sub') => {
        setActiveTab(tab);
        setError(null);
        setSuccessMessage(null);
        if (tab === 'main') {
            setSelectedMain(null);
        } else if (mainSections.length > 0) {
            setSelectedMain(mainSections[0]);
        }
    }, [mainSections]);

    const handleMainChange = useCallback((name: string) => {
        const found = mainSections.find((section) => section.name === name);
        if (found) setSelectedMain(found);
    }, [mainSections]);

    const handleReorder = useCallback((newOrder: string[]) => {
        if (activeTab === 'main') {
            setMainOptions(newOrder);
        } else {
            setSubOptions(newOrder);
        }
    }, [activeTab]);

    const handleSave = useCallback(async (ranks: { option: string; rank: number }[]) => {
        setSaving(true);
        setError(null);
        try {
            if (activeTab === 'main') {
                const payload = ranks
                    .map((rankItem) => {
                        const section = mainSections.find((item) => item.name === rankItem.option);
                        return { id: section?.id as number, rank: rankItem.rank };
                    })
                    .filter((item) => item.id != null);
                await updateMainSectionRanks(payload);
            } else {
                const payload = ranks
                    .map((rankItem) => {
                        const section =
                            selectedMain?.subSections?.find((item) => item.name === rankItem.option)
                            || selectedMain?.sub_sections?.find((item: any) => item.name === rankItem.option);
                        return { id: section?.id as number, rank: rankItem.rank };
                    })
                    .filter((item) => item.id != null);
                await updateSubSectionRanks(payload);
            }

            setSuccessMessage('تم حفظ الترتيب بنجاح');
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل حفظ الترتيب');
        } finally {
            setSaving(false);
        }
    }, [activeTab, mainSections, selectedMain]);

    const renderOption = useCallback((option: string) => (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="flex-1 text-base font-semibold text-slate-900">{option}</span>
        </div>
    ), []);

    const handleClose = () => {
        setMainSections([]);
        setSelectedMain(null);
        setActiveTab('main');
        setMainOptions([]);
        setSubOptions([]);
        setError(null);
        setSuccessMessage(null);
        onClose();
    };

    if (!isOpen) return null;

    const currentOptions = activeTab === 'main' ? mainOptions : subOptions;

    return (
        <FiltersCrudShell onOverlayClick={handleClose}>
            <FiltersCrudHeader
                title={`ترتيب اختيارات ${category.name}${activeTab === 'sub' && selectedMain ? ` - ${selectedMain.name}` : ''}`}
                subtitle="رتّب العناصر بالسحب فقط، وسيتم حفظ الترتيب تلقائيًا مباشرة."
                onClose={handleClose}
            />

            <FiltersCrudTabs
                tabs={[
                    { key: 'main', label: 'الأقسام الرئيسية', active: activeTab === 'main', onClick: () => handleTabChange('main') },
                    { key: 'sub', label: 'الأقسام الفرعية', active: activeTab === 'sub', onClick: () => handleTabChange('sub') },
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
                            <p>اسحب العنصر إلى ترتيبه الجديد فقط، وسيتم حفظ الترتيب تلقائيًا دون أي زر إضافي.</p>
                        </FiltersCrudAlert>

                        {activeTab === 'sub' && (
                            <div className={styles.selectorCard}>
                                <p className={styles.sectionLabel}>اختر القسم الرئيسي</p>
                                <select
                                    value={selectedMain?.name || ''}
                                    onChange={(event) => handleMainChange(event.target.value)}
                                    disabled={saving}
                                    className={styles.fieldSelect}
                                >
                                    {mainSections.map((section) => (
                                        <option key={section.id} value={section.name}>
                                            {section.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <p className={styles.sectionMeta}>
                            {activeTab === 'main' ? 'الأقسام الرئيسية' : 'الأقسام الفرعية'} - {currentOptions.length} خيار
                        </p>
                        <p className={styles.helperText}>اسحب الخيارات لإعادة ترتيبها. سيتم حفظ التغييرات تلقائياً.</p>

                        {currentOptions.length > 0 ? (
                            <DraggableOptionsList
                                key={`${activeTab}-${currentOptions.length}-${currentOptions[0]}`}
                                options={currentOptions}
                                onReorder={handleReorder}
                                onSave={handleSave}
                                renderOption={renderOption}
                                otherOptionLabel="غير ذلك"
                                disabled={saving}
                            />
                        ) : (
                            <div className={styles.emptyState}>
                                <p>لا توجد أقسام {activeTab === 'main' ? 'رئيسية' : 'فرعية'} حالياً</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <FiltersCrudFooter onClose={handleClose} disabled={saving} />
        </FiltersCrudShell>
    );
}
