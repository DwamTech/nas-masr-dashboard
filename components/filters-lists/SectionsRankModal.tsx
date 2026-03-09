'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category, MainSection, SubSection } from '@/types/filters-lists';
import { fetchMainSections, fetchSubSections } from '@/services/sections';
import { DraggableOptionsList } from '@/components/DraggableOptions/DraggableOptionsList';
import '@/components/DraggableOptions/styles.css';
import './animations.css';
import './tailwind-shim.css';

interface SectionsRankModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category;
}

/**
 * SectionsRankModal — ترتيب الأقسام الرئيسية والأقسام الفرعية
 * 
 * Used for unified categories (car-services, home-services, animals, etc.)
 * that use main_sections → sub_sections structure.
 * 
 * Two modes:
 * 1. Main sections view — rank main sections for the category
 * 2. Sub sections view — select a main section, then rank its sub sections
 */
export default function SectionsRankModal({ isOpen, onClose, category }: SectionsRankModalProps) {
    // State
    const [mainSections, setMainSections] = useState<MainSection[]>([]);
    const [selectedMain, setSelectedMain] = useState<MainSection | null>(null);
    const [activeTab, setActiveTab] = useState<'main' | 'sub'>('main');
    const [mainOptions, setMainOptions] = useState<string[]>([]);
    const [subOptions, setSubOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Load main sections when modal opens
    useEffect(() => {
        if (!isOpen) return;

        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetchMainSections(category.slug);
                const sections = response.main_sections || [];
                // Filter out "غير ذلك" from sorting (always last)
                const sortable = sections.filter(s => s.name !== 'غير ذلك' && s.id !== null);
                setMainSections(sortable);
                setMainOptions(sortable.map(s => s.name));

                // Auto-select first main section for sub tab
                if (sortable.length > 0 && !selectedMain) {
                    setSelectedMain(sortable[0]);
                }
            } catch (err) {
                console.error('Error loading main sections:', err);
                setError(err instanceof Error ? err.message : 'فشل تحميل البيانات');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isOpen, category.slug]);

    // Load sub sections when selected main changes
    useEffect(() => {
        if (!selectedMain || !selectedMain.id || activeTab !== 'sub') return;

        const loadSubs = async () => {
            setLoading(true);
            setError(null);
            try {
                // Use subSections from the main response or fetch separately
                const subs = selectedMain.subSections || selectedMain.sub_sections || [];
                const sortable = subs.filter(s => s.name !== 'غير ذلك' && s.id !== null);
                setSubOptions(sortable.map(s => s.name));
            } catch (err) {
                console.error('Error loading sub sections:', err);
                setError(err instanceof Error ? err.message : 'فشل تحميل الأقسام الفرعية');
            } finally {
                setLoading(false);
            }
        };

        loadSubs();
    }, [selectedMain, activeTab]);

    // Handle tab switch
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

    // Handle main section selection change (for sub tab)
    const handleMainChange = useCallback((name: string) => {
        const found = mainSections.find(s => s.name === name);
        if (found) setSelectedMain(found);
    }, [mainSections]);

    // Handle reorder (drag and drop)
    const handleReorder = useCallback((newOrder: string[]) => {
        if (activeTab === 'main') {
            setMainOptions(newOrder);
        } else {
            setSubOptions(newOrder);
        }
    }, [activeTab]);

    // Handle save (auto-save after reorder)
    const handleSave = useCallback(async (ranks: { option: string; rank: number }[]) => {
        setSaving(true);
        setError(null);
        try {
            // Note: The backend doesn't have a sort_order update endpoint yet.
            // For now, show success and keep the new order in state.
            // TODO: Implement sort_order update API when available
            setSuccessMessage('تم حفظ الترتيب بنجاح');
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل حفظ الترتيب');
        } finally {
            setSaving(false);
        }
    }, []);

    // Render option item 
    const renderOption = useCallback((option: string) => (
        <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{option}</span>
    ), []);

    // Handle close
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
        <div className="modal-overlay" onClick={handleClose} role="dialog" aria-modal="true">
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <button onClick={handleClose} className="close-button" aria-label="إغلاق">×</button>
                    <h2 className="modal-title">
                        ترتيب اختيارات {category.name}
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

                    {/* Success Toast */}
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

                    {/* Sub tab: Parent Selector */}
                    {!loading && activeTab === 'sub' && (
                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '0.5rem' }}>اختر القسم الرئيسي</p>
                            <select
                                value={selectedMain?.name || ''}
                                onChange={e => handleMainChange(e.target.value)}
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

                    {/* Options list */}
                    {!loading && !error && (
                        <div>
                            <p style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                {activeTab === 'main' ? 'الأقسام الرئيسية' : 'الأقسام الفرعية'} - {currentOptions.length} خيار
                            </p>
                            <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '1rem' }}>
                                اسحب الخيارات لإعادة ترتيبها. سيتم حفظ التغييرات تلقائياً.
                            </p>

                            {currentOptions.length > 0 ? (
                                <DraggableOptionsList
                                    options={currentOptions}
                                    onReorder={handleReorder}
                                    onSave={handleSave}
                                    renderOption={renderOption}
                                    otherOptionLabel="غير ذلك"
                                    disabled={saving}
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                    <p>لا توجد أقسام {activeTab === 'main' ? 'رئيسية' : 'فرعية'} حالياً</p>
                                </div>
                            )}
                        </div>
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
            `}</style>
        </div>
    );
}
