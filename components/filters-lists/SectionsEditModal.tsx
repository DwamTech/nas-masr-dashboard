'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category, MainSection, SubSection } from '@/types/filters-lists';
import {
    fetchMainSections,
    createMainSection,
    addSubSections,
    updateMainSection,
    updateSubSection,
    deleteMainSection,
    deleteSubSection,
} from '@/services/sections';

interface SectionsEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category;
}

/**
 * SectionsEditModal — إضافة/تعديل الأقسام الرئيسية والفرعية
 *
 * Used for unified categories that use main_sections → sub_sections.
 * Two tabs:
 * 1. Main sections — add/edit/delete main sections
 * 2. Sub sections — select parent, then add/edit/delete sub sections
 */
export default function SectionsEditModal({ isOpen, onClose, category }: SectionsEditModalProps) {
    const [mainSections, setMainSections] = useState<MainSection[]>([]);
    const [selectedMain, setSelectedMain] = useState<MainSection | null>(null);
    const [activeTab, setActiveTab] = useState<'main' | 'sub'>('main');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // New item input
    const [newItemName, setNewItemName] = useState('');
    const [bulkInput, setBulkInput] = useState('');

    // Editing state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');

    // Load main sections
    useEffect(() => {
        if (!isOpen) return;
        loadData();
    }, [isOpen, category.slug]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchMainSections(category.slug);
            const sections = (response.main_sections || []).filter(
                s => s.name !== 'غير ذلك' && s.id !== null
            );
            setMainSections(sections);
            if (sections.length > 0 && !selectedMain) {
                setSelectedMain(sections[0]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    // Current items to display
    const currentItems: Array<{ id: number | null; name: string }> =
        activeTab === 'main'
            ? mainSections
            : (selectedMain?.subSections || selectedMain?.sub_sections || []).filter(
                  s => s.name !== 'غير ذلك' && s.id !== null
              );

    // Handle tab change
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

    // Add single item
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
            // Re-select the main section to refresh subs
            if (activeTab === 'sub' && selectedMain) {
                const updated = mainSections.find(s => s.id === selectedMain.id);
                if (updated) setSelectedMain(updated);
            }
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل الإضافة');
        } finally {
            setSaving(false);
        }
    };

    // Bulk add
    const handleBulkAdd = async () => {
        const items = bulkInput
            .split(/[,\n]/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        if (items.length === 0) return;
        setSaving(true);
        setError(null);

        try {
            if (activeTab === 'main') {
                // Add main sections one by one
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

    // Edit item
    const handleStartEdit = (id: number, name: string) => {
        setEditingId(id);
        setEditingName(name);
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

    // Delete item
    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
        setSaving(true);
        setError(null);

        try {
            if (activeTab === 'main') {
                await deleteMainSection(id);
            } else {
                await deleteSubSection(id);
            }
            setSuccessMessage('تم الحذف بنجاح');
            await loadData();
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل الحذف');
        } finally {
            setSaving(false);
        }
    };

    // Handle close
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

    // Re-select main section after data reload
    useEffect(() => {
        if (selectedMain && mainSections.length > 0) {
            const updated = mainSections.find(s => s.id === selectedMain.id);
            if (updated) setSelectedMain(updated);
        }
    }, [mainSections]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose} role="dialog" aria-modal="true">
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <button onClick={handleClose} className="close-button" aria-label="إغلاق">×</button>
                    <h2 className="modal-title">
                        اضافة/تعديل {category.name}
                        {activeTab === 'sub' && selectedMain && ` - ${selectedMain.name}`}
                    </h2>
                </div>

                {/* Tabs */}
                <div className="tabs-container">
                    <button
                        className={`tab-button ${activeTab === 'main' ? 'active' : ''}`}
                        onClick={() => handleTabChange('main')}
                    >
                        الأقسام الرئيسية
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'sub' ? 'active' : ''}`}
                        onClick={() => handleTabChange('sub')}
                    >
                        الأقسام الفرعية
                    </button>
                    <div className="tab-progress" style={{
                        background: `linear-gradient(90deg, #10b981 0%, #10b981 ${activeTab === 'main' ? '50%' : '100%'}, #ef4444 ${activeTab === 'main' ? '50%' : '100%'}, #ef4444 100%)`
                    }} />
                </div>

                {/* Content */}
                <div className="modal-body" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 320px)', minHeight: '300px' }}>
                    {/* Error */}
                    {error && (
                        <div className="error-box" role="alert">
                            <strong>خطأ</strong>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Success */}
                    {successMessage && (
                        <div className="success-toast">✓ {successMessage}</div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                            <div className="spinner" />
                            <p>جاري التحميل...</p>
                        </div>
                    )}

                    {!loading && (
                        <>
                            {/* Sub tab: Parent Selector */}
                            {activeTab === 'sub' && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                        اختر القسم الرئيسي
                                    </p>
                                    <select
                                        value={selectedMain?.name || ''}
                                        onChange={e => {
                                            const found = mainSections.find(s => s.name === e.target.value);
                                            if (found) setSelectedMain(found);
                                        }}
                                        disabled={saving}
                                        style={{
                                            width: '100%', padding: '0.75rem', borderRadius: '8px',
                                            border: '1px solid #d1d5db', fontSize: '0.95rem',
                                            direction: 'rtl', background: 'white'
                                        }}
                                    >
                                        {mainSections.map(s => (
                                            <option key={s.id} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Info */}
                            <p style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '1rem' }}>
                                {activeTab === 'main' ? 'الأقسام الرئيسية' : 'الأقسام الفرعية'} — {currentItems.length} عنصر
                            </p>

                            {/* Bulk Add Section */}
                            <div className="add-section">
                                <h4>إضافة خيارات متعددة (Bulk Add)</h4>
                                <textarea
                                    value={bulkInput}
                                    onChange={e => setBulkInput(e.target.value)}
                                    placeholder="أدخل الخيارات مفصولة بفواصل أو كل خيار في سطر جديد..."
                                    disabled={saving}
                                    rows={3}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '8px',
                                        border: '1px solid #d1d5db', direction: 'rtl',
                                        fontFamily: 'inherit', resize: 'vertical', fontSize: '0.875rem',
                                    }}
                                />
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                    <p>يمكنك إدخال الخيارات بطريقتين:</p>
                                    <p>• مفصولة بفواصل: خيار1, خيار2, خيار3</p>
                                    <p>• كل خيار في سطر جديد</p>
                                </div>
                                <button
                                    onClick={handleBulkAdd}
                                    disabled={saving || !bulkInput.trim()}
                                    className="add-btn"
                                    style={{ marginTop: '0.5rem' }}
                                >
                                    {saving ? '...' : 'إضافة'}
                                </button>
                            </div>

                            {/* Single Add */}
                            <div className="add-section" style={{ marginTop: '1rem' }}>
                                <h4>إضافة خيار جديد{activeTab === 'sub' && selectedMain ? ` في ${selectedMain.name}` : ''}</h4>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        value={newItemName}
                                        onChange={e => setNewItemName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                                        placeholder="أدخل اسم الخيار الجديد"
                                        disabled={saving}
                                        style={{
                                            flex: 1, padding: '0.75rem', borderRadius: '8px',
                                            border: '1px solid #d1d5db', direction: 'rtl',
                                            fontSize: '0.875rem',
                                        }}
                                    />
                                    <button
                                        onClick={handleAddItem}
                                        disabled={saving || !newItemName.trim()}
                                        className="add-btn"
                                    >
                                        إضافة
                                    </button>
                                </div>
                            </div>

                            {/* Items List */}
                            <div style={{ marginTop: '1.5rem' }}>
                                <h4 style={{ color: '#374151', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                                    العناصر الحالية ({currentItems.length})
                                </h4>
                                {currentItems.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                                        لا توجد عناصر حالياً
                                    </div>
                                ) : (
                                    <div className="items-list">
                                        {currentItems.map(item => (
                                            <div key={item.id} className="item-row">
                                                {editingId === item.id ? (
                                                    // Editing mode
                                                    <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'center' }}>
                                                        <input
                                                            value={editingName}
                                                            onChange={e => setEditingName(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                                                            autoFocus
                                                            style={{
                                                                flex: 1, padding: '0.5rem', borderRadius: '6px',
                                                                border: '1px solid #3b82f6', direction: 'rtl',
                                                                fontSize: '0.875rem',
                                                            }}
                                                        />
                                                        <button onClick={handleSaveEdit} className="save-edit-btn" disabled={saving}>
                                                            حفظ
                                                        </button>
                                                        <button onClick={() => setEditingId(null)} className="cancel-btn">
                                                            إلغاء
                                                        </button>
                                                    </div>
                                                ) : (
                                                    // Display mode
                                                    <>
                                                        <span className="item-name">{item.name}</span>
                                                        <div className="item-actions">
                                                            <button
                                                                onClick={() => item.id && handleStartEdit(item.id, item.name)}
                                                                className="action-btn edit"
                                                                title="تعديل"
                                                                disabled={saving}
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={() => item.id && handleDelete(item.id)}
                                                                className="action-btn delete"
                                                                title="حذف"
                                                                disabled={saving}
                                                            >
                                                                🗑
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

                {/* Footer */}
                <div className="modal-footer">
                    <button onClick={handleClose} disabled={saving} className="close-btn">
                        إغلاق
                    </button>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5); display: flex;
                    align-items: center; justify-content: center; z-index: 1000;
                }
                .modal-content {
                    background: white; border-radius: 16px; width: 95%; max-width: 700px;
                    max-height: 90vh; display: flex; flex-direction: column;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                }
                .modal-header {
                    padding: 1.5rem; border-bottom: 1px solid #e5e7eb;
                    display: flex; align-items: center; gap: 1rem;
                    background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
                    border-radius: 16px 16px 0 0;
                }
                .close-button {
                    background: #f3f4f6; border: none; width: 36px; height: 36px;
                    border-radius: 50%; font-size: 1.25rem; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    color: #6b7280; transition: all 0.2s;
                }
                .close-button:hover { background: #e5e7eb; }
                .modal-title {
                    font-size: 1.25rem; font-weight: 700; color: #1f2937;
                    flex: 1; text-align: center;
                }
                .tabs-container {
                    display: flex; flex-wrap: wrap; gap: 0; padding: 0 1.5rem;
                    border-bottom: 1px solid #e5e7eb; position: relative;
                    background: #f9fafb;
                }
                .tab-button {
                    padding: 0.75rem 1.25rem; border: none; background: none;
                    font-size: 0.875rem; font-weight: 500; color: #6b7280;
                    cursor: pointer; transition: all 0.2s; white-space: nowrap;
                }
                .tab-button.active { color: #2563eb; font-weight: 600; }
                .tab-button:hover { color: #2563eb; }
                .tab-progress {
                    position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
                    border-radius: 3px 3px 0 0;
                }
                .modal-body { padding: 1.5rem; flex: 1; overflow-y: auto; }
                .modal-footer {
                    padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb;
                    display: flex; justify-content: flex-end;
                    background: linear-gradient(180deg, #ffffff, #f9fafb);
                    border-radius: 0 0 16px 16px;
                }
                .close-btn {
                    padding: 0.75rem 2rem; background: #f3f4f6; border: none;
                    border-radius: 8px; font-size: 0.875rem; font-weight: 500;
                    cursor: pointer; color: #374151; transition: all 0.2s;
                }
                .close-btn:hover { background: #e5e7eb; }
                .error-box {
                    background: #fef2f2; border: 1px solid #fecaca;
                    border-radius: 8px; padding: 1rem; margin-bottom: 1rem;
                    color: #dc2626; text-align: right;
                }
                .error-box strong { display: block; margin-bottom: 0.25rem; }
                .success-toast {
                    background: #dcfce7; color: #166534; padding: 0.75rem 1rem;
                    border-radius: 8px; margin-bottom: 1rem; text-align: center;
                    font-size: 0.875rem; font-weight: 500;
                }
                .spinner {
                    width: 32px; height: 32px; border: 3px solid #e5e7eb;
                    border-top-color: #2563eb; border-radius: 50%;
                    animation: spin 0.8s linear infinite; margin: 0 auto 1rem;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .add-section {
                    background: #f9fafb; border: 1px solid #e5e7eb;
                    border-radius: 12px; padding: 1rem;
                }
                .add-section h4 {
                    font-size: 0.875rem; font-weight: 600; color: #374151;
                    margin-bottom: 0.5rem; text-align: right;
                }
                .add-btn {
                    padding: 0.5rem 1.5rem; background: #2563eb; color: white;
                    border: none; border-radius: 8px; cursor: pointer;
                    font-size: 0.875rem; font-weight: 500; transition: all 0.2s;
                }
                .add-btn:hover { background: #1d4ed8; }
                .add-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .items-list {
                    display: flex; flex-direction: column; gap: 0.5rem;
                }
                .item-row {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0.75rem; background: white; border: 1px solid #e5e7eb;
                    border-radius: 8px; direction: rtl;
                }
                .item-name {
                    font-size: 0.95rem; font-weight: 500; color: #1f2937;
                }
                .item-actions { display: flex; gap: 0.25rem; }
                .action-btn {
                    background: none; border: none; cursor: pointer;
                    font-size: 1rem; padding: 0.25rem 0.5rem;
                    border-radius: 4px; transition: all 0.2s;
                }
                .action-btn.edit:hover { background: #eff6ff; }
                .action-btn.delete:hover { background: #fef2f2; }
                .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
                .save-edit-btn {
                    padding: 0.4rem 1rem; background: #10b981; color: white;
                    border: none; border-radius: 6px; cursor: pointer;
                    font-size: 0.8rem;
                }
                .cancel-btn {
                    padding: 0.4rem 1rem; background: #f3f4f6; color: #374151;
                    border: none; border-radius: 6px; cursor: pointer;
                    font-size: 0.8rem;
                }
            `}</style>
        </div>
    );
}
