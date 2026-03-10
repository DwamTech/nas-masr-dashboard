'use client';

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Category } from '@/types/filters-lists';
import { Governorate } from '@/models/governorates';
import { fetchAllGovernorates, updateGovernorateRanks, updateCityRanks } from '@/services/governorates-admin';
import { ParentSelector } from './ParentSelector';
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

interface GovernorateRankModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category;
}

export default function GovernorateRankModal({ isOpen, onClose, category }: GovernorateRankModalProps) {
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
        const loadGovernorates = async () => {
            setLoading(true);
            setError(null);
            try {
                const sortable = await fetchAllGovernorates();
                setGovernorates(sortable);
                
                if (activeTab === 'gov') {
                    setOptions(sortable.map(g => g.name));
                } else if (activeTab === 'city') {
                    const gov = sortable.find(g => g.name === selectedGov);
                    if (gov) {
                        const cities = (gov.cities || []).filter(c => c.name !== 'غير ذلك' && c.id !== null);
                        setOptions(cities.map(c => c.name));
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
        loadGovernorates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Update options when tab or selectedGov changes
    useEffect(() => {
        if (!isOpen || governorates.length === 0) return;
        
        if (activeTab === 'gov') {
            setOptions(governorates.map(g => g.name));
        } else if (activeTab === 'city') {
            let govToUse = selectedGov;
            if (!govToUse && governorates.length > 0) {
                govToUse = governorates[0].name;
                setSelectedGov(govToUse);
            }
            
            const gov = governorates.find(g => g.name === govToUse);
            if (gov) {
                const cities = (gov.cities || []).filter(c => c.name !== 'غير ذلك' && c.id !== null);
                setOptions(cities.map(c => c.name));
            } else {
                setOptions([]);
            }
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
                const payload = ranks.map(r => {
                    const gov = governorates.find(g => g.name === r.option);
                    return { id: gov?.id as number, rank: r.rank };
                }).filter(p => p.id != null);

                await updateGovernorateRanks(payload);
            } else {
                const gov = governorates.find(g => g.name === selectedGov);
                const cities = (gov?.cities || []).filter(c => c.name !== 'غير ذلك' && c.id !== null);
                const payload = ranks.map(r => {
                    const city = cities.find(c => c.name === r.option);
                    return { id: city?.id as number, rank: r.rank };
                }).filter(p => p.id != null);

                await updateCityRanks(payload);
            }

            setSuccessMessage('تم حفظ الترتيب بنجاح ✓');
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
    }, [activeTab, governorates, selectedGov]);

    const renderOption = useCallback((option: string) => {
        return (
            <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
                <span className="flex-1" style={{ color: '#111827' }}>{option}</span>
            </div>
        );
    }, []);

    const handleParentChange = useCallback((newParent: string) => {
        setSelectedGov(newParent);
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
                alignItems: 'flex-start',
                justifyContent: 'center',
                padding: '1rem',
                overflowY: 'auto'
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
                    maxHeight: 'calc(100dvh - 2rem)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 10000,
                    overflow: 'hidden',
                    padding: 0,
                    margin: 0
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
                        ترتيب {activeTab === 'gov' ? 'المحافظات' : `مدن ${selectedGov || ''}`}
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

                {/* Floating Success Toast */}
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

                {/* Field Tabs */}
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
                    aria-label="خيارات الترتيب"
                >
                    <button
                        role="tab"
                        aria-selected={activeTab === 'gov'}
                        onClick={() => setActiveTab('gov')}
                        style={{
                            padding: '0.65rem 1.1rem',
                            whiteSpace: 'nowrap',
                            border: 'none',
                            borderBottom: activeTab === 'gov' ? '2px solid #2563eb' : '2px solid transparent',
                            background: 'none',
                            color: activeTab === 'gov' ? '#2563eb' : '#6b7280',
                            fontWeight: activeTab === 'gov' ? 600 : 400,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            marginBottom: '-2px',
                        }}
                    >
                        المحافظات
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'city'}
                        onClick={() => setActiveTab('city')}
                        style={{
                            padding: '0.65rem 1.1rem',
                            whiteSpace: 'nowrap',
                            border: 'none',
                            borderBottom: activeTab === 'city' ? '2px solid #2563eb' : '2px solid transparent',
                            background: 'none',
                            color: activeTab === 'city' ? '#2563eb' : '#6b7280',
                            fontWeight: activeTab === 'city' ? 600 : 400,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            marginBottom: '-2px',
                        }}
                    >
                        المدن
                    </button>
                </div>

                <div
                    className="flex-1 overflow-y-auto p-6"
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        backgroundColor: '#fafbfc',
                        overscrollBehavior: 'contain',
                        touchAction: 'pan-y',
                        minHeight: 0,
                        overflowX: 'hidden'
                    }}
                    onWheel={(e) => {
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

                    {!loading && (
                        <div>
                            {activeTab === 'gov' ? (
                                <div>
                                    <p className="text-sm mb-4" style={{ color: '#4b5563' }}>
                                        المحافظات - {options.length} خيار
                                    </p>
                                    <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
                                        اسحب الخيارات لإعادة ترتيبها. سيتم حفظ التغييرات تلقائياً.
                                    </p>
                                    <div
                                        style={{
                                            maxHeight: 'min(42vh, 420px)',
                                            overflowY: 'auto',
                                            overflowX: 'hidden',
                                            paddingInlineEnd: '0.25rem',
                                            overscrollBehavior: 'contain',
                                        }}
                                    >
                                        <Suspense fallback={<DraggableListLoading />}>
                                            <DraggableOptionsList
                                                key={`gov-${options.length}`}
                                                options={options}
                                                onReorder={handleReorder}
                                                onSave={handleSave}
                                                renderOption={renderOption}
                                                otherOptionLabel="غير ذلك"
                                                disabled={saving}
                                            />
                                        </Suspense>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm mb-4" style={{ color: '#4b5563' }}>
                                        المدن - تابعة لمحافظة مختارة
                                    </p>

                                    <ParentSelector
                                        parents={governorates.map(g => g.name)}
                                        selectedParent={selectedGov}
                                        onParentChange={handleParentChange}
                                        label="اختر المحافظة"
                                        disabled={saving}
                                        loading={loading}
                                    />

                                    {selectedGov ? (
                                        <>
                                            <p className="text-xs mb-4 mt-6" style={{ color: '#6b7280' }}>
                                                اسحب الخيارات لإعادة ترتيبها. سيتم حفظ التغييرات تلقائياً.
                                            </p>
                                            <div
                                                style={{
                                                    maxHeight: 'min(42vh, 420px)',
                                                    overflowY: 'auto',
                                                    overflowX: 'hidden',
                                                    paddingInlineEnd: '0.25rem',
                                                    overscrollBehavior: 'contain',
                                                }}
                                            >
                                                <Suspense fallback={<DraggableListLoading />}>
                                                    <DraggableOptionsList
                                                        key={`city-${selectedGov}-${options.length}`}
                                                        options={options}
                                                        onReorder={handleReorder}
                                                        onSave={handleSave}
                                                        renderOption={renderOption}
                                                        otherOptionLabel="غير ذلك"
                                                        disabled={saving}
                                                    />
                                                </Suspense>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-8" style={{ color: '#6b7280' }} role="status">
                                            <svg className="w-16 h-16 mx-auto mb-4" style={{ color: '#d1d5db' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <p>الرجاء اختيار المحافظة أولاً</p>
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
