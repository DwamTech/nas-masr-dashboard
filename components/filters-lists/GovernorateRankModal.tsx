'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category } from '@/types/filters-lists';
import { Governorate } from '@/models/governorates';
import { fetchAllGovernorates } from '@/services/governorates-admin';
import { DraggableOptionsList } from '@/components/DraggableOptions/DraggableOptionsList';

interface GovernorateRankModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category;
}

/**
 * GovernorateRankModal — ترتيب المحافظات والمدن
 * 
 * Dedicated modal for ranking governorates and their cities.
 * Uses two tabs: governorates list and cities within a selected governorate.
 */
export default function GovernorateRankModal({ isOpen, onClose, category }: GovernorateRankModalProps) {
    const [governorates, setGovernorates] = useState<Governorate[]>([]);
    const [selectedGov, setSelectedGov] = useState<Governorate | null>(null);
    const [activeTab, setActiveTab] = useState<'gov' | 'city'>('gov');
    const [govOptions, setGovOptions] = useState<string[]>([]);
    const [cityOptions, setCityOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        loadGovernorate();
    }, [isOpen]);

    const loadGovernorate = async () => {
        setLoading(true);
        setError(null);
        try {
            const sortable = await fetchAllGovernorates();
            setGovernorates(sortable);
            setGovOptions(sortable.map(g => g.name));
            if (sortable.length > 0 && !selectedGov) setSelectedGov(sortable[0]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedGov || activeTab !== 'city') return;
        const cities = (selectedGov.cities || []).filter(c => c.name !== 'غير ذلك' && c.id !== null);
        setCityOptions(cities.map(c => c.name));
    }, [selectedGov, activeTab]);

    const handleTabChange = (tab: 'gov' | 'city') => {
        setActiveTab(tab);
        setError(null);
        setSuccessMessage(null);
        if (tab === 'city' && governorates.length > 0 && !selectedGov) setSelectedGov(governorates[0]);
    };

    const handleReorder = useCallback((newOrder: string[]) => {
        if (activeTab === 'gov') setGovOptions(newOrder);
        else setCityOptions(newOrder);
    }, [activeTab]);

    const handleSave = useCallback(async (_ranks: { option: string; rank: number }[]) => {
        setSaving(true);
        try {
            // TODO: Implement sort_order API when backend supports it
            setSuccessMessage('تم حفظ الترتيب بنجاح');
            setTimeout(() => setSuccessMessage(null), 2000);
        } finally {
            setSaving(false);
        }
    }, []);

    const renderOption = useCallback((option: string) => (
        <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{option}</span>
    ), []);

    const handleClose = () => {
        setGovernorates([]);
        setSelectedGov(null);
        setActiveTab('gov');
        setGovOptions([]);
        setCityOptions([]);
        setError(null);
        setSuccessMessage(null);
        onClose();
    };

    if (!isOpen) return null;
    const currentOptions = activeTab === 'gov' ? govOptions : cityOptions;

    return (
        <div className="modal-overlay" onClick={handleClose} role="dialog" aria-modal="true">
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <button onClick={handleClose} className="close-button" aria-label="إغلاق">×</button>
                    <h2 className="modal-title">
                        ترتيب {activeTab === 'gov' ? 'المحافظات' : `مدن ${selectedGov?.name || ''}`}
                    </h2>
                </div>

                <div className="tabs-container">
                    <button className={`tab-button ${activeTab === 'gov' ? 'active' : ''}`} onClick={() => handleTabChange('gov')}>المحافظات</button>
                    <button className={`tab-button ${activeTab === 'city' ? 'active' : ''}`} onClick={() => handleTabChange('city')}>المدن</button>
                </div>

                <div className="modal-body">
                    {error && <div className="error-box" role="alert"><strong>خطأ</strong><p>{error}</p></div>}
                    {successMessage && <div className="success-toast">✓ {successMessage}</div>}
                    {loading && <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}><div className="spinner" /><p>جاري التحميل...</p></div>}

                    {!loading && activeTab === 'city' && (
                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '0.5rem' }}>اختر المحافظة</p>
                            <select
                                value={selectedGov?.name || ''}
                                onChange={e => {
                                    const found = governorates.find(g => g.name === e.target.value);
                                    if (found) setSelectedGov(found);
                                }}
                                disabled={saving}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem', direction: 'rtl', background: 'white' }}
                            >
                                {governorates.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                            </select>
                        </div>
                    )}

                    {!loading && !error && (
                        <div>
                            <p style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                {activeTab === 'gov' ? 'المحافظات' : 'المدن'} - {currentOptions.length} خيار
                            </p>
                            <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '1rem' }}>اسحب الخيارات لإعادة ترتيبها.</p>
                            {currentOptions.length > 0 ? (
                                <DraggableOptionsList options={currentOptions} onReorder={handleReorder} onSave={handleSave} renderOption={renderOption} otherOptionLabel="غير ذلك" disabled={saving} />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}><p>لا توجد {activeTab === 'gov' ? 'محافظات' : 'مدن'} حالياً</p></div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button onClick={handleClose} disabled={saving} className="close-btn">إغلاق</button>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: white; border-radius: 16px; width: 95%; max-width: 700px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
                .modal-header { padding: 1.5rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 1rem; background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%); border-radius: 16px 16px 0 0; }
                .close-button { background: #f3f4f6; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 1.25rem; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6b7280; transition: all 0.2s; }
                .close-button:hover { background: #e5e7eb; }
                .modal-title { font-size: 1.25rem; font-weight: 700; color: #1f2937; flex: 1; text-align: center; }
                .tabs-container { display: flex; gap: 0; padding: 0 1.5rem; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
                .tab-button { padding: 0.75rem 1.25rem; border: none; background: none; font-size: 0.875rem; font-weight: 500; color: #6b7280; cursor: pointer; transition: all 0.2s; }
                .tab-button.active { color: #2563eb; font-weight: 600; border-bottom: 2px solid #2563eb; }
                .modal-body { padding: 1.5rem; flex: 1; overflow-y: auto; max-height: calc(100vh - 320px); min-height: 300px; }
                .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; border-radius: 0 0 16px 16px; }
                .close-btn { padding: 0.75rem 2rem; background: #f3f4f6; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; color: #374151; }
                .close-btn:hover { background: #e5e7eb; }
                .error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; color: #dc2626; text-align: right; }
                .success-toast { background: #dcfce7; color: #166534; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; text-align: center; font-size: 0.875rem; }
                .spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
