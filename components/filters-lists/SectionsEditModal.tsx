'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Category, MainSection } from '@/types/filters-lists';
import {
    fetchMainSections,
    createMainSection,
    addSubSections,
    updateMainSection,
    updateSubSection,
    setMainSectionVisibility,
    setSubSectionVisibility,
} from '@/services/sections';
import {
    FiltersCrudAlert,
    FiltersCrudCard,
    FiltersCrudFooter,
    FiltersCrudHeader,
    FiltersCrudShell,
    FiltersCrudTabs,
    filtersCrudStyles as styles,
} from './FiltersCrudPrimitives';

interface SectionsEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category;
}

export default function SectionsEditModal({ isOpen, onClose, category }: SectionsEditModalProps) {
    const [mainSections, setMainSections] = useState<MainSection[]>([]);
    const [selectedMain, setSelectedMain] = useState<MainSection | null>(null);
    const [activeTab, setActiveTab] = useState<'main' | 'sub'>('main');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [bulkInput, setBulkInput] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');
    const skipBlurSaveRef = useRef<number | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchMainSections(category.slug, { includeInactive: true });
            const sections = (response.main_sections || []).filter(
                (section) => section.name !== 'غير ذلك' && section.id !== null
            );
            setMainSections(sections);
            setSelectedMain((previous) => {
                if (!sections.length) {
                    return null;
                }

                if (previous) {
                    return sections.find((section) => section.id === previous.id) || sections[0];
                }

                return sections[0];
            });

            await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل تحميل البيانات');
        } finally {
            setLoading(false);
        }
    }, [category.slug]);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        void loadData();
    }, [isOpen, loadData]);

    const currentItems: Array<{ id: number | null; name: string; is_active?: boolean }> =
        activeTab === 'main'
            ? mainSections
            : (selectedMain?.subSections || selectedMain?.sub_sections || []).filter(
                (section) => section.name !== 'غير ذلك' && section.id !== null
            );

    const handleTabChange = (tab: 'main' | 'sub') => {
        setActiveTab(tab);
        setError(null);
        setSuccessMessage(null);
        setEditingId(null);
        setNewItemName('');
        setBulkInput('');
        if (tab === 'sub' && mainSections.length > 0 && !selectedMain) {
            setSelectedMain(mainSections[0]);
        }
    };

    const handleAddItem = async () => {
        if (!newItemName.trim()) return;
        setSaving(true);
        setError(null);

        try {
            if (activeTab === 'main') {
                await createMainSection(category.slug, newItemName.trim());
            } else if (selectedMain?.id) {
                await addSubSections(selectedMain.id, [newItemName.trim()]);
            }

            setNewItemName('');
            setSuccessMessage('تمت الإضافة بنجاح');
            await loadData();
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل الإضافة');
        } finally {
            setSaving(false);
        }
    };

    const handleBulkAdd = async () => {
        const items = bulkInput
            .split(/[,\n]/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0);

        if (!items.length) return;
        setSaving(true);
        setError(null);

        try {
            if (activeTab === 'main') {
                for (const name of items) {
                    await createMainSection(category.slug, name);
                }
            } else if (selectedMain?.id) {
                await addSubSections(selectedMain.id, items);
            }

            setBulkInput('');
            setSuccessMessage(`تمت إضافة ${items.length} عنصر بنجاح`);
            await loadData();
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل الإضافة');
        } finally {
            setSaving(false);
        }
    };

    const handleStartEdit = (id: number, name: string) => {
        setEditingId(id);
        setEditingName(name);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName('');
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editingName.trim()) return;
        setSaving(true);
        setError(null);

        try {
            if (activeTab === 'main') {
                await updateMainSection(editingId, { name: editingName.trim() });
            } else {
                await updateSubSection(editingId, { name: editingName.trim() });
            }

            setEditingId(null);
            setEditingName('');
            setSuccessMessage('تم التعديل بنجاح');
            await loadData();
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل التعديل');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleVisibility = async (id: number, isActive: boolean) => {
        setSaving(true);
        setError(null);

        try {
            if (activeTab === 'main') {
                await setMainSectionVisibility(id, !isActive);
            } else {
                await setSubSectionVisibility(id, !isActive);
            }

            setSuccessMessage(!isActive ? 'تم إظهار العنصر بنجاح' : 'تم إخفاء العنصر بنجاح');
            await loadData();
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل تحديث الحالة');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setMainSections([]);
        setSelectedMain(null);
        setActiveTab('main');
        setError(null);
        setSuccessMessage(null);
        setEditingId(null);
        setNewItemName('');
        setBulkInput('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <FiltersCrudShell onOverlayClick={handleClose}>
            <FiltersCrudHeader
                title={`اضافة/تعديل ${category.name}${activeTab === 'sub' && selectedMain ? ` - ${selectedMain.name}` : ''}`}
                subtitle="واجهة أوضح للحفظ السريع. يمكنك الاعتماد على الحفظ التلقائي أو الضغط على حفظ أثناء التعديل."
                onClose={handleClose}
            />

            <FiltersCrudTabs
                tabs={[
                    {
                        key: 'main',
                        label: 'الأقسام الرئيسية',
                        active: activeTab === 'main',
                        onClick: () => handleTabChange('main'),
                    },
                    {
                        key: 'sub',
                        label: 'الأقسام الفرعية',
                        active: activeTab === 'sub',
                        onClick: () => handleTabChange('sub'),
                    },
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
                        <FiltersCrudAlert variant="info" title="تجربة أوضح">
                            <p>كل إضافة أو إخفاء تحفظ فورًا، وأثناء تعديل الاسم يمكنك الضغط على حفظ أو الخروج من الحقل ليتم الحفظ تلقائيًا.</p>
                        </FiltersCrudAlert>

                        {activeTab === 'sub' && (
                            <div className={styles.selectorCard}>
                                <p className={styles.sectionLabel}>اختر القسم الرئيسي</p>
                                <select
                                    value={selectedMain?.name || ''}
                                    onChange={(event) => {
                                        const found = mainSections.find((section) => section.name === event.target.value);
                                        if (found) setSelectedMain(found);
                                    }}
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
                            {activeTab === 'main' ? 'الأقسام الرئيسية' : 'الأقسام الفرعية'} — {currentItems.length} عنصر
                        </p>

                        <FiltersCrudCard title="إضافة خيارات متعددة" chip="Bulk Add">
                            <textarea
                                value={bulkInput}
                                onChange={(event) => setBulkInput(event.target.value)}
                                placeholder="أدخل الخيارات مفصولة بفواصل أو كل خيار في سطر جديد..."
                                disabled={saving}
                                rows={3}
                                className={styles.fieldTextarea}
                            />
                            <div className={styles.helperText}>
                                <p>يمكنك إدخال الخيارات بطريقتين:</p>
                                <p>• مفصولة بفواصل: خيار1, خيار2, خيار3</p>
                                <p>• كل خيار في سطر جديد</p>
                            </div>
                            <button
                                onClick={handleBulkAdd}
                                disabled={saving || !bulkInput.trim()}
                                className={styles.primaryButton}
                                style={{ marginTop: '0.5rem' }}
                            >
                                {saving ? '...' : 'إضافة'}
                            </button>
                        </FiltersCrudCard>

                        <div style={{ marginTop: '1rem' }}>
                            <FiltersCrudCard title={`إضافة خيار جديد${activeTab === 'sub' && selectedMain ? ` في ${selectedMain.name}` : ''}`} muted>
                                <div className={styles.row}>
                                    <input
                                        value={newItemName}
                                        onChange={(event) => setNewItemName(event.target.value)}
                                        onKeyDown={(event) => event.key === 'Enter' && handleAddItem()}
                                        placeholder="أدخل اسم الخيار الجديد"
                                        disabled={saving}
                                        className={styles.fieldInput}
                                    />
                                    <button
                                        onClick={handleAddItem}
                                        disabled={saving || !newItemName.trim()}
                                        className={styles.primaryButton}
                                    >
                                        إضافة
                                    </button>
                                </div>
                            </FiltersCrudCard>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <h4 className={styles.itemsTitle}>العناصر الحالية ({currentItems.length})</h4>
                            {currentItems.length === 0 ? (
                                <div className={styles.emptyState}>لا توجد عناصر حالياً</div>
                            ) : (
                                <div className={styles.itemsList}>
                                    {currentItems.map((item) => (
                                        <div key={item.id} className={`${styles.itemRow} ${item.is_active === false ? styles.itemRowInactive : ''}`}>
                                            {editingId === item.id ? (
                                                <div className={styles.editShell}>
                                                    <div className={styles.editRow}>
                                                        <input
                                                            value={editingName}
                                                            onChange={(event) => setEditingName(event.target.value)}
                                                            onBlur={() => {
                                                                if (skipBlurSaveRef.current === item.id) {
                                                                    skipBlurSaveRef.current = null;
                                                                    return;
                                                                }

                                                                void handleSaveEdit();
                                                            }}
                                                            onKeyDown={(event) => event.key === 'Enter' && handleSaveEdit()}
                                                            autoFocus
                                                            className={`${styles.fieldInput} ${styles.editInput}`}
                                                        />
                                                        <button
                                                            onMouseDown={() => {
                                                                skipBlurSaveRef.current = item.id;
                                                            }}
                                                            onClick={() => void handleSaveEdit()}
                                                            className={styles.saveButton}
                                                            disabled={saving || !editingName.trim()}
                                                        >
                                                            حفظ
                                                        </button>
                                                        <button
                                                            onMouseDown={() => {
                                                                skipBlurSaveRef.current = item.id;
                                                            }}
                                                            onClick={handleCancelEdit}
                                                            className={styles.cancelButton}
                                                        >
                                                            إلغاء
                                                        </button>
                                                    </div>
                                                    <span className={styles.autosaveHint}>يحفظ تلقائيا عند الخروج من الحقل أو الضغط على Enter</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={styles.itemMeta}>
                                                        <span className={styles.itemName}>{item.name}</span>
                                                        {item.is_active === false ? <span className={styles.statusBadge}>مخفي</span> : null}
                                                    </div>
                                                    <div className={styles.itemActions}>
                                                        <button
                                                            onClick={() => item.id && handleStartEdit(item.id, item.name)}
                                                            className={`${styles.actionButton} ${styles.actionEdit}`}
                                                            title="تعديل"
                                                            disabled={saving}
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            تعديل
                                                        </button>
                                                        <button
                                                            onClick={() => item.id && handleToggleVisibility(item.id, item.is_active !== false)}
                                                            className={`${styles.actionButton} ${item.is_active === false ? styles.actionShow : styles.actionHide}`}
                                                            title={item.is_active === false ? 'إظهار' : 'إخفاء'}
                                                            disabled={saving}
                                                        >
                                                            {item.is_active === false ? 'إظهار' : 'إخفاء'}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <FiltersCrudFooter onClose={handleClose} disabled={saving} />
        </FiltersCrudShell>
    );
}
