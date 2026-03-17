'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Governorate } from '@/models/governorates';
import {
    fetchAllGovernorates,
    createGovernorate,
    updateGovernorate,
    setGovernorateVisibility,
    createCity,
    updateCity,
    setCityVisibility,
} from '@/services/governorates-admin';
import {
    FiltersCrudAlert,
    FiltersCrudCard,
    FiltersCrudFooter,
    FiltersCrudHeader,
    FiltersCrudShell,
    FiltersCrudTabs,
    filtersCrudStyles as styles,
} from './FiltersCrudPrimitives';

interface GovernorateEditModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * GovernorateEditModal — اضافة/تعديل المحافظات والمدن
 *
 * Dedicated modal for CRUD operations on governorates and cities.
 * Two tabs: governorates (parents) and cities (children).
 */
export default function GovernorateEditModal({ isOpen, onClose }: GovernorateEditModalProps) {
    const [governorates, setGovernorates] = useState<Governorate[]>([]);
    const [selectedGov, setSelectedGov] = useState<Governorate | null>(null);
    const [activeTab, setActiveTab] = useState<'gov' | 'city'>('gov');
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
            const data = await fetchAllGovernorates({ includeInactive: true });
            setGovernorates(data);
            setSelectedGov(prev => {
                if (data.length === 0) {
                    return null;
                }

                if (prev) {
                    const updated = data.find(g => g.id === prev.id);
                    return updated || data[0];
                }

                return data[0];
            });
            // Small delay to ensure DOM is ready
            await new Promise(resolve => setTimeout(resolve, 50));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل تحميل البيانات');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        // Reset state when modal opens
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        void loadData();
    }, [isOpen, loadData]);

    const currentItems: Array<{ id: number | null; name: string; is_active?: boolean }> = activeTab === 'gov'
        ? governorates.filter(g => g.name !== 'غير ذلك' && g.id !== null)
        : (selectedGov?.cities || []).filter(c => c.name !== 'غير ذلك' && c.id !== null);

    const handleAddItem = async () => {
        if (!newItemName.trim()) return;
        setSaving(true);
        setError(null);
        try {
            if (activeTab === 'gov') {
                await createGovernorate(newItemName.trim());
            } else if (selectedGov?.id) {
                await createCity(selectedGov.id, newItemName.trim());
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
        const items = bulkInput.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0);
        if (items.length === 0) return;
        setSaving(true);
        setError(null);
        try {
            for (const name of items) {
                if (activeTab === 'gov') {
                    await createGovernorate(name);
                } else if (selectedGov?.id) {
                    await createCity(selectedGov.id, name);
                }
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

    const handleSaveEdit = async () => {
        if (!editingId || !editingName.trim()) return;
        setSaving(true);
        setError(null);
        try {
            if (activeTab === 'gov') {
                await updateGovernorate(editingId, editingName.trim());
            } else {
                await updateCity(editingId, editingName.trim());
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
            if (activeTab === 'gov') {
                await setGovernorateVisibility(id, !isActive);
            } else {
                await setCityVisibility(id, !isActive);
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

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName('');
    };

    const resetTabState = () => {
        setEditingId(null);
        setNewItemName('');
        setBulkInput('');
    };

    const handleClose = () => {
        setGovernorates([]);
        setSelectedGov(null);
        setActiveTab('gov');
        setError(null);
        setSuccessMessage(null);
        resetTabState();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <FiltersCrudShell onOverlayClick={handleClose}>
            <FiltersCrudHeader
                title={`اضافة/تعديل ${activeTab === 'gov' ? 'المحافظات' : `مدن ${selectedGov?.name || ''}`}`}
                subtitle="إدارة أنظف للمحافظات والمدن مع إظهار وإخفاء واضحين وحفظ سريع بدون تشتيت."
                onClose={handleClose}
            />

            <FiltersCrudTabs
                tabs={[
                    {
                        key: 'gov',
                        label: 'المحافظات',
                        active: activeTab === 'gov',
                        onClick: () => {
                            setActiveTab('gov');
                            resetTabState();
                        },
                    },
                    {
                        key: 'city',
                        label: 'المدن',
                        active: activeTab === 'city',
                        onClick: () => {
                            setActiveTab('city');
                            resetTabState();
                            if (governorates.length > 0 && !selectedGov) setSelectedGov(governorates[0]);
                        },
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
                    {loading && <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}><div className={styles.spinner} /><p>جاري التحميل...</p></div>}

                    {!loading && (
                        <>
                            <FiltersCrudAlert variant="info" title="تجربة أوضح">
                                <p>الإضافة والإخفاء يحفظان فورًا، وأثناء تعديل الاسم يمكنك الضغط على حفظ أو الاكتفاء بالخروج من الحقل.</p>
                            </FiltersCrudAlert>

                            {activeTab === 'city' && (
                                <div className={styles.selectorCard}>
                                    <p className={styles.sectionLabel}>اختر المحافظة</p>
                                    <select
                                        value={selectedGov?.name || ''}
                                        onChange={e => {
                                            const found = governorates.find(g => g.name === e.target.value);
                                            if (found) setSelectedGov(found);
                                        }}
                                        disabled={saving}
                                        className={styles.fieldSelect}
                                    >
                                        {governorates.map(g => (
                                            <option key={g.id} value={g.name}>
                                                {g.name}{g.is_active === false ? ' (مخفية)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <p className={styles.sectionMeta}>
                                {activeTab === 'gov' ? 'المحافظات' : 'المدن'} — {currentItems.length} عنصر
                            </p>

                            {/* Bulk Add */}
                            <FiltersCrudCard title="إضافة خيارات متعددة" chip="Bulk Add">
                                <textarea
                                    value={bulkInput}
                                    onChange={e => setBulkInput(e.target.value)}
                                    placeholder="أدخل الخيارات مفصولة بفواصل أو كل خيار في سطر جديد..."
                                    disabled={saving}
                                    rows={3}
                                    className={styles.fieldTextarea}
                                />
                                <button onClick={handleBulkAdd} disabled={saving || !bulkInput.trim()} className={styles.primaryButton} style={{ marginTop: '0.5rem' }}>
                                    {saving ? '...' : 'إضافة'}
                                </button>
                            </FiltersCrudCard>

                            {/* Single Add */}
                            <div style={{ marginTop: '1rem' }}>
                                <FiltersCrudCard title={`إضافة ${activeTab === 'gov' ? 'محافظة' : 'مدينة'} جديدة`} muted>
                                <div className={styles.row}>
                                    <input
                                        value={newItemName}
                                        onChange={e => setNewItemName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                                        placeholder={`اسم ${activeTab === 'gov' ? 'المحافظة' : 'المدينة'} الجديدة`}
                                        disabled={saving}
                                        className={styles.fieldInput}
                                    />
                                    <button onClick={handleAddItem} disabled={saving || !newItemName.trim()} className={styles.primaryButton}>إضافة</button>
                                </div>
                                </FiltersCrudCard>
                            </div>

                            {/* Items List */}
                            <div style={{ marginTop: '1.5rem' }}>
                                <h4 className={styles.itemsTitle}>العناصر الحالية ({currentItems.length})</h4>
                                {currentItems.length === 0 ? (
                                    <div className={styles.emptyState}>لا توجد عناصر حالياً</div>
                                ) : (
                                    <div className={styles.itemsList}>
                                        {currentItems.map(item => (
                                            <div key={item.id} className={`${styles.itemRow} ${item.is_active === false ? styles.itemRowInactive : ''}`}>
                                                {editingId === item.id ? (
                                                    <div className={styles.editShell}>
                                                        <div className={styles.editRow}>
                                                            <input
                                                                value={editingName}
                                                                onChange={e => setEditingName(e.target.value)}
                                                            onBlur={() => {
                                                                if (skipBlurSaveRef.current === item.id) {
                                                                    skipBlurSaveRef.current = null;
                                                                    return;
                                                                }

                                                                void handleSaveEdit();
                                                            }}
                                                            onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                                                            autoFocus
                                                            className={`${styles.fieldInput} ${styles.editInput}`}
                                                        />
                                                        <button
                                                            onMouseDown={() => { skipBlurSaveRef.current = item.id; }}
                                                            onClick={() => void handleSaveEdit()}
                                                            className={styles.saveButton}
                                                            disabled={saving || !editingName.trim()}
                                                        >
                                                            حفظ
                                                        </button>
                                                        <button onMouseDown={() => { skipBlurSaveRef.current = item.id; }} onClick={handleCancelEdit} className={styles.cancelButton}>إلغاء</button>
                                                        </div>
                                                        <span className={styles.autosaveHint}>يحفظ تلقائيا عند الخروج من الحقل أو الضغط على Enter</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className={styles.itemMeta}>
                                                            <span className={styles.itemName}>{item.name}</span>
                                                            {item.is_active === false && <span className={styles.statusBadge}>مخفي</span>}
                                                        </div>
                                                        <div className={styles.itemActions}>
                                                            <button onClick={() => { setEditingId(item.id); setEditingName(item.name); }} className={`${styles.actionButton} ${styles.actionEdit}`} disabled={saving}>
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                                تعديل
                                                            </button>
                                                            <button
                                                                onClick={() => item.id && handleToggleVisibility(item.id, item.is_active !== false)}
                                                                className={`${styles.actionButton} ${item.is_active === false ? styles.actionShow : styles.actionHide}`}
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
